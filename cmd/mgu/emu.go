package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func (a *application) emu(args []string) error {
	flags := flag.NewFlagSet("emu", flag.ContinueOnError)
	flags.SetOutput(a.err)
	port := flags.Int("port", 8077, "local HTTP port")
	background := flags.String("bg", "", "head-unit background screenshot")
	noTouch := flags.Bool("no-touch", false, "disable touch routing")
	// Accept the app before the options, as well as after them.
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		args = append(append([]string{}, args[1:]...), args[0])
	}
	if err := flags.Parse(args); err != nil { return err }
	if flags.NArg() > 1 { return errors.New("usage: mgu emu [APP|all] [--port 8077] [--bg PATH] [--no-touch]") }
	if *port < 1 || *port > 65535 { return errors.New("emulator port must be between 1 and 65535") }
	var names []string
	if flags.NArg() == 1 && flags.Arg(0) != "all" { names = []string{flags.Arg(0)} }
	specs, err := a.specs(names)
	if err != nil { return err }
	for _, name := range []string{"index.js", "package.json"} {
		if _, err := os.Stat(filepath.Join(a.root, "bmw-extracted", "oap-sdk", name)); err != nil {
			return fmt.Errorf("SDK missing: use mgu sdk extract APP.js first: %w", err)
		}
	}
	for _, name := range []string{"kit/tools/emu.js", "kit/tools/hu-stub.js", "kit/emu/web/index.html", "kit/emu/web/gfx/mgu-gfx-wasm.wasm"} {
		if _, err := os.Stat(filepath.Join(a.upstream, filepath.FromSlash(name))); err != nil {
			return fmt.Errorf("upstream live emulator file missing (%s): %w", name, err)
		}
	}
	apps := make([]map[string]string, 0, len(specs))
	for _, spec := range specs {
		id := text(spec["id"])
		apps = append(apps, map[string]string{"id": id, "source": filepath.Dir(a.appManifest(id))})
	}
	config := map[string]any{
		"root": a.root, "upstream": a.upstream, "python": a.pythonProgram(),
		"buildArgs": a.upstreamArguments("build"), "apps": apps,
	}
	file, err := os.CreateTemp("", "mgu-emu-*.json")
	if err != nil { return err }
	configPath := file.Name()
	file.Close()
	defer os.Remove(configPath)
	if err := writeJSON(configPath, config); err != nil { return err }
	options := []string{filepath.Join(a.root, "cmd", "mgu", "tools", "emu.cjs"), configPath, apps[0]["id"], "--port", fmt.Sprint(*port)}
	if *background != "" { options = append(options, "--bg", absolute(*background)) }
	if *noTouch { options = append(options, "--no-touch") }
	fmt.Fprintf(a.out, "Live emulator: http://localhost:%d (%d apps; Ctrl+C to stop)\n", *port, len(apps))
	cmd := exec.CommandContext(a.ctx, a.node, options...)
	cmd.Dir = a.root
	cmd.Stdout, cmd.Stderr = a.out, a.err
	control, err := cmd.StdinPipe()
	if err != nil { return err }
	defer control.Close()
	// Give the emulator time to stop its app and builder before forcing exit.
	cmd.Cancel = func() error { return control.Close() }
	cmd.WaitDelay = 5 * time.Second
	if err := cmd.Run(); err != nil {
		if a.ctx.Err() != nil { return nil }
		return fmt.Errorf("live emulator: %w", err)
	}
	return nil
}
