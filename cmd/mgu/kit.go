package main

import (
	"errors"
	"flag"
	"fmt"
	"os/exec"
	"strings"
)

func (a *application) pickRenderer(mode string) (string, error) {
	if mode == "none" { return "", nil }
	cmd := exec.CommandContext(a.ctx, a.pythonProgram(), a.upstreamArguments("renderer-path", mode)...)
	cmd.Dir, cmd.Stderr = a.root, a.err
	output, err := cmd.Output()
	if err != nil { return "", fmt.Errorf("upstream renderer selection: %w", err) }
	return strings.TrimSpace(string(output)), nil
}

func (a *application) renderer(args []string) error {
	if len(args) != 1 || (args[0] != "status" && args[0] != "build") { return errors.New("usage: mgu renderer status|build") }
	return a.upstreamTool("renderer", args...)
}

func (a *application) kit(args []string) error {
	flags := flag.NewFlagSet("kit", flag.ContinueOnError)
	flags.SetOutput(a.err)
	mode := flags.String("renderer", "matching", "matching, stale, or none")
	if err := flags.Parse(args); err != nil { return err }
	if *mode != "matching" && *mode != "stale" && *mode != "none" { return errors.New("renderer mode must be matching, stale, or none") }
	specs, err := a.specs(flags.Args())
	if err != nil { return err }
	options := []string{"--renderer", *mode}
	for _, spec := range specs { options = append(options, text(spec["id"])) }
	return a.upstreamTool("kit", options...)
}
