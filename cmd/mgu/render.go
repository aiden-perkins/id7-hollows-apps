package main

import (
	"bufio"
	"encoding/binary"
	"errors"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	_ "image/jpeg"
	"image/png"
	"io"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

func validPreviewSize(width, height int) error {
	if width < 1 || height < 1 || width > 65535 || height > 65535 || int64(width)*int64(height) > 64*1024*1024 {
		return fmt.Errorf("unsupported image size %dx%d", width, height)
	}
	return nil
}

type recordingInfo struct {
	width int
	height int
	frames int64
}

func inspectRecording(name string) (recordingInfo, error) {
	var meta recordingInfo
	file, err := os.Open(name)
	if err != nil { return meta, err }
	defer file.Close()
	info, err := file.Stat()
	if err != nil { return meta, err }
	var header [8]byte
	var placement [28]byte
	width, height := 0, 0
	for offset := int64(0); offset < info.Size(); {
		if info.Size()-offset < 8 { return meta, errors.New("truncated GPU message header") }
		if _, err := io.ReadFull(file, header[:]); err != nil { return meta, err }
		kind := binary.LittleEndian.Uint32(header[:4])
		length := int64(binary.LittleEndian.Uint32(header[4:]))
		offset += 8
		if length > info.Size()-offset || length%4 != 0 { return meta, errors.New("truncated or unaligned GPU message") }
		read := int64(0)
		switch kind {
		case 2:
			if length != int64(len(placement)) { return meta, errors.New("invalid GPU placement message") }
			if _, err := io.ReadFull(file, placement[:]); err != nil { return meta, err }
			read = int64(len(placement))
			width = int(binary.LittleEndian.Uint32(placement[8:12]))
			height = int(binary.LittleEndian.Uint32(placement[12:16]))
			if err := validPreviewSize(width, height); err != nil { return meta, err }
		case 7:
			if err := validPreviewSize(width, height); err != nil { return meta, fmt.Errorf("frame has no valid surface: %w", err) }
			if length == 0 { return meta, errors.New("GPU frame contains no drawing commands") }
			if meta.frames == 0 { meta.width, meta.height = width, height }
			if width != meta.width || height != meta.height { return meta, errors.New("GPU surface size changed during recording; capture one layout at a time") }
			meta.frames++
		}
		if _, err := file.Seek(length-read, io.SeekCurrent); err != nil { return meta, err }
		offset += length
	}
	if meta.frames == 0 { return meta, errors.New("GPU recording contains no frames") }
	if width != meta.width || height != meta.height { return meta, errors.New("GPU surface size changed after the last frame") }
	return meta, nil
}

type previewFrames struct {
	paths []string
	raw *os.File
	pam string
	width int
	height int
	count int
	skip int64
	cachedPath string
	cachedImage image.Image
}

func (source *previewFrames) close() {
	if source.raw != nil { source.raw.Close() }
}

func (source *previewFrames) frame(index int) (image.Image, error) {
	if index < 0 || index >= source.count { return nil, errors.New("frame index is outside the recording") }
	if source.raw != nil {
		img := image.NewNRGBA(image.Rect(0, 0, source.width, source.height))
		offset := (source.skip+int64(index))*int64(len(img.Pix))
		n, err := source.raw.ReadAt(img.Pix, offset)
		if err != nil && n != len(img.Pix) { return nil, fmt.Errorf("incomplete raw frame %d: %w", index, err) }
		return img, nil
	}
	name := source.paths[index]
	if name == source.cachedPath { return source.cachedImage, nil }
	img, err := loadPreviewImage(name)
	if err != nil { return nil, err }
	source.cachedPath, source.cachedImage = name, img
	return img, nil
}

func loadPreviewImage(name string) (image.Image, error) {
	file, err := os.Open(name)
	if err != nil { return nil, err }
	defer file.Close()
	config, _, err := image.DecodeConfig(file)
	if err != nil { return nil, fmt.Errorf("%s: %w", name, err) }
	if err := validPreviewSize(config.Width, config.Height); err != nil { return nil, err }
	if _, err := file.Seek(0, io.SeekStart); err != nil { return nil, err }
	img, _, err := image.Decode(file)
	if err != nil { return nil, fmt.Errorf("%s: %w", name, err) }
	return img, nil
}

func loadPAM(name string) (*image.NRGBA, error) {
	file, err := os.Open(name)
	if err != nil { return nil, err }
	defer file.Close()
	reader := bufio.NewReader(file)
	header := map[string]string{}
	foundEnd := false
	for lines := 0; lines < 32; lines++ {
		line, err := reader.ReadString('\n')
		if err != nil { return nil, fmt.Errorf("PAM header: %w", err) }
		if len(line) > 256 { return nil, errors.New("invalid PAM header line") }
		line = strings.TrimSpace(line)
		if lines == 0 {
			if line != "P7" { return nil, errors.New("renderer did not produce a PAM image") }
			continue
		}
		if line == "ENDHDR" { foundEnd = true; break }
		if line == "" || strings.HasPrefix(line, "#") { continue }
		key, value, ok := strings.Cut(line, " ")
		if !ok { return nil, errors.New("invalid PAM header") }
		header[key] = strings.TrimSpace(value)
	}
	if !foundEnd || header["DEPTH"] != "4" || header["MAXVAL"] != "255" || header["TUPLTYPE"] != "RGB_ALPHA" {
		return nil, errors.New("renderer output must be an 8-bit RGBA PAM image")
	}
	width, err := strconv.Atoi(header["WIDTH"])
	if err != nil { return nil, err }
	height, err := strconv.Atoi(header["HEIGHT"])
	if err != nil { return nil, err }
	if err := validPreviewSize(width, height); err != nil { return nil, err }
	img := image.NewNRGBA(image.Rect(0, 0, width, height))
	if _, err := io.ReadFull(reader, img.Pix); err != nil { return nil, fmt.Errorf("incomplete PAM pixels: %w", err) }
	return img, nil
}

func preparePreviewImage(frame image.Image, background string, width int) (*image.RGBA, error) {
	var under image.Image
	var err error
	if background != "" {
		under, err = loadPreviewImage(absolute(background))
		if err != nil { return nil, err }
	}
	return composePreviewImage(frame, under, width)
}

func composePreviewImage(frame, under image.Image, width int) (*image.RGBA, error) {
	bounds := frame.Bounds()
	if under != nil { bounds = under.Bounds() }
	w, h := bounds.Dx(), bounds.Dy()
	if err := validPreviewSize(w, h); err != nil { return nil, err }
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Draw(img, img.Bounds(), image.NewUniform(color.Black), image.Point{}, draw.Src)
	if under != nil { draw.Draw(img, img.Bounds(), under, under.Bounds().Min, draw.Over) }
	draw.Draw(img, frame.Bounds().Sub(frame.Bounds().Min), frame, frame.Bounds().Min, draw.Over)
	if width == 0 || width == w { return img, nil }
	height := int(math.Max(1, math.Round(float64(h)*float64(width)/float64(w))))
	if err := validPreviewSize(width, height); err != nil { return nil, err }
	scaled := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		sy := math.Max(0, (float64(y)+0.5)*float64(h)/float64(height)-0.5)
		y0 := int(sy)
		y1 := y0+1
		if y1 >= h { y1 = h-1 }
		fy := sy-float64(y0)
		for x := 0; x < width; x++ {
			sx := math.Max(0, (float64(x)+0.5)*float64(w)/float64(width)-0.5)
			x0 := int(sx)
			x1 := x0+1
			if x1 >= w { x1 = w-1 }
			fx := sx-float64(x0)
			p00, p10 := y0*img.Stride+x0*4, y0*img.Stride+x1*4
			p01, p11 := y1*img.Stride+x0*4, y1*img.Stride+x1*4
			dest := y*scaled.Stride+x*4
			for channel := 0; channel < 3; channel++ {
				top := float64(img.Pix[p00+channel])*(1-fx)+float64(img.Pix[p10+channel])*fx
				bottom := float64(img.Pix[p01+channel])*(1-fx)+float64(img.Pix[p11+channel])*fx
				scaled.Pix[dest+channel] = uint8(math.Round(top*(1-fy)+bottom*fy))
			}
			scaled.Pix[dest+3] = 255
		}
	}
	return scaled, nil
}

func savePreviewPNG(name string, img image.Image) error {
	if err := os.MkdirAll(filepath.Dir(name), 0755); err != nil { return err }
	return atomicFile(name, 0644, func(file *os.File) error { return png.Encode(file, img) })
}

func (a *application) rendererProgram(override string) (string, []string, error) {
	if override != "" {
		if strings.ContainsAny(override, "/\\") { override = absolute(override) }
		return override, nil, nil
	}
	if runtime.GOOS != "linux" { return "", nil, errors.New("GPU replay needs the Linux renderer; use software preview or --renderer PATH for a compatible native renderer") }
	binary, err := a.pickRenderer("matching")
	if err != nil { return "", nil, err }
	if _, err := os.Stat(binary); err != nil { return "", nil, err }
	if _, err := os.Stat("/lib/ld-linux-x86-64.so.2"); os.IsNotExist(err) {
		if _, err := os.Stat("/lib64/ld-linux-x86-64.so.2"); err == nil { return "/lib64/ld-linux-x86-64.so.2", []string{binary}, nil }
	}
	return binary, nil, nil
}

func (a *application) replayFrames(stream, work, override string, count int) (*previewFrames, error) {
	meta, err := inspectRecording(stream)
	if err != nil { return nil, err }
	if count < 1 || int64(count) > meta.frames { return nil, errors.New("requested capture exceeds the recording") }
	program, args, err := a.rendererProgram(override)
	if err != nil { return nil, err }
	pam, raw := filepath.Join(work, "last.pam"), filepath.Join(work, "frames.rgba")
	args = append(args, "--replay", stream, "--out", pam, "--raw", raw)
	cmd := exec.CommandContext(a.ctx, program, args...)
	cmd.Dir, cmd.Stdout, cmd.Stderr = a.root, a.out, a.err
	env := os.Environ()
	if _, ok := os.LookupEnv("EGL_PLATFORM"); !ok { env = append(env, "EGL_PLATFORM=surfaceless") }
	if _, ok := os.LookupEnv("LIBGL_ALWAYS_SOFTWARE"); !ok { env = append(env, "LIBGL_ALWAYS_SOFTWARE=1") }
	cmd.Env = env
	if err := cmd.Run(); err != nil {
		if a.ctx.Err() != nil { return nil, a.ctx.Err() }
		return nil, fmt.Errorf("GPU replay: %w", err)
	}
	last, err := loadPAM(pam)
	if err != nil { return nil, err }
	if last.Bounds().Dx() != meta.width || last.Bounds().Dy() != meta.height { return nil, errors.New("renderer output dimensions differ from the recording") }
	file, err := os.Open(raw)
	if err != nil { return nil, err }
	info, err := file.Stat()
	if err != nil { file.Close(); return nil, err }
	frameBytes := int64(meta.width)*int64(meta.height)*4
	if meta.frames > math.MaxInt64/frameBytes { file.Close(); return nil, errors.New("recording byte count overflows") }
	expected := meta.frames*frameBytes
	if info.Size() != expected { file.Close(); return nil, fmt.Errorf("incomplete renderer output: got %d bytes, expected %d", info.Size(), expected) }
	return &previewFrames{raw: file, pam: pam, width: meta.width, height: meta.height, count: count, skip: meta.frames-int64(count)}, nil
}

func (a *application) render(args []string) error {
	stream := ""
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") { stream, args = args[0], args[1:] }
	flags := flag.NewFlagSet("render", flag.ContinueOnError)
	flags.SetOutput(a.err)
	out := flags.String("out", "", "final PNG or PAM path (default out/render.png)")
	gifOut := flags.String("gif", "", "animated GIF path")
	rawOut := flags.String("raw", "", "also save the raw RGBA frame sequence")
	renderer := flags.String("renderer", "", "compatible GPU renderer executable")
	width := flags.Int("width", 0, "output width; zero preserves the native PNG size")
	fps := flags.Int("fps", 50, "GIF output rate, 1 through 50")
	background := flags.String("background", "", "PNG or JPEG composited at the app's origin")
	flags.Usage = func() { fmt.Fprintln(a.err, "Usage: mgu render RECORDING.bin [options]"); flags.PrintDefaults() }
	if err := flags.Parse(args); err != nil { return err }
	rest := flags.Args()
	if stream == "" && len(rest) > 0 { stream, rest = rest[0], rest[1:] }
	if stream == "" || len(rest) != 0 { return errors.New("usage: mgu render RECORDING.bin [options]") }
	if *width < 0 || *width > 65535 || *fps < 1 || *fps > 50 { return errors.New("invalid output width or GIF frame rate") }
	if *gifOut != "" && !strings.EqualFold(filepath.Ext(*gifOut), ".gif") { return errors.New("--gif requires a .gif filename") }
	stream = absolute(stream)
	if *out == "" && *gifOut == "" && *rawOut == "" { *out = filepath.Join(a.root, "out", "render.png") }
	seen := map[string]bool{strings.ToLower(stream): true}
	for _, name := range []string{*out, *gifOut, *rawOut} {
		if name == "" { continue }
		key := strings.ToLower(absolute(name))
		if seen[key] { return errors.New("recording and output paths must be distinct") }
		seen[key] = true
	}
	if *out != "" && !strings.EqualFold(filepath.Ext(*out), ".png") && !strings.EqualFold(filepath.Ext(*out), ".pam") {
		return errors.New("--out requires a .png or .pam filename")
	}
	if strings.EqualFold(filepath.Ext(*out), ".pam") && (*width != 0 || *background != "") { return errors.New("PAM output preserves the original image; use PNG for scaling or a background") }
	meta, err := inspectRecording(stream)
	if err != nil { return err }
	if meta.frames > 216000 { return errors.New("recording exceeds the one-hour capture limit") }
	work, err := os.MkdirTemp("", "mgu-render-*")
	if err != nil { return err }
	defer os.RemoveAll(work)
	source, err := a.replayFrames(stream, work, *renderer, int(meta.frames))
	if err != nil { return err }
	defer source.close()
	if *gifOut != "" {
		size := *width
		if size == 0 { size = 1280 }
		if err := a.exportGIF(absolute(*gifOut), source, *background, size, *fps); err != nil { return err }
	}
	if *out != "" {
		if strings.EqualFold(filepath.Ext(*out), ".pam") {
			if err := copyFile(source.pam, absolute(*out), 0644); err != nil { return err }
		} else {
			img, err := source.frame(source.count-1)
			if err != nil { return err }
			img, err = preparePreviewImage(img, *background, *width)
			if err != nil { return err }
			if err := savePreviewPNG(absolute(*out), img); err != nil { return err }
		}
		fmt.Fprintln(a.out, "Frame:", absolute(*out))
	}
	if *rawOut != "" {
		if err := copyFile(source.raw.Name(), absolute(*rawOut), 0644); err != nil { return err }
		fmt.Fprintf(a.out, "RGBA: %s (%dx%d, %d frames)\n", absolute(*rawOut), source.width, source.height, source.count)
	}
	return nil
}

