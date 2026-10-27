package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

//go:embed download_remote.cjs
var downloadAgentSource string

type downloadEntry struct {
	Path string `json:"path"`
	Kind string `json:"kind"`
	Size int64 `json:"size"`
	Mode uint32 `json:"mode"`
	UID int64 `json:"uid"`
	GID int64 `json:"gid"`
	Mtime string `json:"mtime"`
	Ctime string `json:"ctime"`
	Inode string `json:"inode"`
	Device string `json:"device"`
	Signature string `json:"signature"`
	Link string `json:"link,omitempty"`
	LinkBytes []byte `json:"linkBytes,omitempty"`
	Error string `json:"error,omitempty"`
}

type downloadReply struct {
	OK bool `json:"ok"`
	Error string `json:"error"`
	Root string `json:"root"`
	Identity string `json:"identity"`
	Paths []string `json:"paths"`
	Excluded []string `json:"excluded"`
	Entries []downloadEntry `json:"entries"`
	Done bool `json:"done"`
	SHA256 string `json:"sha256"`
	PrefixSHA256 string `json:"prefixSHA256"`
	Offset int64 `json:"offset"`
	Data []byte `json:"data"`
}

type downloadRemoteError struct { message string }
func (e *downloadRemoteError) Error() string { return e.message }

type downloadAgent struct {
	input *os.File
	output *os.File
	encoder *json.Encoder
	decoder *json.Decoder
	done chan error
	cancel context.CancelFunc
}

func (a *application) startDownloadAgent(program string, timeout time.Duration) (*downloadAgent, error) {
	ctx, cancel := context.WithCancel(a.ctx)
	if timeout > 0 {
		cancel()
		ctx, cancel = context.WithTimeout(a.ctx, timeout)
	}
	// OS pipes let OpenSSH exit promptly even if the remote closes before reading stdin.
	input, writer, err := os.Pipe()
	if err != nil { cancel(); return nil, err }
	reader, output, err := os.Pipe()
	if err != nil { input.Close(); writer.Close(); cancel(); return nil, err }
	agent := &downloadAgent{input: writer, output: reader, encoder: json.NewEncoder(writer), decoder: json.NewDecoder(reader), done: make(chan error, 1), cancel: cancel}
	session := *a
	session.ctx, session.out = ctx, output
	go func() {
		err := session.sshSession(shellQuote(program)+" -e "+shellQuote(downloadAgentSource), input, false, true)
		input.Close()
		output.Close()
		agent.done <- err
	}()
	return agent, nil
}

func (a *downloadAgent) request(request map[string]any) (downloadReply, error) {
	var reply downloadReply
	if err := a.encoder.Encode(request); err != nil { return reply, fmt.Errorf("download request: %w", err) }
	if err := a.decoder.Decode(&reply); err != nil { return reply, fmt.Errorf("download connection interrupted: %w", err) }
	if !reply.OK { return reply, &downloadRemoteError{reply.Error} }
	return reply, nil
}

func (a *downloadAgent) close(graceful bool) error {
	a.input.Close()
	var drainErr error
	if graceful {
		// Consume the last JSON newline and let OpenSSH close normally before closing its reader.
		_, drainErr = io.Copy(io.Discard, a.output)
	} else { a.cancel() }
	a.output.Close()
	err := <-a.done
	a.cancel()
	return errors.Join(err, drainErr)
}

func downloadSize(value string) (int64, error) {
	value = strings.ToUpper(strings.TrimSpace(value))
	factor := int64(1)
	for _, unit := range []struct { suffix string; factor int64 }{{"GIB", 1 << 30}, {"MIB", 1 << 20}, {"KIB", 1 << 10}, {"GB", 1000000000}, {"MB", 1000000}, {"KB", 1000}, {"B", 1}} {
		if strings.HasSuffix(value, unit.suffix) { value = strings.TrimSpace(strings.TrimSuffix(value, unit.suffix)); factor = unit.factor; break }
	}
	n, err := strconv.ParseInt(value, 10, 64)
	if err != nil || n < 0 || n > (1<<63-1)/factor { return 0, errors.New("--max-bytes requires a nonnegative integer, optionally followed by KiB, MiB, GiB, KB, MB or GB") }
	return n * factor, nil
}

func (a *application) downloadConnection() error {
	if a.auto { return a.autoConnect() }
	if a.host == "" && a.key == "" {
		base := filepath.Join(filepath.Dir(a.root), "idrive7-8-ssh-root", "data", "enrollments")
		entries, err := os.ReadDir(base)
		if err != nil && !os.IsNotExist(err) { return err }
		var keys []string
		for _, entry := range entries {
			if !entry.IsDir() { continue }
			key := filepath.Join(base, entry.Name(), "id_rsa")
			if info, err := os.Stat(key); err == nil && info.Mode().IsRegular() { keys = append(keys, key) } else if err != nil && !os.IsNotExist(err) { return err }
		}
		if len(keys) > 1 { return errors.New("multiple saved enrollments; select --key and --host, or use --auto with your key") }
		if len(keys) == 1 { a.key = keys[0] }
	}
	if a.host == "" && a.key != "" {
		data, err := os.ReadFile(filepath.Join(filepath.Dir(absolute(a.key)), "connect.txt"))
		if err != nil && !os.IsNotExist(err) { return err }
		for _, line := range strings.Split(string(data), "\n") {
			if value, ok := strings.CutPrefix(strings.TrimSpace(line), "Host (IP):"); ok {
				if ip := net.ParseIP(strings.TrimSpace(value)); ip != nil { a.host = "root@" + ip.String(); break }
			}
		}
	}
	if a.host == "" { return errors.New("use --auto or --host root@HEADUNIT; no unambiguous saved head-unit IP was found") }
	return nil
}

func (a *application) download(args []string) (resultErr error) {
	target := ""
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") { target, args = args[0], args[1:] }
	flags := flag.NewFlagSet("download", flag.ContinueOnError)
	flags.SetOutput(a.err)
	output := flags.String("out", "", "capture directory (reused to resume; defaults under out/downloads)")
	bytesText := flags.String("max-bytes", "0", "file bytes to receive this run, such as 250MiB; zero is unlimited")
	maxFiles := flags.Int("max-files", 0, "newly completed files this run; zero is unlimited")
	timeout := flags.Duration("timeout", 0, "time limit, such as 10m; progress is retained")
	remoteNode := flags.String("remote-node", "node", "Node.js executable on the head unit")
	breakLock := flags.Bool("break-lock", false, "remove a stale local capture lock; use only when no download is running there")
	var paths repeatedOption
	flags.Var(&paths, "path", "capture this path (repeatable; absolute for head-unit; relative to app storage, such as data/log.json)")
	if err := flags.Parse(args); err != nil { return err }
	if target == "" && flags.NArg() == 1 { target = flags.Arg(0) } else if flags.NArg() != 0 { return errors.New("usage: mgu download APP|head-unit [options]") }
	if !validName(target) || target[0] == '.' { return errors.New("usage: mgu download APP|head-unit [options]") }
	if *maxFiles < 0 || *timeout < 0 || *remoteNode == "" || strings.ContainsAny(*remoteNode, "\x00\r\n") { return errors.New("invalid download limit or remote Node executable") }
	for _, name := range paths {
		if strings.ContainsRune(name, 0) || (target == "head-unit" && !path.IsAbs(name)) || (target != "head-unit" && (path.IsAbs(name) || name == ".." || strings.HasPrefix(path.Clean(name), "../"))) { return fmt.Errorf("invalid capture path %q", name) }
	}
	maxBytes, err := downloadSize(*bytesText)
	if err != nil { return err }
	if err := a.downloadConnection(); err != nil { return err }
	agent, err := a.startDownloadAgent(*remoteNode, *timeout)
	if err != nil { return err }
	defer func() { if err := agent.close(resultErr == nil); err != nil && resultErr == nil { resultErr = err } }()
	hello, err := agent.request(map[string]any{"op": "hello", "target": target, "paths": paths})
	if err != nil { return err }
	if hello.Identity == "" || !path.IsAbs(hello.Root) || path.Clean(hello.Root) != hello.Root { return errors.New("invalid download source identity or root") }
	if strings.HasPrefix(hello.Identity, "hostname:") { hello.Identity += "|ssh:" + a.host }
	if *output == "" { *output = filepath.Join(a.root, "out", "downloads", target+"-"+downloadDigest(hello.Identity+"\x00"+hello.Root)[:12]) }
	capture, err := openDownloadCapture(absolute(*output), target, hello, *breakLock)
	if err != nil { return err }
	defer func() { if err := capture.close(); err != nil { resultErr = errors.Join(resultErr, err) } }()
	fmt.Fprintln(a.out, "Download directory:", capture.root)
	fmt.Fprintln(a.out, "Repeat this command to continue; completed files are retained.")
	err = capture.receive(a, agent, maxBytes, *maxFiles)
	if err != nil { return fmt.Errorf("%w; progress retained in %s", err, capture.root) }
	return nil
}
