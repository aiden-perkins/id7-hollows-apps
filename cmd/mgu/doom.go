package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func (a *application) doom(args []string) error {
	if len(args) == 0 || args[0] != "build" { return errors.New("usage: mgu doom build [--zig PATH] [--zig-arg ARG] [--wasm-opt PATH] [--out FILE]") }
	flags := flag.NewFlagSet("doom build", flag.ContinueOnError)
	flags.SetOutput(a.err)
	zigDefault, optDefault := os.Getenv("ZIG"), os.Getenv("WASM_OPT")
	if zigDefault == "" { zigDefault = "zig" }
	if optDefault == "" { optDefault = "wasm-opt" }
	zig := flags.String("zig", zigDefault, "Zig executable")
	optimizer := flags.String("wasm-opt", optDefault, "Binaryen wasm-opt executable")
	out := flags.String("out", filepath.Join(a.root, "apps", "doom", "doom.wasm"), "output WebAssembly file")
	var zigArgs repeatedOption
	flags.Var(&zigArgs, "zig-arg", "argument before cc; repeat for wrappers such as python -m ziglang")
	if err := flags.Parse(args[1:]); err != nil { return err }
	if flags.NArg() != 0 { return errors.New("unexpected Doom build argument") }
	directory := filepath.Join(a.upstream, "third_party", "doomgeneric", "doomgeneric")
	makefile, err := os.ReadFile(filepath.Join(directory, "Makefile"))
	if err != nil { return err }
	var sources []string
	for _, line := range strings.Split(string(makefile), "\n") {
		if !strings.HasPrefix(line, "SRC_DOOM = ") { continue }
		for _, name := range strings.Fields(strings.TrimPrefix(line, "SRC_DOOM = ")) {
			if name == "doomgeneric_xlib.o" { continue }
			if !validName(name) || !strings.HasSuffix(name, ".o") { return fmt.Errorf("unexpected Doom source %q", name) }
			sources = append(sources, strings.TrimSuffix(name, ".o")+".c")
		}
	}
	if len(sources) == 0 { return errors.New("SRC_DOOM was not found in the Doom Makefile") }
	work, err := os.MkdirTemp("", "mgu-doom-*")
	if err != nil { return err }
	defer os.RemoveAll(work)
	raw, optimized := filepath.Join(work, "doom-raw.wasm"), filepath.Join(work, "doom.wasm")
	compilerArgs := append([]string{}, zigArgs...)
	compilerArgs = append(compilerArgs, "cc", "-target", "wasm32-wasi", "-mcpu=mvp", "-mexec-model=reactor", "-O2", "-DMGU_RGBA", "-DDOOMGENERIC_RESX=320", "-DDOOMGENERIC_RESY=200", "-DNORMALUNIX", "-DLINUX", "-D_DEFAULT_SOURCE", "-Wno-everything", "-o", raw)
	compilerArgs = append(compilerArgs, sources...)
	compilerArgs = append(compilerArgs, "doomgeneric_mgu.c")
	compiler := exec.CommandContext(a.ctx, *zig, compilerArgs...)
	compiler.Dir, compiler.Stdout, compiler.Stderr = directory, a.out, a.err
	compiler.Env = append(os.Environ(), "ZIG_LOCAL_CACHE_DIR="+filepath.Join(work, "local-cache"), "ZIG_GLOBAL_CACHE_DIR="+filepath.Join(work, "global-cache"))
	if err := compiler.Run(); err != nil { return fmt.Errorf("Doom compiler: %w", err) }
	if err := a.command(*optimizer, []string{raw, "--enable-sign-ext", "--enable-mutable-globals", "--legalize-js-interface", "--signext-lowering", "-O2", "-o", optimized}, nil, false); err != nil { return err }
	if err := copyFile(optimized, absolute(*out), 0644); err != nil { return err }
	fmt.Fprintln(a.out, "Doom WebAssembly:", absolute(*out))
	return nil
}
