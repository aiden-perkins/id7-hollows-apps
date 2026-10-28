# ID7 Hollows Apps

A Go CLI for building, previewing, installing and downloading BMW iDrive 7 apps.
It wraps the sibling `../idrive7-apps` checkout and adds local custom apps,
without keeping a separate copy of upstream's source or changing its files.

## Setup

Keep the folders next to each other:

```text
parent/
  idrive7-apps/          upstream checkout
  id7-hollows-apps/     this wrapper
```

Required tools:

- **Go 1.20+** to compile the CLI.
- **Python 3.7+, Node.js and your extracted BMW SDK** to package apps.
- **OpenSSH and existing head-unit SSH access** for car commands and downloads.
- **Node.js 8+ on the head unit** for downloads.

From this folder, compile the Windows executable:

```powershell
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu
```

For macOS/Linux, use `out/mgu`. Examples below use `mgu`; substitute
`./out/mgu.exe` or put the executable on your PATH.

Extract the SDK once before packaging:

```sh
mgu sdk extract path/to/app.js
```

It is saved to `bmw-extracted/oap-sdk/`. Keep the SDK and generated app bundles private.
Global options go before the command: `--upstream PATH`, `--root PATH`,
`--python PATH` and `--node PATH` override the default locations or executables.

## Build and install

```sh
mgu apps
mgu kit
mgu --auto --key path/to/id_rsa car install
mgu --auto --key path/to/id_rsa car status
```

- `kit` builds **all upstream apps plus local MGU Lab, Ambient Lighting, Live Data Viewer and Trip Data**, then creates the car kit.
- Select apps with `mgu kit mgu_lab edrive`.
- `mgu build mgu_lab` packages an app without assembling a kit.
- `kit` already builds its apps; a separate `build` first is unnecessary.
- Recompile after Go changes. App changes only need another build or kit.

`car install` uploads the kit automatically. For a preflight check, run
`car upload`, then `car check`, then `car install` as separate commands.
Use `car logs APP`, `car backups` and `car restore` for logs and recovery.

Connection options, before the command:

| Option | Purpose |
| --- | --- |
| `--auto` | Discover the current head-unit IP over ENET. |
| `--host root@IP` | Supply the head-unit SSH address directly. |
| `--key PATH` / `--port NUMBER` | Select the SSH key or port. |
| `--vin VIN` / `--gateway IP` | Select a car or gateway when using `--auto`. |

`MGU_HOST`, `MGU_KEY`, OpenSSH configuration and SSH agents are also supported.

## Download files

```sh
mgu --auto --key path/to/id_rsa download mgu_lab
mgu --auto --key path/to/id_rsa download head-unit --max-bytes 250MiB
```

App downloads include **data, kvs, share and security** by default. Each app keeps
its own file formats; downloading does not request new samples or snapshots.
Head-unit downloads capture accessible mounted storage, excluding virtual kernel
trees such as `/proc`, `/sys` and `/dev`.

Repeat a command to resume. Completed unchanged files are skipped, partial files
are checked before resuming, and earlier downloaded versions are retained.

| Option | Example |
| --- | --- |
| Select paths; repeatable | `--path /usr` for head-unit, `--path data` for apps |
| Limit received file bytes | `--max-bytes 250MiB` |
| Limit newly completed files | `--max-files 100` |
| Set a time limit | `--timeout 10m` |
| Choose a persistent output folder | `--out out/my-capture` |

Byte/file limits default to unlimited. App paths are relative to the installation
directory. Byte limits exclude protocol overhead and do not limit remote hashing.

Downloads are saved under `out/downloads/`:

- `files/` contains completed regular files.
- `manifest.json` and `.mgu-download/` hold source metadata, checkpoints and history.
- Keep the **whole capture folder** to resume; do not share it between simultaneous downloads.
- After a crash, use `--break-lock` only after confirming no downloader is still running there.

Captures are live file copies, not disk images or complete restore backups.
Symlinks are recorded without following them; some filenames are encoded for
Windows compatibility. Local edits are not overwritten. Source deletions do not
remove saved files, and actively changing files may need another attempt.

Downloads need no local Python or upstream checkout. Use `--remote-node PATH` if
Node is not on the head unit's PATH. Without an explicit connection or `--auto`,
a single saved sibling enrollment can supply its key and saved IP. Download SSH
rejects changed known host keys; existing car-command SSH policy is unchanged.

## Other tools

| Command | Purpose |
| --- | --- |
| `preview APP --build --out out/preview.png` | Package and preview an app. |
| `preview APP --gif out/preview.gif` | Export an animated preview. |
| `render RECORDING.bin` | Replay a GPU recording. |
| `renderer status` / `renderer build` | Inspect the renderer or rebuild it with Docker. |
| `signals search`, `signals show`, `signals check` | Inspect the local SOME/IP catalog. |
| `dtc import`, `dtc db`, `dtc codes`, `dtc csv`, `dtc tables` | Import fault data. |
| `pack`, `icon`, `icons`, `fonts bake`, `doom build` | Asset and optional build tools. |

Native iDrive menus can be previewed as well as canvas screens. Menu previews use
a host-rendered approximation of the layout, with text, controls, selected rows
and inline canvas graphs; they are not screenshots of BMW's renderer. Native
menus support software PNG/GIF capture; GPU capture and recordings require a
canvas screen. Without an explicit fixture there is no live vehicle feed.

```sh
mgu preview ambient_lighting --out out/preview.png
mgu preview ambient_lighting --out out/presets.png --click HOME_PRESETS --focus PRESET_LIST:1
mgu preview ambient_lighting --out out/preset.png --click HOME_PRESETS --click PRESET_LIST:1
```

`COMPONENT:ROW` selects a zero-based row; a plain component name uses row zero.
`--focus` scrolls to a component/row without pressing it and runs after all
`--click` actions. `--click @back` follows the screen's current Back target.
Preview preferences and app data are isolated in the temporary preview directory.

The preview host and menu renderer are embedded in the CLI executable. Rebuild
the CLI after changing preview source; existing staged app files in `dist/`
can be reused when only the preview host changes.


`mgu help` lists the commands. Renderer matching is the default; use
`kit --renderer stale` to permit an older binary or `kit --renderer none` to omit
it. SVG icons need Chrome/Chromium, font baking needs Pillow, and Doom rebuilds
need Zig and Binaryen. GPU replay needs a compatible renderer for your host.

## Custom apps

- [MGU Lab](apps/mgu_lab/) — the current local test app.
- [Trip Data](apps/trip_data/) - manual trip recordings, recovery, coverage-aware summaries and GPS graphs.
- [Live Data Viewer](apps/live_data_viewer/) - categorized read-only readings, quality, trends and manual snapshots.
- [Ambient Lighting](apps/ambient_lighting/) — saved color-menu presets and driving-mode mappings.

App-specific features, settings and examples belong in each app's own README
inside its folder. Keep this list updated as more custom apps are added.

## Files and output

| Location | Contents |
| --- | --- |
| `cmd/mgu/` | Go CLI and local adapters, extensions and patches. |
| `apps/` | Custom apps and local app assets. |
| `bmw-extracted/` | Private SDK and imported data. |
| `dist/` | Packaged apps and installation kits. |
| `out/` | Previews, downloads and generated tool output. |

Upstream supplies the builder, runtime and installers. MGU Lab receives only its
local runtime patches during packaging. If an upstream change breaks a patch or
tool interface, the wrapper may need an update.
