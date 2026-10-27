package main

import (
	"errors"
	"path/filepath"
)

func (a *application) pack(args []string) error {
	if len(args) < 1 || len(args) > 2 { return errors.New("usage: mgu pack FOLDER [OUTPUT.pack]") }
	input := absolute(args[0])
	output := input + ".pack"
	if len(args) == 2 { output = absolute(args[1]) }
	return a.command(a.pythonProgram(), []string{"-B", filepath.Join(a.upstream, "kit", "tools", "pack_data.py"), input, output}, nil, false)
}
