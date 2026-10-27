package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

type downloadManifest struct {
	Schema int `json:"schema"`
	Target string `json:"target"`
	Identity string `json:"identity"`
	Root string `json:"root"`
	Created string `json:"created"`
	LastRun string `json:"lastRun"`
	Status string `json:"status"`
	Paths []string `json:"paths"`
	Excluded []string `json:"excluded"`
	BytesThisRun int64 `json:"bytesThisRun"`
	FilesThisRun int `json:"filesThisRun"`
	ErrorsThisRun int `json:"errorsThisRun"`
}

type downloadRecord struct {
	Entry downloadEntry `json:"entry"`
	Local string `json:"local,omitempty"`
	SHA256 string `json:"sha256,omitempty"`
	ReplacesSHA256 string `json:"replacesSHA256,omitempty"`
	Complete bool `json:"complete"`
	Seen string `json:"seen"`
	Error string `json:"error,omitempty"`
}

type downloadCapture struct {
	root string
	manifest downloadManifest
	lock string
	bytes int64
	files int
	problems int
}

func downloadDigest(value string) string {
	digest := sha256.Sum256([]byte(value))
	return hex.EncodeToString(digest[:])
}

func downloadDirectory(name string) error {
	parent := filepath.Dir(name)
	if parent != name {
		if err := downloadDirectory(parent); err != nil { return err }
	}
	info, err := os.Lstat(name)
	if os.IsNotExist(err) {
		if parent == name { return err }
		if err := os.Mkdir(name, 0700); err != nil && !os.IsExist(err) { return err }
		info, err = os.Lstat(name)
	}
	if err != nil { return err }
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 { return fmt.Errorf("download directory is not a regular directory: %s", name) }
	return nil
}

func downloadLocal(root, relative string, directory bool) (string, error) {
	if !filepath.IsLocal(relative) { return "", fmt.Errorf("download path escapes capture: %s", relative) }
	name := filepath.Join(root, relative)
	if directory {
		if err := downloadDirectory(name); err != nil { return "", err }
	} else {
		if err := downloadDirectory(filepath.Dir(name)); err != nil { return "", err }
		if info, err := os.Lstat(name); err == nil {
			if !info.Mode().IsRegular() { return "", fmt.Errorf("download file is not a regular file: %s", name) }
		} else if !os.IsNotExist(err) { return "", err }
	}
	return name, nil
}

func downloadJSON(name string, value any) error {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil { return err }
	return writeFile(name, append(data, '\n'), 0600)
}

func openDownloadCapture(root, target string, source downloadReply, breakLock bool) (*downloadCapture, error) {
	if err := downloadDirectory(root); err != nil { return nil, err }
	manifest, err := downloadLocal(root, "manifest.json", false)
	if err != nil { return nil, err }
	capture := &downloadCapture{root: root}
	if err := readJSON(manifest, &capture.manifest); err == nil {
		if capture.manifest.Schema != 1 || capture.manifest.Identity != source.Identity || capture.manifest.Target != target || capture.manifest.Root != source.Root { return nil, errors.New("capture belongs to another source or app; choose a different --out directory") }
	} else if !os.IsNotExist(err) { return nil, err } else {
		entries, err := os.ReadDir(root)
		if err != nil { return nil, err }
		if len(entries) != 0 { return nil, errors.New("output directory is not empty and has no download manifest; choose a new --out directory") }
		capture.manifest = downloadManifest{Schema: 1, Identity: source.Identity, Root: source.Root, Target: target, Created: time.Now().UTC().Format(time.RFC3339Nano)}
	}
	capture.lock, err = downloadLocal(root, filepath.Join(".mgu-download", "lock"), false)
	if err != nil { return nil, err }
	if breakLock {
		if err := os.Remove(capture.lock); err != nil && !os.IsNotExist(err) { return nil, err }
	}
	lock, err := os.OpenFile(capture.lock, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if os.IsExist(err) { return nil, errors.New("capture is locked; after confirming no other download uses it, repeat with --break-lock") }
	if err != nil { return nil, err }
	_, writeErr := fmt.Fprintf(lock, "pid=%d\nstarted=%s\n", os.Getpid(), time.Now().UTC().Format(time.RFC3339Nano))
	if err := errors.Join(writeErr, lock.Close()); err != nil { os.Remove(capture.lock); return nil, err }
	capture.manifest.Paths, capture.manifest.Excluded = source.Paths, source.Excluded
	capture.manifest.Status = "running"
	if err := downloadJSON(manifest, capture.manifest); err != nil { os.Remove(capture.lock); return nil, err }
	return capture, nil
}

func (c *downloadCapture) close() error { return os.Remove(c.lock) }

// Encode upper-case and unsafe bytes too, so distinct Linux names cannot collide on Windows.
func downloadName(value string) string {
	var result strings.Builder
	for i, b := range []byte(value) {
		if b >= 'a' && b <= 'z' || b >= '0' && b <= '9' || b == '-' || b == '_' || b == '.' && i != len(value)-1 { result.WriteByte(b) } else { fmt.Fprintf(&result, "%%%02X", b) }
	}
	name := result.String()
	stem := strings.SplitN(name, ".", 2)[0]
	reserved := stem == "con" || stem == "prn" || stem == "aux" || stem == "nul" || len(stem) == 4 && (strings.HasPrefix(stem, "com") || strings.HasPrefix(stem, "lpt")) && stem[3] >= '1' && stem[3] <= '9'
	if reserved { name = fmt.Sprintf("%%%02X", name[0]) + name[1:] }
	if len(name) > 200 { name = name[:120] + "~" + downloadDigest(value) }
	return name
}

func (c *downloadCapture) relative(remote string) (string, error) {
	root := c.manifest.Root
	if !path.IsAbs(remote) || path.Clean(remote) != remote || root != "/" && remote != root && !strings.HasPrefix(remote, root+"/") { return "", fmt.Errorf("invalid remote capture path: %q", remote) }
	relative := strings.TrimPrefix(strings.TrimPrefix(remote, root), "/")
	if relative == "" { return "files", nil }
	parts := []string{"files"}
	for _, part := range strings.Split(relative, "/") { parts = append(parts, downloadName(part)) }
	return filepath.Join(parts...), nil
}

func (c *downloadCapture) recordName(remote string) (string, error) {
	return downloadLocal(c.root, filepath.Join(".mgu-download", "entries", downloadDigest(remote)+".json"), false)
}

func (c *downloadCapture) record(entry downloadEntry) (downloadRecord, error) {
	name, err := c.recordName(entry.Path)
	if err != nil { return downloadRecord{}, err }
	var record downloadRecord
	if err := readJSON(name, &record); err != nil && !os.IsNotExist(err) { return record, err }
	if record.Entry.Path != "" && record.Entry.Path != entry.Path { return record, errors.New("capture entry path does not match its index") }
	return record, nil
}

func (c *downloadCapture) save(record downloadRecord) error {
	name, err := c.recordName(record.Entry.Path)
	if err != nil { return err }
	record.Seen = time.Now().UTC().Format(time.RFC3339Nano)
	return downloadJSON(name, record)
}

func downloadFileHash(name string) (string, error) {
	info, err := os.Lstat(name)
	if err != nil { return "", err }
	if !info.Mode().IsRegular() { return "", fmt.Errorf("not a regular download file: %s", name) }
	file, err := os.Open(name)
	if err != nil { return "", err }
	defer file.Close()
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil { return "", err }
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func (c *downloadCapture) metadata(entry downloadEntry) error {
	record, err := c.record(entry)
	if err != nil { return err }
	if record.Entry.Kind != "" && record.Entry.Kind != entry.Kind && record.Entry.Kind != "error" { return fmt.Errorf("remote path changed type; use a new capture to retain both types: %s", entry.Path) }
	local := ""
	if entry.Kind == "directory" {
		local, err = c.relative(entry.Path)
		if err != nil { return err }
		if _, err := downloadLocal(c.root, local, true); err != nil { return err }
	}
	return c.save(downloadRecord{Entry: entry, Local: local, Complete: true})
}

func (c *downloadCapture) receive(a *application, agent *downloadAgent, maxBytes int64, maxFiles int) (resultErr error) {
	status := "interrupted"
	limited := func() error {
		status = "limited"
		if c.problems > 0 { return fmt.Errorf("download limit reached with %d source errors; progress was saved", c.problems) }
		return nil
	}
	defer func() {
		c.manifest.LastRun = time.Now().UTC().Format(time.RFC3339Nano)
		c.manifest.Status, c.manifest.BytesThisRun, c.manifest.FilesThisRun, c.manifest.ErrorsThisRun = status, c.bytes, c.files, c.problems
		name, err := downloadLocal(c.root, "manifest.json", false)
		if err == nil { err = downloadJSON(name, c.manifest) }
		resultErr = errors.Join(resultErr, err)
		fmt.Fprintf(a.out, "%d file bytes received; %d files completed; %d errors; status: %s\n", c.bytes, c.files, c.problems, status)
	}()
	for {
		batch, err := agent.request(map[string]any{"op": "scan"})
		if err != nil { return err }
		for _, entry := range batch.Entries {
			if _, err := c.relative(entry.Path); err != nil { return err }
			if (maxBytes > 0 && c.bytes >= maxBytes) || (maxFiles > 0 && c.files >= maxFiles) { return limited() }
			var entryErr error
			switch entry.Kind {
			case "file":
				var complete bool
				complete, entryErr = c.receiveFile(a, agent, entry, maxBytes)
				if entryErr == nil && !complete { return limited() }
			case "directory", "symlink", "special", "excluded": entryErr = c.metadata(entry)
			case "error": entryErr = errors.New(entry.Error)
			default: return fmt.Errorf("unknown remote file type %q", entry.Kind)
			}
			if entryErr != nil {
				var remote *downloadRemoteError
				if entry.Kind != "error" && !errors.As(entryErr, &remote) { return entryErr }
				c.problems++
				fmt.Fprintf(a.err, "%s: %v\n", entry.Path, entryErr)
				record, err := c.record(entry)
				if err != nil { return err }
				if record.Entry.Path == "" { record.Entry = entry }
				record.Error = entryErr.Error()
				if err := c.save(record); err != nil { return err }
			}
		}
		if batch.Done {
			status = "complete"
			if c.problems > 0 { status = "errors"; return fmt.Errorf("%d paths could not be captured; see per-entry metadata", c.problems) }
			return nil
		}
	}
}

func (c *downloadCapture) receiveFile(a *application, agent *downloadAgent, entry downloadEntry, maxBytes int64) (bool, error) {
	if entry.Size < 0 || entry.Size > 1<<53-1 || entry.Signature == "" { return false, errors.New("invalid remote file metadata") }
	record, err := c.record(entry)
	if err != nil { return false, err }
	if record.Entry.Kind != "" && record.Entry.Kind != "file" && record.Entry.Kind != "error" { return false, fmt.Errorf("remote path changed type: %s", entry.Path) }
	relative, err := c.relative(entry.Path)
	if err != nil { return false, err }
	local, err := downloadLocal(c.root, relative, false)
	if err != nil { return false, err }
	localHash, err := downloadFileHash(local)
	if err != nil && !os.IsNotExist(err) { return false, err }
	if localHash != "" && !record.Complete && record.Entry.Signature == entry.Signature && localHash == record.SHA256 {
		// Recover an interruption after publishing the file but before its completion checkpoint.
		record.Complete, record.ReplacesSHA256, record.Error = true, "", ""
		return true, c.save(record)
	}
	if localHash != "" {
		expected := record.ReplacesSHA256
		if record.Complete { expected = record.SHA256 }
		if expected == "" || localHash != expected { return false, fmt.Errorf("local file has untracked changes; choose a new --out directory: %s", local) }
	}
	if record.Complete && record.Entry.Signature == entry.Signature && localHash == record.SHA256 && localHash != "" {
		record.Error = ""
		return true, c.save(record)
	}
	if record.Complete && localHash != "" {
		history := filepath.Join(".mgu-download", "history", downloadDigest(entry.Path), downloadDigest(record.Entry.Signature))
		archive, err := downloadLocal(c.root, history+".data", false)
		if err != nil { return false, err }
		if existing, err := downloadFileHash(archive); os.IsNotExist(err) {
			if err := copyFile(local, archive, 0600); err != nil { return false, err }
		} else if err != nil { return false, err } else if existing != localHash { return false, errors.New("saved download history differs from its recorded content") }
		metadata, err := downloadLocal(c.root, history+".json", false)
		if err != nil { return false, err }
		archived := record
		archived.Local = history + ".data"
		if err := downloadJSON(metadata, archived); err != nil { return false, err }
		record.ReplacesSHA256 = localHash
	}
	record.Entry, record.Local, record.Complete, record.Error = entry, relative, false, ""
	partialRelative := filepath.Join(".mgu-download", "partials", downloadDigest(entry.Path+"\x00"+entry.Signature)+".partial")
	partial, err := downloadLocal(c.root, partialRelative, false)
	if err != nil { return false, err }
	var offset int64
	if info, err := os.Stat(partial); err == nil { offset = info.Size() } else if !os.IsNotExist(err) { return false, err }
	if offset > entry.Size { return false, errors.New("local partial exceeds remote file size; use a new capture directory") }
	hashes, err := agent.request(map[string]any{"op": "hash", "path": entry.Path, "signature": entry.Signature, "prefix": offset})
	if err != nil { return false, err }
	if digest, err := hex.DecodeString(hashes.SHA256); err != nil || len(digest) != sha256.Size { return false, errors.New("invalid remote SHA-256") }
	if offset > 0 {
		prefix, err := downloadFileHash(partial)
		if err != nil { return false, err }
		if prefix != hashes.PrefixSHA256 {
			bad := partial + ".bad-" + fmt.Sprint(time.Now().UnixNano())
			if _, err := os.Lstat(bad); !os.IsNotExist(err) { return false, errors.New("cannot preserve mismatched partial") }
			if err := os.Rename(partial, bad); err != nil { return false, err }
			offset = 0
			fmt.Fprintln(a.err, "Preserved mismatched partial; restarting:", entry.Path)
		}
	}
	record.SHA256 = hashes.SHA256
	if localHash == hashes.SHA256 {
		record.Complete, record.ReplacesSHA256 = true, ""
		return true, c.save(record)
	}
	if err := c.save(record); err != nil { return false, err }
	file, err := os.OpenFile(partial, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil { return false, err }
	defer file.Close()
	if _, err := file.Seek(offset, io.SeekStart); err != nil { return false, err }
	fmt.Fprintf(a.out, "%s: resuming at %d / %d bytes\n", entry.Path, offset, entry.Size)
	lastProgress := time.Now()
	for offset < entry.Size {
		length := int64(1 << 20)
		if length > entry.Size-offset { length = entry.Size-offset }
		if maxBytes > 0 && length > maxBytes-c.bytes { length = maxBytes-c.bytes }
		if length == 0 { return false, nil }
		chunk, err := agent.request(map[string]any{"op": "read", "path": entry.Path, "signature": entry.Signature, "offset": offset, "length": length})
		if err != nil { return false, err }
		if chunk.Offset != offset || int64(len(chunk.Data)) != length { return false, errors.New("remote returned an unexpected byte range") }
		written, err := file.Write(chunk.Data)
		c.bytes += int64(written)
		offset += int64(written)
		if err != nil { return false, err }
		if written != len(chunk.Data) { return false, io.ErrShortWrite }
		if err := file.Sync(); err != nil { return false, err }
		if time.Since(lastProgress) >= time.Second {
			fmt.Fprintf(a.out, "%s: %d / %d bytes\n", entry.Path, offset, entry.Size)
			lastProgress = time.Now()
		}
	}
	if err := file.Sync(); err != nil { return false, err }
	if err := file.Close(); err != nil { return false, err }
	actual, err := downloadFileHash(partial)
	if err != nil { return false, err }
	if actual != record.SHA256 { return false, errors.New("download checksum mismatch; partial retained for review and retry") }
	current, err := downloadFileHash(local)
	if err != nil && !os.IsNotExist(err) { return false, err }
	if current != record.ReplacesSHA256 { return false, errors.New("local destination changed during download; partial retained") }
	if err := os.Rename(partial, local); err != nil { return false, err }
	record.Complete, record.ReplacesSHA256 = true, ""
	if err := c.save(record); err != nil { return false, err }
	c.files++
	fmt.Fprintln(a.out, "Saved:", local)
	return true, nil
}
