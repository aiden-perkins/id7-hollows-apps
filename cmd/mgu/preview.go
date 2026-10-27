package main

import (
	"bufio"
	_ "embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
)

//go:embed preview_host.cjs
var previewHostSource []byte

type previewReply struct {
	OK bool
	Error string
	PNG string
	Frame int
	Now float64
}

type previewHost struct {
	app *application
	cmd *exec.Cmd
	input io.WriteCloser
	output *bufio.Reader
	closed bool
}

func (a *application) startPreviewHost(dir string) (*previewHost, error) {
	hostFile := filepath.Join(dir, "host.cjs")
	if err := writeFile(hostFile, previewHostSource, 0600); err != nil { return nil, err }
	cmd := exec.CommandContext(a.ctx, a.node, "--unhandled-rejections=strict", hostFile)
	cmd.Dir, cmd.Stderr = a.root, a.err
	input, err := cmd.StdinPipe()
	if err != nil { return nil, err }
	output, err := cmd.StdoutPipe()
	if err != nil { input.Close(); return nil, err }
	if err := cmd.Start(); err != nil { input.Close(); output.Close(); return nil, fmt.Errorf("start preview Node adapter: %w", err) }
	return &previewHost{app: a, cmd: cmd, input: input, output: bufio.NewReader(output)}, nil
}

func (h *previewHost) request(request map[string]any) (previewReply, error) {
	var reply previewReply
	if err := json.NewEncoder(h.input).Encode(request); err != nil { return reply, fmt.Errorf("preview request: %w", err) }
	line, err := h.output.ReadBytes('\n')
	if err != nil {
		if h.app.ctx.Err() != nil { return reply, h.app.ctx.Err() }
		return reply, fmt.Errorf("preview adapter stopped before replying: %w", err)
	}
	if err := json.Unmarshal(line, &reply); err != nil { return reply, fmt.Errorf("invalid preview adapter reply: %w", err) }
	if !reply.OK { return reply, errors.New(reply.Error) }
	return reply, nil
}

func (h *previewHost) abort() {
	if h.closed { return }
	h.closed = true
	h.input.Close()
	h.cmd.Process.Kill()
	h.cmd.Wait()
}

func (h *previewHost) finish() error {
	_, err := h.request(map[string]any{"op": "close"})
	h.input.Close()
	if err != nil { h.abort(); return err }
	h.closed = true
	if err := h.cmd.Wait(); err != nil { return fmt.Errorf("preview adapter: %w", err) }
	return nil
}

type repeatedOption []string

func (o *repeatedOption) String() string { return strings.Join(*o, ", ") }
func (o *repeatedOption) Set(value string) error { *o = append(*o, value); return nil }

func settingValue(raw string) any {
	if raw == "true" { return true }
	if raw == "false" { return false }
	if value, err := strconv.ParseFloat(raw, 64); err == nil && !math.IsNaN(value) && !math.IsInf(value, 0) { return value }
	return raw
}

func previewSettings(spec map[string]any, overrides []string, section string) (map[string]any, error) {
	settings := map[string]any{}
	for _, item := range overrides {
		key, value, ok := strings.Cut(item, "=")
		if !ok || key == "" { return nil, errors.New("settings must use --set KEY=VALUE") }
		settings[key] = settingValue(value)
	}
	if section != "" { settings["section"] = section }
	schema := map[string]map[string]any{}
	for _, raw := range list(spec["settings"]) {
		item := obj(raw)
		schema[text(item["key"])] = item
	}
	for key, value := range settings {
		item, ok := schema[key]
		if !ok {
			if key == "demo" { continue }
			return nil, fmt.Errorf("app has no setting %q", key)
		}
		switch text(item["type"]) {
		case "bool":
			if _, ok := value.(bool); !ok { return nil, fmt.Errorf("%s requires true or false", key) }
		case "number":
			if _, ok := value.(float64); !ok { return nil, fmt.Errorf("%s requires a number", key) }
		case "choice":
			found := false
			for _, raw := range list(item["options"]) {
				option := list(raw)
				if len(option) == 2 && reflect.DeepEqual(option[0], value) { found = true }
			}
			if !found { return nil, fmt.Errorf("%v is not an option for %s", value, key) }
		}
	}
	return settings, nil
}

func (a *application) preview(args []string) error {
	appID := ""
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") { appID, args = args[0], args[1:] }
	flags := flag.NewFlagSet("preview", flag.ContinueOnError)
	flags.SetOutput(a.err)
	out := flags.String("out", "", "final PNG path (default out/APP.png)")
	gifOut := flags.String("gif", "", "animated GIF path, encoded by Go")
	record := flags.String("record", "", "save a GPU command stream; implies --gpu")
	framesDir := flags.String("frames-dir", "", "write the captured PNG sequence")
	seconds := flags.Float64("seconds", 6, "GIF or recording duration")
	warmup := flags.Float64("warmup", 6, "demo seconds to advance before capture")
	frames := flags.Int("frames", 0, "capture count at 60 Hz (overrides --seconds)")
	fps := flags.Int("fps", 50, "GIF output rate, 1 through 50")
	width := flags.Int("width", 0, "output width (native for PNG, 1280 for GIF)")
	gpu := flags.Bool("gpu", false, "replay through the native GPU renderer")
	renderer := flags.String("renderer", "", "compatible renderer executable")
	background := flags.String("background", "", "PNG or JPEG composited under the app")
	fixture := flags.String("fixture", "", "host-only JavaScript data fixture")
	section := flags.String("section", "", "section setting, such as mode, lights, or status in MGU Lab")
	realtime := flags.Bool("realtime", false, "advance demo time at wall-clock speed")
	build := flags.Bool("build", false, "package the selected app before previewing")
	var sets, clicks repeatedOption
	flags.Var(&sets, "set", "override KEY=VALUE (repeatable)")
	flags.Var(&clicks, "click", "press a named button before warmup (repeatable)")
	flags.Usage = func() {
		fmt.Fprintln(a.err, "Usage: mgu preview APP [options] [BUTTON ...]")
		flags.PrintDefaults()
	}
	if err := flags.Parse(args); err != nil { return err }
	buttons := flags.Args()
	if appID == "" {
		if len(buttons) == 0 { return errors.New("usage: mgu preview APP [options] [BUTTON ...]") }
		appID, buttons = buttons[0], buttons[1:]
	}
	if !validName(appID) { return errors.New("invalid preview app name") }
	if *out != "" && !strings.EqualFold(filepath.Ext(*out), ".png") { return errors.New("--out requires a .png filename") }
	if *gifOut != "" && !strings.EqualFold(filepath.Ext(*gifOut), ".gif") { return errors.New("--gif requires a .gif filename") }
	if *width < 0 || *width > 65535 { return errors.New("output width must be between 0 and 65535") }
	if *fps < 1 || *fps > 50 { return errors.New("GIF frame rate must be between 1 and 50") }
	if *warmup < 0 || *warmup > 3600 || math.IsNaN(*warmup) || math.IsInf(*warmup, 0) { return errors.New("warmup must be between zero and one hour") }
	if *frames < 0 { return errors.New("frame count cannot be negative") }
	count := *frames
	if count == 0 {
		count = 1
		if *gifOut != "" || *record != "" {
			if *seconds <= 0 || math.IsNaN(*seconds) || math.IsInf(*seconds, 0) || *seconds > 3600 { return errors.New("duration must be positive and at most one hour") }
			count = int(math.Round(*seconds * 60))
		}
	}
	if count < 1 || count > 216000 { return errors.New("capture must contain 1 to 216000 frames") }
	if *out == "" && *gifOut == "" && *record == "" && *framesDir == "" { *out = filepath.Join(a.root, "out", appID+".png") }
	outputs := map[string]bool{}
	for _, output := range []string{*out, *gifOut, *record} {
		if output == "" { continue }
		name := absolute(output)
		for previous := range outputs {
			if name == previous || strings.EqualFold(name, previous) { return errors.New("preview output paths must be distinct") }
		}
		outputs[name] = true
	}
	if *build {
		if err := a.build([]string{appID}); err != nil { return err }
	}
	stage := filepath.Join(a.root, "dist", appID)
	var spec map[string]any
	if err := readJSON(filepath.Join(stage, "source", "javascript", "kit", "app-spec.json"), &spec); err != nil {
		return fmt.Errorf("built app unavailable; use mgu build %s or preview --build: %w", appID, err)
	}
	settings, err := previewSettings(spec, sets, *section)
	if err != nil { return err }
	if *record != "" { *gpu = true }
	if *renderer != "" && !*gpu { return errors.New("--renderer requires --gpu or --record") }
	if *gpu && (*out != "" || *gifOut != "" || *framesDir != "") {
		if _, _, err := a.rendererProgram(*renderer); err != nil { return err }
	}
	work, err := os.MkdirTemp("", "mgu-preview-*")
	if err != nil { return err }
	defer os.RemoveAll(work)
	stream := ""
	if *gpu { stream = filepath.Join(work, "stream.bin") }
	fixtureFile := ""
	if *fixture != "" { fixtureFile = absolute(*fixture) }
	host, err := a.startPreviewHost(work)
	if err != nil { return err }
	defer host.abort()
	reply, err := host.request(map[string]any{
		"op": "init", "stage": stage, "dir": work, "settings": settings,
		"gpu": stream, "fast": !*realtime, "fixture": fixtureFile,
	})
	if err != nil { return err }
	for _, button := range append(clicks, buttons...) {
		if strings.HasPrefix(button, "-") { return errors.New("put preview options before positional button names") }
		reply, err = host.request(map[string]any{"op": "click", "name": button})
		if err != nil { return err }
	}
	reply, err = host.request(map[string]any{"op": "wait", "ms": *warmup * 1000})
	if err != nil { return err }
	fmt.Fprintf(a.out, "Capturing %s: %d frames at 60 Hz\n", appID, count)
	start := reply.Now
	var pngFiles []string
	for i := 0; i < count; i++ {
		if err := a.ctx.Err(); err != nil { return err }
		reply, err = host.request(map[string]any{"op": "frame"})
		if err != nil { return err }
		if reply.Frame != i+1 { return errors.New("preview adapter returned an unexpected frame number") }
		if !*gpu {
			rel, err := filepath.Rel(work, reply.PNG)
			if err != nil || !filepath.IsLocal(rel) { return errors.New("preview adapter returned an invalid image path") }
			pngFiles = append(pngFiles, reply.PNG)
		}
		delay := math.Max(0, start+float64(i+1)*1000/60-reply.Now)
		reply, err = host.request(map[string]any{"op": "wait", "ms": delay})
		if err != nil { return err }
	}
	if err := host.finish(); err != nil { return err }
	var source *previewFrames
	if *gpu {
		meta, err := inspectRecording(stream)
		if err != nil { return err }
		if meta.frames < int64(count) { return errors.New("GPU recording contains fewer frames than requested") }
		if *out != "" || *gifOut != "" || *framesDir != "" {
			source, err = a.replayFrames(stream, work, *renderer, count)
			if err != nil { return err }
		}
	} else {
		source = &previewFrames{paths: pngFiles, count: count}
	}
	if source != nil {
		defer source.close()
		if *gifOut != "" {
			gifWidth := *width
			if gifWidth == 0 { gifWidth = 1280 }
			fmt.Fprintln(a.out, "Encoding GIF:", *gifOut)
			if err := a.exportGIF(absolute(*gifOut), source, *background, gifWidth, *fps); err != nil { return err }
		}
		if *out != "" {
			frame, err := source.frame(count-1)
			if err != nil { return err }
			frame, err = preparePreviewImage(frame, *background, *width)
			if err != nil { return err }
			if err := savePreviewPNG(absolute(*out), frame); err != nil { return err }
			fmt.Fprintln(a.out, "PNG:", absolute(*out))
		}
		if *framesDir != "" {
			for i := 0; i < count; i++ {
				if err := a.ctx.Err(); err != nil { return err }
				frame, err := source.frame(i)
				if err != nil { return err }
				frame, err = preparePreviewImage(frame, *background, *width)
				if err != nil { return err }
				name := filepath.Join(absolute(*framesDir), fmt.Sprintf("%06d.png", i))
				if err := savePreviewPNG(name, frame); err != nil { return err }
			}
			fmt.Fprintln(a.out, "PNG sequence:", absolute(*framesDir))
		}
	}
	if *record != "" {
		if err := copyFile(stream, absolute(*record), 0644); err != nil { return err }
		fmt.Fprintln(a.out, "Recording:", absolute(*record))
	}
	return nil
}

