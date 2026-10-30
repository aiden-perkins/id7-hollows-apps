# Other vehicle data: findings and read-only lab

Research date: 2026-10-30. Scope: the five items under **“other data to be found”** in `ideas.md`. That file is unchanged. This is offline reverse engineering of the downloaded MGU filesystem, retained vehicle logs, installed ISTA data, and E-Sys definitions. No connection to the car, control request, coding, flashing, or mechanical experiment was performed.

## 1. Results

| Requested data | Concrete route found | What it establishes | Limit |
|---|---|---|---|
| Exhaust valve position | DME8FF_R/L `22 62FD`, `22 64FD`; regulated-family `22 631E`, `22 651E` | Tester command / electrical flap output, including two bank-labelled channels in the regulated definitions | **Not proven measured valve position or degrees.** Shared diagnostic definitions do not prove fitted actuator type or which DME populates each bank |
| Transfer-case clutch engagement / front drive | LMV_G11 `22 DB32`, `22 DFEA`, `22 4004`, `22 4005` | Reported actual/requested front torque; raw service/release states; actuator current, angle, voltage, thermal data | **No validated clutch-engagement percentage or front-wheel power percentage.** Torque qualifiers and release-state numeric mapping remain unresolved |
| Individual wheel speed and direction | IB_G05 `22 DBE4`; MGU `Powertrain.ActualValueRPMWheel` for separate raw observations | Four wheel speeds in km/h, four independent directions, reference direction, per-wheel signal quality | Diagnostic and notification samples have different times. Native wheel RPM scaling is not supplied by the catalog |
| Rear wheel steering degrees | HSR_G11 `22 DB33`, with `DB35` and `DB36` for context | Actual rear angle, validity, target angle; HSR state/current/motor torque; QDM target qualifier | This is rear-axle actuator steering angle, not separate measured left/right toe angles. Front/driver XView angles are not substitutes |
| Dynamic sway-bar actuator data | EMARS_V1 `0x25` and EMARS_H1 `0x04`, `22 D699`–`D69D`, `D6BB`, `D499` | Front/rear actuator torque, motor torque/current/angle/speed, internal voltages, temperatures, controller states | Electric active anti-roll system, not a demonstrated hydraulic-pressure system. No universal “engaged %”; one D6BB torque field has contradictory signedness documentation |

**Evidence levels:** “artifact-defined” means a local schema or diagnostic table defines it; “historically observed” means a retained car log contains it; “lab-decoded” means software applied the artifact layout. None alone is a new live-vehicle validation or independent physical measurement.

## 2. Sources and vehicle applicability

### 2.1 Actual saved ECU identification

The downloaded `var/opt/public/oap/oap_12444/data/dtc_scanner.log:173-200` records `22 F1 50` lookups on 2026-10-26:

| Physical address | Recorded SGBD | Log lines |
|---|---|---|
| `0x12` | `DME8FF_R` | 197–198 |
| `0x13` | `DME8FF_L` | 199–200 |
| `0x19` | `LMV_G11` | 175–176 |
| `0x29` | `IB_G05` | 195–196 |
| `0x2B` | `HSR_G11` | 181–182 |
| `0x39` | `VIP_G05` | 173–174 |
| `0x25` | `EMARS_V1` (front) | 189–190 |
| `0x04` | `EMARS_H1` (rear) | 191–192 |

Prefix those paths with `out/downloads/head-unit-5e14f35a4092/files/`. These are historical identifications, not a fresh scan. Address/SGBD matching matters more than assuming every G15 or M850i has identical hardware. Do not substitute EMARS2/3, transverse-drive LMV, another DSC generation, or M8 software because names look similar.

### 2.2 Diagnostic definitions

Installed ISTA root: `C:/Program Files/BMW/ISPI/TRIC/ISTA/`.

The useful measurement definitions are in `Ecu/*.prg`, not merely coding CAFD names. The files have an `@EDIABAS OBJECT` header. Static parsing used:

1. Original little-endian header pointer at `0x84` identifies the table directory.
2. Decode table entries and data with XOR `0xF7` (data from `0xA0` onward; the header stays original).
3. Table entries are 80 bytes: name, data pointer, column/row counts. Values are NUL-terminated Windows-1252 cells, including short numeric factors.
4. Join `SG_FUNKTIONEN` selectors to `RES_*` tables and referenced `TAB_*` enums. Preserve `RESULTNAME`, `DATENTYP`, byte order, unit, multiplier/divisor/offset, and comments.

This recovered real read definitions, not guessed DIDs from fault-environment names. The format was cross-referenced against [ediabasx’s parser](https://github.com/emdzej/ediabasx/blob/main/packages/best-parser/src/parser.ts); conclusions below are grounded in the installed bytes. The repository’s concept document contains an older differing XOR example, so the parser and observed local structures were used instead.

The lab’s `evidence.js` preserves selected original table cells, source SHA-256s, and file offsets. `catalog.js` contains the finite read allowlist and derived sequential layouts. These are data-only JavaScript exports, matching the existing builder’s supported source format. Numeric byte offsets below refer to the **payload after** `62 DIDhi DIDlo`, never the TASU header.

### 2.3 MGU and documentation

- `bmw-extracted/reference/someip-interfaces.json`, SHA-256 `645b929b273197df927dd45d958e82c823a3f1f843f71587baaba03c205c74e4`: interface/type/instance definitions. A catalog entry does not prove its provider is offered on this car.
- Downloaded native/OAP schemas corroborate the presence of the Powertrain interface, including `var/opt/public/oap/oap_12203/someip%49nterfaces/de_bmw_powertrain_%50owertrain.json`.
- ISTA `SQLiteDBs/xmlvalueprimitive_ENGB.sqlite`: read-only FTS5 queries and XML extraction. Document IDs are listed below. An unfiltered search mixes decades and platforms; exact hardware applicability still needs care.
- `SQLiteDBs/DiagDocDb.sqlite` is not readable as ordinary SQLite with the available reader; no claim that its full diagnostic graph was examined.
- E-Sys S18A `C:/Data/psdzdata/mainseries/S18A/S18A_25_03_571_V_004_000_001/odx/src/odx-d/` includes LMV, HSR2, EMARS, DSC_VIP/IB and DME8.8T-family declarations. These are principally variant/base-layer and programming links, not the measurement layouts recovered from ISTA. Installed software definitions are not proof of live compatibility.

## 3. Exhaust valves: command and output are not measured position

The saved car identifies DME8FF_R and DME8FF_L. Both PRGs expose these read selectors in `SG_FUNKTIONEN`:

| DID | Definition | Payload | Interpretation |
|---|---|---|---|
| `62FD` | `ASW_EL_AGK` | 2 bytes, signed BE16 / 100, `%` | Tester command to electrical exhaust flap |
| `64FD` | `ASG_EL_AGK` | 2 bytes, signed BE16 / 100, `%` | Electrical flap output/control quantity (`tvakr_w_msg`) |
| `631E` | `ASW_GER_EL_AGK` | 4 bytes: bank 1 at 0, bank 2 at 2; signed BE16 / 81.92, `%` | Regulated electrical exhaust-flap command |
| `651E` | `ASG_GER_EL_AGK` | 4 bytes: bank 1 at 0, bank 2 at 2; unsigned BE16 × 0.00152588, `%` | Regulated electrical-flap tester/output quantity |

Read the two ECU addresses independently. “Bank 2” in a result name does not establish “read only the left DME,” and the shared tables do not establish which regulated-family channels are active. Do not clamp a strange value to 0–100 or relabel PWM duty as percent-open.

Evidence: `dme8ff_r.prg` result-table data offsets `5629387` (`RES_0X631E_D`) and `5629677` (`RES_0X651E_D`); corresponding left PRG offsets `5525142` and `5525432`. Simple `62FD`/`64FD` definitions are inline selector rows, not standalone result tables.

Additional metadata exists: `3020` includes an exhaust-flap variant; `5FF2` includes exhaust-flap presence/learned actuator type. These are useful diagnostic research context but are not position sensors. The initial lab deliberately sticks to the four finite measurement candidates above and raw F150 identification.

ISTA documents inspected include IDs `2000016292247204` (Electrical exhaust flap), `2000036636323104` (control electronics), `2000036674994104`, `2000078038574204` (controller drive 2), `2000080426638404`, `2000015417115304`, and `2000073064434104` (exhaust-emission system). Engine references `2000044781407404` and `2000063971080204` distinguish N63 and S63 contexts. One controller document combines infinitely-adjustable language with an older 10%-open/90%-closed description. That is not authority to choose either interpretation for every installed actuator.

**Unresolved:** a verified actual flap-angle read, measured position feedback, applicable binary/continuous actuator type on the saved software, and physical correlation of command/output to the flap. The lab labels this category **“Exhaust commands / output”**, not a position gauge.

## 4. Transfer case: torque and actuator telemetry

### 4.1 LMV_G11 `22 DB32`: front torque, now independently defined

`RES_0XDB32_D`, data offset `963308`, directory entry `987396`:

| Payload offset | Width/type | Result | Conversion |
|---|---|---|---|
| 0 | signed BE16 | Actual reported torque toward front axle | raw / 4 Nm |
| 2 | unsigned BE16 | Actual torque qualifier | Raw; no enum provided |
| 4 | signed BE16 | Requested torque toward front axle | raw / 4 Nm |
| 6 | unsigned BE16 | Requested torque qualifier | Raw; no enum provided |

Minimum payload is 8 bytes. This independently supports the earlier app’s quarter-Nm scale; it does **not** independently validate every live reading or its qualifiers. Do not import a qualifier convention from a similarly named SOME/IP enum.

### 4.2 `22 DFEA`: release and service states

`RES_0XDFEA_D`, data offset `971194`: seven sequential bytes for service basis, limp controller, actuator position state, protection, normal-operation release state, clutch availability, and actuator availability. Byte 4 is explicitly described as `Position LMV gelüftet/nicht gelüftet (Normalbetrieb)`.

**The numeric state mapping is not supplied.** Preserve the raw seven values. Neither zero nor one is assigned “clutch open” in this lab. This is a promising state channel, not an engagement percentage.

### 4.3 `22 4004` and `22 4005`

`RES_0X4004_D`, data offset `956119`, contains 31 sequential fields (59 bytes). Highlights:

- Lamella temperature: signed BE32 / 4194304 °C; treat as reported/model-derived unless sensor provenance is established.
- Thermal clutch stress: a percent field, **not clutch engagement**.
- Measured actuator current: signed BE16 / 512 A.
- Measured actuator angle: signed BE16 / 64 degrees, **not percent clutch closure**.
- Battery voltage: signed BE16 / 1024 V.
- Actuator voltage is explicitly marked “currently not in use”; the app retains that comment.
- Bridge temperature, front/rear speed difference, engine speed, protection and wear context.

`RES_0X4005_D`, data offset `958964`, contains 21 fields (55 bytes): BLDC bridge and high-side currents, rotor angle, DC-link/KL30 voltage, electronics/sensor temperatures, driver states and protection counters. Several external sensor fields are explicitly **unoccupied placeholders**, not proof of fitted sensors.

The complete layouts and offsets are available per probe in the lab. `DFE8`/`DFEE` also have relevant calibration context in ISTA; no calibration write is implemented.

ISTA document `2000088102734904` (rowid 252709, ATC13-1 context) describes DSC torque requests, motor/geared-ring positioning, and calculated wear/load/oil-temperature data returned by VTG. It does not establish a direct front-axle torque load cell. `2000088103044204` is an M-xDrive description: its operating split and mode claims must not be copied to this car. Transverse front-drive-based LMV descriptions are a different architecture.

### 4.4 What the headunit signal names do not establish

- `Powertrain.WheelMomentDrive4` actually contains rear-axle RPM, generic powertrain engagement/direction states and qualifiers—not a documented numeric front-torque value.
- `WheelMomentDrive1` has numeric `dummy1/3/4` fields without physical conversion metadata. No invented Nm decoder.
- `BasicDataSet.basicDataSet` has `valueDistributionLongitudinalTorqueRearAxisFrontAxis`, UInt16 default 65535, plus a qualifier. The catalog alone does not define the split scale or axle convention. The lab shows raw data/schema, not a fabricated front/rear bar.

**Why not front power %?** Torque, torque capacity, clutch slip, motor angle, motor current and power are different quantities. Axle power additionally needs compatible angular speed and torque reference planes. An engine-torque/gear-ratio estimate cannot establish clutch engagement or a physically measured axle power fraction.

## 5. Individual wheel speed and direction

IB_G05 at `0x29`, selector `GESCHWINDIGKEIT_RAD`, `22 DBE4`, 19-byte payload:

| Payload offsets | Type/conversion | Channels |
|---|---|---|
| 0, 2, 4, 6 | signed BE16 / 100 km/h | Front left, front right, rear left, rear right |
| 8 | signed BE16 / 100 km/h | Vehicle speed |
| 10, 11, 12, 13 | unsigned byte | Independent FL, FR, RL, RR rotation direction |
| 14 | unsigned byte | Reference travel direction |
| 15, 16, 17, 18 | unsigned byte, `%` | FL, FR, RL, RR signal quality |

`TAB_DREHRICHTUNG`: 0 standstill, 1 forward, 2 reverse, 3 undefined; any other value remains unknown. Quality comments: below 10% no signal; 10–50% weak; above 50% signal OK. These are reported sensor-quality semantics, not an invented drivetrain-health score. Preserve directions separately; do not manufacture individual direction from gear selection or speed sign.

Evidence: `ib_g05.prg` `RES_0XDBE4_D` data offset `1250418`, directory `1346788`; direction table data `1323439`, directory `1350468`. DSC/IB/VIP generations were compared; use the logged IB_G05 layout, not a generic DSC address assumption.

The MGU notification `de.bmw.powertrain.Powertrain.ActualValueRPMWheel` is a second, independent raw observation route (service 38192, instance 1). Its order is **RL, RR, FL, FR**, and `actualValueRPMwheelFRH` has a lowercase `wheel` in the catalog. Each wheel has its own qualifier; default wheel value is 65535 and default qualifier 15. A valid/plausibilized enum exists, but the transport catalog does not supply physical RPM scaling. It is notification-only: do not send a nonexistent getter. It does not supply four wheel directions.

ISTA integrated-brake-system document `2000045315142904` explicitly covers the G05/G15-era architecture. Earlier wheel-speed documents explain direction-aware sensing but do not override the identified PRG layout.

## 6. Rear wheel steering angle

HSR_G11 at `0x2B`, `22 DB33`, payload 11 bytes:

| Offset | Type/conversion | Result |
|---|---|---|
| 0 | unsigned BE16 × 0.002747 − 90° | Actual rear-axle steering angle |
| 2 | byte enum | Actual-angle qualifier: 1 valid, 6 invalid, 8 initialization |
| 3 | unsigned BE16 × 0.002747 − 90° | Requested rear-axle steering angle |
| 5 | unsigned BE16 / 100° | Motor zero-position angle; FFFF means uncalibrated |
| 7, 9 | unsigned BE16, raw hex | Analog sensor A/B zero-position values |

`22 DB35` (8 bytes): service qualifier at 0, angle-error amplitude at 1 (unsigned BE16 × 0.002747°), current at 3 (byte A), actual and target motor torque at 4/6 (signed BE16 / 1024 Nm).

`22 DB36` (5 bytes): raw filter constant at 0, QDM requested angle at 2 (unsigned BE16 × 0.002747 − 90°), target qualifier at 4. Target states distinguish active/diagnostic/standby/invalid; the lab retains the complete enum. An angle is not presented as physically valid merely because the UDS reply was positive.

Evidence: `hsr_g11.prg` `RES_0XDB33_D` data `716102`, `RES_0XDB35_D` data `717538`, `RES_0XDB36_D` data `718173`. Actual-angle qualifier table data `729057`.

No rear-angle SOME/IP field was found in the inspected catalog. XView’s `statusFrontAxleSteeringAngle` and `statusSteeringAngleDriver` explicitly concern the front axle/driver. VIP `684A`–`684F` names found in fault-environment tables are **not established ReadDataByIdentifier DIDs** and are excluded. Motor-position angles are not silently relabelled wheel angles. ISTA docs `200000467235304` and `2000074015379604` provide steering-architecture context, not left/right toe calibration.

## 7. Active anti-roll: electric front and rear actuators

The saved vehicle log identifies EMARS_V1 at `0x25` and EMARS_H1 at `0x04`. Both have the following read definitions; compare front and rear as separate sources:

| DID | Bytes | Artifact conversion and meaning |
|---|---|---|
| `D499` | 4 | Two unsigned BE16 / 1638, KL30/KL15 voltage-labelled channels; source unit is `-`, so retain that uncertainty |
| `D699` | 6 | Three signed BE16: actual actuator torque / 26 Nm; actual motor speed / 3 rpm; motor angle in degrees |
| `D69A` | 4 | Signed BE16 target and actual **motor** torque / 3276 Nm |
| `D69B` | 6 | Signed BE16 RMS/d-axis/q-axis phase current / 150 A |
| `D69C` | 16 | Eight unsigned BE16 / 1638 V: d-axis, q-axis, U1–U6 internal voltages |
| `D69D` | 4 | Four bytes − 40: motor, magnet, power-board, logic-board temperatures; original unit cell is `°` |
| `D6BB` | 34 | Mixed BE integers and IEEE754 BE floats: controller commands/states, target stabilizer and motor torque, twist/zero/motor angles, speed and their qualifiers |

V1 table data offsets respectively: `716850`, `717056`, `717345`, `717557`, `717823`, `718433`, `719906`. Both V1/H1 source hashes and their own table offsets are retained in the app evidence, rather than assuming byte-identical files.

D6BB state enums distinguish no regulation, normal regulation, degraded regulation, unavailable/invalid, and several null-position fallback states. For example, actuator state 144 means active/all OK/requested, 16 means ready/not requested, and 96 means no regulation possible. A motor-enable bit or zero torque at rest does not establish “anti-roll off.” Motor torque and stabilizer/actuator torque are different reference planes.

**Contradiction retained:** D6BB `STAT_ISTMOM_STABI_ARS_WERT` is declared `unsigned int`, unit Nm, no signed offset, but its comment describes a ±1200 Nm range. The lab displays that field as **raw only** and does not invent two’s-complement or a bias. D699 offers a separate signed actual-actuator-torque channel. Another D6BB qualifier has an implausible Nm unit cell; enum/qualifier bytes remain states, not torque.

Older hydraulic ARS docs (e.g. `200000467275004`, `200000468251104`) describe pumps, valve blocks and pressure sensors on other platforms. They do not establish a hydraulic pressure channel for these EMARS units. `mars01.prg` is a misleading filename match: its tables concern tuner/antenna/media hardware, not an anti-roll controller. No hydraulic-pressure DID is included. No numeric thermal cutoff or universal engagement percentage was established.

## 8. Lab app: `other_data_lab`

The companion native-menu app is intentionally a debug instrument, not a polished dashboard or an actuator controller:

- Five research categories, with source-backed conclusions and unresolved semantics visible in the UI.
- A fixed allowlist of the above SID `0x22` reads, at the historically identified physical addresses. No arbitrary DID editor, sweeps, functional broadcast, sessions, unlocks, DTC clearing, control routines, coding or flashing.
- Diagnostics are **off at startup**. Manual enable and selected-probe reads; no background diagnostic polling. F150 is a separate explicit identity read; measurement reads require its current-provider SGBD family index to match the saved target. This is a family gate, not software-version validation. Recheck exact compatibility with appropriate vehicle tooling before interpreting a layout.
- Serialized single-attempt TASU calls. ECU/SID/echoed-DID, frame length, provider epoch, hard deadline and transport verdict are separate evidence. Timeouts/provider failures quarantine further reads for the app session; restart only after other diagnostic clients and old work have stopped. TASU has no end-to-end ownership token: matching traffic can still originate from another tester.
- Original envelopes, unmatched/negative/pending replies, raw bytes, complete layouts, enum tables and conversion comments remain inspectable. Layout-length mismatch is raw evidence, not a made-up measurement.
- Actual, target, qualifier, unsupported/missing, stale and preview evidence remain distinguishable. Unknown torque qualifiers and release states do not acquire invented validity labels.
- Raw native wheel/Powertrain/BasicDataSet subscriptions, with complete datatype closure available. No fabricated wheel-RPM scale, exhaust angle, front-power percentage or anti-roll engagement gauge.
- A bounded in-memory event history and explicit snapshot save in the app data directory; counters disclose evictions. Saving does not mean the data was uploaded anywhere. Raw views are paginated without discarding the complete saved payload.
- Preview opens no real vehicle providers and cannot send diagnostics. Host-supplied observations must remain explicitly labelled synthetic, never counted as physical confirmation.

Build/package with the project’s existing `mgu` CLI after rebuilding that executable for the new local-app registration:

```powershell
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu
./out/mgu.exe build other_data_lab
./out/mgu.exe preview other_data_lab --out out/other-data-lab-home.png
./out/mgu.exe kit other_data_lab
```

Do not use a production live-data app concurrently with this lab’s diagnostics. Do not operate the UI while driving. Vehicle evaluation should start stationary with a qualified operator, recording missing/NRC results rather than escalating to writes. A second observer/data logger is needed for any later controlled motion comparison; do not lift/spin wheels or provoke stability-control intervention simply to populate a screen.

## 9. Refinement criteria

1. Re-identify each currently installed ECU/software; compare the exact variant and table provenance, not just vehicle model.
2. Collect raw baseline replies and keep transport outcome, decoding outcome, qualifier state and physical observation separate.
3. Exhaust: compare the command/output candidates against independent observation and actuator-type metadata. Do not claim measured position until a genuine feedback channel or independently verified relationship is established.
4. Transfer case: correlate DB32 with 4004 current/angle and DFEA raw states under normal factory operation. Establish qualifier/release enums independently before using them for a status decision. No conversion to clutch percentage by endpoint interpolation alone.
5. Wheels: verify four-channel ordering and direction against a controlled reference; preserve no-signal/weak/undefined states and timestamps.
6. HSR: confirm DB33 valid qualifier, sign convention and target/actual behavior against the appropriate ISTA display. Retain uncalibrated/initializing states.
7. EMARS: compare front/rear D699 with current/voltage/state channels. Resolve D6BB’s contradictory torque representation against exact software before using it numerically.

These are open validation obligations, not reasons to fabricate values. The app supplies the observation paths and evidence capture needed to resolve them.

## 10. Host verification performed

The CLI and installable bundle were built, and the actual lab entry point was launched through the existing native-menu preview host. The first launch exposed that the builder skips standalone JSON assets; the evidence/catalog were converted to the existing JavaScript-module convention, and subsequent launches succeeded. The captured headunit runtime is Node `v8.16.2` (`bmw-extracted/reference/dev-snapshots/20261024-003758-a273ad/runtime.txt:2`); snapshot writing uses the existing synchronous filesystem API rather than unsupported `fs.promises`.

**Synthetic host scenarios only; no new vehicle validation:**

- Hand-authored replies exercised all five research categories. Observed outputs included exhaust PWM/output 90% (not opening), LMV −2.5 Nm with qualifiers retained raw, independent forward/reverse/standstill wheel enums, rear angle 0.651° with target −2.096°, and signed anti-roll torque/current plus mixed big-endian floats.
- Weak/no-signal wheel quality, invalid rear-angle qualifier, uncalibrated motor-zero value, short payload, invalid EMARS motor-angle qualifier and contradictory D6BB torque remained unavailable/raw rather than fabricated valid measurements.
- A host-only synthetic TASU scenario exercised startup-off, missing/mismatching identity, positive matching identity, failed re-identification clearing the previous match, unrelated ECU/DID traffic, response-pending, NRC31, short positive payload, overlapping reads, a five-second timeout, late-reply retention and quarantine. The eight sent synthetic requests were all physical SID22 reads. Preview sent zero requests. A missing transport verdict was refused.
- Explicit snapshot save produced a readable JSON record containing 45 retained events and the quarantined diagnostic state. The synthetic snapshot and throwaway scenario scripts were removed afterward, so they cannot be mistaken for vehicle observations.

Generated artifacts:

- Installable app: `dist/other_data_lab@1.0.0.mgu`.
- Synthetic decoder output: `out/other-data-synthetic-decoder-output.json` (every sample explicitly marked synthetic).
- Native-menu preview captures: `out/other-data-lab-home.png`, `out/other-data-lab-wheels.png`, `out/other-data-lab-directions.png`, `out/other-data-lab-rear-steering.png`, `out/other-data-lab-source.png`.

No automated test suite, linter, formatter, type checker, ISTA procedure, vehicle write, coding or flashing was run. Native-menu previews are approximate host renderings, not a screenshot of this app installed in the vehicle.
