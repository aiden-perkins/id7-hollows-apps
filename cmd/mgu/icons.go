package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"math"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

const iconBare = `<defs><filter id="tile-shadow" x="-20%" y="-20%" width="140%" height="140%">
<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.75"/>
</filter></defs><g filter="url(#tile-shadow)">{art}</g>`

const iconTile = `<defs>
<linearGradient id="tile-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#363a42"/><stop offset="0.55" stop-color="#16181c"/><stop offset="1" stop-color="#08090b"/></linearGradient>
<radialGradient id="tile-glow" cx="0.5" cy="0.6" r="0.62"><stop offset="0" stop-color="{accent}" stop-opacity="0.55"/><stop offset="0.55" stop-color="{accent}" stop-opacity="0.16"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="tile-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.35" stop-color="#ffffff" stop-opacity="0.1"/><stop offset="0.8" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="1" stop-color="{accent}" stop-opacity="0.7"/></linearGradient>
<linearGradient id="tile-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<clipPath id="tile-clip"><rect x="4" y="4" width="132" height="132" rx="27"/></clipPath>
<filter id="tile-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.75"/></filter>
</defs><rect x="4" y="4" width="132" height="132" rx="27" fill="url(#tile-bg)"/>
<rect x="4" y="4" width="132" height="132" rx="27" fill="url(#tile-glow)"/>
<g clip-path="url(#tile-clip)"><g filter="url(#tile-shadow)">{art}</g></g>
<path d="M4 31 Q4 4 31 4 H109 Q136 4 136 31 V58 Q70 44 4 66 Z" fill="url(#tile-gloss)" clip-path="url(#tile-clip)"/>
<rect x="4.75" y="4.75" width="130.5" height="130.5" rx="26.25" fill="none" stroke="url(#tile-rim)" stroke-width="1.5"/>`

var iconAccent = regexp.MustCompile(`^\s*<!--\s*accent:\s*(#[0-9a-fA-F]{6})\s*-->`)

func iconPage(source string, tile bool) string {
	accent := "#2a8cff"
	if match := iconAccent.FindStringSubmatch(source); match != nil { accent, source = match[1], source[len(match[0]):] }
	body := iconBare
	if tile { body = iconTile }
	body = strings.ReplaceAll(strings.ReplaceAll(body, "{accent}", accent), "{art}", source)
	return `<html><body style="margin:0;background:transparent;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" width="560" height="560" viewBox="0 0 140 140">` + body + `</svg></body></html>`
}

func findChrome(override string) (string, error) {
	if override == "" { override = os.Getenv("CHROME") }
	if override != "" {
		found, err := exec.LookPath(override)
		if err != nil { return "", fmt.Errorf("Chrome executable: %w", err) }
		return found, nil
	}
	for _, name := range []string{"chrome-headless-shell", "chromium", "chromium-browser", "google-chrome", "chrome"} {
		if found, err := exec.LookPath(name); err == nil { return found, nil }
	}
	if runtime.GOOS == "windows" {
		for _, base := range []string{os.Getenv("LOCALAPPDATA"), os.Getenv("PROGRAMFILES"), os.Getenv("PROGRAMFILES(X86)")} {
			if base == "" { continue }
			name := filepath.Join(base, "Google", "Chrome", "Application", "chrome.exe")
			if info, err := os.Stat(name); err == nil && info.Mode().IsRegular() { return name, nil }
		}
	}
	if homeDir, err := os.UserHomeDir(); err == nil {
		for _, base := range []string{filepath.Join(homeDir, ".cache", "ms-playwright"), filepath.Join(homeDir, "AppData", "Local", "ms-playwright")} {
			for _, pattern := range []string{"chromium_headless_shell-*/*/chrome-headless-shell", "chromium_headless_shell-*/*/headless_shell.exe"} {
				matches, _ := filepath.Glob(filepath.Join(base, filepath.FromSlash(pattern)))
				if len(matches) > 0 { return matches[len(matches)-1], nil }
			}
		}
	}
	return "", errors.New("Chromium / Chrome was not found; use --chrome PATH or CHROME")
}

// Filter premultiplied channels together so transparent icon edges keep their colour.
func resizeIcon(source image.Image, width, height int) *image.RGBA {
	bounds := source.Bounds()
	input := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(input, input.Bounds(), source, bounds.Min, draw.Src)
	filter := func(input *image.RGBA, width, height int, horizontal bool) *image.RGBA {
		output := image.NewRGBA(image.Rect(0, 0, width, height))
		scale := float64(input.Bounds().Dy()) / float64(height)
		if horizontal { scale = float64(input.Bounds().Dx()) / float64(width) }
		spread := math.Max(1, scale)
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				at, limit := y, input.Bounds().Dy()
				if horizontal { at, limit = x, input.Bounds().Dx() }
				center := (float64(at)+0.5)*scale - 0.5
				var channels [4]float64
				total := 0.0
				for sample := int(math.Ceil(center-3*spread)); sample <= int(math.Floor(center+3*spread)); sample++ {
					if sample < 0 || sample >= limit { continue }
					distance := (center-float64(sample))/spread
					weight := 1.0
					if distance != 0 { weight = 3*math.Sin(math.Pi*distance)*math.Sin(math.Pi*distance/3)/(math.Pi*math.Pi*distance*distance) }
					sx, sy := x, sample
					if horizontal { sx, sy = sample, y }
					offset := input.PixOffset(sx, sy)
					for c := range channels { channels[c] += float64(input.Pix[offset+c])*weight }
					total += weight
				}
				offset := output.PixOffset(x, y)
				alpha := math.Max(0, math.Min(255, math.Round(channels[3]/total)))
				for c := 0; c < 3; c++ { output.Pix[offset+c] = uint8(math.Max(0, math.Min(alpha, math.Round(channels[c]/total)))) }
				output.Pix[offset+3] = uint8(alpha)
			}
		}
		return output
	}
	return filter(filter(input, width, bounds.Dy(), true), width, height, false)
}

func (a *application) icons(args []string) error {
	flags := flag.NewFlagSet("icons", flag.ContinueOnError)
	flags.SetOutput(a.err)
	tile := flags.Bool("tile", false, "render on a glass tile instead of transparent")
	out := flags.String("out", "", "write APP.png into this directory instead of the app folder")
	sheet := flags.String("sheet", "", "also write a preview sheet on black")
	chrome := flags.String("chrome", "", "Chromium / Chrome executable (or CHROME)")
	if err := flags.Parse(args); err != nil { return err }
	icons := filepath.Join(a.upstream, "kit", "icons")
	names := flags.Args()
	if len(names) == 0 {
		entries, err := os.ReadDir(icons)
		if err != nil { return err }
		for _, entry := range entries { if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".svg") { names = append(names, strings.TrimSuffix(entry.Name(), ".svg")) } }
	}
	if len(names) == 0 { return errors.New("no SVG icons found") }
	exe, err := findChrome(*chrome)
	if err != nil { return err }
	work, err := os.MkdirTemp("", "mgu-icons-*")
	if err != nil { return err }
	defer os.RemoveAll(work)
	var images []image.Image
	for _, name := range names {
		if !validName(name) { return fmt.Errorf("invalid icon name %q", name) }
		source, err := os.ReadFile(filepath.Join(icons, name+".svg"))
		if err != nil { return err }
		html, screenshot := filepath.Join(work, name+".html"), filepath.Join(work, name+".png")
		if err := writeFile(html, []byte(iconPage(string(source), *tile)), 0600); err != nil { return err }
		location := &url.URL{Scheme: "file", Path: filepath.ToSlash(html)}
		if runtime.GOOS == "windows" && !strings.HasPrefix(location.Path, "/") { location.Path = "/"+location.Path }
		ctx, cancel := context.WithTimeout(a.ctx, 2*time.Minute)
		command := exec.CommandContext(ctx, exe, "--headless", "--no-sandbox", "--hide-scrollbars", "--default-background-color=00000000", "--force-device-scale-factor=1", "--user-data-dir="+filepath.Join(work, "profile"), "--window-size=560,560", "--screenshot="+screenshot, location.String())
		command.Dir, command.Stderr = a.root, a.err
		err = command.Run()
		cancel()
		if err != nil { return fmt.Errorf("render icon %s: %w", name, err) }
		file, err := os.Open(screenshot)
		if err != nil { return err }
		img, _, err := image.Decode(file)
		file.Close()
		if err != nil { return err }
		img = resizeIcon(img, 140, 140)
		target := filepath.Join(a.root, "apps", name, "icon.png")
		if *out != "" { target = filepath.Join(absolute(*out), name+".png") }
		if err := savePreviewPNG(target, img); err != nil { return err }
		images = append(images, img)
		fmt.Fprintln(a.out, "icon", name, "->", target)
	}
	if *sheet != "" {
		cols := len(images)
		if cols > 4 { cols = 4 }
		rows := (len(images)+cols-1)/cols
		preview := image.NewRGBA(image.Rect(0, 0, cols*460, rows*300))
		draw.Draw(preview, preview.Bounds(), image.NewUniform(color.Black), image.Point{}, draw.Src)
		for i, img := range images {
			x, y := (i%cols)*460, (i/cols)*300
			draw.Draw(preview, image.Rect(x+10, y+80, x+150, y+220), img, image.Point{}, draw.Over)
			draw.Draw(preview, image.Rect(x+165, y+10, x+445, y+290), resizeIcon(img, 280, 280), image.Point{}, draw.Over)
		}
		if err := savePreviewPNG(absolute(*sheet), preview); err != nil { return err }
		fmt.Fprintln(a.out, "sheet", absolute(*sheet))
	}
	return nil
}
