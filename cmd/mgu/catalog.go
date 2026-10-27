package main

import (
	"errors"
	"flag"
	"fmt"
	"path/filepath"
	"strings"
)

func (a *application) signals(args []string) error {
	if len(args) == 0 { return errors.New("usage: mgu signals search|show|check [--catalog PATH] [arguments]") }
	flags := flag.NewFlagSet("signals "+args[0], flag.ContinueOnError)
	flags.SetOutput(a.err)
	catalog := flags.String("catalog", filepath.Join(a.root, "bmw-extracted", "reference", "someip-interfaces.json"), "local service catalog")
	if err := flags.Parse(args[1:]); err != nil { return err }
	var db map[string]any
	if err := readJSON(*catalog, &db); err != nil { return err }
	interfaces := obj(db["interfaces"])
	if interfaces == nil { return errors.New("catalog does not contain interfaces") }
	switch args[0] {
	case "search":
		queries := flags.Args()
		for _, name := range sortedKeys(interfaces) {
			iface := obj(interfaces[name])
			matches := func(value string) bool {
				value = strings.ToLower(value)
				for _, query := range queries { if !strings.Contains(value, strings.ToLower(query)) { return false } }
				return true
			}
			if len(queries) == 0 || matches(name) {
				fmt.Fprintln(a.out, name)
				continue
			}
			for _, kind := range []string{"fields", "methods", "events"} {
				for _, member := range sortedKeys(obj(iface[kind])) {
					if matches(name+" "+member) { fmt.Fprintf(a.out, "%s  %s  %s\n", name, kind, member) }
				}
			}
		}
		return nil
	case "show":
		if flags.NArg() == 0 { return errors.New("usage: mgu signals show [--catalog PATH] INTERFACE [FIELD ...]") }
		name := flags.Arg(0)
		iface := obj(interfaces[name])
		if iface == nil { return fmt.Errorf("interface not found: %s", name) }
		fmt.Fprintf(a.out, "%s svc %v inst %v\n", name, iface["serviceId"], obj(db["instanceIDs"])[name])
		selected := map[string]bool{}
		for _, field := range flags.Args()[1:] { selected[field] = true }
		fields := obj(iface["fields"])
		for field := range selected {
			if _, ok := fields[field]; !ok { return fmt.Errorf("field %s not found in %s", field, name) }
		}
		for _, field := range sortedKeys(fields) {
			if len(selected) > 0 && !selected[field] { continue }
			fd := obj(fields[field])
			var access []string
			if truthy(fd["getter"]) { access = append(access, "get") }
			if truthy(fd["setter"]) { access = append(access, "set") }
			if truthy(fd["notifier"]) { access = append(access, "evt") }
			description := describeType(obj(db["datatypes"]), text(fd["dataRef"]), 0, map[string]bool{})
			if len(description) > 700 { description = description[:700] }
			fmt.Fprintf(a.out, "  %s %s = %s\n", field, strings.Join(access, "/"), description)
		}
		if len(selected) == 0 {
			for _, kind := range []string{"methods", "events"} {
				for _, name := range sortedKeys(obj(iface[kind])) { fmt.Fprintf(a.out, "  %s %s\n", kind, name) }
			}
		}
		return nil
	case "check":
		specs, err := a.specs(flags.Args())
		if err != nil { return err }
		problems := 0
		problem := func(format string, args ...any) { fmt.Fprintf(a.out, format+"\n", args...); problems++ }
		for _, spec := range specs {
			id := text(spec["id"])
			for _, name := range sortedKeys(obj(spec["signals"])) {
				iface := obj(interfaces[name])
				if iface == nil { problem("%s MISSING IFACE %s", id, name); continue }
				signalFields := obj(obj(spec["signals"])[name])
				for _, field := range sortedKeys(signalFields) {
					switch field {
					case "_methods", "_broadcasts":
						kind := "methods"
						if field == "_broadcasts" { kind = "events" }
						for _, member := range list(signalFields[field]) {
							if _, ok := obj(iface[kind])[text(member)]; !ok { problem("%s %s no %s %s", id, name, kind, text(member)) }
						}
					default:
						if strings.HasPrefix(field, "_") { continue }
						fd := obj(obj(iface["fields"])[field])
						if fd == nil { problem("%s %s no field %s", id, name, field); continue }
						modes := text(signalFields[field])
						if strings.Contains(modes, "r") && !truthy(obj(fd["getter"])["id"]) { problem("%s %s %s no getter", id, name, field) }
						if strings.Contains(modes, "w") && !truthy(obj(fd["setter"])["id"]) { problem("%s %s %s no setter", id, name, field) }
						if strings.Contains(modes, "s") && !truthy(fd["notifier"]) { problem("%s %s %s no notifier", id, name, field) }
					}
				}
			}
		}
		fmt.Fprintln(a.out, "problems:", problems)
		if problems > 0 { return fmt.Errorf("%d signal declaration problems", problems) }
		return nil
	default:
		return errors.New("usage: mgu signals search|show|check [--catalog PATH] [arguments]")
	}
}

func truthy(value any) bool {
	switch value := value.(type) {
	case nil: return false
	case bool: return value
	case float64: return value != 0
	case string: return value != ""
	case map[string]any: return len(value) != 0
	case []any: return len(value) != 0
	default: return true
	}
}

func describeType(types map[string]any, ref string, depth int, seen map[string]bool) string {
	if ref == "" { return "?" }
	if depth > 8 || seen[ref] { return ref }
	d := obj(types[ref])
	if d == nil { return ref }
	seen[ref] = true
	defer delete(seen, ref)
	switch text(d["type"]) {
	case "struct":
		if depth > 1 { return "struct" }
		members := append([]any{}, list(d["members"])...)
		parent := text(d["extends"])
		parents := map[string]bool{ref: true}
		for parent != "" && !parents[parent] {
			parents[parent] = true
			base := obj(types[parent])
			if base == nil { break }
			members = append(append([]any{}, list(base["members"])...), members...)
			parent = text(base["extends"])
		}
		var fields []string
		for _, raw := range members {
			member := obj(raw)
			fields = append(fields, text(member["name"])+":"+describeType(types, text(member["dataRef"]), depth+1, seen))
		}
		return "{" + strings.Join(fields, ", ") + "}"
	case "enum":
		items := obj(d["items"])
		var values []string
		for _, name := range sortedKeys(items) {
			if len(values) == 8 { values = append(values, ".."); break }
			values = append(values, name+"="+text(items[name]))
		}
		return "enum(" + strings.Join(values, ",") + ")"
	case "typedef":
		return describeType(types, text(valueOr(d, "dataRef", valueOr(d, "baseType", "?"))), depth+1, seen)
	case "array":
		return "[" + describeType(types, text(d["elementDataRef"]), depth+1, seen) + "]"
	default:
		return text(d["type"])
	}
}

