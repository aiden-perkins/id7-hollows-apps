# Ambient Lighting

Standalone native iDrive app for saved factory color-menu presets and exact
driving-mode mappings. It uses the legacy lighting provider demonstrated in
[MGU Lab findings](../mgu_lab/FINDINGS.md), without replacing BMW's factory menu.

## Controls

- Home shows fresh vehicle mode/menu, the last app-confirmed preset and its
  manual/automatic source, automation availability, and pending/applied/failed status.
- Presets supports capture, create, apply, edit, duplicate, rename and confirmed
  deletion. Capture reads the vehicle first. Saved presets and reported state remain
  separate. Menus 5, 8 and 12 are initial examples from successful Lab captures;
  automation and all mode mappings initially remain off/unassigned.
- The editor changes only a local draft. Rotate to select native rows and press
  to choose a menu or name character. Names support 24 characters. Save commits
  the draft; Apply on the preset screen sends the command. Cancel discards the
  draft. Native Back returns Home and cancels uncommitted edits.
- Driving modes offers Sport Dynamic/Expert/Individual, Comfort/Comfort Plus,
  and Eco Pro Efficient/Individual: the seven variants observed on this car.
  Each exact mode can select a saved preset or Leave unchanged.
- Lighting settings displays the raw payload, service state and capability limits.
- Preferences controls automation, immediate application when enabling it, and
  experimental operation while hidden. Recent changes keeps 20 session entries.

## Write and automation behavior

Only factory menu selection (1–12) is editable. Menu numbers are not physical
color names, so previews describe the menu without guessing colors. Unknown
captured fields remain in saved presets; only the selected menu is sent, with the
Lab catalog's unfilled sentinels for other fields. Brightness, independent layers,
dynamic lighting and roof settings are not changed.

A write is pending until a subsequent vehicle read reports the requested menu.
Setter completion alone is insufficient. Confirmation covers the reported menu,
not physical color or independent layer behavior. Failed/mismatched commands stop
automatic writes until a new valid mode transition or explicit re-enable; no
command retries run in a loop. Requests are serialized. Rapid mode changes cancel
obsolete requests and coalesce to the latest transition.

Defaults are automation off, transition-only application, and no hidden writes.
Enabling automation can optionally apply the current mapping, provided mode and
lighting are fresh. Manual application lasts until the next valid transition.
External menu changes suspend automatic writes until a new transition.

Startup, reconnect and resuming visibility read the vehicle to establish a new
baseline without applying saved state. Invalid, unsupported, or stale modes cannot
trigger mappings. Polling refreshes mode and lighting every two seconds; values
older than ten seconds are unavailable for automation. Read failures invalidate
the corresponding baseline.

Hidden operation is an explicit experimental preference. It only works while the
app process and providers remain alive; captures do not establish hidden-mode
delivery, head-unit sleep behavior, or process survival. Closing the app cancels
pending work and shuts down subscriptions. It does not restore an old saved vehicle
state. No temporary preview or restore operation is offered because reliable full
state restoration has not been demonstrated.

## Storage and packaging

Configuration lives in the app's data directory:

- `settings.json`: schema version 1 and automation preferences.
- `presets.json`: schema version 1, stable IDs, names, legacy values and capture metadata.
- `mode-mappings.json`: schema version 1 and exact mode-to-preset IDs.

Writes use a temporary file and rename. Missing files use defaults. Malformed data
or an unsupported schema is reported and preserved; the app blocks overwriting
that file. There is no older app schema to migrate yet. Transient reported vehicle
state and history are never loaded as current state after restart. Storage failures
appear in the UI.

The wrapper recognizes `ambient_lighting` as local for app listing, packaging,
kit assembly and normal app downloads, using the same runtime getter patches as
MGU Lab. No upstream source is copied into this app. The CLI executable and app
bundle must be rebuilt separately before installation; no build or install was
performed for this implementation.

## Remaining capability gaps

The saved evidence does not establish factory on/off, brightness, independent
zones/layers, roof controls or the newer interior-profile backend. These need
further vehicle research before functional controls can be implemented. Factory
menu interception/replacement is also unresolved. This app presents those limits
instead of offering controls with speculative wire semantics.

Implementation is based on the Oct. 25–26 exports in `out/`, including later
successful menu 5/8/12 writes; early numeric-enum write failures are superseded by
the named `FARBAUSWAHL_n` command mapping. Physical color, rapid changes, restart,
and hidden operation still require vehicle validation.

Tests, linters, formatters, builds, compilation and execution validation were not run.
