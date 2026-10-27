package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func sortedKeys(values map[string]any) []string {
	keys := make([]string, 0, len(values))
	for key := range values { keys = append(keys, key) }
	sort.Strings(keys)
	return keys
}

func (a *application) specs(names []string) ([]map[string]any, error) {
	if len(names) == 0 {
		for _, base := range []string{a.upstream, a.root} {
			entries, err := os.ReadDir(filepath.Join(base, "apps"))
			if err != nil { return nil, err }
			for _, entry := range entries {
				if entry.IsDir() {
					if _, err := os.Stat(filepath.Join(base, "apps", entry.Name(), "app.json")); err == nil { names = append(names, entry.Name()) }
				}
			}
		}
		sort.Strings(names)
	}
	seen := map[string]bool{}
	var result []map[string]any
	for _, name := range names {
		if !validName(name) { return nil, fmt.Errorf("invalid app name %q", name) }
		if seen[name] { continue }
		seen[name] = true
		spec := map[string]any{}
		if err := readJSON(a.appManifest(name), &spec); err != nil { return nil, err }
		if _, ok := spec["id"]; !ok { spec["id"] = name }
		if text(spec["id"]) != name { return nil, fmt.Errorf("app id %q does not match directory %q", text(spec["id"]), name) }
		if !validName(strings.ReplaceAll(text(spec["version"]), "+", "-")) { return nil, fmt.Errorf("%s has an invalid version", name) }
		if text(spec["title"]) == "" || text(spec["loggingId"]) == "" { return nil, fmt.Errorf("%s requires title and loggingId", name) }
		result = append(result, spec)
	}
	if len(result) == 0 { return nil, fmt.Errorf("no apps found") }
	return result, nil
}

func (a *application) build(names []string) error {
	specs, err := a.specs(names)
	if err != nil { return err }
	for _, name := range []string{"index.js", "package.json"} {
		if _, err := os.Stat(filepath.Join(a.root, "bmw-extracted", "oap-sdk", name)); err != nil { return fmt.Errorf("SDK missing: use mgu sdk extract APP.js first: %w", err) }
	}
	for _, spec := range specs {
		if err := a.ctx.Err(); err != nil { return err }
		id := text(spec["id"])
		if err := a.upstreamTool("build", id); err != nil { return fmt.Errorf("%s: %w", id, err) }
	}
	return nil
}
