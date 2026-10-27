package main

import (
	"os"
	"regexp"
	"strings"
	"unicode"
)

var germanDTCWords map[string]bool

func loadDTCWords(path string) error {
	data, err := os.ReadFile(path)
	if err != nil { return err }
	germanDTCWords = map[string]bool{}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "#") { germanDTCWords[line] = true }
	}
	return nil
}

func hmiText(value any) string {
	var result strings.Builder
	for _, r := range text(value) {
		if r >= 32 && r <= 126 { result.WriteRune(r) }
	}
	return result.String()
}

var dtcWord = regexp.MustCompile("[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]*")

func isEnglishDTC(description string) bool {
	for _, word := range dtcWord.FindAllString(description, -1) {
		if strings.Contains(word, "_") || strings.IndexFunc(word, unicode.IsDigit) >= 0 { continue }
		for _, part := range strings.Split(word, "-") {
			if strings.ContainsAny(part, "äöüßÄÖÜ") { return false }
			minimum := 3
			if strings.ToUpper(part) == part && strings.ToLower(part) != part { minimum = 5 }
			if len([]rune(part)) >= minimum && germanDTCWords[strings.ToLower(part)] { return false }
		}
	}
	return true
}
