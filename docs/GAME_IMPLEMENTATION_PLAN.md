# Game implementation plan

Updated 2026-11-11. Scope: all nine games below as separate installable iDrive 7 apps, with single-player, offline gameplay and presentation/behavior as close as practical to a specific original release.

## Current status and targets

Seven standalone JavaScript apps now exist, each with an icon, controller/touch controls, settings, pause/resume and versioned saves. They reproduce the core mechanics with custom dark dashboard graphics; they are not faithful visual ports. Source review found close coverage of the earlier standalone plan, but runtime behavior and head-unit performance remain unverified. Super Mario Bros. and Pokemon remain planned apps, with dedicated implementation sections below.

| Game / app | Implemented in source | Next fidelity target |
| --- | --- | --- |
| [Tetris](../apps/tetris/app.json) | Seven-piece bag, custom wall kicks, next/hold/ghost, drops, scoring, gravity and saved lock timing. | Choose a release, such as NES or Game Boy; emulate that version for maximum accuracy. Current rotation/scoring are not a specific release's rules. |
| [Minesweeper](../apps/minesweeper/app.json) | Three presets, safe first reveal, iterative flood fill, cursor, reveal/flag/chord modes and active-play timer. | Recreate classic Windows presentation: gray beveled cells, familiar number colors, smiley reset and digital counters. Windows emulation is unnecessary for this target. |
| [Pong](../apps/pong/app.json) | Single-player CPU opponent, swept paddle collisions, configurable sensitivity, serves and saved matches. | Match original arcade court, scoring and movement; identify the CPU opponent as a single-player adaptation. |
| [Breakout](../apps/breakout/app.json) | Six custom layouts, durable bricks, lives, levels, bounded collision substeps and saved ball state. | Match original arcade presentation, brick arrangement and rules rather than the current custom levels. |
| [Snake](../apps/snake/app.json) | Queued turns, reversal rejection, free-cell food, difficulty/progression, solid/wrapping edges and saved randomizer. | Choose a classic version, such as Nokia Snake, and match its graphics, board and behavior. |
| [2048](../apps/game_2048/app.json) | Correct merge/spawn rules, win/continue, animations with one queued move, undo and move-based saves. | Adapt the [original MIT-licensed JavaScript source](https://github.com/gabrielecirulli/2048) and match its beige palette, typography, layout and animation. |
| [Pac-Man](../apps/pacman/app.json) | Three original wide mazes, four ghost targets, scatter/chase/frightened modes, tunnels, lives and saved timers. | Replace the recreation with a suitable arcade emulator and the original ROM set for strongest fidelity. Preserve the original maze, sprites, timing and screen proportions. |
| [Super Mario Bros.](#super-mario-bros-planned-app) | Planned; not implemented. | Emulate the original NES release using a user-supplied ROM. |
| [Pokemon](#pokemon-planned-app) | Planned; not implemented. | Emulate selected Game Boy/Game Boy Color titles using user-supplied ROMs; no GBA or link features initially. |

## Reuse Doom's approach where appropriate

The upstream [Doom app](https://github.com/cauliflowermossgrape/idrive7-apps/tree/main/apps/doom) runs doomgeneric compiled to WebAssembly, with a Node 8 JavaScript host for input, filesystem access, timing and saves. It displays the engine's rendered pixels through the existing renderer and keeps the game fullscreen. It bundles Freedoom artwork/levels, not the original commercial Doom data.

Reuse that pattern for a source port or emulator: run the existing engine/core, feed it inputs, display its frames and serialize its state. Doom's engine itself cannot load these other games. A browser WASM build is not automatically compatible with Node 8; each core needs a compatible build and host integration. Current no-build restrictions still apply, so a new core needs a suitable prebuilt artifact or separately authorized compilation before it can be delivered as working.

- **Pac-Man:** investigate a core supporting the exact arcade ROM set. [MAME documents Pac-Man-specific builds](https://docs.mamedev.org/initialsetup/compilingmame.html); compatibility and performance here are not established. [pacman.c](https://github.com/floooh/pacman.c) is an alternative recreation, not original arcade emulation.
- **NES / GB / GBC:** candidates include [FCEUmm](https://github.com/libretro/libretro-fceumm), [binjgb](https://github.com/binji/binjgb) and [Gambatte](https://github.com/libretro/gambatte-libretro). Select and pin a core after checking supported games, host requirements and licensing.
- **Simpler games:** faithful JavaScript presentation/rules are practical for Minesweeper, Snake, Pong and Breakout. Using WebAssembly alone does not make a recreation more accurate.

Preserve the chosen release's layout, aspect ratio, colors, animation and rules. Use nearest-neighbor scaling for pixel graphics and borders where needed; avoid stretching games to widescreen or surrounding them with dashboard cards. Keep app settings/navigation outside the original game image, with optional controls in spare space. Label recreations and changed control/game modes accurately.

## Super Mario Bros. (planned app)

Target the original NES game using a user-supplied ROM and an existing NES core, such as [FCEUmm](https://github.com/libretro/libretro-fceumm), rather than recreating Mario's engine.

- **Core/frontend:** adapt initialization, ROM loading, frame execution, video/audio callbacks, input and state serialization to Node 8-compatible WASM. Document supported ROM/mappers and run at the selected region's cadence independently of redraws.
- **Presentation:** display the core's original framebuffer with nearest-neighbor scaling and the intended aspect ratio; retain original graphics, levels, animation and behavior.
- **Controls:** simultaneous left/right, A (jump) and B (run/fire), plus Start/Select. A gamepad path is preferred; multitouch needs integration. Any knob-only or auto-run option must be identified as changed controls.
- **Progress:** provide ROM selection, reset, pause/resume, mapping settings and save states keyed by ROM hash, core version and state format. Keep cartridge RAM separate where applicable.
- **Remaining work:** core hosting, compatible artifact/packaging, audio and simultaneous input are not implemented. A native x86-64 helper is an alternative if WASM is unsuitable, with its own dependency/packaging path.

## Pokemon (planned app)

Target Game Boy/Game Boy Color releases: start with one title family, such as Red/Blue/Yellow, then explicitly extend to Gold/Silver/Crystal. Use user-supplied ROMs and a core such as [binjgb](https://github.com/binji/binjgb) or [Gambatte](https://github.com/libretro/gambatte-libretro).

- **Core/frontend:** load ROMs, set buttons, execute frames, receive original video/audio, serialize state and flush cartridge storage. Reuse the NES frontend services where practical; document supported cartridges/memory controllers.
- **Presentation/controls:** preserve original pixel graphics and aspect ratio. Provide directions, A, a separate accessible B action, Start and Select; keep extra app controls outside the game image.
- **Durable saves:** battery-backed RAM is the primary progress record; save states are a separate resume convenience. Isolate both by ROM hash, flush changed RAM periodically/on pause and support import/export. Never overwrite a battery save with an incompatible state.
- **Clock:** preserve cartridge RTC state across pauses/restarts with an explicit elapsed-time policy that tolerates wall-clock corrections; this is required for supported clock-based titles.
- **Remaining work:** core integration, audio, cartridge/RTC persistence and packaging are not implemented. Trading/link cable, multiplayer, cheats, fast-forward, Game Boy Advance and later generations remain outside the initial scope.

## Shared work and remaining requirements

- **Shell:** existing lifecycle, input and storage patterns are copied per app. Extract reusable helpers with explicit package copying; installed apps cannot depend on sibling source directories.
- **Lifecycle:** retain Play/Continue, New Game and settings; pause/save on BACK, MENU, lost focus, calls/popups, closure and vehicle movement with parked-only enabled. Release capture, neutralize held input and require explicit resume.
- **Timing:** keep simulation/core cadence separate from drawing, bound catch-up and discard paused time. Preserve original timing where fidelity requires it; resume moving games with a ready pause.
- **Controls:** retain knob/tilt mappings and explicit actions. Current touch input uses buttons/court taps, not swipe/drag. NES Mario needs simultaneous direction and A/B; provide Start/Select too. External gamepads and touchscreen multitouch need separate integration.
- **Saves:** retain versioned replacement writes/backups and checkpoint/pause saves in writable app data. For emulation, associate states with ROM hash, core version and state-format version; keep battery RAM separate. Preserve GB/GBC RTC state with an explicit elapsed-time policy and provide save import/export.
- **Game files:** provide offline ROM import/selection, size/format bounds and actionable errors. Review engine and asset permissions separately; open-source engines do not grant rights to bundle commercial ROMs or artwork.
- **Audio:** all seven apps are silent, and the inspected Doom adapter provides no general audio bridge. Add sample output, buffering, gain and interruption handling; video-only emulation is an intermediate milestone.

## Packaging and next steps

Keep implementation in this wrapper repository under `apps/<id>/`; do not modify the sibling upstream checkout. Target the existing Node 8 runtime and accelerated renderer; the PNG software fallback is not the performance target for action games.

[`mgu-repo.json`](../mgu-repo.json) already discovers all seven apps through `apps/*/app.json`. Its renderer/inputgate requirements and [`store_build.py`](../cmd/mgu/tools/store_build.py) need no change for the current plain JavaScript games. The local [runtime overlay](../cmd/mgu/patches/runtime.json) forwards explicitly captured controller input to games.

Future cores/assets may need changes to the pinned Store inputs, extraction rules and [`upstream.py`](../cmd/mgu/tools/upstream.py) packaging. Pin source/tool versions, include required license/source notices, package every core/asset explicitly and allow enough disk quota for game files and saves.

Next: choose exact reference releases; update lightweight games to their original presentation/rules; integrate arcade Pac-Man and the NES/GB/GBC frontends with audio and reliable saves. Shared-shell extraction can accompany that work. No new emulator or fidelity update is complete yet.
