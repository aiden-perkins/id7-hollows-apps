# Touchscreen Lab

Touchscreen-only research and an isolated MGU app. Research date: 2026-10-29. No controller experiments, controller grab, touchpad subscriptions, vehicle coding, firmware flashing, ISTA execution, packet interception commands, or firewall installation are performed by this app.

## Evidence and confidence

The previous MGU Lab exports did not establish display-touch reception. The Oct. 25 export retains 26 `Input relay: Create relay: INTERNAL_ERROR` result records; the later Oct. 26 20:34 export retains one. The inspected exports and the separately downloaded lab data contain no explicitly labelled display-touch records. Rotation and cumulative counters mean these are retained records, not independent trial counts or loss-free observations. A native-control action does not identify the physical input source.

Three input paths must stay distinct:

1. Native RHMI widgets send semantic actions/focus through `RemoteHmiApplication.notify`. This can prove that a widget action arrived, not that it came from the touchscreen, and supplies no raw x/y stream.
2. The custom renderer can decode and route display packets, supplying down/move/up and logical canvas coordinates for claimed regions.
3. The OEM SOME/IP InputRelay service defines raw display-touch events, but creation, activation and display routing have not yet been demonstrated by the saved experiments.

### Current renderer source

The sibling `../idrive7-apps/kit/renderd/src/touch.c` now implements touchscreen routing. Earlier research encountered an older renderer with only a three-word READY reply; that limitation is not a statement about the current source. Source support, a packaged binary, and the running vehicle daemon are separate facts.

Relevant source files (relative to the repository root):

- `../idrive7-apps/kit/renderd/src/touch.c`: packet decoding, gesture ownership, forwarding, nftables rules and guard.
- `../idrive7-apps/kit/renderd/src/main.c`: claims, visibility gates, coordinate transformation, capability handshake and event delivery.
- `../idrive7-apps/kit/renderd/src/config.c`, `mgu-render.conf`, `prebuilt/idrive7-renderd.service`: configuration and service privileges.
- `../idrive7-apps/kit/runtime/renderd.js`: READY touch word, native capability negotiation, `claim(rects)` and raw `touch(phase,x,y)`.
- `../idrive7-apps/kit/runtime/display.js`: placement, focus gating, automatic claims and semantic page/tab handling.
- `../idrive7-apps/kit/runtime/mgu.js`: `ctx.display`, `ctx.onTap`, `ctx.onTab` and lifecycle.

The implementation's on-car candidate is `vlan73`, source `160.48.199.115`, destination UDP 30567. Its own default diversion uses ports 30572/30573 and table `ip idrive7_render`; the Store and Iterio renderers use different tables/ports. These values are source/configuration evidence, not a packet capture from this car during this investigation.

The decoder recognizes a 16-byte PDU header and identifier `0xB0048002`. Payload byte 37 masked with `0x1f` is the finger count; the first finger's X/Y are big-endian u16 at offsets 38/44; byte 47 bits 4-5 indicate 1 down, 2 move, 3 up. Payload offsets are relative to the payload, not the UDP datagram. This implementation routes one finger, not general multitouch. Its comments attribute the decoder to Hmi8 research; exact iDrive 7 behavior still requires captured evidence.

While a shown app claims an area, the daemon diverts incoming PDUs using nftables. A gesture beginning inside a claim is consumed by that app; other PDUs are forwarded to the HMI. Removing a claim is not necessarily an immediate handover of an in-flight gesture. A guard is intended to remove diversion on daemon death/hang. These are implementation behaviors to check, not a safety certification. The daemon's Wayland surface can still have an empty input region because packet-level routing, not Wayland hit testing, supplies touch.

The downloaded service at `out/downloads/head-unit-5e14f35a4092/files/etc/systemd/system/mgu-renderd.service` uses `DynamicUser=yes`; the current root service supplies privileges for network-rule changes. Inference: a new binary under that old service is not sufficient to enable current routing. The downloaded 75,192-byte daemon has SHA-256 `687e5ae468d837feb47af123bfa594a9222e938d13ce28cebd915d31778e2d1a`. Its feature set was not established from a live handshake.

### OEM InputRelay

Authoritative local contract: `bmw-extracted/reference/someip-interfaces.json`, keys under `.interfaces`, `.datatypes` and `.instanceIDs` for `de.bmw.infotainment.hmi.inputrelay` and `de.bmw.infotainment.hmi.InputRelayTypes`.

- Manager service 64686 (`0xfcae`), interface v1.1. `createInputRelay(relayId: Utf8D)` returns `{InputRelayError, instanceName}`; destroy takes the same ID.
- Relay service 64685 (`0xfcad`), interface v1.1. `onTouchInput` event 32771 (`0x8003`), event group 3, outputs `{touchData}`. `status` has getter and notifier, no setter.
- Status: INACTIVE=0, ACTIVE=1, ERROR=7.
- Error: STATUS_OK=0, INTERNAL_ERROR=1, KEYCODE_UNKNOWN=2, EXISTING_INSTANCE=3, UNKNOWN_INSTANCE=4.
- TouchSource: TOUCH_DISPLAY=2; TOUCH_PAD=1. Only display source is accepted as touchscreen evidence here.
- TouchInputData: `{time: UInt32, proximity: Bool, fingerData: FingerData[], touchSource}`.
- FingerData: `{xCoordinate: UInt16, yCoordinate: UInt16, zCoordinate: UInt16, eventType: UInt8, touchId: UInt8}`.
- Catalog does not define OEM eventType phase semantics, timestamp units, axis orientation, or scaling. Do not copy the renderer's phase meanings into OEM events.

`apps/mgu_lab/services.js` creates IDs of the form `mgu_lab_<base36 timestamp>`. The downloaded native HMI contains `malformed uuid` in its relay-manager diagnostic region. Inference: invalid UUID syntax is a strong candidate for the creation failure, not a proven branch-level diagnosis. This app uses a fresh canonical version-4 UUID and retains it for cleanup. It does not intentionally send malformed IDs.

The native strings associate manager 2 with `RSEL-InputRelayInstances` and manager 3 with `RSER-InputRelayInstances`; inference: these are rear-seat roles. This app uses manager 1 only. The SDK has no established screen/widget-to-relay binding recipe. A generic RHMI UUID property exists, but setting arbitrary UUID properties or undocumented configuration keys is not a demonstrated solution. Successful creation alone is not proof of activation or display delivery.

REA inspected native exports from the downloaded `libde.bmw.infotainment.hmi.inputrelay.stub.someip.so.3.1.12-8.5.2`, including `fireOnTouchInputEvent` and manager create/destroy methods. This generated stub is not the HMI's routing implementation. REA also observed `CidMain_SetCID_Touch`, `CidSwbus_TouchMsgId`, `CidSwbus_TouchProxStatus` and `CidSwbus_TouchProxErrorStatus` in `displaycontrol_hu`; symbol presence is not proof of runtime reachability or permission to invoke them.

The downloaded `usr/bin/%48mi%4Dain3%44` (HmiMain3D) has SHA-256 `e13be1a0e71950454779c9f5f12680ed3860e57f841477ac4a178309fd4b054d`. Read-only string extraction observed:

- `CHmiStubInputRelayManager.cpp`, file offset 0x7cc19f8.
- `malformed uuid`, offset 0x7cc1da7; candidate RIP-relative LEA reference 0x4a18923.
- `Could not allocate instance id for InputRelay!`, offset 0x7cc1a40.
- `Failed to register InputRelay '%s'!`, offset 0x7cc1a70.
- `CHmiInputRelayService.cpp`, offset 0x7cc2440, and `sendTouchInput`.
- `CTouchDataClient.cpp`, offset 0x7f05680; socket/listening diagnostics and `decodeTouchScreenPduData`/`readTouchScreenPduData`.

These strings and byte-reference candidates were not decompiled into a proven create-error control-flow trace. REA's Ghidra was unconfigured; GNU objdump was unavailable. Native export inspection worked. No native target was executed.

### ISTA

Actual installation: `C:/Program Files/BMW/ISPI/TRIC/ISTA`. Its `SQLiteDBs` contains the diagnostic material; the separate `C:/Program Files/ISTA4J29/SQLiteDBs` directory was empty.

In `xmlvalueprimitive_ENGB.sqlite` (observed ENGB version 4.60.12), table `xmlvalueprimitive`, document ID `2000049819779104`, rowid 198877, title **Central information display**:

- Describes equipment-dependent touchscreen availability and APIX connection to the headunit.
- Describes an integrated touch/approach diagnostic functional check: green filled square for approach, red for touch, empty for no detection.
- The check switches the display into diagnostic mode; it is not a passive read.
- Diagnostic communication is through the headunit; internal failures may be recorded there.

Document ID `2000086055606104`, rowid 250645, **Head Unit High (HU-H)**, also describes APIX CID connectivity and touchscreen operation. Exact applicability of these documents/tests to this G15/software was not established.

Candidate modules in `Testmodule`: `ABL_DIT_AT6581_CID.dll`, `CID2`, `CID3`, `CID4`, `CIDTAST`, `CIDVERS`, `ABL_GEN_GS6581_APIXKALIBR.dll`, `ABL_GEN_AG6510_MGU_TESTVERBAU.dll`, `ABL_GEN_AG6512_DTC_MGU.dll`, and `ABL_AUS_RETROFITCIDTOUCH.dll`. Names establish existence only, not applicability, jobs, or the ability to add touch to non-touch hardware. `Ecu/hu_mgu.prg`, `mgu_02_a.prg`, `mgu_02_l.prg` are available diagnostic artifacts. None were executed.

### E-Sys and firmware

`C:/Data/SVT/SVTBak/G015_BU96457.xml` identifies HU_MGU at physical diagnostic address 99 decimal (0x63), HWEL `00005F34_001_001_004`, CAFD `00003E52_008_010_064`, BTLD `00003F36_026_006_023`, and SWFL `00005684_026_006_009` plus other entries. Saved coding is `C:/Data/CAF/CAFD_00003E52_008_010_064.ncd`; a matching backup exists under `NCDBak/BU96457`. Do not substitute unrelated BDC CAFDs.

The matching CAFD in `C:/Data/psdzdata/swe/cafd` is compressed/encrypted/normalized. No touchscreen parameter name, mapping or current FDL value was decoded. No guessed `CID_TOUCH` coding change is justified.

The saved `C:/Data/FA/FABak/G015_BU96457.xml` has G015, time criterion 0319, 6U3 and no 6UY in its SA list. This old saved vehicle order is not current hardware verification.

Programming packages are available under `C:/Program Files/BMW/ISPI/TRIC/ISTA/PSdZ/data_swi/psdzdata/swe`, including `swfl_00005684`/`00005685` 030_016_002 PSDZ Image 1/2 and 2/2, other revisions, and bootloaders. Exact saved 026 revisions were not found by the scoped search. E-Sys' `C:/Data/psdzdata/swe/swfl` was empty. These packages are comparison/research material, not proposed replacements. The downloaded headunit files are a more direct native-runtime source.

## App behavior and operating procedure

Touchscreen Lab starts disarmed. Use it parked. It never asserts that the car is stationary; the operator must verify that. Renderer and OEM relay acquisition are mutually exclusive so experiments do not silently compete for display input.

1. On BMW's stock UI, verify deliberate display taps/drags. In the lab, **Native check** records semantic action receipt only; record your physical-input observation separately.
2. **Start session** to retain a bounded capture. Capability reports, focus, operation replies, source labels, raw OEM display payloads, renderer coordinates, gesture transitions and operator marks are kept separately.
3. Open **Renderer**. Read actual handshake/placement information. If no touch capability is advertised, do not interpret a rendered canvas or native-button response as raw touch support.
4. **Arm renderer** claims only the outlined test area for 60 seconds. The native bar and BMW chrome remain unclaimed. Try corners, horizontal/vertical drags, a stationary hold, then lift. The current router supplies single-finger phases; multi-finger capability is not implied.
5. **Stop probes** releases claims. Opening another page, losing focus/visibility, renderer loss, expiry, and app shutdown also disarm. Returning does not automatically re-arm.
6. Open **OEM relay** and explicitly start it. Inspect UUID, create reply, returned instance, provider availability and INACTIVE/ACTIVE/ERROR separately. Only TOUCH_DISPLAY payloads count; other source payloads are ignored. OEM bytes are shown as raw, not down/move/up.
7. Use **Mark result** to record an operator observation (stock UI unaffected, both interfaces reacted, expected touch missing, etc.). Observations are not automatic proof.
8. **Save / stop** stops probes and writes a session JSON. Storage failures stay visible and retain the unsaved capture in memory for retry. Sessions also end when MAIN loses focus/visibility or after 120 seconds. A new session must be started explicitly.

The app uses a small app-local adapter around the existing display instance's claim hook. It requires the known `ctx.display`/`_claimTabs`/`gpu.claim` contract, forces standard layout, disables automatic page/tab claims for this app, and listens to the same renderer connection used to draw it. It does not open a competing drawing surface or modify the sibling runtime. Unsupported runtime contracts are reported, not worked around with fake events. No continuous raw-touch callback is added to every app.

An empty claim requests release from the daemon; it does not itself remove firewall rules or verify guard recovery. For a layer renderer, touching outside claims may hide the app. Focus loss ends acquisition/capture, deliberately preventing automatic re-arming after a popup.

### Capture files

Files live in the installed app's `data/` directory:

- `touchscreen-session-<UUID>.json`: saved session metadata, exact retained events, summary and loss counters.
- `touchscreen-latest.json`: latest capability/status snapshot and last saved session filename.

Each session is bounded to 12,000 records and 4 MiB of serialized event bytes. Received/retained/dropped counts are explicit; dropped events do not mean the vehicle failed to send them. UI trails/recent rows are bounded separately. Complete retained payloads are in the JSON, not the abbreviated screen text. There is no silent session-file deletion. Sudden process/power loss before a save can lose in-memory events; a shutdown save and periodic summary snapshots are not a durable per-event journal.

Use the existing wrapper download command to retrieve this app's data (see `mgu download --help` for the current command form). Native-button checks, renderer taps and OEM events are not interchangeable and must not be added into a single touchscreen success counter. Preview is a UI-only environment: probes are disabled and synthetic input is not counted as vehicle evidence.

### Remaining vehicle checks

| Check | Required observation |
| --- | --- |
| Running daemon | Service/executable identity and negotiated touch capability; source presence alone is insufficient. |
| Passive packet capture | Actual touch interface/source/port, PDU identifier and bytes while tapping known points. Do this before any new interception setup. |
| Coordinates | Compare known corners/center and horizontal/vertical drags; resolve scaling, orientation and placement. No automatic calibration is claimed. |
| Ownership | Inside-region gesture reaches only the app; outside-region touches still operate stock HMI. Record double activation explicitly. |
| Lifecycle | Hidden app, popup, disconnect, orderly stop and controlled daemon failure leave stock display touch working. Daemon crash/guard checks require a deliberate separate operation. |
| OEM relay | STATUS_OK + returned instance + ACTIVE + TOUCH_DISPLAY payload; creation or availability alone is not reception. |
| Hardware doubt | Check applicable ISTA touch/approach function only as a separate diagnostic operation, since it changes mode. |

## Build and validation status

App ID: `touchscreen_lab`. Build through the existing wrapper, e.g. `go run ./cmd/mgu build touchscreen_lab`; include it in the chosen kit app list using the existing kit command. These are instructions for the operator, not commands executed during implementation.

Repository policy prohibits tests, builds/type checks, lint/format/static-analysis commands and execution of project code unless explicitly allowed. Implementation is source-reviewed only under that policy; no host preview, packet capture, renderer handshake, vehicle session, or on-car acceptance has been performed. Do not treat the presence of this app as end-to-end validation.
