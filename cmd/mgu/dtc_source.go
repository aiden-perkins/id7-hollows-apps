package main

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

func dtcMemberName(name string) (string, error) {
	name = strings.ReplaceAll(name, "\\", "/")
	if strings.HasPrefix(name, "/") || strings.Contains(name, ":") { return "", fmt.Errorf("unsafe archive path %q", name) }
	for _, part := range strings.Split(name, "/") { if part == ".." { return "", fmt.Errorf("unsafe archive path %q", name) } }
	return path.Clean(name), nil
}

func readDTCMember(reader io.Reader) ([]byte, error) {
	const limit = 128 << 20
	data, err := io.ReadAll(io.LimitReader(reader, limit+1))
	if err == nil && len(data) > limit { return nil, errors.New("fault database member exceeds 128 MiB") }
	return data, err
}

func wantedDTCMember(name string) bool {
	return strings.HasSuffix(name, ".json") || strings.HasSuffix(name, ".tgz") || strings.HasSuffix(name, ".tar.gz")
}

func readDTCArchive(data []byte) (map[string][]byte, error) {
	files := map[string][]byte{}
	add := func(name string, reader io.Reader) error {
		name, err := dtcMemberName(name)
		if err != nil { return err }
		if !wantedDTCMember(name) { return nil }
		if _, exists := files[name]; exists { return fmt.Errorf("duplicate fault database member %q", name) }
		content, err := readDTCMember(reader)
		if err == nil { files[name] = content }
		return err
	}
	if bytes.HasPrefix(data, []byte{'P', 'K'}) {
		reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
		if err != nil { return nil, err }
		for _, member := range reader.File {
			if member.FileInfo().IsDir() { continue }
			if !member.Mode().IsRegular() { return nil, fmt.Errorf("unsupported archive member %q", member.Name) }
			file, err := member.Open()
			if err != nil { return nil, err }
			addErr := add(member.Name, file)
			closeErr := file.Close()
			if addErr != nil { return nil, addErr }
			if closeErr != nil { return nil, closeErr }
		}
		return files, nil
	}
	var input io.Reader = bytes.NewReader(data)
	if bytes.HasPrefix(data, []byte{0x1f, 0x8b}) {
		reader, err := gzip.NewReader(input)
		if err != nil { return nil, err }
		defer reader.Close()
		input = reader
	}
	reader := tar.NewReader(input)
	for {
		member, err := reader.Next()
		if err == io.EOF { break }
		if err != nil { return nil, err }
		if member.Typeflag == tar.TypeDir { continue }
		if member.Typeflag != tar.TypeReg && member.Typeflag != tar.TypeRegA { return nil, fmt.Errorf("unsupported archive member %q", member.Name) }
		if err := add(member.Name, reader); err != nil { return nil, err }
	}
	if len(files) == 0 { return nil, errors.New("archive contains no fault database files") }
	return files, nil
}

func readDTCSource(source string) (map[string][]byte, error) {
	info, err := os.Lstat(source)
	if err != nil { return nil, err }
	if info.Mode()&os.ModeSymlink != 0 { return nil, errors.New("fault database source must not be a symbolic link") }
	if !info.IsDir() {
		if !info.Mode().IsRegular() { return nil, errors.New("fault database source must be a file or directory") }
		data, err := os.ReadFile(source)
		if err != nil { return nil, err }
		return readDTCArchive(data)
	}
	files := map[string][]byte{}
	err = filepath.WalkDir(source, func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil { return walkErr }
		if entry.IsDir() { return nil }
		if entry.Type()&os.ModeSymlink != 0 { return fmt.Errorf("symbolic link in fault database: %s", name) }
		if !wantedDTCMember(entry.Name()) { return nil }
		info, err := entry.Info()
		if err != nil { return err }
		if !info.Mode().IsRegular() { return fmt.Errorf("unsupported fault database file: %s", name) }
		rel, err := filepath.Rel(source, name)
		if err != nil { return err }
		file, err := os.Open(name)
		if err != nil { return err }
		data, readErr := readDTCMember(file)
		closeErr := file.Close()
		if readErr != nil { return readErr }
		if closeErr != nil { return closeErr }
		files[filepath.ToSlash(rel)] = data
		return nil
	})
	return files, err
}

func decodeDTCJSON(data []byte, target any) error {
	return json.Unmarshal(bytes.TrimPrefix(data, []byte{0xef, 0xbb, 0xbf}), target)
}

func dtcStrings(data []byte, name string) (map[string]string, error) {
	var object map[string]json.RawMessage
	if err := decodeDTCJSON(data, &object); err != nil { return nil, fmt.Errorf("%s: expected an object of texts: %w", name, err) }
	if object == nil { return nil, fmt.Errorf("%s: expected an object of texts", name) }
	result := map[string]string{}
	for key, raw := range object {
		raw = bytes.TrimSpace(raw)
		if len(raw) == 0 || raw[0] != '"' { return nil, fmt.Errorf("%s: %q is not a text", name, key) }
		var description string
		if err := json.Unmarshal(raw, &description); err != nil { return nil, fmt.Errorf("%s: %w", name, err) }
		result[key] = description
	}
	return result, nil
}

func sortedDTCFiles(files map[string][]byte) []string {
	names := make([]string, 0, len(files))
	for name := range files { names = append(names, name) }
	sort.Strings(names)
	return names
}

func dtcOutputStage(source, output string) (string, error) {
	source, output = absolute(source), absolute(output)
	for _, pair := range [][2]string{{source, output}, {output, source}} {
		rel, err := filepath.Rel(pair[0], pair[1])
		if err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			return "", errors.New("fault database input and output must not contain each other")
		}
	}
	if info, err := os.Lstat(output); err == nil {
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 { return "", fmt.Errorf("output is not a regular directory: %s", output) }
	} else if !os.IsNotExist(err) { return "", err }
	parent := filepath.Dir(output)
	if err := os.MkdirAll(parent, 0755); err != nil { return "", err }
	return os.MkdirTemp(parent, ".mgu-dtc-*")
}

func (a *application) dtcDirectory() string {
	return filepath.Join(a.root, "bmw-extracted", "dtc_scanner", "dtc_db")
}
