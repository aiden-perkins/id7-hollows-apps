package main

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/user"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

const carKitDirectory = "/var/opt/mgu-custom-apps"

func shellQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\"'\"'") + "'"
}

func (a *application) ssh(remote string, input io.Reader, terminal bool) error {
	return a.sshSession(remote, input, terminal, false)
}

func (a *application) sshSession(remote string, input io.Reader, terminal, download bool) (resultErr error) {
	if a.host == "" { return errors.New("use --auto, --host root@HEADUNIT or MGU_HOST before the car or download command") }
	if strings.HasPrefix(a.host, "-") || strings.ContainsAny(a.host, " \t\r\n") { return errors.New("invalid SSH destination") }
	if a.port < 0 || a.port > 65535 { return errors.New("SSH port must be between 1 and 65535") }
	args := []string{
		"-o", "BatchMode=yes",
		"-o", "ConnectTimeout=15",
		"-o", "LogLevel=ERROR",
	}
	if download {
		// Match the download scripts' saved-host-key policy; leave car commands unchanged.
		args = append(args, "-o", "StrictHostKeyChecking=accept-new", "-o", "ServerAliveInterval=10", "-o", "ServerAliveCountMax=3")
	} else {
		args = append(args, "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile="+os.DevNull, "-o", "GlobalKnownHostsFile="+os.DevNull)
	}
	if terminal { args = append(args, "-t") } else { args = append(args, "-T") }
	if a.port != 0 { args = append(args, "-p", strconv.Itoa(a.port)) }
	if a.key != "" {
		key := absolute(a.key)
		info, err := os.Stat(key)
		if err != nil { return err }
		if !info.Mode().IsRegular() { return errors.New("SSH key must be a regular file") }
		key, cleanup, err := a.prepareSSHKey(key)
		if err != nil { return err }
		if cleanup != nil {
			defer func() { resultErr = errors.Join(resultErr, cleanup()) }()
		}
		args = append(args, "-i", key, "-o", "IdentitiesOnly=yes")
	}
	args = append(args, a.host, remote)
	session := *a
	if runtime.GOOS == "windows" && !terminal {
		// Pipe output through Go so OpenSSH does not apply console terminal modes
		// to the installer's plain LF-terminated output.
		if a.out != nil { session.out = struct{ io.Writer }{a.out} }
		if a.err != nil { session.err = struct{ io.Writer }{a.err} }
	}
	return session.command("ssh", args, input, terminal)
}

func (a *application) prepareSSHKey(name string) (string, func() error, error) {
	if runtime.GOOS != "windows" { return name, nil, nil }
	current, err := user.Current()
	if err != nil { return "", nil, fmt.Errorf("find SSH key owner: %w", err) }
	dir, err := os.MkdirTemp("", "mgu-ssh-key-*")
	if err != nil { return "", nil, fmt.Errorf("create temporary SSH key directory: %w", err) }
	cleanup := func() error {
		if err := os.RemoveAll(dir); err != nil { return fmt.Errorf("remove temporary SSH key directory: %w", err) }
		return nil
	}
	fail := func(err error) (string, func() error, error) {
		return "", nil, errors.Join(err, cleanup())
	}
	for _, args := range [][]string{
		{dir, "/grant:r", "*" + current.Uid + ":(OI)(CI)F"},
		{dir, "/inheritance:r"},
	} {
		output, err := exec.CommandContext(a.ctx, "icacls.exe", args...).CombinedOutput()
		if err != nil {
			return fail(fmt.Errorf("protect temporary SSH key directory: %w: %s", err, strings.TrimSpace(string(output))))
		}
	}
	key := filepath.Join(dir, "id_rsa")
	if err := copyFile(name, key, 0600); err != nil { return fail(fmt.Errorf("copy SSH private key: %w", err)) }
	return key, cleanup, nil
}

func (a *application) car(args []string) error {
	if len(args) == 0 { return errors.New("usage: mgu car upload|check|install|status|restore|backups|logs") }
	action := args[0]
	switch action {
	case "upload", "check", "install", "status", "restore", "backups", "logs":
	default:
		return fmt.Errorf("unknown car command %q", action)
	}
	flags := flag.NewFlagSet("car "+action, flag.ContinueOnError)
	flags.SetOutput(a.err)
	kit := filepath.Join(a.root, "dist", "mgu-custom-apps.tar.gz")
	lines, follow := 100, false
	if action == "upload" || action == "install" { flags.StringVar(&kit, "kit", kit, "car kit archive") }
	if action == "logs" {
		flags.IntVar(&lines, "lines", lines, "number of log lines")
		flags.BoolVar(&follow, "follow", false, "follow the log until interrupted")
	}
	if err := flags.Parse(args[1:]); err != nil { return err }
	if action == "logs" {
		if flags.NArg() != 1 || lines < 1 || lines > 100000 { return errors.New("usage: mgu car logs [--lines 100] [--follow] APP|deploy|renderer") }
	}
	if action != "restore" && action != "logs" && flags.NArg() != 0 { return fmt.Errorf("unexpected arguments to car %s", action) }
	if action == "restore" && flags.NArg() > 1 { return errors.New("usage: mgu car restore [stock|latest|BACKUP_NAME]") }
	if a.auto {
		if err := a.autoConnect(); err != nil { return err }
	}
	if action == "logs" { return a.carLogs(flags.Arg(0), lines, follow) }
	if action == "upload" || action == "install" {
		if err := a.uploadKit(absolute(kit)); err != nil { return err }
		if action == "upload" { return nil }
	}
	remote := "cd " + shellQuote(carKitDirectory) + " && sh deploy-car.sh " + shellQuote(action)
	if action == "restore" && flags.NArg() == 1 {
		backup := flags.Arg(0)
		if !validName(backup) { return errors.New("invalid backup name") }
		remote += " " + shellQuote(backup)
	}
	return a.ssh(remote, nil, action == "restore")
}

func inspectKit(input *os.File) error {
	gz, err := gzip.NewReader(input)
	if err != nil { return err }
	defer gz.Close()
	tr := tar.NewReader(gz)
	found := map[string]bool{}
	regular := map[string]bool{}
	hasApp := false
	for {
		header, err := tr.Next()
		if err == io.EOF { break }
		if err != nil { return err }
		name := strings.TrimSuffix(header.Name, "/")
		if name == "" || path.Clean(name) != name || strings.ContainsAny(name, "\\\r\n") {
			return fmt.Errorf("unsafe archive path %q", header.Name)
		}
		if name != "mgu-custom-apps" && !strings.HasPrefix(name, "mgu-custom-apps/") { return fmt.Errorf("unexpected kit archive path %q", name) }
		if header.Typeflag != tar.TypeDir && header.Typeflag != tar.TypeReg && header.Typeflag != tar.TypeRegA { return fmt.Errorf("unsupported kit archive entry %q", name) }
		if found[name] { return fmt.Errorf("duplicate kit archive entry %q", name) }
		found[name] = true
		regular[name] = header.Typeflag != tar.TypeDir && header.Size > 0
		if strings.HasPrefix(name, "mgu-custom-apps/apps/") && strings.HasSuffix(name, ".mgu") && regular[name] { hasApp = true }
	}
	if _, err := io.Copy(io.Discard, gz); err != nil { return err }
	for _, name := range []string{"KIT_SUMS", "deploy-car.sh", "mgu-app-install.sh", "mainapp-patch.js"} {
		if !regular["mgu-custom-apps/"+name] { return fmt.Errorf("kit archive is missing %s", name) }
	}
	if !hasApp { return errors.New("kit archive does not contain any app bundles") }
	return nil
}

func (a *application) uploadKit(name string) error {
	file, err := os.Open(name)
	if err != nil { return err }
	defer file.Close()
	if err := inspectKit(file); err != nil { return fmt.Errorf("kit archive: %w", err) }
	if _, err := file.Seek(0, io.SeekStart); err != nil { return err }
	fmt.Fprintln(a.out, "Uploading kit to", a.host)
	dest := shellQuote(carKitDirectory)
	remote := "mkdir -p " + dest + " && rm -rf " + shellQuote(carKitDirectory+"/apps") +
		" && rm -f " + shellQuote(carKitDirectory+"/mgu-renderd") + " " + shellQuote(carKitDirectory+"/mgu-inputgate.so") +
		" && tar xzf - -C /var/opt && cd " + dest + " && md5sum -c KIT_SUMS"
	if err := a.ssh(remote, file, false); err != nil { return err }
	fmt.Fprintln(a.out, "Kit uploaded; remote checksums matched.")
	return nil
}

func (a *application) carLogs(name string, lines int, follow bool) error {
	count := strconv.Itoa(lines)
	if name == "renderer" {
		command := "journalctl --no-pager -u mgu-renderd.service -n " + count
		if follow { command += " -f" }
		return a.ssh(command, nil, false)
	}
	tail := "tail -n " + count
	if follow { tail += " -f" }
	if name == "deploy" { return a.ssh(tail+" "+shellQuote(carKitDirectory+"/deploy-car.log"), nil, false) }
	if !validName(name) { return errors.New("invalid app name") }
	remote := "while IFS='=' read -r uid name; do if [ \"$name\" = " + shellQuote(name) + " ]; then " +
		"case \"$uid\" in ''|*[!0-9]*) echo 'Invalid app uid' >&2; exit 1;; esac; " +
		"exec " + tail + " \"/var/opt/public/oap/oap_$uid/data/" + name + ".log\"; fi; " +
		"done < /var/opt/public/oap/oap_12201/security/uids.txt; echo 'App is not installed' >&2; exit 1"
	return a.ssh(remote, nil, false)
}

