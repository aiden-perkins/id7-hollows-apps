package main

import (
	"errors"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
)

func readJSON(name string, target any) error {
	data, err := os.ReadFile(name)
	if err != nil { return err }
	if err := json.Unmarshal(data, target); err != nil { return fmt.Errorf("%s: %w", name, err) }
	return nil
}

func writeJSON(name string, value any) error {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil { return err }
	return writeFile(name, append(data, '\n'), 0644)
}

func writeFile(name string, data []byte, mode fs.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(name), 0755); err != nil { return err }
	return atomicFile(name, mode, func(file *os.File) error {
		_, err := file.Write(data)
		return err
	})
}

func atomicFile(name string, mode fs.FileMode, write func(*os.File) error) error {
	file, err := os.CreateTemp(filepath.Dir(name), ".mgu-file-*")
	if err != nil { return err }
	defer os.Remove(file.Name())
	if err := write(file); err != nil { file.Close(); return err }
	if err := file.Chmod(mode); err != nil { file.Close(); return err }
	if err := file.Close(); err != nil { return err }
	return os.Rename(file.Name(), name)
}

func copyFile(src, dst string, mode fs.FileMode) error {
	info, err := os.Lstat(src)
	if err != nil { return err }
	if !info.Mode().IsRegular() { return fmt.Errorf("expected a regular file: %s", src) }
	input, err := os.Open(src)
	if err != nil { return err }
	defer input.Close()
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil { return err }
	return atomicFile(dst, mode, func(file *os.File) error {
		_, err := io.Copy(file, input)
		return err
	})
}

func copyTree(src, dst string) error {
	return filepath.WalkDir(src, func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil { return walkErr }
		rel, err := filepath.Rel(src, name)
		if err != nil { return err }
		target := filepath.Join(dst, rel)
		if entry.IsDir() { return os.MkdirAll(target, 0755) }
		if entry.Type()&os.ModeSymlink != 0 { return fmt.Errorf("symbolic links are not supported in bundles: %s", name) }
		return copyFile(name, target, 0644)
	})
}

// Only generated output directly under dist may be replaced.
func replaceDirectory(stage, dest, dist string) error {
	rel, err := filepath.Rel(dist, dest)
	if err != nil || rel == "." || filepath.Dir(rel) != "." { return errors.New("output must be directly under dist") }
	if info, err := os.Lstat(dest); err == nil {
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 { return fmt.Errorf("output is not a regular directory: %s", dest) }
		backup, err := os.MkdirTemp(dist, ".mgu-previous-*")
		if err != nil { return err }
		if err := os.Remove(backup); err != nil { return err }
		if err := os.Rename(dest, backup); err != nil { return err }
		if err := os.Rename(stage, dest); err != nil {
			if restoreErr := os.Rename(backup, dest); restoreErr != nil {
				return fmt.Errorf("publishing failed: %v; previous output is at %s (restore failed: %v)", err, backup, restoreErr)
			}
			return err
		}
		return os.RemoveAll(backup)
	} else if !os.IsNotExist(err) { return err }
	return os.Rename(stage, dest)
}

