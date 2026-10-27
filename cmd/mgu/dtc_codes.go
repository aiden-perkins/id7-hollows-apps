package main

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var validDTCCode = regexp.MustCompile("^[0-9A-Fa-f]{6}$")
var dtcMeaningWord = regexp.MustCompile("[a-z]{3,}")
var dtcUnitTag = regexp.MustCompile("^([A-Z][A-Z0-9]+[a-z0-9]?)(?:[-/ ][A-Z0-9]{1,6})?\\s*:")

func readDTCCSV(source string) ([][]string, error) {
	data, err := os.ReadFile(source)
	if err != nil { return nil, err }
	data = bytes.TrimPrefix(data, []byte{0xef, 0xbb, 0xbf})
	data = []byte(strings.ToValidUTF8(string(data), "\ufffd"))
	first := strings.SplitN(string(data), "\n", 2)[0]
	counts := map[rune]int{',': 0, ';': 0, '\t': 0}
	quoted := false
	for _, r := range first {
		if r == '"' { quoted = !quoted } else if !quoted {
			if _, exists := counts[r]; exists { counts[r]++ }
		}
	}
	delimiter := ','
	for _, candidate := range []rune{';', '\t'} { if counts[candidate] > counts[delimiter] { delimiter = candidate } }
	reader := csv.NewReader(bytes.NewReader(data))
	reader.Comma, reader.FieldsPerRecord = delimiter, -1
	return reader.ReadAll()
}

func normalizedDTCText(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

func (a *application) importDTCCSV(source, output string) error {
	rows, err := readDTCCSV(source)
	if err != nil { return err }
	if len(rows) == 0 { return errors.New("fault CSV is empty") }
	fields := map[string]int{}
	for index, name := range rows[0] {
		name = strings.NewReplacer(" ", "", "_", "").Replace(strings.ToLower(strings.TrimSpace(name)))
		fields[name] = index
	}
	column := func(names ...string) int {
		for _, name := range names { if index, exists := fields[name]; exists { return index } }
		return -1
	}
	codeColumn := column("code", "faultcode", "dtc", "fehlercode")
	textColumn := column("description", "faultdescription", "text", "faulttext", "fehlertext")
	if codeColumn < 0 || textColumn < 0 { return errors.New("fault CSV requires Code and Description columns") }
	values := map[string]map[string]bool{}
	for _, row := range rows[1:] {
		if codeColumn >= len(row) || textColumn >= len(row) { continue }
		code := strings.TrimPrefix(strings.ToUpper(strings.TrimSpace(row[codeColumn])), "0X")
		description := normalizedDTCText(row[textColumn])
		if !validDTCCode.MatchString(code) || description == "" || strings.EqualFold(description, "no description") || strings.EqualFold(description, "unknown") { continue }
		if values[code] == nil { values[code] = map[string]bool{} }
		values[code][description] = true
	}
	unique, ambiguous := map[string]string{}, map[string]int{}
	for code, texts := range values {
		if len(texts) == 1 { for description := range texts { unique[code] = description } } else { ambiguous[code] = len(texts) }
	}
	if err := writeJSON(filepath.Join(output, "dtc_scanner_texts.json"), unique); err != nil { return err }
	if err := writeJSON(filepath.Join(output, "dtc_scanner_ambiguous.json"), ambiguous); err != nil { return err }
	fmt.Fprintf(a.out, "%d codes with one text, %d with several -> %s\n", len(unique), len(ambiguous), output)
	return nil
}

func dtcWords(description string) map[string]bool {
	result := map[string]bool{}
	for _, word := range dtcMeaningWord.FindAllString(strings.ToLower(description), -1) {
		if word != "the" && word != "and" && word != "for" && word != "with" { result[word] = true }
	}
	return result
}

func dtcSimilarity(first, second string) float64 {
	left, right := dtcWords(first), dtcWords(second)
	total := len(left)
	if len(right) < total { total = len(right) }
	if total == 0 { return 0 }
	shared := 0
	for word := range left { if right[word] { shared++ } }
	return float64(shared)/float64(total)
}

func dtcTag(description string) string {
	if match := dtcUnitTag.FindStringSubmatch(description); match != nil { return match[1] }
	return ""
}

func (a *application) importDTCCodes(source, output string) error {
	rows, err := readDTCCSV(source)
	if err != nil { return err }
	seen := map[string]map[string]bool{}
	meanings := map[string][][]string{}
	for _, row := range rows {
		if len(row) < 2 { continue }
		code := strings.ToUpper(strings.TrimSpace(row[0]))
		if !validDTCCode.MatchString(code) { continue }
		description := normalizedDTCText(strings.ReplaceAll(strings.SplitN(row[1], "\n", 2)[0], "\"", "'"))
		if !isEnglishDTC(description) { continue }
		description = hmiText(description)
		if description == "" || strings.Contains(description, "DUMMY") { continue }
		if seen[code] == nil { seen[code] = map[string]bool{} }
		key := strings.ToLower(description)
		if seen[code][key] { continue }
		seen[code][key] = true
		grouped := false
		for index, group := range meanings[code] {
			if dtcSimilarity(group[0], description) >= 0.5 {
				meanings[code][index] = append(group, description)
				grouped = true
				break
			}
		}
		if !grouped { meanings[code] = append(meanings[code], []string{description}) }
	}
	shared := map[string][]string{}
	tags := map[string]map[string]bool{}
	indexPath := filepath.Join(output, "sgbd_index.json")
	if data, err := os.ReadFile(indexPath); err == nil {
		index, err := dtcStrings(data, indexPath)
		if err != nil { return err }
		addresses := map[string]map[string]bool{}
		for key, variant := range index {
			fields := strings.Fields(key)
			if len(fields) == 0 || !dtcVariantName.MatchString(variant) { return fmt.Errorf("invalid SGBD index entry %q", key) }
			if addresses[variant] == nil { addresses[variant] = map[string]bool{} }
			addresses[variant][fields[0]] = true
		}
		if data, err := os.ReadFile(filepath.Join(output, "shared_codes.json")); err == nil {
			if err := decodeDTCJSON(data, &shared); err != nil { return err }
		} else if !os.IsNotExist(err) { return err }
		counts := map[string]map[string]int{}
		for variant, units := range addresses {
			name := filepath.Join(output, "texts", variant+".json")
			data, err := os.ReadFile(name)
			if os.IsNotExist(err) { continue }
			if err != nil { return err }
			texts, err := dtcStrings(data, name)
			if err != nil { return err }
			for code, description := range texts {
				for _, group := range meanings[code] {
					alike := false
					for _, candidate := range group { if dtcSimilarity(candidate, description) >= 0.3 { alike = true; break } }
					if !alike { continue }
					for _, candidate := range group {
						tag := dtcTag(candidate)
						if tag == "" { continue }
						if counts[tag] == nil { counts[tag] = map[string]int{} }
						for unit := range units { counts[tag][unit]++ }
					}
				}
			}
		}
		for tag, units := range counts {
			total := 0
			for _, count := range units { total += count }
			if total < 30 { continue }
			tags[tag] = map[string]bool{}
			for unit, count := range units { if float64(count)/float64(total) >= 0.5 { tags[tag][unit] = true } }
		}
	} else if !os.IsNotExist(err) { return err }
	texts := map[string]any{}
	perUnit := 0
	for code, groups := range meanings {
		if len(groups) == 1 && len(shared[code]) == 0 { texts[code] = groups[0][0]; continue }
		units := map[string][]string{}
		for _, group := range groups {
			matched := map[string]bool{}
			for _, description := range group { for unit := range tags[dtcTag(description)] { matched[unit] = true } }
			for unit := range matched { units[unit] = append(units[unit], group[0]) }
		}
		specific := map[string]string{}
		for unit, candidates := range units { if len(candidates) == 1 { specific[unit] = candidates[0] } }
		if len(specific) > 0 { texts[code] = specific; perUnit++ }
	}
	if err := writeJSON(filepath.Join(output, "code_texts.json"), texts); err != nil { return err }
	if err := os.Remove(filepath.Join(output, "obd_texts.json")); err != nil && !os.IsNotExist(err) { return err }
	fmt.Fprintf(a.out, "%d fault codes (%d unit-specific, %d ambiguous omitted) -> %s\n", len(texts), perUnit, len(meanings)-len(texts), filepath.Join(output, "code_texts.json"))
	return nil
}

