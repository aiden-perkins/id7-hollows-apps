# xDrive Lab — findings, research developments and operating guide

Dedicated native-menu MGU research app for AWD/RWD feasibility on the owner's 2019 M850i xDrive G15. Separate from MGU Lab, Lighting Lab and the everyday telemetry apps. Research date: 2026-10-29.

The owner explicitly selected **gated native MDrive requests** in addition to observation and guided tests. This is experimental tooling, not a validated xDrive conversion, a factory M xDrive retrofit, or permission to switch drivetrain modes while driving. A catalog declaration, offered provider, successful serialization, transport return, reported mode and physical torque distribution are different evidence levels.

## What is implemented

- Fourteen exact service/instance definitions and 42 observable fields: MDrive actual/configuration/display state; FES and DSC selection; torque-split candidate; four wheel RPMs/qualifiers; XView wheel-moment display; vehicle motion/yaw/acceleration; selector/gear; engine/pedal/brake/temperature/battery; stabilization; steering; Check Control display; software-update session; TASU status.
- Provider discovery state, per-field getter/subscription errors, raw payloads, catalog schemas, separate getter/notification/event counts, observed monotonic sample gaps and freshness. Subscription success is not a received sample; notification-only fields have no fabricated getter.
- Continuous recording of **every callback delivered to this app**, independent of the selected screen and visibility. This is not a guarantee that upstream vehicle traffic is lossless. Retention, queue drops, errors and rotations are explicit; sample gaps are not packet-loss measurements.
- Manual, serialized read-only diagnostics: LMV `0x19 / 22 DB32`, four-ECU `22 F150` identities, `19 02 FF` fault-memory reads, and one UInt16 DID at one of four researched ECU addresses. Optional DB32 polling starts OFF and is at most one request per second after completion. No scan of DID ranges.
- Complete diagnostic request parameters, transport verdict, raw TASU envelope, UDS bytes, NRC, latency, request identity and correlation limitations. Unsupported envelopes remain raw evidence rather than guessed successful replies.
- Historical baseline, snapshots, retained raw-journal exports, operator markers/outcomes and seven staged research workflows.
- Two catalog-declared native MDrive request backends, three explicit mode candidates, target-bound arming, final queued-dispatch checks, durable trials and separately armed original-mode restoration.
- Restart recovery retains unresolved trials but never replays a request or turns historical samples into current safety input. There is no automatic restore or automatic AWD engagement after a fault, hide, shutdown or crash.

### Deliberately absent vehicle operations

No diagnostic clutch override, VIP AWD-off write, arbitrary UDS service, diagnostic session/security unlock, adaptation/calibration reset, fault clearing, NCD coding, ECU flashing, M8 cross-flash, CAN injection, speed spoofing, FES/DSC writer, automated sweep or automatic request retry is included.

The ISTA operation is exposed as a **technician-operated protocol and evidence markers**, not a nonfunctional app button. Its exact vehicle-side request and supported two-way restoration contract remain unresolved. The app does not invent differential-lock or transfer-case-temperature DIDs. A documented DID can be examined with the single-DID reader, but raw bytes alone do not supply its semantics.

## Research findings

### 1. Vehicle hardware: M Sport differential is real, but separate from AWD coupling

The local vehicle reference records a 2019 M850i G15, N63TU3, Stage 2/E50 and owner-reported 700–750 wheel horsepower. Tuned peak torque and mechanical safety margins have not been established. The saved FA has build criterion `0319` and option `2T4`; it is a historical configuration, not a new read of installed hardware.

BMW's June 2018 G15 Powertrain/Chassis training material identifies:

- ATC13-1 transfer case, first used in G12, including its Efficiency Mode;
- regulated HAG 225ALS rear differential, marketed as the M Sport differential;
- DSCi as the calculating/coordination system for rear locking, forwarding requests to GHAS over FlexRay;
- a distinction between the G15 HAG 225ALS and the F90 HAG 225M, including different maximum locking torques in the training comparison.

The transfer-case clutch couples front drive. The rear differential clutch regulates locking between the rear wheels. Releasing the former is the relevant principle for removing commanded front-drive torque; possessing the latter does not provide factory M xDrive mode software. The listed rear locking torque is not a certified engine-torque limit or approval for this tune.

Source: [BMW G15 training material, printed pp. 25–29 and 36–40](https://gershon.ucoz.com/BMW/2018_bmw_8_series_g15_powertrainchassis.pdf). It is BMW-authored training material hosted by a third party, not a complete current repair instruction. Local context: `../../BMW_M850I_LIMITS.md`.

BMW describes M8 M xDrive as 4WD, 4WD Sport and **2WD with DSC off**. Reproducing factory M coordination is broader than holding a front-drive clutch open. Normal FES Sport is not equivalent to 4WD Sport, and DSC off alone is not RWD.

Sources: [BMW M8 description](https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m8-gran-coupe-f93.html), [BMW M850i description](https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m850i-xdrive-coupe-g15.html).

### 2. Strongest reversible lead: BMW's temporary AWD-off procedure

BMW SI B27 02 20, revision 5 dated 2025-06-06, explicitly lists G15 and provides:

```text
Vehicle Management
  > Troubleshooting
  > Function structure
  > Drive
  > Transfer box
  > Current fault patterns
  > Temporary deactivation of all-wheel-drive system

ABL-DIT-AW2710_TDEAKAWD11
```

The bulletin says to follow the guided procedure for diagnosis with the transfer-case clutch deactivated, that an xDrive warning appears, and that cycling the ignition reactivates the VTG. It says unplugging the VTG module is no longer necessary or approved for diagnosing the covered complaint. This is not a persistent warning-free RWD configuration or approval for arbitrary mode switching.

Primary source: [BMW bulletin hosted by NHTSA, page 2](https://static.nhtsa.gov/odi/tsbs/2025/MC-11019579-0001.pdf).

Reverse Engineer Anything inspected the matching installed file without executing it:

```text
C:/Program Files/BMW/ISPI/TRIC/ISTA/Testmodule/
  ABL_DIT_AW2710_TDEAKAWD11.dll
```

Recovered method `Allradfunktion_deaktivieren` contains DSC/VIP branches referring to `STEUERN`, `LMV_FUNKTION`, `STEUERN_LMV_FUNKTION_QDM` and `STAT_LMV_FUNKTION_AKTIV`. A `VIP_G05` branch is especially relevant because that diagnostic family was identified in the saved vehicle log. This is evidence of shipped diagnostic code and semantic job names, **not** an executed command, recovered raw UDS payload or proven acceptance by this car.

REA parent Evidence ID:

```text
ev_f6157c5b3ba3595534220bb6737832e76d9b34da9da29cbfd40538258e0d6cc1
```

Other inspected modules:

- `ABL_GEN_AG2710_FSPRUEF_VTGG11.dll`: fault-reading definitions, including `FS_LESEN_DETAIL`.
- `ABL_DIT_AT3450_IB05_VTG.dll`: diagnostic fault-family routing, not a mode-switch API.
- `ABL_DIT_AT2710_LKUPPL_VTGG11.dll`: service operations including calibration data and `LMV_SOLLMOMENT_SETZEN` with bounded execution time. These are not enabled in this app; repeated service overrides are not a validated persistent mode.
- `ABL_DIT_AT2710_STEU_VTGG11.dll`: controller/fault diagnostic workflow.

The latter modules had some malformed terminal-flag observations in REA's user-string metadata. Readable strings were retained, but coverage is not silently promoted to complete runtime equivalence. No assembly was loaded as executable code.

The earlier REA session exported 18 records to a temporary machine-local bundle (`bmw-xdrive-rea-b28c33bf20.json`). That path is not a durable repo dependency; preserve a private copy if further reverse-engineering needs the original Evidence. The session was closed.

### 3. Two genuine native MDrive request candidates

Source: `../../bmw-extracted/reference/someip-interfaces.json`, interface `de.bmw.infotainment.misc.MDrive`, service **46367 / 0xB51F**, version **1.3**, instance **1**.

| Backend | Setter ID | Target member | Standard | Alternative | RWD |
| --- | ---: | --- | --- | --- | --- |
| `mSystem` | 4 | `controlAllWheelSetup` | `_4WD_STANDARD = 0` | `_4WD_ALTERNATIV = 1` | `_2WD = 2` |
| `operationMSystemsMDrive` | 19 | `operationMSystemsAWMDrive` | `AWDSTANDARD = 1` | `AWDALTERNATIV = 2` | `RWD = 4` |

They are different schemas/wire encodings. The alternative is deliberately called a **Sport candidate**, not demonstrated factory 4WD Sport behavior.

Actual feedback is `statusMSystem.statusAllWheelSetup`, with `qualifierFunctionAllWheel`: ready 2 or active 10; unavailable/fault 6, interface unavailable 14, unfilled 15. Actual standard/alternative/2WD values are 0/1/2.

`controlDisplayMSystemsMDrive.controlDisplayMSystemsAWMDrive` distinguishes operable standard/alternative/RWD 1/2/4 from `*_NICHT_BEDIENBAR` states 9/10/12, unavailable 13, fault 14 and unfilled 15. Saved M configuration fields are observed but never substituted for actual mode.

Each request wrapper also includes unrelated engine, steering, suspension, brake, traction, drift and other members. `domain.js` builds the complete wrapper using each member's explicit `KEINE_AENDERUNG`, `KEINE_BEDIENUNG` or `NO_CHANGE`; where none exists, it uses the exact catalog unfilled value. It never zero-fills the entire request, confirms a drift popup, or alters DSC. The meaning of neutral/unfilled handling still depends on the provider; the full before/after wrapper evidence is retained.

There is no successful native AWD/RWD request in the inspected saved recordings. A returned gearbox-display field from MDrive does not prove its AWD subsystem is fitted/operable. A valid present-day provider and explicit current availability are required; a catalog/menu tweak cannot create missing ECU behavior.

### 4. Head-unit diagnostic access already exists

`../../bmw-extracted/reference/someip-interfaces.json` declares:

```text
com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu
service 63654, version 1.2
instance SystemFunctionsInternalTasuInst1 -> 128
sendTasuRequest: method 1
sendTasuResponse: event 32769, event group 1, selective
```

Inputs include source address, target, service ID, subroutine ID, payload length/bytes and timeout field. The sibling runtime (`../../../idrive7-apps/kit/runtime/diag.js`) already uses tester `0xF2` for diagnostic reads. Therefore an external controller is not inherently required simply to originate a request; vehicle-side permission, protocol and restoration remain separate prerequisites.

The broader SDK also contains Joynr DiagnosticService request/job schemas and HIGH-trust permission declarations. Named jobs, whitelist versions and security/session errors prevent interpreting those declarations as unrestricted diagnostic authorization. `AolCodingService` is a coding-shaped API with NCD/signature data, not an AWD runtime toggle. No additional coding API is used here.

The lab uses only single-target SID 0x22 reads and SID 0x19 read-DTC operations. It does not import the existing unrestricted diagnostic sender. Unknown/missing TASU verdicts are not treated as successful. Busy/refused requests are recorded without retries. Timeout or provider failure stops polling and quarantines diagnostics until explicit reconnect; reconnect is blocked during an unresolved native trial. A post-trial diagnostic timeout may therefore require external restoration and review before more reads.

Existing TASU envelope parsing places ECU address at byte 6 and UDS at byte 9. This app retains the **entire raw envelope** and validates its length before interpreting it. A reply must match ECU/SID and echoed DID (or DTC subfunction), but there is no end-to-end request token. Another tool's same-ECU/same-DID response can be indistinguishable. Do not run unrelated OBD polling apps concurrently with evidence collection. This app is not a passive full-vehicle packet sniffer; externally initiated ISTA traffic is not guaranteed to appear on its selective response subscription.

### 5. Saved ECU/software identities

Historical E-Sys inventory: `C:/Data/SVT/SVTBak/G015_BU96457.xml`. Recent log: `C:/Data/Logs/E-Sys_20261028_225827.log`. Avoid sharing these files without removing VIN and other private data.

| Function | E-Sys base variant | Saved diagnostic family | Address |
| --- | --- | --- | --- |
| Transfer case | LMV2 | LMV_G11 | 0x19 |
| Chassis integration | DSC_VIP_IB4 | VIP_G05 | 0x39 |
| Integrated brakes | DSC_BRS_IB | IB_G05 | 0x29 |
| Rear differential | GSD | GSD_F90 | 0x0F |

Saved LMV software:

```text
HWEL 00002064 / 040_008_003
CAFD 00002066 / 000_042_008
BTLD 000030CC / 021_032_000
SWFL 000033EE / 000_042_001
SWFL 000033EF / 001_042_002
```

The scanner records F150 SGBD indices 0F2180/0F2520/0F2500/0F2550 for those targets; human-readable family names come from its local lookup database. `GSD_F90` does not certify identical M5 physical hardware or firmware. Generic scanner address labels must not replace this observed topology; the retained transfer-case identification is **0x19**, not the generic VTG label at 0x38.

No VIN request is part of this lab. Arbitrary user-selected read-only DIDs may nevertheless return sensitive information; exports should remain private.

### 6. Transfer-case telemetry: promising, not yet physical truth

Saved head-unit capture root:

```text
../../out/downloads/head-unit-5e14f35a4092/files/
```

At `var/opt/public/oap/oap_12450/data/car_vitals.log:1219`, the app retained this DB32 payload excerpt:

```text
FF F6 00 02 00 00 00 21
```

The existing configuration interprets the first signed two bytes as actual front torque with raw/4 scaling, bytes 2–3 as qualifiers and bytes 4–5 as target torque. Under that **unvalidated candidate decoder**, the first value is -2.5 Nm. The old app did not validate the qualifiers and labeled a decoded value <=5 as "clutch open". That label is application inference, not independent clutch-position evidence.

This lab reports raw values and clearly marked Nm candidates, including qualifier and target bytes. It never derives "clutch open", "100% rear" or an axle percentage from them. Its decoder is not a substitute for the exact applicable LMV description.

Other declaration-only telemetry leads:

- `BasicDataSet.valueDistributionLongitudinalTorqueRearAxisFrontAxis` and its qualifier;
- XView `statusDisplayDriveDynamic`, including display wheel moments;
- `Powertrain.ActualValueRPMWheel`, including four qualifiers and catalog spelling `actualValueRPMwheelFRH`;
- FES `statusDSCSwitchHMI`, distinct from DSC pump/unit operating state;
- steering and motion/yaw/acceleration raw fields.

No physical unit is invented for raw wheel moments, split, steering, temperature or pressure. Speed zero is used as an exact raw invariant, not a calibrated moving-speed display. CRC bytes are retained but not independently verified by this app. Catalog signal qualifiers are required where known; they do not constitute a functional-safety certification.

### 7. What MGU Lab did and did not establish

The three Oct. 25–26 MGU Lab exports contain 65 retained FES mode-change events, not AWD/RWD changes. Lighting automation linked to those FES changes is not drivetrain control. MDrive, torque split, wheel RPM and TASU were mostly not requested by that lab; missing results are a **coverage gap**, not a negative vehicle capability result.

One saved raw speed-zero sample was about 44 minutes old by the later snapshot. The app's "live" provider label could outlast fresh data. Logging was throttled and rotated. These facts motivated receive-time-based gates, source counts, complete delivered-sample journaling and independent provider/field state in xDrive Lab.

Useful sources: `../../mgu_lab findings v1.md`, the three `../../out/mgu-lab-*` capture folders, downloaded `car_vitals` and `dtc_scanner` logs. Previous scanner logs include fault-clear attempts, so saved fault snapshots are not an untouched baseline.

### 8. Available files and recovery limits

Installed research sources include ISTA test modules/ECU programs, ISTA SQLite databases, E-Sys inventories/FA/CAFD/NCD data, full ISTA PSdZData and the MGU filesystem download. Relevant diagnostic programs include `lmv_g11.prg`, `vip_g05.prg` and related group/family definitions; names alone are not callable actuator contracts.

`C:/Data/psdzdata/swe/swfl` was empty when inspected. ISTA's separate full dataset contains 33EE/000_044_000 and 33EF/001_044_001 application payloads, not the saved installed versions above. A matching bootloader filename does not make different application firmware interchangeable. CAFD containers inspected declared compressed/encrypted content; exact switch/coding parameters were not recovered.

Native MGU gateway/SOME/IP proxy/TASU libraries are available for further offline research, but the native Ghidra provider was not configured in the initial REA session. The managed ISTA modules were inspected successfully without target execution. Root access to the MGU is not proof of unrestricted FlexRay/chassis-ECU access.

The filesystem download reports errors and is not an atomic complete disk image. Existing OAP recovery archives cover app installation/registry data, **not a complete vehicle ECU recovery plan**. Do not use them to justify a chassis firmware experiment.

### 9. Existing solution: xDelete

Current vendor pages advertise G-series ON/OFF/Sport/Custom configurations and a G-series support window through build date June 2021, with explicit exceptions. The saved 0319 build criterion is inside that window, but exact support for this vehicle was **not confirmed**. No VIN was submitted externally.

Current product/configuration pages list **LIVE on-the-fly switching for E/F series**, not G series. An older engineer article describes G-series LIVE as development work; a development target is not a release. Ordinary xDelete configuration changes modify/flash a dataset and are not equivalent to an app-callable native mode request.

Sources:

- [Product and current platform matrix](https://www.xautomotive.com/products/xdelete)
- [Supported vehicles and private support check](https://xautomotive.atlassian.net/wiki/spaces/NW/pages/1732673538/xDelete+Supported+Vehicles)
- [Configuration semantics](https://xautomotive.atlassian.net/wiki/spaces/NW/pages/1732837381/xDelete+-+xDrive+Configurations)
- [Flashing/technical explanation and constraints](https://xautomotive.atlassian.net/wiki/spaces/NW/pages/1753415683/Flashing+Safety+with+xDelete)
- [Engineer discussion of LIVE versus per-change flashing](https://www.xautomotive.com/blogs/news/xdelete-live-you-asked-our-engineers-answered)

Vendor general mechanical/warranty/invisibility claims are not independently established for this modified M850i. The custom "0–100%" control is not proof of literal 0–100% measured front axle torque. Do not remove shafts, unplug controllers, defeat lubrication requirements or use fuse-pulling as a mode backend.

## Operating sequence

### Read-only first

1. Keep the vehicle safely parked; do not run other diagnostic pollers or drivetrain writers concurrently. The app starts disarmed, with LMV polling off.
2. Open **Providers**. Inspect exact instances, offered/unavailable/unknown state and each field's receive age. A failed getter does not imply an absent provider. Open **Field schema** for exact enum names/defaults.
3. Run manual **F150 identifiers**, **fault reads** and **LMV DB32** as needed. Preserve faults; nothing clears them. A custom DID is one explicit read, not a discovery sweep. Do not guess thermal/differential semantics.
4. Capture a baseline. Missing notification-only channels remain explicitly missing; refreshing getters does not refresh those channels by fiction.
5. Operate factory controls manually while parked, recording markers. Use passenger-operated ordinary-driving logging only for the later read-only correlation stage; the driver must not use the menus while driving.
6. Save snapshots and export the retained raw data. Download the new app's data before retention limits remove old raw segments.

### Native request experiment

**All gates are mandatory; no override exists.** The app requires a visible non-preview session, healthy durable recording, baseline evidence, no conflicting action/diagnostic, and current same-epoch offered-provider samples no more than two seconds old:

- exact raw vehicle speed zero;
- all four wheel RPMs zero, each with the catalog valid/secured/plausible qualifier;
- actual and virtual accelerator zero, with the valid/plausible qualifier;
- actual and target selector P, with actual gear N_OR_P;
- parking brake explicitly applied;
- valid DSC selection, specifically DSC OFF for an RWD request;
- actual MDrive AWD mode with ready/active qualifier;
- MDrive AWD display currently operable, not unavailable/not-operable/fault/unfilled;
- remote software update session explicitly false.

These are deliberately conservative research gates, not proof that every OEM precondition has been discovered. Some fields may not arrive on this car, in which case requests remain blocked and the observations still provide useful research evidence. The app does not disable DSC, change gear or apply the brake for you.

1. Select one backend and one different target. Inspect **Exact request** before proceeding. Already-current mode is not an informative apply experiment and is blocked.
2. Capture baseline, inspect blockers, open **Arm**, and explicitly authorize that backend/target/phase for at most 30 seconds. Arming sends no mode change. Polling stops without automatic resume.
3. Review **Apply**, then explicitly send once. A complete before-state and dispatch intent are saved before the native call. The safety/epoch/deadline checks run again inside the actual queued native invocation, including after durable evidence I/O.
4. Read the transport result and fresh post-invocation **actual** MDrive feedback separately. A matched reported mode still does not establish torque distribution. Record the operator outcome independently.
5. Use **Restore** only while parked and eligible. It requires a new target-bound arm and requests the retained original via the same backend. It is not a universal reset. No automatic re-engagement occurs on loss of feedback; that could be hazardous with mismatched axle speeds.
6. Review external or native restoration explicitly. A new fresh original-mode observation plus your acknowledgement is needed before the trial is archived. The archive says what was reported/claimed, not that physical side effects are proven reversed.

A timeout, refusal, stale sample, provider epoch change, hide, loss of visibility or evidence failure disarms and retains the unresolved trial. Never keep pressing Apply or force AWD to make an uncertain state disappear. The guided ISTA ignition restoration applies to that documented diagnostic operation; it is not assumed to reverse every native request. Use the qualified specialist/recovery path appropriate to the actual condition.

### Recording limits and recovery

- Raw retention is four journals of at most 4 MiB each. The queue is bounded to 1 MiB / 4,096 records and normally flushed/fsynced in 250 ms batches; critical intents are committed synchronously. Rotation evictions are counted separately from dropped or uncertain records. Download before rotation if the complete session matters.
- At most two evidence exports are retained, each capped at 48 MiB. A third export is refused without deleting prior exports or disabling recording. Download and archive those export copies, then deliberately remove only the downloaded export copies from app data before exporting again.
- Critical state is capped at 8 MiB; baseline and snapshot files are each capped at 1 MiB. Reaching a critical evidence limit or experiencing an I/O error blocks native writes rather than silently discarding trial history. The app requests 160 MiB of host disk allowance, including headroom for retained exports and atomic temporary saves; free space and real host behavior still need vehicle-side observation.
- An interrupted/corrupt recorder is preserved and blocks native writes: loss before the last committed batch is unknown. Reopening does not clear this fault or reload historical samples into live gates. There is no in-app fault-reset or evidence-delete button.
- After an interruption, download/archive the complete app data and resolve any retained vehicle/trial state using fresh observations and the appropriate external recovery procedure. Only then deliberately start a fresh app-data set if another native research session is needed. Do not delete an unresolved trial to bypass the block.

Raw views use short, rotary-focusable segments with page navigation, rather than a single three-line text widget that would clip the payload. Full raw JSONL, source hashes and recorder counters remain in the export; on-screen line wrapping is not a replacement for the downloaded evidence.

## App structure and packaging

- `app.json`: native menus and exact access declarations; only `mSystem` and `operationMSystemsMDrive` are writable.
- `catalog.js`: source-hashed, exact reachable schema subset, packaged as JavaScript because the existing packer copies JS modules rather than loose JSON.
- `domain.js`: catalog-backed request construction, enum decoding, gates, ECU/read allowlist and staged protocols.
- `services.js`: provider lifecycle, bounded getters, final guarded native dispatch and serialized read-only TASU adapter.
- `lab.js`: monotonic observations, baseline/trial/recovery state, arming, operator evidence and exports.
- `storage.js`: atomic critical saves, bounded raw journal and explicit retention/error accounting.
- `main.js`: native iDrive research menus; no shipped fixture or vehicle simulator.

The local CLI and Python wrapper register `xdrive_lab` alongside the other local apps. From the repository root:

```powershell
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu
./out/mgu.exe build xdrive_lab
./out/mgu.exe preview xdrive_lab --out out/xdrive-lab-home.png
./out/mgu.exe kit xdrive_lab
```

`kit xdrive_lab` already packages the selected app; a separate build is optional. Building/previewing is local. Installation is a separate deliberate vehicle-changing action; no installation or vehicle validation was performed as part of implementation.

After deliberately installing and recording, the existing downloader can retrieve the data:

```powershell
./out/mgu.exe --auto --key "./id_rsa" download xdrive_lab
```

Do not share SSH keys or private vehicle exports. Export paths displayed by the app refer to its host/data directory, not an automatic upload.

## Evidence interpretation and next decisions

Proceed in order: observe trustworthy data; obtain the technician-operated BMW reference; resolve exact request/restoration semantics; then decide whether native MDrive suffices or validated controller firmware support is necessary. Do not jump from an M menu or one near-zero torque frame to a permanent conversion claim.

Still unresolved:

- Whether either native AWD/RWD setter is accepted on this car and for which targets/states.
- Exact raw UDS mapping and applicable preconditions for the recovered VIP diagnostic semantic job.
- A supported in-session re-enable operation versus ignition restoration for that diagnostic procedure.
- Authoritative DB32 qualifier/target interpretation and validated differential/thermal DIDs.
- Sustained physical clutch release, actual axle torque distribution, thermal limits and coordination with stability/brake/differential systems.
- Exact xDelete compatibility and currently released G-series LIVE support, if any changes after the cited source inspection.
- Recoverable exact installed firmware/calibration before any deeper modification.

## Local implementation verification

- Built the local CLI and packaged `dist/xdrive_lab@1.0.0.mgu` (17 native-menu screens).
- Exercised the actual native-menu preview: provider/field/raw-schema navigation, baseline and snapshot capture, export/recorder status, request inspection, bounded DID editing, protocol outcomes and operator markers. Inspected rendered screenshots. Preview arming remained disabled even with injected live-looking samples.
- Exercised the packaged recorder, service adapter and trial state machine against temporary **memory-only host interfaces**, not the BMW native SDK or a vehicle: unarmed rejection; one apply and separately armed restore; fresh restoration review; hide between enqueue and native invocation; retained unresolved intent after restart without replay.
- Exercised complete positive DB32 envelopes, negative NRC `0x31`, four fixed-target read-DTC responses, timeout quarantine/no automatic retry, journal rotation with explicit eviction accounting, complete raw export and the two-export limit without poisoning recording.
- Temporary host fixtures/scenarios were removed and are not part of the app package. No installation, real diagnostic request, real setter invocation, actual BMW HMI validation or physical drivetrain validation was performed.

Local software smoke/preview evidence demonstrates only the app's host behavior. It cannot validate vehicle control, physical torque, functional safety or suitability for road/track use.
