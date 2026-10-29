# Lighting Lab: research and operating guide

Lighting-only research app for the 2019 M850i G15 MGU. Separate from MGU Lab and the everyday Ambient Lighting app. Its job is to collect attributable evidence and exercise catalog-declared runtime controls, not to pretend that every declaration is supported by this vehicle.

Research date: 2026-10-29. Source inspection and previously saved observations; no new car session was performed during this work. This guide is not confirmation that the new app has been built, installed, or validated on the car.

## Scope and boundaries

- Observe legacy ambient color/user-setting/ALEV4 status, the newer ambient profile interface, exterior switch availability, exterior lamp notifications, vehicle lamp status, exact raw standstill, and driving-mode changes.
- Run explicitly armed, stationary, single-control runtime experiments with a persisted before-state and restoration plan.
- Keep provider availability, request dispatch, provider feedback, reported-state match, and operator physical observations separate.
- Preserve unresolved trials across restart. Never automatically replay a command or restore lighting on startup, hide, shutdown, or process exit.
- No diagnostic output overrides, NCD writes, ECU flashing, CAN frame injection, headlamp aiming, automatic sweeps, animations, or speed-interlock bypasses.
- No native BMW menu/profile renaming or arbitrary-RGB claim. App annotations are evidence, not modifications to BMW's stock menu.

The head-unit filesystem download is not a complete vehicle backup. Its manifest reports `status: errors`, one error, and about 30.9 billion received bytes for that run. Mounted virtual filesystems and symlink targets are not equivalent to a full disk image. A local catalog entry is not proof of a live provider, fitted equipment, or permission to actuate it.

## Research findings

### 1. Working legacy ambient path

Interface `de.bmw.infotainment.misc.ComfortFunctionIuK`, service 46354 (`0xB512`), version 1.1, instance `1`:

| Attribute | Catalog operation |
| --- | --- |
| `statusAmbientLightInteriorColour` | Getter 3, notifier 32771 |
| `ambientLightInteriorColour` | Setter 26 |
| `statusAmbientLightInteriorUserSetting` | Getter 4, notifier 32772 |
| `ambientLightInteriorUserSetting` | Setter 27; observation only in this lab |
| `statusALEV4` | Getter 53, notifier 32800 |

The Oct. 26 saved MGU Lab results contain successful preset readbacks. Examples are `out/mgu-lab-20261026-202547-a08b8b3e/mgu_lab-events.jsonl.1`, lines 646, 651 and 665. The saved presets associate A/B/C with factory menus 12/5/8. These are numbered selectors, not confirmed physical color names.

The earlier Oct. 25 failures (`controlMenuAmbientePanoramicRoofInteriorLighting: Not a string`) were local enum-serialization failures. The later implementation uses enum names such as `FARBAUSWAHL_12`, and later readbacks succeeded. Do not treat the early failure as the final capability result.

The color command contains:

| Command member | Wire type/default | Research meaning |
| --- | --- | --- |
| `controlHueInteriorLighting` | UInt16 / 4095 | Overall hue candidate; not established as degrees, RGB, or a linear color wheel |
| `controlMenuAmbientePanoramicRoofInteriorLighting` | Enum / `SIGNAL_UNBEFUELLT` | Off, factory choices 1-12, individual mode, native FES coupling |
| `controlHueValueLayer1IndividualGroup` | UInt8 / 255 | Individual-group selector candidate |
| `controlHueValueLayer2IndividualGroup` | UInt8 / 255 | Individual-group selector candidate |
| `controlHueValueLayer3IndividualGroup` | UInt8 / 255 | Individual-group selector candidate |
| `controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting` | UInt8 / 255 | Brightness offset candidate; no percent scale established |
| `controlModeAmbientePanoramicRoofInteriorLighting` | Enum / `SIGNAL_UNBEFUELLT` | Ambient mode on/off candidate |
| `controlDynamicInteriorLighting` | Enum / `SIGNAL_UNBEFUELLT` | Dynamic interior mode candidate |
| `controlDynamicAmbienteInteriorLighting` | Enum / `SIGNAL_UNBEFUELLT` | Dynamic ambient mode candidate |

Menu identities include `AMBIENTEBELEUCHTUNG_AUS=0`, `FARBAUSWAHL_1..12`, `INDIVIDUALMODUS=13`, `KOPPLUNG_AN_FES=14`, and `SIGNAL_UNBEFUELLT=15`. The on/off enums are `AUS`, `EIN`, and `SIGNAL_UNBEFUELLT`. Native FES coupling is a useful lead, not demonstrated mode-dependent behavior on this car.

The later saved raw state was hue 0, factory menu 8, layer 1 value 2, layers 2/3 value 255, brightness offset 254, ambient mode on, dynamic interior off, dynamic ambient on. This does not identify the color of layer 1, establish that three layers are RGB channels, or prove that layers correspond to doors/dashboard/footwell.

The lab's exploratory numeric editor permits hue 0-4094 and UInt8 candidates 0-253. These are bounded raw experiments, not calibrated physical scales. Values 254/255 are withheld for the UInt8 controls; the saved brightness value 254 is not assigned an invented meaning. A field without a valid original value cannot be written. Layers 2/3 reported as 255 therefore remain blocked unless a later valid original is observed.

Separate, explicitly named **Individual mode + hue/layer** experiments send `INDIVIDUALMODUS` and one raw value together in a single legacy setter. This tests whether individual mode is a prerequisite without leaving one unresolved trial to start another. Both the reported menu and raw value must match; the original menu and target field must be valid, and restoration returns the known original legacy state. Ordinary hue/layer experiments do not silently change the menu.

Partial legacy commands use the catalog's unfilled defaults for other members, following the existing app pattern. This is a research assumption, not a universal guarantee that every provider leaves every unfilled field unchanged. Complete raw before/after evidence is retained. Restoration replays only known valid legacy color members and checks their reported values; unknown/unfilled values are not converted into guessed restore commands.

### 2. Newer profile interface

`de.bmw.body.interiorillumination.AmbientLight`, service 45214 (`0xB09E`), version 1.0, instance `1`, declares:

- current and startup profile selection;
- ambient activation and brightness;
- contour-line brightness;
- dimming while driving at night;
- several event/staging controls.

`currentInteriorLightProfile` uses getter 29, setter 6, notifier 32773. The enum has `NONE`, `COLOUR1..50`, and `MODE0..20`; it contains no descriptive color names or RGB triplets. `COLOUR8` is not established as the same thing as legacy `FARBAUSWAHL_8`.

No profile provider announcement or payload was captured in the inspected saved MGU Lab session. Lighting Lab observes provider availability and offers only the selected declared profile/activation/brightness/night-dimming experiments when the actual provider and a restorable original are available. It does not assume that this richer interface supersedes the working legacy backend on this vehicle. Staging/alert controls are outside this lab's write set.

### 3. Exterior control: the previous attempts stopped before dispatch

`de.bmw.body.drivinglight.LightswitchOperation`, service 20492 (`0x500C`), version 1.0, instance `1`, is declared in both the reference catalog and the downloaded MGU catalog. The deployed MGU Lab descriptor contains the correct service/version/instance, the six methods, and both fog setters.

| Operation | Catalog method/field |
| --- | --- |
| Driving lights / low beam | `pushButtonDrivingLight` |
| Automatic lighting | `pushButtonAuto` |
| Position lights | `pushButtonPositionLight` |
| Left/right parking | `pushButtonParkinglightLeft`, `pushButtonParkinglightRight` |
| Lights off | `pushButtonLightOff` |
| Front/rear fog | Boolean `foglightFront`, `foglightRear` setters |

The six button methods are fire-and-forget, without return values. Successful local dispatch is not a positive body-ECU acknowledgment. The feedback event `showLightswitchOperationFeedback` contains button identity, `successful`, `additonalLightswitchInformation` (catalog spelling), and a raw speed-threshold field. Availability must explicitly report `OPERABLE`; missing availability is not permission.

The Oct. 26 exterior attempts failed at `apps/mgu_lab/vehicle_lab.js:255` before a command was sent. Recorded front-fog, off, position and auto failures are in the later rotated events at lines 616, 621, 639, 649 and 657. This proves a missing/unseen provider in that session, not ECU rejection of an actual lamp request.

No inspected vsomeip policy/static route established a provider for `0x500C`. Wrong implementation/generation, operating-state-dependent offers, discovery/routing and authorization remain distinct possibilities. The catalog maps this service to instance 1; random instance-number probing is not the first research step.

### 4. Exterior observation is not an actuation API

`de.bmw.body.Light`, service 21810 (`0x5532`), version 1.0, instance `1`, has no declared methods or setters. `LowBeam` has a getter/notifier; other lamp members are notifications. A payload member named `controlFunction...` is still only an observed signal when the interface has no setter.

- `LampExterior`: DRL, parking/position, brake, welcome/goodbye and other body-light signals.
- `LampExterior2`: main-beam, separate dipped-beam and related headlamp request signals; included in Lighting Lab observation.
- `statusOperationLightExterior`: stock switch status/events.
- `IndicatorSteeringColumnComplete`: stalk-related observations.
- Vehicle `statusLightStatus`: reported low/high/position/fog state.

These are reported/requested states, not independent electrical or optical measurements. Position-light mode is not independent tail-lamp/license-plate-lamp control. This catalog does not supply the requested independent high-beam, DRL, tail-lamp or license-plate setters, so the lab does not expose fake write buttons for them.

### 5. Native services and discovery leads

With `D = out/downloads/head-unit-5e14f35a4092/files`:

- `D/lib/systemd/system/signalgateway.service` starts `/usr/bin/SignalGateway` as `sin_sgw` after vsomeip and coding services.
- `D/var/lib/opkg/info/signalgateway.control` explicitly describes a CAN-to-SOME/IP gateway.
- Its inspected offer policy under `D/etc/vsomeip/10004_10004/` lists legacy `0xB5xx` services, not `0x500C`. This does not establish it as the exterior-control provider.
- Autosar-on-Linux is another networking lead, but its inspected policy requests `0x5532`; it was not established as the provider.
- `D/etc/vsomeip/vsomeip_std.json` enables dynamic discovery on UDP 30490, and sends vsomeip logging to DLT rather than ordinary log files.
- `D/etc/vsomeip/vsomeip_security.json` enables credential checking. Root filesystem access, a permitted request, and an observed service offer are different facts.

The lab can report proxy availability and field errors. It is not a packet sniffer or a decoder of native DLT traffic, and it cannot conclusively diagnose why an unoffered service is absent.

### 6. Stock names and native UI assets

Naming a preset in the everyday Ambient Lighting app is app-local storage. Neither examined vehicle lighting API exposes a setter for BMW's stock menu labels.

The strongest native assets are:

```text
D/mnt/dataro/dataro1/hmi/app/hmimycar/hmimycarlight.pba
D/mnt/dataro/dataro1/hmi/app/hmimappings/mappings.pbm
D/mnt/dataro/dataro1/hmi/bmw/db/text.db
```

The 5.8 KB compiled lighting resource has readable color-picker/radio-button/brightness-slider template names, but its text and bindings use encoded IDs. The stock text store was not established as an ordinary SQLite database. Format-aware offline decoding of the small lighting resource, its mappings and text IDs is the next native-menu reverse-engineering target.

Screen/widget color registries are not proof of cabin LED palette values; vehicle car-paint registries and G15 visualization models are also not lamp control definitions. No exact stock label-to-selector-to-physical-RGB mapping was recovered. No resource files were patched.

### 7. ISTA, E-Sys, coding and diagnostics

Actual installations examined:

```text
C:/Program Files/BMW/ISPI/TRIC/ISTA/
C:/Program Files/BMW/ISPI/TRIC/ISTA/PSdZ/data_swi/psdzdata/
C:/EC-Apps/ESG/E-Sys/
C:/Data/CAF/
```

The saved G015 inventory identifies BDC_BODY3 (diagnostic address 0x40), BDC_GW3 (0x10), two FLM2 entries (0x43/0x44), and HU_MGU (0x63). This is an older saved inventory, not a current identification read. Physical left/right FLM attribution must be confirmed rather than inferred from address alone.

Relevant installed diagnostic candidates include `bdc_g05.prg`, `bdc_g11.prg`, `bdc.prg`, `flm02_l/r.prg`, `flm02x_l/r.prg`, and `flm2_1_l/r.prg`. Relevant test modules include:

```text
ABL_DIT_AT6300_G05_IL_AMBIENTE_INNENBEL.dll
ABL_DIT_AT6300_G05_IL_AMB_INNENBEL_RD.dll
ABL_DIT_AT6300_G05_BEL.dll
ABL_DIT_AT6300_FLM02_SCHW.dll
ABL_DIT_AT6300_FLM02X_SCHW.dll
```

These filenames identify research targets, not verified matching jobs or callable actuation signatures. No validated individual-lamp request/release sequence was recovered. Readable `EcuFunctions/1243555.xml` declares `STATUS_LAMPEN_DIGITAL`; `1243548.xml` declares `STATUS_LAMPEN_KURZSCHLUSS`. Those are status/short-circuit reads, not lamp setters, and their match to this current G015 variant remains unverified.

The upstream `kit/runtime/diag.js` implements UDS transport through `com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu`. Transport code is not ECU-specific diagnostic semantics, session/security permission, or a verified output-control/release operation. Lighting Lab intentionally does not import this transport or send diagnostic requests.

Matching CAFD/NCD filename candidates exist for:

- BDC: `000017BD.203_068_172`, `00001DF8.016_067_022`, `000044ED.008_034_216`, `00004694.016_055_031`, `000051DD.017_072_004`, `00005665.013_072_003`, `00007083.029_060_008`.
- FLM: `000043AF.015_192_000`.
- HU: `00003E52.008_010_064`.

The examined CAFDs declare compressed/encrypted content. No exact palette parameter names, RGB byte offsets, scaling or channel mapping were decoded. Recent working NCDs and older backup candidates exist; modification time is not proof of a current untouched read. The HU working/backup file sizes differ. One CAFD filename shared by both FLMs does not constitute separate original backups for both physical ECUs.

The full dataset marker is SDP 4.60.11. Some firmware IDs exist only at revisions different from the historical inventory. Full PSdZData does not mean every historical revision is present. E-Sys's saved `Path.PsdzHome` points at `C:/Data`; its separate SWFL directory was empty in the inspection, unlike the full ISTA dataset. No paths/settings were changed.

E-Sys coding is persistent configuration, not an appropriate per-frame animation channel. If the desired colors only exist in coded BDC palettes, arbitrary colors without coding require another proven runtime mechanism or deeper ECU work. That outcome is not yet established.

## Operating sequence

### Start with observation

1. Secure the car stationary, with appropriate stable power arrangements. Do not run the everyday Ambient Lighting automation or MGU Lab's follow-mode writer concurrently.
2. Open Lighting Lab and its observation screen. Confirm which services are available; inspect field freshness and individual read errors. Waiting/absent provider states are meaningful results.
3. Record the original stock selections. Manually change one BMW stock color/brightness setting at a time and add observation annotations. Snapshot useful transitions. Record physical zones/colors yourself rather than labeling raw values as physical colors automatically.
4. Observe normal exterior switches with no app writes. Compare `LampExterior`, `LampExterior2`, `LowBeam`, switch status and physical lamps. Do not treat a reported request as optical confirmation.
5. Capture a fresh full baseline before a write experiment. A baseline is evidence, not permission to replay every captured value as a setter.

### Run one supported experiment

1. Pick a control. Read its current raw value, provider status and help. An absent provider, missing original, reserved value or missing exterior `OPERABLE` status blocks the experiment.
2. Choose one candidate value. Numeric editors are raw and intentionally do not label values as percent/degrees/RGB. There is no automatic range sweep. Use an explicitly named **Individual mode + ...** experiment to test that two-field hypothesis; ordinary raw controls leave the menu unfilled. The compound experiment is not evidence that individual mode is supported or required.
3. Arm writes explicitly. Arming expires after a short interval, is not saved, and is not available in preview. The app requires a fresh exact raw vehicle speed of zero; it does not use a guessed speed scale to admit movement.
4. Apply. Before dispatch the app persists the trial, original state and restoration plan. Refreshes and guard checks must still pass immediately before the write.
5. Inspect separate dispatch/feedback/readback results. Do not operate the stock switch at the same time: exterior feedback has no unique per-request transaction token to distinguish a concurrent human operation.
6. Record physical result as yes, no, or uncertain. A yes annotation is an operator observation, not an electrical measurement.
7. Re-arm if necessary and restore the trial. Verify raw state and physical behavior before starting another trial. Legacy restoration covers known valid color members; unsupported/unfilled members are never guessed. Exterior switch restoration does not establish that every physical lamp or unknown side effect was restored.

A trial remains unresolved until restoration succeeds. Failed dispatch, timeout or missing confirmation is not evidence that nothing happened. On a restart, inspect the retained trial and re-establish current state before any explicit restoration. Never blindly replay an old plan after coding, ECU/software changes, another app's writes or a changed vehicle context. Keep the original evidence and use normal stock controls to recover if uncertain.

Hiding/closing the app, a stale/nonzero speed, provider loss, or an evidence error disarms writes. Disarming stops further dispatch; it does not undo a command already delivered. Process termination/power loss cannot guarantee restoration. Always verify the car's ordinary switch behavior after experiments.

### Record enough for the next research pass

Useful captures include provider availability/failures, complete raw baseline and snapshot, selected control and candidate, request/feedback/readback timeline, physical result, annotations, and the retained unresolved/restored trial record. Download the entire app data rather than just a screenshot. Logs are bounded/sampled and are not a loss-free bus trace.

| App data file | Contents |
| --- | --- |
| `lighting-lab-baseline.json` | Explicitly captured complete raw baseline |
| `lighting-lab-trial.json` | Pending/unresolved trial and last completed trial, with original state and restore plan |
| `lighting-lab-snapshot.json` | Latest explicit evidence snapshot, including readings, providers, trial and notes |
| `lighting-lab-events.jsonl` and `.1` | Bounded event timeline, rotating at approximately 512 KiB per file |

The journal is saved before dispatch and records uncertain outcomes instead of silently clearing them. Evidence writes are synchronous/durable at dispatch boundaries; a storage error blocks further mutation. These files are not a replacement for original ECU coding backups or a guaranteed power-loss-safe vehicle restore.

### Movement and diagnostics remain separate

No result from this lab establishes control above 15 mph. The exterior feedback enum includes speed-dependent restrictions, but the threshold's physical units and vehicle behavior are not established. Do not remove the standstill guard to work around an absent provider or a rejection. Later movement validation requires established stationary control, authority/restoration semantics and a controlled environment, not exploratory public-road use.

For a future diagnostic backend, first identify the exact current ECU variant and recover its supported operation, session/security conditions, bounded duration and explicit return-to-normal-control mechanism. No output-control experiment should begin when its release mechanism is unknown. Initialization, coding, auto-addressing and headlamp calibration are not substitutes for reversible output testing.

## Packaging

The local wrapper registers `lighting_lab` in both its Go selector and Python source adapter. Rebuild the wrapper executable before using that registration; an older `out/mgu.exe` does not automatically gain it. The commands below are instructions, not commands run during development:

```powershell
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu
./out/mgu.exe build lighting_lab
./out/mgu.exe kit lighting_lab
./out/mgu.exe --auto --key "./id_rsa" car install
./out/mgu.exe --auto --key "./id_rsa" download lighting_lab
```

`kit lighting_lab` already builds the app; a separate `build` first is optional. Installation changes the car; only do it deliberately. This app uses native menus and the existing kit runtime; it does not need a new renderer implementation. Generated packages, car installation, previews and hardware behavior remain unverified until explicitly allowed and exercised.
