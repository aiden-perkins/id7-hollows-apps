package main

import (
	"bufio"
	"compress/lzw"
	"encoding/binary"
	"errors"
	"fmt"
	"image"
	"image/color"
	"io"
	"math"
	"os"
	"path/filepath"
	"sort"
)

type colorSample struct {
	count uint64
	red uint64
	green uint64
	blue uint64
}

func histogramKey(r, g, b uint8) int {
	return int(r>>3)<<10 | int(g>>3)<<5 | int(b>>3)
}

func samplePreviewColors(histogram []colorSample, img *image.RGBA) {
	for y := 0; y < img.Bounds().Dy(); y += 3 {
		for x := 0; x < img.Bounds().Dx(); x += 3 {
			offset := y*img.Stride+x*4
			r, g, b := img.Pix[offset], img.Pix[offset+1], img.Pix[offset+2]
			sample := &histogram[histogramKey(r, g, b)]
			sample.count++
			sample.red += uint64(r)
			sample.green += uint64(g)
			sample.blue += uint64(b)
		}
	}
}

type palettePoint struct {
	r int
	g int
	b int
	count uint64
}

type paletteBox struct {
	points []palettePoint
	axis int
	score float64
}

func makePaletteBox(points []palettePoint) paletteBox {
	box := paletteBox{points: points}
	if len(points) < 2 { return box }
	minimum, maximum := [3]int{255, 255, 255}, [3]int{}
	var count uint64
	for _, p := range points {
		values := [3]int{p.r, p.g, p.b}
		for axis, value := range values {
			if value < minimum[axis] { minimum[axis] = value }
			if value > maximum[axis] { maximum[axis] = value }
		}
		count += p.count
	}
	spread := maximum[0]-minimum[0]
	for axis := 1; axis < 3; axis++ {
		if maximum[axis]-minimum[axis] > spread { spread, box.axis = maximum[axis]-minimum[axis], axis }
	}
	box.score = float64(spread)*float64(count)
	return box
}

func adaptivePreviewPalette(histogram []colorSample) color.Palette {
	var points []palettePoint
	for _, sample := range histogram {
		if sample.count != 0 {
			points = append(points, palettePoint{int(sample.red/sample.count), int(sample.green/sample.count), int(sample.blue/sample.count), sample.count})
		}
	}
	boxes := []paletteBox{makePaletteBox(points)}
	for len(boxes) < 218 {
		best := -1
		for i, box := range boxes {
			if len(box.points) > 1 && box.score > 0 && (best == -1 || box.score > boxes[best].score) { best = i }
		}
		if best == -1 { break }
		box := boxes[best]
		component := func(p palettePoint) int {
			switch box.axis {
			case 0: return p.r
			case 1: return p.g
			default: return p.b
			}
		}
		sort.SliceStable(box.points, func(i, j int) bool { return component(box.points[i]) < component(box.points[j]) })
		var total, cumulative uint64
		for _, point := range box.points { total += point.count }
		middle := 1
		for middle < len(box.points) {
			cumulative += box.points[middle-1].count
			if cumulative*2 >= total { break }
			middle++
		}
		if middle == len(box.points) { middle-- }
		boxes[best] = makePaletteBox(box.points[:middle])
		boxes = append(boxes, makePaletteBox(box.points[middle:]))
	}
	palette := color.Palette{color.RGBA{A: 255}, color.RGBA{R: 255, G: 255, B: 255, A: 255}}
	for _, box := range boxes {
		var r, g, b, count uint64
		for _, point := range box.points {
			count += point.count
			r += uint64(point.r)*point.count
			g += uint64(point.g)*point.count
			b += uint64(point.b)*point.count
		}
		if count != 0 { palette = append(palette, color.RGBA{R: uint8(r/count), G: uint8(g/count), B: uint8(b/count), A: 255}) }
	}
	return palette
}

func previewPaletteLookup(palette color.Palette, histogram []colorSample) []uint8 {
	table := make([]uint8, 32768)
	colors := make([][3]int, len(palette))
	for i, value := range palette {
		r, g, b, _ := value.RGBA()
		colors[i] = [3]int{int(r>>8), int(g>>8), int(b>>8)}
	}
	for key := range table {
		r, g, b := (key>>10)*8+4, ((key>>5)&31)*8+4, (key&31)*8+4
		if sample := histogram[key]; sample.count != 0 { r, g, b = int(sample.red/sample.count), int(sample.green/sample.count), int(sample.blue/sample.count) }
		best, distance := 0, int(^uint(0)>>1)
		for i, value := range colors {
			dr, dg, db := r-value[0], g-value[1], b-value[2]
			d := 3*dr*dr+4*dg*dg+2*db*db
			if d < distance { best, distance = i, d }
		}
		table[key] = uint8(best)
	}
	return table
}

func palettizePreview(img *image.RGBA, palette color.Palette, lookup []uint8) *image.Paletted {
	result := image.NewPaletted(img.Bounds(), palette)
	exact := map[uint32]uint8{}
	for i, value := range palette {
		r, g, b, _ := value.RGBA()
		exact[(r>>8)<<16 | (g>>8)<<8 | (b>>8)] = uint8(i)
	}
	for y := 0; y < img.Bounds().Dy(); y++ {
		for x := 0; x < img.Bounds().Dx(); x++ {
			offset := y*img.Stride+x*4
			r, g, b := img.Pix[offset], img.Pix[offset+1], img.Pix[offset+2]
			key := uint32(r)<<16 | uint32(g)<<8 | uint32(b)
			index, ok := exact[key]
			if !ok { index = lookup[histogramKey(r, g, b)] }
			result.Pix[y*result.Stride+x] = index
		}
	}
	return result
}

// GIF image data is split into length-prefixed blocks of at most 255 bytes.
type gifSubBlocks struct {
	output io.Writer
	buffer [255]byte
	count int
}

func (b *gifSubBlocks) flush() error {
	if b.count == 0 { return nil }
	if _, err := b.output.Write([]byte{byte(b.count)}); err != nil { return err }
	if _, err := b.output.Write(b.buffer[:b.count]); err != nil { return err }
	b.count = 0
	return nil
}

func (b *gifSubBlocks) Write(data []byte) (int, error) {
	written := 0
	for len(data) > 0 {
		if b.count == len(b.buffer) {
			if err := b.flush(); err != nil { return written, err }
		}
		n := copy(b.buffer[b.count:], data)
		b.count += n
		written += n
		data = data[n:]
	}
	return written, nil
}

type previewGIFWriter struct {
	output *bufio.Writer
	width int
	height int
	frames int
}

func newPreviewGIFWriter(output io.Writer, width, height int, palette color.Palette) (*previewGIFWriter, error) {
	if err := validPreviewSize(width, height); err != nil { return nil, err }
	if len(palette) < 2 || len(palette) > 256 { return nil, errors.New("invalid GIF palette size") }
	writer := &previewGIFWriter{output: bufio.NewWriterSize(output, 65536), width: width, height: height}
	header := make([]byte, 13+256*3)
	copy(header, "GIF89a")
	binary.LittleEndian.PutUint16(header[6:8], uint16(width))
	binary.LittleEndian.PutUint16(header[8:10], uint16(height))
	header[10] = 0xf7
	for i, value := range palette {
		r, g, b, _ := value.RGBA()
		header[13+i*3], header[14+i*3], header[15+i*3] = byte(r>>8), byte(g>>8), byte(b>>8)
	}
	if _, err := writer.output.Write(header); err != nil { return nil, err }
	loop := []byte{0x21, 0xff, 0x0b}
	loop = append(loop, []byte("NETSCAPE2.0")...)
	loop = append(loop, 3, 1, 0, 0, 0)
	if _, err := writer.output.Write(loop); err != nil { return nil, err }
	return writer, nil
}

func (w *previewGIFWriter) frame(img *image.Paletted, delay int) error {
	if img.Bounds().Dx() != w.width || img.Bounds().Dy() != w.height || delay < 1 || delay > 65535 { return errors.New("invalid GIF frame dimensions or delay") }
	control := []byte{0x21, 0xf9, 4, 4, 0, 0, 0, 0}
	binary.LittleEndian.PutUint16(control[4:6], uint16(delay))
	if _, err := w.output.Write(control); err != nil { return err }
	descriptor := make([]byte, 11)
	descriptor[0] = 0x2c
	binary.LittleEndian.PutUint16(descriptor[5:7], uint16(w.width))
	binary.LittleEndian.PutUint16(descriptor[7:9], uint16(w.height))
	descriptor[10] = 8
	if _, err := w.output.Write(descriptor); err != nil { return err }
	blocks := &gifSubBlocks{output: w.output}
	compressor := lzw.NewWriter(blocks, lzw.LSB, 8)
	for y := 0; y < w.height; y++ {
		if _, err := compressor.Write(img.Pix[y*img.Stride:y*img.Stride+w.width]); err != nil { compressor.Close(); return err }
	}
	if err := compressor.Close(); err != nil { return err }
	if err := blocks.flush(); err != nil { return err }
	if err := w.output.WriteByte(0); err != nil { return err }
	w.frames++
	return nil
}

func (w *previewGIFWriter) finish() error {
	if w.frames == 0 { return errors.New("no GIF frames were encoded") }
	if err := w.output.WriteByte(0x3b); err != nil { return err }
	return w.output.Flush()
}

func (a *application) exportGIF(name string, source *previewFrames, background string, width, fps int) error {
	var under image.Image
	var err error
	if background != "" {
		under, err = loadPreviewImage(absolute(background))
		if err != nil { return err }
	}
	if source.count < 1 || fps < 1 || fps > 50 { return errors.New("invalid GIF recording or frame rate") }
	outputFrames := (source.count*fps+59)/60
	histogram := make([]colorSample, 32768)
	w, h := 0, 0
	for index := 0; index < outputFrames; index++ {
		if err := a.ctx.Err(); err != nil { return err }
		raw, err := source.frame(index*60/fps)
		if err != nil { return err }
		img, err := composePreviewImage(raw, under, width)
		if err != nil { return err }
		if index == 0 { w, h = img.Bounds().Dx(), img.Bounds().Dy() }
		if img.Bounds().Dx() != w || img.Bounds().Dy() != h { return errors.New("image dimensions changed during capture") }
		samplePreviewColors(histogram, img)
	}
	palette := adaptivePreviewPalette(histogram)
	lookup := previewPaletteLookup(palette, histogram)
	if err := os.MkdirAll(filepath.Dir(name), 0755); err != nil { return err }
	err = atomicFile(name, 0644, func(file *os.File) error {
		writer, err := newPreviewGIFWriter(file, w, h, palette)
		if err != nil { return err }
		for index := 0; index < outputFrames; index++ {
			if err := a.ctx.Err(); err != nil { return err }
			raw, err := source.frame(index*60/fps)
			if err != nil { return err }
			img, err := composePreviewImage(raw, under, width)
			if err != nil { return err }
			delay := int(math.Round(float64(index+1)*100/float64(fps))-math.Round(float64(index)*100/float64(fps)))
			if err := writer.frame(palettizePreview(img, palette, lookup), delay); err != nil { return err }
		}
		if err := writer.finish(); err != nil { return err }
		info, err := file.Stat()
		if err != nil { return err }
		if info.Size() <= 800 { return errors.New("GIF encoder produced no image data") }
		return nil
	})
	if err != nil { return err }
	fmt.Fprintf(a.out, "GIF: %s (%dx%d, %d frames, %.2f seconds)\n", name, w, h, outputFrames, float64(source.count)/60)
	return nil
}

