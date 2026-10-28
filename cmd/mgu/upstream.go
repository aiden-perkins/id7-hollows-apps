package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

func (a *application) checkUpstream() error {
	local, err := filepath.EvalSymlinks(a.root)
	if err != nil { return err }
	upstream, err := filepath.EvalSymlinks(a.upstream)
	if err != nil { return fmt.Errorf("upstream unavailable; use --upstream PATH: %w", err) }
	localInfo, err := os.Stat(local)
	if err != nil { return err }
	upstreamInfo, err := os.Stat(upstream)
	if err != nil { return err }
	if os.SameFile(localInfo, upstreamInfo) { return errors.New("wrapper and upstream must be separate directories") }
	for _, name := range []string{"apps", "kit", "deploy"} {
		info, err := os.Stat(filepath.Join(upstream, name))
		if err != nil || !info.IsDir() { return fmt.Errorf("%s is not an upstream MGU repository (missing %s)", upstream, name) }
	}
	a.upstream = upstream
	return nil
}

func (a *application) isUpstreamApp(id string) bool {
	// Local apps take precedence even if upstream later adds their namesakes.
	return id != "mgu_lab" && id != "ambient_lighting" && id != "live_data_viewer" && id != "trip_data"
}

func (a *application) appManifest(id string) string {
	base := a.root
	if a.isUpstreamApp(id) { base = a.upstream }
	return filepath.Join(base, "apps", id, "app.json")
}

func (a *application) pythonProgram() string {
	if a.python != "" { return a.python }
	if runtime.GOOS == "windows" { return "python" }
	return "python3"
}

func (a *application) upstreamArguments(command string, args ...string) []string {
	options := []string{"-B", filepath.Join(a.root, "cmd", "mgu", "tools", "upstream.py"), "--root", a.root, "--upstream", a.upstream, "--node", a.node, command}
	return append(options, args...)
}

func (a *application) upstreamTool(command string, args ...string) error {
	return a.command(a.pythonProgram(), a.upstreamArguments(command, args...), nil, false)
}
