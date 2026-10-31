package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
)

type application struct {
	ctx context.Context
	root string
	upstream string
	node string
	python string
	host string
	key string
	port int
	auto bool
	vin string
	gateway string
	out io.Writer
	err io.Writer
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	app := application{ctx: ctx, out: os.Stdout, err: os.Stderr}
	if err := app.run(os.Args[1:]); err != nil && !errors.Is(err, flag.ErrHelp) {
		fmt.Fprintln(os.Stderr, "mgu:", err)
		os.Exit(1)
	}
}

func (a *application) run(args []string) error {
	flags := flag.NewFlagSet("mgu", flag.ContinueOnError)
	flags.SetOutput(a.err)
	flags.StringVar(&a.root, "root", "", "repository directory (auto-detected by default)")
	flags.StringVar(&a.upstream, "upstream", "", "upstream repository (defaults to ../idrive7-apps)")
	flags.StringVar(&a.node, "node", "node", "Node.js executable for SDK extraction, icons and app previews")
	flags.StringVar(&a.python, "python", "", "Python executable for upstream packaging and optional font baking")
	flags.StringVar(&a.host, "host", os.Getenv("MGU_HOST"), "SSH destination, such as root@headunit")
	flags.StringVar(&a.key, "key", os.Getenv("MGU_KEY"), "SSH private key path (otherwise use OpenSSH configuration)")
	flags.IntVar(&a.port, "port", 0, "SSH port (otherwise use OpenSSH configuration)")
	flags.BoolVar(&a.auto, "auto", false, "discover the head unit IP over ENET")
	flags.StringVar(&a.vin, "vin", "", "select a discovered car by VIN (requires --auto)")
	flags.StringVar(&a.gateway, "gateway", "", "ENET gateway IPv4 address instead of broadcast discovery (requires --auto)")
	flags.Usage = func() { a.help() }
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) { return nil }
		return err
	}
	args = flags.Args()
	if len(args) == 0 || args[0] == "help" {
		a.help()
		return nil
	}
	if (a.auto || a.vin != "" || a.gateway != "") && args[0] != "car" && args[0] != "download" { return errors.New("--auto, --vin and --gateway apply to car and download commands") }
	if !a.auto && (a.vin != "" || a.gateway != "") { return errors.New("--vin and --gateway require --auto") }
	root, err := findRoot(a.root)
	if err != nil {
		if (args[0] != "car" && args[0] != "download") || a.root != "" { return err }
		root, err = os.Getwd()
		if err != nil { return err }
	}
	a.root = root
	if a.upstream == "" { a.upstream = filepath.Join(filepath.Dir(root), "idrive7-apps") }
	a.upstream = absolute(a.upstream)
	if args[0] != "car" && args[0] != "download" {
		if err := a.checkUpstream(); err != nil { return err }
	}
	switch args[0] {
	case "apps":
		if len(args) != 1 { return errors.New("usage: mgu apps") }
		apps, err := a.specs(nil)
		if err != nil { return err }
		for _, spec := range apps {
			fmt.Fprintf(a.out, "%-18s %-10s %s\n", text(spec["id"]), text(spec["version"]), text(spec["title"]))
		}
		return nil
	case "build":
		return a.build(args[1:])
	case "kit":
		return a.kit(args[1:])
	case "renderer":
		return a.renderer(args[1:])
	case "preview":
		return a.preview(args[1:])
	case "render":
		return a.render(args[1:])
	case "sdk":
		if len(args) < 3 || len(args) > 4 || args[1] != "extract" {
			return errors.New("usage: mgu sdk extract APP.js [OUTPUT_DIRECTORY]")
		}
		out := filepath.Join(a.root, "bmw-extracted", "oap-sdk")
		if len(args) == 4 { out = absolute(args[3]) }
		return a.nodeTool("extract_sdk.js", absolute(args[2]), out)
	case "signals":
		return a.signals(args[1:])
	case "dtc":
		return a.dtc(args[1:])
	case "pack":
		return a.pack(args[1:])
	case "icon":
		if len(args) != 3 { return errors.New("usage: mgu icon GLYPH OUTPUT.png") }
		output := absolute(args[2])
		if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil { return err }
		return a.nodeTool("make_icon.js", args[1], output)
	case "icons":
		return a.icons(args[1:])
	case "doom":
		return a.doom(args[1:])
	case "fonts":
		if len(args) != 2 || args[1] != "bake" { return errors.New("usage: mgu fonts bake") }
		return a.upstreamTool("fonts")
	case "download":
		return a.download(args[1:])
	case "car":
		return a.car(args[1:])
	default:
		return fmt.Errorf("unknown command %q; use mgu help", args[0])
	}
}

func (a *application) help() {
	fmt.Fprintln(a.out, "Hollows MGU wrapper: upstream apps plus local app overrides")
	fmt.Fprintln(a.out, "\nUsage: mgu [global options] COMMAND [arguments]")
	fmt.Fprintln(a.out, "\n  apps                              List source apps")
	fmt.Fprintln(a.out, "  build [APP ...]                   Build app bundles (all apps by default)")
	fmt.Fprintln(a.out, "  kit [--renderer MODE] [APP ...]    Build apps and assemble the car kit")
	fmt.Fprintln(a.out, "  renderer status|build             Inspect the prebuilt renderer or rebuild it")
	fmt.Fprintln(a.out, "  preview APP [options]             Capture PNGs, GIFs, or a GPU recording")
	fmt.Fprintln(a.out, "  render RECORDING.bin [options]    Replay a GPU recording into images")
	fmt.Fprintln(a.out, "  sdk extract APP.js [DIRECTORY]    Extract the SDK using Node.js")
	fmt.Fprintln(a.out, "  signals search|show|check ...     Inspect the local SOME/IP catalog")
	fmt.Fprintln(a.out, "  dtc import|db|codes|csv|tables ... Import fault descriptions and databases")
	fmt.Fprintln(a.out, "  pack FOLDER [OUTPUT.pack]        Compress app data folders")
	fmt.Fprintln(a.out, "  icon GLYPH OUTPUT.png             Generate a tile icon using Node.js")
	fmt.Fprintln(a.out, "  icons [options] [APP ...]         Render SVG app icons using Chrome")
	fmt.Fprintln(a.out, "  doom build [options]              Rebuild Doom WebAssembly using Zig and Binaryen")
	fmt.Fprintln(a.out, "  fonts bake                        Bake fonts using Python and Pillow")
	fmt.Fprintln(a.out, "  download APP|head-unit [options]   Resume a file capture from the head unit")
	fmt.Fprintln(a.out, "    --path PATH --max-bytes 250MiB --max-files 100 --timeout 10m --out PATH")
	fmt.Fprintln(a.out, "  car upload|check|install|status|restore|backups|logs ...")
	fmt.Fprintln(a.out, "\nGlobal options (before COMMAND):")
	fmt.Fprintln(a.out, "  --root PATH  --upstream PATH  --node PATH  --python PATH")
	fmt.Fprintln(a.out, "  --host root@HEADUNIT  --key PATH  --port NUMBER")
	fmt.Fprintln(a.out, "  --auto [--vin VIN] [--gateway IP]  Discover the head unit IP for car/download")
	fmt.Fprintln(a.out, "  Example: mgu --auto car status")
	fmt.Fprintln(a.out, "  MGU_HOST and MGU_KEY provide defaults; OpenSSH config and agent are supported.")
	fmt.Fprintln(a.out, "\nRenderer modes: matching (default), stale (explicitly permit an older binary), none.")
	fmt.Fprintln(a.out, "All apps use the upstream Python builder. Local apps add runtime patches. Preview uses Node.js; GIF encoding is native Go.")
}

func findRoot(root string) (string, error) {
	if root != "" {
		root = absolute(root)
		if isRoot(root) { return root, nil }
		return "", fmt.Errorf("%s is not an MGU apps repository", root)
	}
	cwd, err := os.Getwd()
	if err != nil { return "", err }
	starts := []string{cwd}
	if exe, err := os.Executable(); err == nil { starts = append(starts, filepath.Dir(exe)) }
	for _, start := range starts {
		for dir := start; ; dir = filepath.Dir(dir) {
			if isRoot(dir) { return dir, nil }
			if filepath.Dir(dir) == dir { break }
		}
	}
	return "", errors.New("repository not found; use --root PATH")
}

func isRoot(dir string) bool {
	module, err := os.ReadFile(filepath.Join(dir, "go.mod"))
	if err != nil || !strings.Contains(string(module), "module id7-hollows-apps") { return false }
	for _, name := range []string{"apps", filepath.Join("cmd", "mgu", "tools")} {
		info, err := os.Stat(filepath.Join(dir, name))
		if err != nil || !info.IsDir() { return false }
	}
	return true
}

func absolute(name string) string {
	value, err := filepath.Abs(name)
	if err != nil { return name }
	return value
}

func (a *application) command(program string, args []string, input io.Reader, terminal bool) error {
	cmd := exec.CommandContext(a.ctx, program, args...)
	cmd.Dir = a.root
	cmd.Stdin = input
	if terminal { cmd.Stdin = os.Stdin }
	cmd.Stdout = a.out
	cmd.Stderr = a.err
	if err := cmd.Run(); err != nil {
		if a.ctx.Err() != nil { return a.ctx.Err() }
		return fmt.Errorf("%s: %w", program, err)
	}
	return nil
}

func (a *application) nodeTool(name string, args ...string) error {
	return a.command(a.node, append([]string{filepath.Join(a.upstream, "kit", "tools", name)}, args...), nil, false)
}

func text(value any) string {
	if value == nil { return "" }
	if value, ok := value.(string); ok { return value }
	return fmt.Sprint(value)
}

func obj(value any) map[string]any {
	result, _ := value.(map[string]any)
	return result
}

func list(value any) []any {
	result, _ := value.([]any)
	return result
}

func valueOr(values map[string]any, key string, fallback any) any {
	if value, ok := values[key]; ok { return value }
	return fallback
}

func number(value any, fallback float64) float64 {
	switch value := value.(type) {
	case float64: return value
	case int: return float64(value)
	}
	return fallback
}

func validName(name string) bool {
	if name == "" || name == "." || name == ".." { return false }
	for _, r := range name {
		if !(r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '_' || r == '-' || r == '.') { return false }
	}
	return !strings.HasPrefix(name, "-")
}

