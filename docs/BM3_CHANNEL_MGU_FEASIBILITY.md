# BM3 CSV channel feasibility for MGU apps

## Scope and conclusion

Source: [`datalog_6ad087b6d142b737c45113f7.csv`](../datalog_6ad087b6d142b737c45113f7.csv).

Many of these quantities are feasible in an MGU app, but the CSV alone is insufficient to reproduce every column live. Basic measurements have existing or conventional diagnostic routes. Advanced RAM channels require ECU/ROM-specific definitions and a suitable acquisition backend. Some exported slots may be inapplicable to this engine.

This assessment concerns **live acquisition**, not replaying the CSV. Every numeric column can be displayed during replay; that does not establish a live source.

| CSV property | Observed result | Interpretation |
| --- | --- | --- |
| Channel types | 69 | Each has a DME and DME2 column. |
| Measurement columns | 138 | Not necessarily 138 independent physical sensors. |
| Ordinary channel types | 32 | Not labelled `(RAM)`; this does not prove they are standard OBD PIDs. |
| RAM channel types | 37 | Labelled `(RAM)` in the export. |
| Samples | 308 | All measurement cells are numeric. |
| Elapsed time | 29.392 seconds | Difference between first and last sample timestamps. |
| Average row cadence | Approximately 10.45 Hz | Does not prove every field was freshly sampled on each row. |
| Sample intervals | Minimum 0.077 s; median 0.090 s; maximum 0.202 s | Export timing, not a measured MGU acquisition rate. |
| Channel metadata | Labels, units and values | No DIDs, RAM addresses, byte layouts, scaling definitions or reliable active-ROM identification. |
| Non-measurement header fields | `bootmod3_3.21.012_unknown`; `6aaef3782ea3bf379607ff51` | Metadata/trailer fields, not measurement channels or established ROM identifiers. |

## Status definitions

| Status | Meaning |
| --- | --- |
| Existing route | Repository code contains a source for this quantity. Vehicle support, exact BM3 equivalence and both-DME coverage are not established by this review. |
| Candidate route | A relevant diagnostic definition exists in the repositories, but support, sensor identity, precision or semantics still need confirmation. |
| Needs definition | No confirmed source for the exact BM3 quantity was established. An OEM/BM3 definition is needed. |
| Conditional RAM | Technically plausible using the investigated diagnostic mechanism, but requires a ROM-matched address or equivalent DID, decoding metadata and ECU assignment. Not ready to use from this CSV alone. |
| Hold | The CSV does not establish a meaningful applicable live channel. Do not represent the exported slot as a confirmed physical measurement. |

Every channel type is listed separately below. Each row covers **both DME and DME2**, except where noted. Existing car-wide signals must not be presented as two independently acquired ECU measurements.

## Ordinary channels: all 32 types

| # | CSV channel | MGU feasibility | Source or remaining requirement |
| --- | --- | --- | --- |
| 1 | Accel. Pedal [%] | Existing route | BMW pedal DID `480B` is configured. Confirm both-DME requirements rather than duplicating one reading. |
| 2 | Ambient Pressure [psig] | Existing route | Barometric routes include `F433` / OBD `33`. The CSV is zero throughout; zero gauge pressure is not zero atmospheric pressure. Confirm BM3's reference. |
| 3 | Boost (Pre-Throttle) [psig] | Candidate route | Boost-pressure candidates exist, including `F470`. Sensor location must match; manifold pressure is not interchangeable with pre-throttle pressure. |
| 4 | Boost pressure (Target) [psig] | Candidate route | Sibling Car Vitals defines `4AB0` and `F470` / OBD `70` candidates. Match the target stage and pressure reference to BM3. |
| 5 | Coolant Temp [F] | Existing route | Native vehicle signal and diagnostic candidates exist. Convert display units as needed. |
| 6 | Engine speed [1/min] | Existing route | Native RPM source exists. Shared vehicle RPM is not two independently sampled DME values. |
| 7 | Gear [-] | Existing route | Reported gearbox signals exist. No RPM/speed gear estimation is required. |
| 8 | HPFP (Target) [psig] | Needs definition | Actual-pressure support does not provide requested pressure. Need the target source for each relevant ECU. |
| 9 | HPFP Act. [psig] | Existing route | `F423` is configured. Confirm pressure reference and both-bank coverage. |
| 10 | IAT [F] | Existing route | Temperature candidates exist. Sensor and bank mapping matter: the two CSV streams differ throughout. |
| 12 | Ignition Timing 1 [deg] | Needs definition | Need the individual timing source and physical-cylinder mapping for each DME. Generic timing advance alone does not establish this channel. |
| 13 | Ignition Timing 2 [deg] | Needs definition | Need the individual timing source and physical-cylinder mapping for each DME. |
| 14 | Ignition Timing 3 [deg] | Needs definition | Need the individual timing source and physical-cylinder mapping for each DME. |
| 15 | Ignition Timing 4 [deg] | Needs definition | Need the individual timing source and physical-cylinder mapping for each DME. |
| 16 | Intake manifold absolute pressure measured [psig] | Existing route | Manifold-pressure candidates include `F487` and `F40B` / OBD `0B`. Despite “absolute” in the name, the CSV uses psig and includes negative values. Confirm conversion and sensor identity. |
| 17 | Knock detected [0-n] | Needs definition | Aggregate indication; the export contains one nonzero DME row and no nonzero DME2 rows. Not a source for eight per-cylinder knock readings. |
| 21 | Load Act. (Rel.) [%] | Candidate route | Standard calculated-load and BMW relative-air-charge candidates exist. Their normalization may differ from this BM3 quantity. |
| 22 | Load Target (Rel.) [%] | Candidate route | Requested relative-air-charge candidate `480C` exists in sibling Car Vitals. Confirm equivalence and scaling. |
| 26 | Oil Temp [F] | Existing route | Native and diagnostic sources exist. |
| 28 | Throttle Angle [%] | Candidate route | OBD `11` provides throttle position. Confirm that its normalization and sensor match BM3's percentage definition. |
| 29 | totalizer count counts exhaust gas relevant misfires over all cylinders [-] | Needs definition | Related Mode 06 support exists, but counter period and scope may differ. This is an aggregate, not eight per-cylinder counters; both streams return from 2 to 0 within the log. |
| 30 | Transmission temperature [C] | Existing route | EGS temperature sources include configured DID `6000`. Both CSV streams remain at 81 C; a constant value alone does not establish a fault. |
| 31 | Vehicle Speed [mph] | Existing route | Native vehicle-speed source exists. Convert units as needed. |

## RAM channels: all 37 types

A **zero DME2** note means every DME2 sample is zero in this CSV. That can indicate a primary-DME-only quantity, an inapplicable field or an acquisition/profile issue. The export cannot distinguish these explanations. Do not present such zeros as confirmed healthy measurements.

| # | CSV RAM channel | MGU feasibility | Source or remaining requirement |
| --- | --- | --- | --- |

| 1 | (RAM) Boost (MAP) [psig] | Conditional RAM | Need exact source, gauge/absolute reference and precision. |
| 2 | (RAM) Boost (Pre-Throttle) [psig] | Conditional RAM | Separate source from manifold pressure; match sensor location. |
| 3 | (RAM) Boost Deviation [psig] | Conditional RAM | Need BM3's sign convention, pressure reference and operands. Do not infer the formula from the name. |
| 4 | (RAM) Boost Pressure (Manifold Target) [psig] | Conditional RAM | Keep distinct from other boost targets. |
| 5 | (RAM) Boost Pressure (Target) [psig] | Conditional RAM | Need the exact internal target definition. |
| 6 | (RAM) Boost Setpoint [-] | Conditional RAM | Dimensionless internal quantity, not simply pressure in different units. Zero DME2 throughout. |
| 7 | (RAM) Fuel Inj. Angle (End) [corrupted unit text] | Conditional RAM | Need angle reference and units; the CSV unit label is corrupted. |
| 8 | (RAM) HPFP Angle (Final) [Grad KW] | Conditional RAM | Need pump-control/crank-angle definition and conversion. |
| 9 | (RAM) Ignition Timing Corr. (Total) [corrupted unit text] | Conditional RAM | Need aggregate-correction meaning and units; the CSV unit label is corrupted. |
| 10 | (RAM) Ignition Timing Corr. Cyl. 1 [deg] | Conditional RAM | Varies on both DMEs. Need addresses and mapping from each DME-local slot to physical cylinder. |
| 11 | (RAM) Ignition Timing Corr. Cyl. 2 [deg] | Conditional RAM | Varies on both DMEs. Need addresses and physical-cylinder mapping. |
| 12 | (RAM) Ignition Timing Corr. Cyl. 3 [deg] | Conditional RAM | Varies on both DMEs. Need addresses and physical-cylinder mapping. |
| 13 | (RAM) Ignition Timing Corr. Cyl. 4 [deg] | Conditional RAM | Varies on both DMEs. Need addresses and physical-cylinder mapping. |
| 17 | (RAM) Load (Limit) [%] | Conditional RAM | Internal load limit, not ordinary calculated load. |
| 18 | (RAM) Load (Target) [%] | Conditional RAM | Internal target; not automatically equivalent to the non-RAM load target. |
| 19 | (RAM) Load Rf (Actual) [%] | Conditional RAM | Need exact internal variable and scaling. |
| 20 | (RAM) Load Rf_ist (Actual) [%] | Conditional RAM | Keep separate from Load Rf; the exported streams are not identical. |
| 22 | (RAM) Rel. Fill Limit (Flag) [-] | Conditional RAM | Need encoded-state or flag meanings, not just numeric display. |
| 23 | (RAM) Torque at Clutch (Actual) [Nm] | Conditional RAM | Different quantity from existing FES crankshaft torque. Confirm scope; do not sum matching DME values into an invented engine total. |
| 24 | (RAM) Torque at Clutch (Target) [Nm] | Conditional RAM | Need target definition and ECU scope. Zero DME2 throughout. |
| 25 | (RAM) Torque at Clutch Pre-DrivDynmcs (Target) [Nm] | Conditional RAM | Separate torque-control stage; do not merge with the other clutch-torque target. |

## Important mapping boundaries

| Area | Evidence and consequence |
| --- | --- |
| Eight-cylinder correction display | Local correction slots 1–4 vary on each DME, giving eight changing streams. This supports investigating them for the N63 V8's eight cylinders, but does not prove the physical-cylinder mapping. Slots 5–6 on each DME must not be presented as cylinders 9–12. |
| Advance versus correction | Ignition advance cannot substitute for ignition correction. They are separate quantities. |
| Knock | The aggregate knock indication does not provide per-cylinder knock voltage, energy or another per-cylinder metric. A label ending in `0-n` is not sufficient to establish event-counter semantics. |
| Misfires | The aggregate misfire streams rise to 2 and return to 0 during this log. Confirm counter window/reset behavior before interpreting totals or comparing with Mode 06. |
| Pressure | Distinguish absolute from gauge pressure, and pre-throttle from manifold pressure. Similar names do not establish equivalent sources. |
| Fuel trims | The CSV uses factor-like values around 1. Standard OBD trims use percentages. Confirm conversion rather than relabelling raw values. |
| Torque and power | Clutch torque is not automatically FES crankshaft torque. Turbine-model power is not engine horsepower. Mirrored ECU values must not be summed without confirmed scope. |
| Flags | Values include 65536 and 131072. Preserve full width and decode established bit meanings; do not treat these as percentages or one-byte booleans. |
| Zero or constant values | They do not independently prove a faulty source, a correct ROM address or a healthy component. |

## Acquisition mechanism and MGU implementation requirements

The prior native BM3 investigation found channel descriptors for diagnostic identifiers, RAM addresses, ECU targets, byte lengths/order, signedness, masks and conversions. Its acquisition code builds aggregate dynamic diagnostic identifiers and reads them back. The CSV contains none of those descriptors.

| Area | Established evidence | Remaining work |
| --- | --- | --- |
| Ordinary diagnostics | The current viewer supports UDS service `0x22` and OBD service `0x01`, with same-ECU multi-DID support under its batching conditions. | Confirm channel definitions, support, bank coverage and exact semantics. |
| BM3 aggregate acquisition | Native builders support `0x2C 01` for identifier-based definitions, `0x2C 02` for memory-based definitions, `0x2C 03` for clearing definitions, and `0x22 F3xx` for aggregate reads. | Implement a suitable backend; the current scalar viewer definitions are not a complete BM3 RAM acquisition path. |
| MGU transport overlap | Sibling `live_adjustments/bm3_protocol.js` expresses a memory-based `0x2C` definition followed by a `0x22 F301` read through `diag.physical` / TASU. | This proves request representability in code, not ECU acceptance, access permission or achieved logging rate on the vehicle. |
| ROM profiles | BM3 has ROM-scoped channel metadata. The sibling protocol also selects a profile from an identified ROM. | Obtain definitions matching the active firmware and relevant ECU targets. Do not guess addresses from labels or use a different ROM's layout. |
| ECU scope | The CSV has two ECU-labelled streams. BM3's native logging implementation supports per-target grouping/workers. | Confirm both diagnostic targets and each channel's bank-local, engine-wide or primary-DME-only scope. |
| Dynamic DID coordination | Existing sibling BM3 identification uses `F301`. Defining a dynamic DID changes temporary diagnostic state even when the purpose is reading data. | Coordinate ownership and cleanup; do not overwrite another user's or app's definition. This is not a requirement to perform tuning writes. |
| Flag decoding | The viewer's current bitmask support is one byte wide. | Extend decoding appropriately before exposing the wide torque-limit flag words. |
| Scheduling | The viewer configures a 100 ms focused poll interval, has one pending diagnostic operation and an eight-DID batching limit. | Treat these as implementation policies, not proven vehicle performance. Measure request latency, payload limits and per-channel freshness when vehicle execution is authorized. |
| Performance | This CSV averages 10.45 exported rows/s. BM3's grouped reads reduce separate-request overhead. | Equivalent MGU refresh rate is unproven. A row timestamp does not establish simultaneous fresh values for every channel. |

## Recommended implementation order

| Priority | Channels | Reason / prerequisite |
| --- | --- | --- |
| 1 | Existing basic measurements: RPM, speed, temperatures, pedal, gear, manifold pressure and actual fuel pressure | Reuse existing acquisition routes; confirm sources and bank coverage rather than adding duplicate or estimated values. |
| 2 | Both-bank IAT, boost actual/target, HPFP actual/target, lambda and trims | Useful gauge additions; resolve missing definitions and measurement semantics first. |
| 3 | Eight physical-cylinder timing corrections | The CSV contains eight changing local-slot streams. Obtain the ROM profile and physical-cylinder mapping before populating the viewer's correction rows. |
| 4 | Remaining applicable RAM measurements | Add only with verified definitions and full decoding metadata. |
| 5 | Limiter flags and turbine/torque model internals | Need flag meanings and model-stage semantics to avoid displaying misleading numbers. |

## Evidence references and limitations

| Source | Relevant evidence |
| --- | --- |
| [CSV export](../datalog_6ad087b6d142b737c45113f7.csv) | Channel names, paired ECU labels, values, constant streams, transitions and row cadence. |
| [Live Data Viewer definitions](../apps/live_data_viewer/definitions.js) | Existing quantities, configured diagnostic candidates and unavailable correction/knock/misfire rows. |
| [Live Data Viewer diagnostics](../apps/live_data_viewer/diagnostic.js) | Supported services, decoding constraints, batching and polling policies. |
| [Trip Data sources](../apps/trip_data/sources.js) | Reported gearbox signals. |
| [Sibling Car Vitals configuration](../../idrive7-apps/apps/car_vitals/app.json) | Boost, relative-air-charge and ignition-advance diagnostic candidates. |
| [Sibling standard catalog](../../idrive7-apps/apps/live_data/std.js) | Conventional OBD definitions for trims, lambda, MAF, load, throttle and related measurements. |
| [Sibling diagnostic runtime](../../idrive7-apps/kit/runtime/dids.js) | Generic diagnostic decoding and related Mode 06 support. |
| [Sibling BM3 protocol](../../idrive7-apps/apps/live_adjustments/bm3_protocol.js) | TASU requests, ROM-profile selection and dynamic-DID marker acquisition. |
| Prior native BM3 client inspection | Channel descriptor structure and aggregate diagnostic request builders. The complete active-vehicle channel catalog was not recovered. |
| [M850i limits and source review](BMW_M850I_LIMITS.md) | Documented N63 V8/two-DME architecture, physical-cylinder coverage caveats and owner configuration. |

This was a static source review and CSV analysis. No project code, tests, builds, linters, type checks, previews or vehicle diagnostic requests were run. Existing-route and candidate statuses are not on-car validation. No achievable MGU logging rate or complete 138-column live reproduction has been demonstrated.
