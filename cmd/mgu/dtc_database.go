package main

import (
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

var dtcVariantName = regexp.MustCompile("^[a-zA-Z0-9_]+$")
var dtcAddress = regexp.MustCompile("^[0-9A-Fa-f]{1,2}$")

func findDTCDatabase(files map[string][]byte, depth int) (map[string][]byte, string, error) {
	if depth > 8 { return nil, "", errors.New("fault database archives are nested too deeply") }
	var indexes []string
	for name := range files {
		if path.Base(name) == "sgbd_index.json" { indexes = append(indexes, name) }
	}
	sort.Slice(indexes, func(i, j int) bool {
		if len(indexes[i]) == len(indexes[j]) { return indexes[i] < indexes[j] }
		return len(indexes[i]) < len(indexes[j])
	})
	if len(indexes) > 0 { return files, strings.TrimSuffix(indexes[0], "sgbd_index.json"), nil }
	for _, name := range sortedDTCFiles(files) {
		if strings.HasSuffix(name, ".tgz") || strings.HasSuffix(name, ".tar.gz") {
			inner, err := readDTCArchive(files[name])
			if err != nil { return nil, "", err }
			return findDTCDatabase(inner, depth+1)
		}
	}
	return nil, "", errors.New("no sgbd_index.json found; expected a fault database package")
}

func englishDTCTexts(texts map[string]string) (map[string]string, int) {
	result := map[string]string{}
	for key, value := range texts { if isEnglishDTC(value) { result[key] = value } }
	return result, len(texts)-len(result)
}

func (a *application) importDTCDatabase(source, output string) error {
	files, err := readDTCSource(source)
	if err != nil { return err }
	files, base, err := findDTCDatabase(files, 0)
	if err != nil { return err }
	index, err := dtcStrings(files[base+"sgbd_index.json"], "sgbd_index.json")
	if err != nil { return err }
	addresses := map[string]map[string]bool{}
	for key, variant := range index {
		fields := strings.Fields(key)
		if len(fields) == 0 { return fmt.Errorf("invalid SGBD index key %q", key) }
		if addresses[variant] == nil { addresses[variant] = map[string]bool{} }
		addresses[variant][fields[0]] = true
	}
	stage, err := dtcOutputStage(source, output)
	if err != nil { return err }
	defer os.RemoveAll(stage)
	if err := os.MkdirAll(filepath.Join(stage, "texts"), 0755); err != nil { return err }
	if err := writeJSON(filepath.Join(stage, "sgbd_index.json"), index); err != nil { return err }
	used := map[string]map[string]bool{}
	var types, kept, skipped int
	for _, name := range sortedDTCFiles(files) {
		if !strings.HasPrefix(name, base+"texts/") || !strings.HasSuffix(name, ".json") { continue }
		variant := strings.TrimSuffix(strings.TrimPrefix(name, base+"texts/"), ".json")
		if !dtcVariantName.MatchString(variant) { continue }
		texts, err := dtcStrings(files[name], name)
		if err != nil { return err }
		for code := range texts {
			code = strings.ToUpper(code)
			if used[code] == nil { used[code] = map[string]bool{} }
			for address := range addresses[variant] { used[code][address] = true }
		}
		filtered, left := englishDTCTexts(texts)
		kept, skipped = kept+len(filtered), skipped+left
		if err := writeJSON(filepath.Join(stage, "texts", variant+".json"), filtered); err != nil { return err }
		types++
	}
	for _, name := range []string{"unit_names.json", "dtc_texts.json"} {
		if data, ok := files[base+name]; ok {
			texts, err := dtcStrings(data, name)
			if err != nil { return err }
			filtered, left := englishDTCTexts(texts)
			if name == "dtc_texts.json" { kept, skipped = kept+len(filtered), skipped+left }
			if err := writeJSON(filepath.Join(stage, name), filtered); err != nil { return err }
		}
	}
	shared := map[string][]string{}
	for code, units := range used {
		if len(units) < 2 { continue }
		for unit := range units { shared[code] = append(shared[code], unit) }
		sort.Strings(shared[code])
	}
	if err := writeJSON(filepath.Join(stage, "shared_codes.json"), shared); err != nil { return err }
	if err := writeFile(filepath.Join(stage, ".packignore"), []byte("# only used while importing code lists\nshared_codes.json\n"), 0644); err != nil { return err }
	for _, keep := range []string{"tables", "code_texts.json"} {
		old := filepath.Join(output, keep)
		if info, err := os.Stat(old); err == nil {
			target := filepath.Join(stage, keep)
			if info.IsDir() { err = copyTree(old, target) } else { err = copyFile(old, target, 0644) }
			if err != nil { return err }
		} else if !os.IsNotExist(err) { return err }
	}
	if err := a.ctx.Err(); err != nil { return err }
	if err := replaceDirectory(stage, output, filepath.Dir(output)); err != nil { return err }
	fmt.Fprintf(a.out, "%d control unit types, %d English texts imported, %d German texts omitted -> %s\n", types, kept, skipped, output)
	return nil
}

func normalizedDTCCode(code string) string {
	code = strings.TrimPrefix(strings.ToUpper(strings.TrimSpace(code)), "0X")
	if len(code) < 6 { code = strings.Repeat("0", 6-len(code)) + code }
	return code
}

func (a *application) importDTCTables(source, output string) error {
	files, err := readDTCSource(source)
	if err != nil { return err }
	names := []string{"dtc_scanner_variant_exact.json", "dtc_scanner_addr_exact.json", "dtc_scanner_ecu_matches.json", "dtc_scanner_ecu_hints.json", "dtc_scanner_texts.json", "dtc_scanner_ambiguous.json"}
	tables := map[string]map[string]any{}
	for _, name := range sortedDTCFiles(files) {
		for _, wanted := range names {
			if path.Base(name) != wanted || tables[wanted] != nil { continue }
			var table map[string]any
			if err := decodeDTCJSON(files[name], &table); err != nil { return fmt.Errorf("%s: %w", name, err) }
			if table == nil { return fmt.Errorf("%s: expected an object", name) }
			tables[wanted] = table
		}
	}
	if len(tables) == 0 { return errors.New("no dtc_scanner_*.json tables found") }
	variants, addresses := map[string]map[string]string{}, map[string]map[string]string{}
	for _, key := range sortedKeys(tables[names[0]]) {
		value := text(tables[names[0]][key])
		at := strings.LastIndex(key, ":")
		if at < 0 || value == "" || !dtcVariantName.MatchString(key[:at]) { continue }
		variant, code := strings.ToLower(key[:at]), normalizedDTCCode(key[at+1:])
		if variants[variant] == nil { variants[variant] = map[string]string{} }
		if _, exists := variants[variant][code]; !exists { variants[variant][code] = value }
	}
	for _, name := range names[1:4] {
		for _, key := range sortedKeys(tables[name]) {
			value := text(tables[name][key])
			unit, code, found := strings.Cut(key, ":")
			if !found || !dtcAddress.MatchString(unit) || value == "" { continue }
			unit = strings.ToUpper(unit)
			if len(unit) == 1 { unit = "0" + unit }
			code = normalizedDTCCode(code)
			if addresses[unit] == nil { addresses[unit] = map[string]string{} }
			if _, exists := addresses[unit][code]; !exists { addresses[unit][code] = value }
		}
	}
	indexPath := filepath.Join(filepath.Dir(output), "sgbd_index.json")
	if data, err := os.ReadFile(indexPath); err == nil {
		index, err := dtcStrings(data, indexPath)
		if err != nil { return err }
		reachable := map[string]bool{}
		for _, variant := range index { reachable[strings.ToLower(variant)] = true }
		for variant := range variants { if !reachable[variant] { delete(variants, variant) } }
	} else if !os.IsNotExist(err) { return err } else {
		fmt.Fprintln(a.out, "note: no sgbd_index.json; all unit type tables retained")
	}
	stage, err := dtcOutputStage(source, output)
	if err != nil { return err }
	defer os.RemoveAll(stage)
	for _, directory := range []string{"variant", "addr"} { if err := os.MkdirAll(filepath.Join(stage, directory), 0755); err != nil { return err } }
	for variant, texts := range variants { if err := writeJSON(filepath.Join(stage, "variant", variant+".json"), texts); err != nil { return err } }
	for address, texts := range addresses { if err := writeJSON(filepath.Join(stage, "addr", address+".json"), texts); err != nil { return err } }
	codes, ambiguous := map[string]string{}, map[string]int{}
	for code, value := range tables[names[4]] { if description := text(value); description != "" { codes[normalizedDTCCode(code)] = description } }
	for code, value := range tables[names[5]] {
		count, err := strconv.Atoi(text(value))
		if err == nil && count >= 0 { ambiguous[normalizedDTCCode(code)] = count }
	}
	if err := writeJSON(filepath.Join(stage, "codes.json"), codes); err != nil { return err }
	if err := writeJSON(filepath.Join(stage, "ambiguous.json"), ambiguous); err != nil { return err }
	if err := a.ctx.Err(); err != nil { return err }
	if err := replaceDirectory(stage, output, filepath.Dir(output)); err != nil { return err }
	fmt.Fprintf(a.out, "fault text tables: %d unit types, %d addresses, %d code-only texts -> %s\n", len(variants), len(addresses), len(codes), output)
	return nil
}
