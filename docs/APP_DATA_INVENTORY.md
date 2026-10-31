# App displayed-data inventory

- **19 apps across the three sibling repositories.** Versions identify the inspected source/package.
- **Columns:** what is displayed, units, source file/input, retrieval/decoding/calculation. Settings, histories, diagnostic views and visible status/error fields are included.
- **Source notation:** paths are relative to this repo; each app supplies its source base. `archive.tgz:package/path` names a file inside the distributed archive. CDS/vehicle signals are live bus inputs; UDS addresses/DIDs are diagnostic reads. Byte offsets refer to the decoded data payload unless stated otherwise.
- **Availability:** a configured candidate is a fallback source, not an extra guaranteed sensor. Estimates, demo values, raw/unknown layouts, external phone imagery, unavailable values and accepted-versus-read-back commands are identified explicitly.

## Repository / app coverage

| Repository | Apps | App identifiers |
|---|---|---|
| idrive7-apps | 13 | car_vitals; edrive; warmup; redline; gforce; dyno; brake_test; draggy; dtc_scanner; service; live_adjustments; zf8hp; doom |
| idrive-apps | 1 | robertn_waze_cluster |
| car-apps | 5 | iteriodev_cardash; iteriodev_draggy; iteriodev_dtcscan; iteriodev_liveadjust; iteriodev_tailscale |

## Shared idrive7 decoding and display conventions

Source base: `../idrive7-apps/kit/runtime/`. Per-app rows below identify which of these inputs actually appear. Shared conversion definitions are not additional gauges.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Engine speed | rpm | `../idrive7-apps/kit/runtime/car.js` → `sharedCar`; `CDS.statusEngineSpeed2.actualValueRPMEngineCrankshaft` | Raw × 0.25; 65535 is missing. |
| Vehicle speed | km/h; mph | `../idrive7-apps/kit/runtime/car.js` → `sharedCar`; `Vehicle2.statusCarSpeed2.speedVehicleCentreOfGravity` | Raw / 64; 65535 is missing. mph = km/h × 0.621371. |
| Oil / coolant temperatures | °C; °F | `../idrive7-apps/kit/runtime/car.js` → `sharedCar`; `CDS.statusEngineTemperature.temperatureEngineOilDrive` / `.temperatureEngineDrive` | Raw − 48 °C; 255 is missing. °F = °C × 1.8 + 32. |
| Longitudinal / lateral acceleration | m/s²; g | `../idrive7-apps/kit/runtime/car.js` → `sharedCar`; `CDS2.statusLongitudinalAccelerationMassCenter` / `statusLateralAccelerationMassCenter` | Raw × 0.002 − 65 m/s²; 65535 is missing; divide by 9.80665 for g. |
| Engine crankshaft torque | Nm | `../idrive7-apps/kit/runtime/car.js` → `sharedCar`; `FES.statusActualValueTorque2.actualValueTorqueCrankshaft` | Raw × 0.5 − 1023.5. Reject 65535 / raw ≥ 4095; shared runtime clamps negative torque to zero. |
| Gear / selector | gear number; P/R/N/D | `../idrive7-apps/kit/runtime/car.js` → `gear` / `selector`; `VehicleInformation.statusGearboxDrive`; `DataPowerTrain2.statusGearSelectionDrive` | Maps named and numeric BMW enums; VehicleInformation G1…G10 → 1…10, R → −1, N/P → 0. Selector 1/2/3/4 → P/R/N/D; alternate powertrain enum N/R/P/NP/1…9 also decoded. |
| Estimated gear, where actual gear is absent | gear number; EST | `../idrive7-apps/kit/runtime/car.js` → `GearGuess` | Clusters rpm/(km/h) while rpm > 1100 and speed > 8 km/h. 5% ratio tolerance, >30 observations to trust a cluster; descending ratios become gears. It is an estimate, not ECU gear readback. |
| Missing / unavailable values | status; `--` | `../idrive7-apps/kit/runtime/gauges.js`; `../idrive7-apps/kit/runtime/signals.js` → subscriptions | Missing or invalid numeric values render as dashes, not zero. Signals are initially fetched and subscribed to; selected paths also poll. |
| Diagnostic reply / ECU source | hex; address; status | `../idrive7-apps/kit/runtime/diag.js`; `../idrive7-apps/kit/runtime/dids.js` | TASU transport uses tester 0xF2; response ECU is header byte 6 and nine transport header bytes are stripped. UDS 22 expects 62+DID; OBD 01 expects 41+PID. Decode data-relative offsets as big-endian integers unless a catalog explicitly selects little-endian; signed values use two’s complement. |
| Diagnostic candidate choice | source; status | `../idrive7-apps/kit/runtime/dids.js` → candidate reader | Attempts configured sources in order and accepts the first plausible successful decode; retries the most recently successful candidate first. Physical units remain configuration-specific. |
| Fault status | ACTIVE / WARNING / PENDING / STORED / HISTORY | `../idrive7-apps/kit/runtime/diag.js` → DTC parser / status | UDS 19 replies contain three code bytes plus status byte. Label precedence: bit 0x01, then 0x80, then 0x04, then 0x08, else HISTORY. |
| App version and current settings values | version; setting-specific units | `../idrive7-apps/kit/runtime/mgu.js` → settings overlay; `../idrive7-apps/kit/runtime/sheet.js`; each app’s `app.json` | Settings overlay displays `Version <SPEC.version>` and stored values, falling back to manifest defaults. Choice labels and numeric units are rendered from the manifest. Every app’s setting rows are listed below. |
| Demo indication and synthetic readings | DEMO / status; same units as real fields | Each app’s `demo.js` / `main.js`; shared `../idrive7-apps/kit/runtime/car.js` where used | Demo values are generated, not measured. Shared car runtime updates demo at 20 Hz; automatic demo waits five seconds without a provider/received sample, not merely a parked or temporarily unchanged signal. App-specific demo histories/records are identified below. |

## idrive7-apps / car_vitals — Car Vitals (2.21.2)

Source base: `../idrive7-apps/apps/car_vitals/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Engine speed and tachometer | rpm | `main.js` → Engine page; CDS engine-speed signal | Uses configured raw × 0.25; tach range comes from redline setting. Peak marker follows configured hold time. |
| Road speed | km/h; mph | `main.js` → speed card; Vehicle2 speed signal | Raw / 64, converted to selected unit; integer display is held at `speedRate`. |
| Crankshaft torque and peak | Nm; lb-ft | `main.js` → Engine page; FES actual crankshaft torque | Raw × 0.5 − 1023.5, invalid raw ≥ 4095 rejected. lb-ft = Nm × 0.737562; peak uses selected hold setting. |
| Engine power and peak | kW; hp; PS | `main.js` → `powerKw` / Engine page; FES power percentage or torque/rpm | Sport source: powerPct / 100 × configured maxPower in kW. Calculation source/fallback: torque × rpm / 9549. hp = kW × 1.34102; PS = kW × 1.35962. This is not wheel-dyno measurement. |
| Boost pressure and peak | bar; psi | `main.js` → boost selection / Engine page; `app.json` → config.scaling.boost / config.dme | Auto uses usable sport-display boost or diagnostic pressure; user may force source. FES scaling raw × 0.01 is explicitly a calibration guess. DME gauge boost = (absolute kPa − baro kPa) / 100; baro defaults to 101.3 kPa if absent. psi = bar × 14.5038. Warning above 85% of gauge scale. |
| Oil temperature | °C; °F | `main.js` → Thermals; CDS oil signal / DME fallback | CDS raw − 48; when missing/stale >15 s, diagnostic oil candidates raw − 40. Uses configured oilWarn. |
| Coolant temperature | °C; °F | `main.js` → Thermals; CDS coolant signal | Raw − 48 °C; standard Celsius/Fahrenheit conversion. |
| Gearbox oil temperature from vehicle bus | °C; °F | `main.js`; `BasicDataSet.valueTemperatureTransmissionOil` | Raw − 48. A value that never changes is rejected as unpopulated instead of displayed as a trustworthy temperature. |
| Gearbox oil temperature from EGS | °C; °F | `main.js`; `app.json` → config.dme.egs | Reads ECU 0x18: DID 6000 byte − 40; fallback DA12 byte − 48. DA12 is unconfirmed and must change before being accepted. |
| Ambient temperature | °C; °F | `main.js`; `EnvironmentalInformation.temperatureExterior` | Raw × 0.5 − 40 °C. |
| Intake / charge air temperature | °C; °F | `main.js` → Thermals; DME iat candidates | First plausible candidate: F40F, F477 at byte 1, or OBD 0F; raw − 40 °C. |
| Intake temperature above ambient | °C difference; °F difference | `main.js` → Thermals | Subtracts ambient from intake temperature; temperature-difference conversion does not add 32. |
| Thermal histories, minima and maxima | °C; °F; time | `main.js` → thermal history panels | Samples displayed temperatures once per second, retaining five minutes; calculates min/max over history. |
| High-pressure fuel rail pressure | bar; psi | `main.js` → Fuel & ignition; DME hpfp candidates | F423 or OBD 23: u16 × 0.1 bar; F459: u16 × 0.1 − 1 bar. Display conversion follows pressure setting. |
| Low-pressure fuel pressure | bar; psi | `main.js` → Fuel & ignition; DME lpfp candidates | F40A / OBD 0A byte × 0.03 bar; F422 / OBD 22 u16 × 0.00079 bar. These candidates do not all represent the same pressure reference; source notes are retained below. |
| Ignition timing advance | degrees before TDC | `main.js` → Fuel & ignition; OBD 0E / DID F40E | Byte × 0.5 − 64 degrees; cylinder-1 standard OBD timing advance. |
| Boost requested | bar; psi | `main.js` → boost control; DME boostTarget candidates | Reads absolute setpoint from 4AB0 / F470 / OBD 70, then subtracts barometric pressure and converts to gauge pressure. |
| Boost actual | bar; psi | `main.js` → boost control; DME boostActual candidates | Reads absolute actual pressure from 580B / F470 / OBD 70, then subtracts barometric pressure. |
| Boost actual-versus-requested difference | bar; psi | `main.js` → boost control | Compares decoded actual boost and target boost; not a separate sensor. |
| Requested relative air charge / load | % | `main.js` → load control; DME DID 480C | u16 × 0.0234375; BMW requested relative air charge, not simply throttle angle. |
| Actual relative air charge / load | % | `main.js` → load control; DME DID 5813 | Byte × 0.75. |
| Load difference / under-target indication | percentage points; status | `main.js` → load control | Compares actual and requested relative charge. Uses 10 percentage-point under-target tolerance under load and 40 at idle. |
| Fuel / timing histories and extrema | bar / psi; degrees; time | `main.js` → Fuel & ignition histories | Retains the same five-minute, one-sample-per-second history treatment for these displayed values. |
| Misfire total | count for current drive cycle | `main.js` → misfire panel; `../idrive7-apps/kit/runtime/dids.js` → Mode 06 | Reads OBD 06 MID A0/cylinder MIDs with TID 0C, with UDS F6 fallback; sums valid cylinder values. Values ≥65535 are invalid, not huge misfire counts. |
| Misfires per cylinder | count; cylinder number | `main.js` → misfire panel; DME Mode 06 | MIDs A2, A3, … represent cylinders 1, 2, …; MID A0 supplies cylinder count. Displays individual valid TID 0C results. |
| Current gear | P/R/N; gear number; EST | `main.js` → `gearText`; VehicleInformation / powertrain signals | Selector P/R/N takes precedence. Otherwise actual forward gear, falling back to ratio-cluster estimate marked EST. |
| Gearbox drive program | D / S / M | `main.js`; `MDrive.dataDisplayGearbox.displayProgramGearbox` | Maps vehicle drive-program state; combined with gear text rather than calculating a new gear. |
| xDrive / AWD setup | mode; unavailable qualifier | `main.js`; `MDrive.statusMSystem.statusAllWheelSetup` | Maps _4WD_STANDARD, _4WD_ALTERNATIV, _2WD and AWD sand mode. FUNCTION_NOT_AVAILABLE qualifier is displayed as unavailable rather than a valid mode. |
| Rear axle torque share | % | `main.js`; `BasicDataSet.valueDistributionLongitudinalTorqueRearAxisFrontAxis` | Raw × 0.01, provided qualifier is valid and data <10 s old. Falls back to transfer-case estimate where enabled. |
| Front axle torque share | % | `main.js` → xDrive card | 100 − rear share for vehicle-bus data. Transfer-case fallback calculates front Nm / (engine Nm × configured gear ratio); ratio list 5, 3.2, 2.143, 1.72, 1.313, 1, 0.823, 0.64. No converter multiplication or driveline-loss correction; explicitly estimated. |
| Front-axle torque used for fallback split | Nm; source / estimated qualifier | `main.js`; LMV ECU 0x19 DID DB32; config.xdrive.front | Signed u16-equivalent two’s-complement word at offset 0 × 0.25; accepts −200…2500 Nm. ≤5 Nm gives 100% rear; absent engine torque/gear leaves split unknown, with 2WD fallback to 100% rear. This is the split input, not an additional wheel-torque measurement. |
| Lateral acceleration | g | `main.js` → Chassis; CDS2 lateral acceleration | Raw × 0.002 − 65, then /9.80665. Learns standstill bias after >2 s, averaging up to 50 samples. |
| Longitudinal acceleration | g | `main.js` → Chassis; CDS2 longitudinal acceleration | Same conversion and standstill-bias treatment. |
| G-force position / recent trail | g; visual trail | `main.js` → Chassis G-meter | Plots longitudinal versus lateral acceleration, up to 60 recent positions; scale 1.5 g. |
| Optional-card availability / source / failure reason | status; source text | `main.js` → optional cards / boostWhy | Auto/show/hide settings affect missing cards. Distinguishes missing signal, unsupported DME, stale / implausible reply and source; three failed reads trigger roughly 30-second backoff. |
| Demo state | DEMO | `demo.js`; `main.js` | Synthetic 24-second driving lap; live and demo peaks are kept separate. |
| Tyre pressure — front left (FL) | bar; psi | `main.js` → tyre card; tyre-pressure actual signal / config.scaling.tyrePress | Raw × 0.1 in vehicle-configured BAR/KPA/PSI, normalized to bar then selected unit. If unit metadata is absent, plausibility bands infer it. Actual pressure must be 0.5…6 bar; invalid raw ≥65532 rejected. |
| Tyre target pressure — front left (FL) | bar; psi | `main.js` → tyre card; tyre-pressure target signal | Same input-unit normalization; valid target 1…6 bar. Actual/target <0.85 critical; <0.93 or >1.15 warning; otherwise normal. |
| Tyre temperature — front left (FL) | °C; °F | `main.js` → tyre card; config.scaling.tyreTemp | Raw − 40 in the vehicle’s temperature unit, converted internally to Celsius; reject outside −40…150 °C, then convert to selected display unit. |
| Tyre pressure — front right (FR) | bar; psi | `main.js` → tyre card; tyre-pressure actual signal / config.scaling.tyrePress | Raw × 0.1 in vehicle-configured BAR/KPA/PSI, normalized to bar then selected unit. If unit metadata is absent, plausibility bands infer it. Actual pressure must be 0.5…6 bar; invalid raw ≥65532 rejected. |
| Tyre target pressure — front right (FR) | bar; psi | `main.js` → tyre card; tyre-pressure target signal | Same input-unit normalization; valid target 1…6 bar. Actual/target <0.85 critical; <0.93 or >1.15 warning; otherwise normal. |
| Tyre temperature — front right (FR) | °C; °F | `main.js` → tyre card; config.scaling.tyreTemp | Raw − 40 in the vehicle’s temperature unit, converted internally to Celsius; reject outside −40…150 °C, then convert to selected display unit. |
| Tyre pressure — rear left (RL) | bar; psi | `main.js` → tyre card; tyre-pressure actual signal / config.scaling.tyrePress | Raw × 0.1 in vehicle-configured BAR/KPA/PSI, normalized to bar then selected unit. If unit metadata is absent, plausibility bands infer it. Actual pressure must be 0.5…6 bar; invalid raw ≥65532 rejected. |
| Tyre target pressure — rear left (RL) | bar; psi | `main.js` → tyre card; tyre-pressure target signal | Same input-unit normalization; valid target 1…6 bar. Actual/target <0.85 critical; <0.93 or >1.15 warning; otherwise normal. |
| Tyre temperature — rear left (RL) | °C; °F | `main.js` → tyre card; config.scaling.tyreTemp | Raw − 40 in the vehicle’s temperature unit, converted internally to Celsius; reject outside −40…150 °C, then convert to selected display unit. |
| Tyre pressure — rear right (RR) | bar; psi | `main.js` → tyre card; tyre-pressure actual signal / config.scaling.tyrePress | Raw × 0.1 in vehicle-configured BAR/KPA/PSI, normalized to bar then selected unit. If unit metadata is absent, plausibility bands infer it. Actual pressure must be 0.5…6 bar; invalid raw ≥65532 rejected. |
| Tyre target pressure — rear right (RR) | bar; psi | `main.js` → tyre card; tyre-pressure target signal | Same input-unit normalization; valid target 1…6 bar. Actual/target <0.85 critical; <0.93 or >1.15 warning; otherwise normal. |
| Tyre temperature — rear right (RR) | °C; °F | `main.js` → tyre card; config.scaling.tyreTemp | Raw − 40 in the vehicle’s temperature unit, converted internally to Celsius; reject outside −40…150 °C, then convert to selected display unit. |

### Diagnostic candidates (in configured fallback order)

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| iat, candidate 1 | °C | `app.json` → `config.dme.iat`; ECU 0x12, UDS 22 F40F | unsigned 1-byte BE at data offset 0; raw × 1 + (-40); valid -40…150. |
| iat, candidate 2 | °C | `app.json` → `config.dme.iat`; ECU 0x12, UDS 22 F477 | unsigned 1-byte BE at data offset 1; raw × 1 + (-40); valid -40…150. charge air cooler temperature, bank 1 sensor 1 |
| iat, candidate 3 | °C | `app.json` → `config.dme.iat`; ECU 0x12, OBD 01 0F | unsigned 1-byte BE at data offset 0; raw × 1 + (-40); valid -40…150. the same PID with OBD service 01, for engine units that refuse F40F with NRC 31 |
| hpfp, candidate 1 | bar | `app.json` → `config.dme.hpfp`; ECU 0x12, UDS 22 F423 | unsigned 2-byte BE at data offset 0; raw × 0.1 + (0); valid 0…500. fuel rail gauge pressure (direct injection), 10 kPa per bit |
| hpfp, candidate 2 | bar | `app.json` → `config.dme.hpfp`; ECU 0x12, UDS 22 F459 | unsigned 2-byte BE at data offset 0; raw × 0.1 + (-1); valid 0…500. fuel rail absolute pressure, 10 kPa per bit |
| hpfp, candidate 3 | bar | `app.json` → `config.dme.hpfp`; ECU 0x12, OBD 01 23 | unsigned 2-byte BE at data offset 0; raw × 0.1 + (0); valid 0…500. OBD service 01 PID 0x23 (same as F423) |
| lpfp, candidate 1 | bar | `app.json` → `config.dme.lpfp`; ECU 0x12, UDS 22 F40A | unsigned 1-byte BE at data offset 0; raw × 0.03 + (0); valid 0.5…8. fuel pressure (gauge), 3 kPa per bit |
| lpfp, candidate 2 | bar | `app.json` → `config.dme.lpfp`; ECU 0x12, UDS 22 F422 | unsigned 2-byte BE at data offset 0; raw × 0.00079 + (0); valid 0.5…15. fuel rail pressure relative to manifold, 0.079 kPa per bit |
| lpfp, candidate 3 | bar | `app.json` → `config.dme.lpfp`; ECU 0x12, OBD 01 0A | unsigned 1-byte BE at data offset 0; raw × 0.03 + (0); valid 0.5…8. OBD service 01 PID 0x0A (same as F40A) |
| lpfp, candidate 4 | bar | `app.json` → `config.dme.lpfp`; ECU 0x12, OBD 01 22 | unsigned 2-byte BE at data offset 0; raw × 0.00079 + (0); valid 0.5…15. OBD service 01 PID 0x22 (same as F422) |
| oil, candidate 1 | °C | `app.json` → `config.dme.oil`; ECU 0x12, OBD 01 5C | unsigned 1-byte BE at data offset 0; raw × 1 + (-40); valid -40…170. engine oil temperature, OBD service 01 PID 0x5C - only read while the car's own signal (CDS) sends none |
| oil, candidate 2 | °C | `app.json` → `config.dme.oil`; ECU 0x12, UDS 22 F45C | unsigned 1-byte BE at data offset 0; raw × 1 + (-40); valid -40…170. |
| boost, candidate 1 | kPa absolute | `app.json` → `config.dme.boost`; ECU 0x12, UDS 22 F470 | unsigned 2-byte BE at data offset 3; raw × 0.03125 + (0); valid 20…600. OBD PID 0x70 boost pressure control: actual boost pressure sensor A (absolute), 1/32 kPa |
| boost, candidate 2 | kPa absolute | `app.json` → `config.dme.boost`; ECU 0x12, UDS 22 F487 | unsigned 2-byte BE at data offset 1; raw × 0.03125 + (0); valid 20…600. OBD PID 0x87 intake manifold absolute pressure sensor A, 1/32 kPa |
| boost, candidate 3 | kPa absolute | `app.json` → `config.dme.boost`; ECU 0x12, UDS 22 F40B | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 20…255. OBD PID 0x0B intake manifold absolute pressure, kPa (max 255 = 1.5 bar boost) |
| boost, candidate 4 | kPa absolute | `app.json` → `config.dme.boost`; ECU 0x12, OBD 01 0B | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 20…255. OBD service 01 PID 0x0B (same as F40B) |
| baro, candidate 1 | kPa absolute | `app.json` → `config.dme.baro`; ECU 0x12, UDS 22 F433 | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 50…115. OBD PID 0x33 barometric pressure, kPa (101.3 when not available) |
| baro, candidate 2 | kPa absolute | `app.json` → `config.dme.baro`; ECU 0x12, OBD 01 33 | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 50…115. OBD service 01 PID 0x33 (same as F433) |
| boostTarget, candidate 1 | kPa absolute | `app.json` → `config.dme.boostTarget`; ECU 0x12, UDS 22 4AB0 | unsigned 2-byte BE at data offset 0; raw × 0.00390625 + (0); valid 20…400. BMW boost pressure setpoint (absolute), hPa = raw * 10 / 256 |
| boostTarget, candidate 2 | kPa absolute | `app.json` → `config.dme.boostTarget`; ECU 0x12, UDS 22 F470 | unsigned 2-byte BE at data offset 1; raw × 0.03125 + (0); valid 20…600. OBD PID 0x70: commanded boost pressure A (absolute), 1/32 kPa |
| boostTarget, candidate 3 | kPa absolute | `app.json` → `config.dme.boostTarget`; ECU 0x12, OBD 01 70 | unsigned 2-byte BE at data offset 1; raw × 0.03125 + (0); valid 20…600. OBD service 01 PID 0x70 (same as F470) |
| boostActual, candidate 1 | kPa absolute | `app.json` → `config.dme.boostActual`; ECU 0x12, UDS 22 580B | unsigned 2-byte BE at data offset 0; raw × 0.00390625 + (0); valid 20…400. BMW boost pressure actual (absolute), hPa = raw * 10 / 256 |
| boostActual, candidate 2 | kPa absolute | `app.json` → `config.dme.boostActual`; ECU 0x12, UDS 22 F470 | unsigned 2-byte BE at data offset 3; raw × 0.03125 + (0); valid 20…600. OBD PID 0x70: boost pressure sensor A (absolute), 1/32 kPa |
| boostActual, candidate 3 | kPa absolute | `app.json` → `config.dme.boostActual`; ECU 0x12, OBD 01 70 | unsigned 2-byte BE at data offset 3; raw × 0.03125 + (0); valid 20…600. OBD service 01 PID 0x70 (same as F470) |
| loadTarget, candidate 1 | % | `app.json` → `config.dme.loadTarget`; ECU 0x12, UDS 22 480C | unsigned 2-byte BE at data offset 0; raw × 0.0234375 + (0); valid 0…250. BMW requested relative air charge, % = raw * 0.75 / 32 |
| loadActual, candidate 1 | % | `app.json` → `config.dme.loadActual`; ECU 0x12, UDS 22 5813 | unsigned 1-byte BE at data offset 0; raw × 0.75 + (0); valid 0…191.25. BMW actual relative air charge, % = raw * 0.75 |
| timing, candidate 1 | degrees BTDC | `app.json` → `config.dme.timing`; ECU 0x12, OBD 01 0E | unsigned 1-byte BE at data offset 0; raw × 0.5 + (-64); valid -64…63.5. OBD service 01 PID 0x0E timing advance, degrees before TDC (cylinder 1) |
| timing, candidate 2 | degrees BTDC | `app.json` → `config.dme.timing`; ECU 0x12, UDS 22 F40E | unsigned 1-byte BE at data offset 0; raw × 0.5 + (-64); valid -64…63.5. the same PID over UDS 0x22 |
| egs, candidate 1 | °C | `app.json` → `config.dme.egs`; ECU 0x18, UDS 22 6000 | unsigned 1-byte BE at data offset 0; raw × 1 + (-40); valid -40…160. ZF 8HP (GSZFBCE) _GETRIEBEOELTEMPERATUR, deg C + 40 (idrive7-apps PR #29, read on a G22) |
| egs, candidate 2 | °C | `app.json` → `config.dme.egs`; ECU 0x18, UDS 22 DA12 | unsigned 1-byte BE at data offset 0; raw × 1 + (-48); valid -40…160. gearbox unit (EGS, 0x18) transmission oil temperature, deg C + 48 (from a forum report, not confirmed on a car: only shown once it changes; the replies go to the log, "raw EGS") |


### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Start page | choice / on-off | `app.json` → `settings[page]`; shared settings renderer | Persisted setting `page`; default `"engine"`. Choices: Engine (`engine`); Thermals (`thermal`); Fuel & ignition (`fuel`); Chassis (`chassis`). |
| Temperature | choice / on-off | `app.json` → `settings[tempUnit]`; shared settings renderer | Persisted setting `tempUnit`; default `"C"`. Choices: Celsius (`C`); Fahrenheit (`F`). |
| Pressure unit | choice / on-off | `app.json` → `settings[pressUnit]`; shared settings renderer | Persisted setting `pressUnit`; default `"bar"`. Choices: bar (`bar`); psi (`psi`). |
| Speed | choice / on-off | `app.json` → `settings[speedUnit]`; shared settings renderer | Persisted setting `speedUnit`; default `"kmh"`. Choices: km/h (`kmh`); mph (`mph`). |
| Redline | rpm | `app.json` → `settings[redline]`; shared settings renderer | Persisted setting `redline`; default `7000`. Selectable values: 4500, 5000, 5500, 6000, 6500, 7000, 7200, 7500, 8000. |
| Max power (100% on sport display) | kW | `app.json` → `settings[maxPower]`; shared settings renderer | Persisted setting `maxPower`; default `215`. Selectable values: 100, 120, 135, 140, 150, 160, 170, 185, 190, 200, 215, 230, 240, 250, 260, 275, 285, 300, 320, 340, 360, 375, 390, 405, 420, 450, 460, 480, 500, 530, 550, 600. |
| Power unit | choice / on-off | `app.json` → `settings[powerUnit]`; shared settings renderer | Persisted setting `powerUnit`; default `"kw"`. Choices: kW (`kw`); hp (`hp`); PS (`ps`). |
| Torque unit | choice / on-off | `app.json` → `settings[torqueUnit]`; shared settings renderer | Persisted setting `torqueUnit`; default `"nm"`. Choices: Nm (`nm`); lb-ft (`lbft`). |
| Power from | choice / on-off | `app.json` → `settings[powerSource]`; shared settings renderer | Persisted setting `powerSource`; default `"sport"`. Choices: Sport display (`sport`); Torque x rpm (`calc`). |
| Oil temp warning | °C | `app.json` → `settings[oilWarn]`; shared settings renderer | Persisted setting `oilWarn`; default `125`. Selectable values: 110, 115, 120, 125, 130, 135. |
| Show peak markers | choice / on-off | `app.json` → `settings[peaks]`; shared settings renderer | Persisted setting `peaks`; default `true`. Boolean toggle. |
| Peak hold | s | `app.json` → `settings[peakHold]`; shared settings renderer | Persisted setting `peakHold`; default `15`. Selectable values: 5, 10, 15, 30, 60. |
| xDrive card | choice / on-off | `app.json` → `settings[xdrive]`; shared settings renderer | Persisted setting `xdrive`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (RWD) (`off`). |
| Boost | choice / on-off | `app.json` → `settings[showBoost]`; shared settings renderer | Persisted setting `showBoost`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Boost from | choice / on-off | `app.json` → `settings[boostSource]`; shared settings renderer | Persisted setting `boostSource`; default `"auto"`. Choices: Auto (first that works) (`auto`); Sport display (`fes`); Engine unit (OBD) (`dme`). |
| Gearbox oil temperature | choice / on-off | `app.json` → `settings[showGearbox]`; shared settings renderer | Persisted setting `showGearbox`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Gearbox temperature (EGS) | choice / on-off | `app.json` → `settings[showEgs]`; shared settings renderer | Persisted setting `showEgs`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Intake air temperature | choice / on-off | `app.json` → `settings[showIat]`; shared settings renderer | Persisted setting `showIat`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| High pressure fuel | choice / on-off | `app.json` → `settings[showHpfp]`; shared settings renderer | Persisted setting `showHpfp`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Low pressure fuel | choice / on-off | `app.json` → `settings[showLpfp]`; shared settings renderer | Persisted setting `showLpfp`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Ignition timing | choice / on-off | `app.json` → `settings[showTiming]`; shared settings renderer | Persisted setting `showTiming`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Boost target vs actual | choice / on-off | `app.json` → `settings[showBoostCtl]`; shared settings renderer | Persisted setting `showBoostCtl`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Air charge req. vs actual | choice / on-off | `app.json` → `settings[showLoad]`; shared settings renderer | Persisted setting `showLoad`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Misfire counter | choice / on-off | `app.json` → `settings[showMisfire]`; shared settings renderer | Persisted setting `showMisfire`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Tyre card | choice / on-off | `app.json` → `settings[showTyres]`; shared settings renderer | Persisted setting `showTyres`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Tyre temperatures | choice / on-off | `app.json` → `settings[showTyreTemp]`; shared settings renderer | Persisted setting `showTyreTemp`; default `"auto"`. Choices: Auto (`auto`); Show (`on`); Hide (`off`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Speed display rate | fps | `app.json` → `settings[speedRate]`; shared settings renderer | Persisted setting `speedRate`; default `10`. Selectable values: 5, 10, 15, 30, 60. |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / edrive — eDrive (2.7.1)

Source base: `../idrive7-apps/apps/edrive/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| HV battery state of charge | % | `main.js` → Range / Charge; `live.js` → Battery; ECU 0x07 DID DDBC | u16 BE × 0.1, valid 0…100. Range page rounds to whole percent; cell panel shows one decimal. Battery icon is segmented SOC, warning below 25% and critical below 10%. |
| Estimated electric distance remaining | km; miles | `main.js` → `estimate` / `renderMain`; `range.js` → RangeModel | SOC above engine-start reserve divided by learned driving %/km plus hourly climate/comfort draw divided by pace. Learns electric-only use over roughly 60 km; requires at least 5 km and 2% SOC use. This is model output, not the car’s official range. |
| Electric range uncertainty band | km; miles | `main.js` → `estimate` / `renderMain` | Learned estimate ±10%; before learning, uses temperature-dependent low/high full-battery range scaled by usable SOC. |
| Estimated range at full charge | km; miles | `main.js` → `estimate`, Full bar | Uses learned km per SOC point × available SOC span; otherwise scales temperature curve by configured 20 °C full range. Default curve: −10 °C 20…30 km, 0 °C 30…38, 10 °C 40…45, 20 °C 50…50; warm capped at 20 °C, cold floor 30%. |
| Engine-start SOC reserve | % | `main.js` → `estimate`; `range.js` | Manual setting or learned median from at least two low-SOC moving engine starts, capped at 11%; default 8% before enough evidence. |
| Distance used to learn electric consumption | km; miles | `main.js` → `renderMain`; saved st.learn.km | Displays “learned from” distance; before learning displays “Learns while driving”. |
| Low-battery hybrid warning / light-throttle electric speed | % band; km/h or mph; status | `main.js` → `renderMain` | Low-SOC hybrid hold state displays typical 5…11% behavior and “electric up to” 62 km/h converted to user units. This is explanatory model behavior, not measured EV speed capability. |
| Engine running / battery assistance or charging while engine runs | status; % per 10 km or 10 miles | `main.js` → `renderMain`; `range.js` → `enginePctPerKm` | CDS rpm determines engine-on state. Learned SOC change versus distance with engine running becomes battery helps −% or charging +%; displays learning until a rate exists. |
| SOC reading age / missing charge status | elapsed time; status | `main.js` → `renderMain` / diagnostics | Shows stale read age, unavailable charge / diagnostic hint instead of treating missing SOC as zero. |
| 12 V system voltage | V | `main.js` → `render12V` / Charge; config.battery.v12 | UDS F442 or OBD 42 across configured engine/battery/transmission ECUs, u16 × 0.001, valid 5…18 V; two decimals. Hybrid page critical <11.8, warning <12.2 or >15.2 V. |
| 12 V voltage history | V; time | `main.js` → `render12V` | Keeps 120 samples at 30-second spacing, approximately one hour; plots actual observed voltage. |
| 12 V battery condition / charging state | status | `main.js` → `render12V` | Voltage thresholds: ≥13.2 charging, ≥12.6 full, ≥12.4 good, ≥12.2 half, otherwise low. This is a voltage classification, not battery SOH measurement. |
| 12 V-only / hybrid availability state | status | `main.js` → `isHybrid` / `render12V` | Hybrid setting and available HV data choose Range or 12 V-only view; unavailable hybrid data does not fabricate HV readings. |
| Ambient temperature | °C; °F | `main.js`; config.scaling.ambient; EnvironmentalInformation temperature | Raw × 0.5 − 40 °C; drives temperature-dependent range and climate estimates. |
| Battery state of health | % | `main.js` → `renderHealth`; ECU 0x07 DD7B / 6335 | First plausible byte 40…110%; cached according to sohDays. <80% warning, <70% critical. |
| Estimated present full battery capacity | kWh | `main.js` → `renderHealth` | Configured designKwh × SOH / 100; design capacity used when SOH unavailable. This is an estimate, not directly read usable capacity. |
| Estimated energy in battery / capacity | kWh | `main.js` → `renderHealth` / This drive | Present capacity × SOC / 100, paired with present full capacity. |
| Cell-panel approximate energy | kWh | `live.js` → `renderBattery` | SOC / 100 × designKwh. Unlike the health/This-drive energy estimate, this displayed approximation does not multiply by SOH. |
| HV pack voltage | V | `live.js` → `renderPowerPanel`; battery.fast.hvV | DDB4 / DD68 / DD66 u16 × 0.01, or DDEF u16 × 1, valid 150…500 V. SOME/IP LSCDataSink HV voltage fallback uses /10 when raw >1500. |
| HV pack current | A | `live.js` → `renderPowerPanel`; ECU 0x07 DD69 | Signed 32-bit BE × 0.01, valid −800…800 A. Display current = −decoded current × (powerSign < 0 ? 1 : −1), matching configured usage sign. |
| HV battery power / usage bar | kW | `live.js` → `power` / `powerBar` | Pack V × decoded A /1000 × powerSign (default −1). Positive means draw, negative means regen or stationary charging. User gaugeKw sets positive gauge extent. |
| Battery operating / read state | DRAW / REGEN / CHARGING / PAUSED / READING / NO LINK / NO REPLY | `live.js` → `power` | Uses signed power, approximately ±0.3 kW deadband, movement above 1 km/h and read/link state. Readings older than 1.5 s dim; parked status is not a valid zero-power reading. |
| Battery power history | kW; seconds | `live.js` → `powerTrace` / trace | Last 120 seconds; discontinuities above four seconds are blank gaps rather than connecting unavailable readings. |
| Maximum discharge power allowed now | kW | `live.js` → `limitsKw` / power bar; DD7D offset 2 | Discharge-current limit u16 × 0.1 A × current pack voltage /1000. |
| Maximum charge / regeneration power allowed now | kW | `live.js` → `limitsKw` / power bar; DD7D offset 0 | Charge-current limit u16 × 0.1 A × pack voltage /1000. Regen gauge uses available limit when ≥15 kW, otherwise max(10, gaugeKw × 0.5). |
| Every reported battery cell voltage | V; cell index | `live.js` → `renderBattery`; ECU 0x07 DFA5 | Repeated u16 BE × 0.001, valid 2.5…4.4 V. Renders one bar per received cell, indices and average reference line; cell count is response-derived, not hardcoded to 96. |
| Reported cell count | count | `live.js` → `renderBattery` | Length of decoded DFA5 cell array. |
| Lowest cell voltage and cell number | V; cell index | `live.js` → `renderBattery`; DFA5 / DDBF | Minimum over cell array and 1-based index. DDBF fallback supplies minimum u16 × 0.001 at offset 0, without inventing an index. |
| Highest cell voltage and cell number | V; cell index | `live.js` → `renderBattery`; DFA5 / DDBF | Maximum over array and 1-based index. DDBF fallback offset 2 supplies max voltage. |
| Cell voltage spread / balance assessment | mV; status | `live.js` → `renderBattery` | (Maximum − minimum) ×1000. >100 mV out of balance / critical; >50 high (normal under load) / warning; otherwise well balanced. |
| Battery / cell average temperature | °C; °F | `live.js` → `cellTemps` / `renderBattery`; `main.js` → health | DID DDC0 signed u16 word at offset 4 ×0.01 °C, or Efficiencytainment2 battery average raw −50 fallback. Cold below 5 °C, warning >38, critical >45. |
| Battery / cell minimum temperature | °C; °F | `live.js` → `cellTemps` / `renderBattery` | DDC0 signed word offset 0 ×0.01; bus fallback raw −50. |
| Battery / cell maximum temperature | °C; °F | `live.js` → `cellTemps` / `renderBattery` | DDC0 signed word offset 2 ×0.01; bus fallback raw −50. |
| This drive: energy used | kWh | `live.js` → `readPower` / `renderTripTall` | Time-integrates positive pack kW into trip.out. |
| This drive: regenerated energy | kWh | `live.js` → `readPower` / `renderTripTall` | Time-integrates negative pack power while moving; stationary charging is not counted as regeneration. |
| This drive: net / TOTAL energy | kWh | `live.js` → `renderTripTall` | Used − regen. Reset drive totals clears accumulators. |
| This drive: driving share | % of used energy | `live.js` → `renderTripTall` | max(0, used − min(climate,used)) / used; dashes before used >0.005 kWh. It is residual allocation, not motor-controller energy readback. |
| This drive: climate share | % of used energy | `live.js` → `readPower` / `renderTripTall` | Integrates estimated/measured climate power clamped to total positive pack draw; min(climate,used)/used. |
| Climate on/off, A/C and combined auxiliary draw | status; kW; km / miles lost | `main.js` → Range foot / `estimate`; `range.js` | Car climate state selects on/off/unknown. Learned temperature-band hourly consumption, or typical AUX_KW curve, plus comfort load; computes range difference with these consumers removed. Typical climate curve kW: −10°C 3, 0°C 2.2, 10°C 1, 18°C 0.5, 24°C 0.5, 30°C 1.2, 38°C 2. |
| Driving power allocation and speed / pace note | kW; km/h; mph; source label | `main.js` → `renderEnergy` | Moving >2 km/h engine-off: max(0, live pack power − climate − comfort − baseline). Otherwise learned %/km × energy-per-% × pace, or typical range-derived estimate. Note identifies live speed versus learned/typical pace. |
| Climate heating / A/C power allocation | kW; km / miles range cost; source label | `main.js` → `renderEnergy`; `live.js` → `climatePower` | Uses stationary engine-off battery draw minus baseline, climate-unit probes, retained prior measurement or model; subtracts separately listed seat/wheel comfort consumption. Labels from battery / climate unit / measured before / learned / typical. |
| Estimated blower contribution | kW | `main.js` → `blowerKw` / Energy note | 0.03 + 0.32 × (level / top)² when active, limited by climate allocation; explicitly approximate. |
| Seat-heating load and active zones / levels | kW; km / miles range cost; level | `main.js` → `comfortKw` / `renderEnergy`; Climate seat states DR, PS, DRR, PSR | Each seat level 0/1/2/3 estimated at 0/0.04/0.07/0.10 kW. Lists driver, passenger, rear-left and rear-right active levels and summed power; apportions comfort-related range loss. |
| Steering-wheel heating load / state | kW; km / miles range cost; on/off/n/a | `main.js` → `comfortKw` / `renderEnergy` | On adds estimated 0.06 kW; range cost is share of comfort cost. Unknown state shown n/a. |
| On-board electrics baseline | kW | `main.js` → `renderEnergy`; `range.js` / `live.js` baseline | Learned with climate/comfort off, default 0.35 kW. Allocation represents screens, units and pumps; not a dedicated measured circuit. |
| Range at current consumption rate | km; miles | `main.js` → `renderEnergy`; `live.js` → `consumption` | Energy above engine-start SOC reserve / recently measured kWh per km; falls back to model remaining range if unavailable. |
| Last / ongoing charge SOC gain | percentage points | `main.js` → Range charge panel / charge tracking | Stopped SOC rise ≥3 percentage points becomes a charge. Shows +gain and CHARGING while open; gaps ≥10 minutes allow overnight before/after detection. |
| Last charge starting and ending SOC | % | `main.js` → Range charge panel | Recorded before/after SOC; not charger-reported values. |
| Last charge estimated added range | km; miles | `main.js` → `kmOf` / Range charge panel | SOC gain × model km-per-SOC-point. |
| Last charge age | elapsed time | `main.js` → Range charge panel / `ago` | Current time − recorded charge end time. |
| Charge log: completion date / time | DD.MM HH:MM | `main.js` → `renderLog` | Local date/time of c.toT; newest first, keeps up to 200 charge records. |
| Charge log: added SOC | percentage points | `main.js` → `renderLog` | c.to − c.from, rounded whole percent. |
| Charge log: from / to SOC | % | `main.js` → `renderLog` | Recorded starting and ending SOC, rounded whole percent. |
| Charge log: energy added | kWh | `main.js` → charge tracking / `renderLog` | SOC gain × designKwh × SOH /10000. Battery-side estimate, not wall-meter energy. |
| Charge log: range added | km; miles | `main.js` → `kmOf` / `renderLog` | Model range corresponding to logged SOC increase. |
| Charge log: estimated cost | EUR | `main.js` → `money` / `renderLog` | Logged kWh ×1.10 assumed grid-loss factor × electricity-price setting; hidden when price is zero. |
| This month / all-time charge energy totals | kWh | `main.js` → `renderLog` | Sums logged charge energy; this-month filter starts local first day of current month. |
| This month / all-time charge count | count | `main.js` → `renderLog` | Number of included charge records, not estimated charging sessions outside retained history. |
| This month / all-time added range totals | km; miles | `main.js` → `renderLog` | Applies kmOf to summed SOC gains. |
| This month / all-time cost totals | EUR | `main.js` → `money` / `renderLog` | Summed recorded energy ×1.10 × current configured price. |
| Daily charging history | kWh per day; 14 days | `main.js` → `renderLog` | Bins logged energy by local calendar day over last 14 days. |
| SOC / SOH / 12 V candidate diagnostic rows | value; ECU hex; DID; reply hex; status; elapsed age | `main.js` → `renderDiag` | Each configured candidate displays ECU/DID, raw reply, decoded number, failure/status and reading age; selected successful source is marked *. Replies/status are truncated to fit. |
| HV battery unit diagnostic rows | value; ECU hex; DID; raw hex; decoded fields; status | `live.js` → `renderUnit` | Every fast/slow candidate is listed; selected source marked *. Shows truncated raw bytes and per-field decoded values, including voltage/current, SOC, cell temperatures, coolant and limits. |
| Battery coolant diagnostic value | °C | `live.js` → `renderUnit`; ECU 0x07 DD6C | Signed 16-bit BE ×0.01; plausible −40…100 °C. Appears in decoded diagnostics rather than a separate main-page coolant gauge. |
| Read performance / link / missed reads / sign / baseline | reads/s; ms/read; counts; sign; kW; sample count | `live.js` → `renderUnit` | Measured read-rate and durations; missed fast/slow counts, diagnostic availability, powerSign, learned baseline and number of baseline samples. |
| Raw signal and climate diagnostic values | raw values / JSON; levels; km/h; °C; V | `main.js` → `renderSignals` | Displays climate state, blower level/top, four seat zones, steering heating, pace, battery avg/min/max and HV voltage; raw climate/A/C/compressor payloads and sorted raw signals, up to 14 fitting rows with text truncation. |
| Diagnostic scan progress and responding DID records | ECU/DID hex; counts; raw bytes; status | `live.js` → Scan / comparison | Battery scans DD00…DDFF, DF00…DFFF, D600…D6FF, 6300…63FF; IHKA scans D000…DFFF and 4000…41FF. Displays replies, hits/no answers/progress and byte changes versus baseline. |
| Scan voltage-like interpretations | possible mV / V; unconfirmed hints | `live.js` → Scan | Heuristically flags words 3000…4300 as possible cell mV and 20000…46000 as possible pack voltage /100. Not confirmed signal definitions. |
| Home-screen widget values | kW; V; A; %; °C/°F; kWh; status | `live.js` → `widgetCells` / canvas widgets | Repeats power/state, pack voltage/current, SOC, battery temperature, net drive energy and regen using the same decoding as full pages, at configured widgetFps. |
| Demo state | DEMO | `main.js`; `main.js`; `live.js` | Synthetic SOC, SOH, cell values, power trace, charge log and trip totals; not measurements. |

### Diagnostic candidates and fields

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| soc / value, candidate 1 | % | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDBC | unsigned 2-byte BE at data offset 0; raw × 0.1 + (0); valid 0…100. |
| soh / value, candidate 1 | % | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD7B | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 40…110. |
| soh / value, candidate 2 | % | `app.json` → `config.battery`; ECU 0x07, UDS 22 6335 | unsigned 1-byte BE at data offset 0; raw × 1 + (0); valid 40…110. |
| v12 / value, candidate 1 | V | `app.json` → `config.battery`; ECU 0x12, UDS 22 F442 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 2 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 F442 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 3 | V | `app.json` → `config.battery`; ECU 0x12, OBD 01 42 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 4 | V | `app.json` → `config.battery`; ECU 0x13, UDS 22 F442 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 5 | V | `app.json` → `config.battery`; ECU 0x13, OBD 01 42 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 6 | V | `app.json` → `config.battery`; ECU 0x18, UDS 22 F442 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| v12 / value, candidate 7 | V | `app.json` → `config.battery`; ECU 0x18, OBD 01 42 | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 5…18. |
| hvV / v, candidate 1 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDB4 | unsigned 2-byte BE at data offset 0; raw × 0.01 + (0); valid 150…500. |
| hvV / v, candidate 2 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD68 | unsigned 2-byte BE at data offset 0; raw × 0.01 + (0); valid 150…500. |
| hvV / v, candidate 3 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD66 | unsigned 2-byte BE at data offset 0; raw × 0.01 + (0); valid 150…500. |
| hvV / v, candidate 4 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDEF | unsigned 2-byte BE at data offset 0; raw × 1 + (0); valid 150…500. |
| hvI / a, candidate 1 | A | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD69 | signed 4-byte BE at data offset 0; raw × 0.01 + (0); valid -800…800. |
| soc / pct, candidate 1 | % | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDBC | unsigned 2-byte BE at data offset 0; raw × 0.1 + (0); valid 0…100. |
| cellV / array, candidate 1 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DFA5 | Repeated array of unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 2.5…4.4. |
| cellV / min, candidate 2 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDBF | unsigned 2-byte BE at data offset 0; raw × 0.001 + (0); valid 2.5…4.4. |
| cellV / max, candidate 2 | V | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDBF | unsigned 2-byte BE at data offset 2; raw × 0.001 + (0); valid 2.5…4.4. |
| cellT / min, candidate 1 | °C | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDC0 | signed 2-byte BE at data offset 0; raw × 0.01 + (0); valid -40…80. |
| cellT / max, candidate 1 | °C | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDC0 | signed 2-byte BE at data offset 2; raw × 0.01 + (0); valid -40…80. |
| cellT / avg, candidate 1 | °C | `app.json` → `config.battery`; ECU 0x07, UDS 22 DDC0 | signed 2-byte BE at data offset 4; raw × 0.01 + (0); valid -40…80. |
| coolant / t, candidate 1 | °C | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD6C | signed 2-byte BE at data offset 0; raw × 0.01 + (0); valid -40…100. |
| limits / chargeA, candidate 1 | A | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD7D | unsigned 2-byte BE at data offset 0; raw × 0.1 + (0); valid 0…1000. |
| limits / dischargeA, candidate 1 | A | `app.json` → `config.battery`; ECU 0x07, UDS 22 DD7D | unsigned 2-byte BE at data offset 2; raw × 0.1 + (0); valid 0…1000. |
| ac climate probe | kW | `app.json` → `config.probes`; ECU 0x78, UDS 22 D8D2 | Unsigned 2-byte BE at data offset 1 × 0.001. IHKA: A/C compressor power in W (X5 45e: 280-680 W on LO) |
| heater climate probe | kW | `app.json` → `config.probes`; ECU 0x78, UDS 22 D8D3 | Unsigned 2-byte BE at data offset 1 × 0.001. IHKA: HV heater power in W (X5 45e: 5520 W on HIGH, matched the battery measurement) |


### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Electric range when full, 20 °C | km | `app.json` → `settings[range20]`; shared settings renderer | Persisted setting `range20`; default `50`. Selectable values: 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100. |
| Engine starts at | choice / on-off | `app.json` → `settings[reserve]`; shared settings renderer | Persisted setting `reserve`; default `"auto"`. Choices: Auto (learned) (`auto`); 0 % (`0`); 4 % (`4`); 5 % (`5`); 6 % (`6`); 7 % (`7`); 8 % (`8`); 9 % (`9`); 10 % (`10`); 12 % (`12`); 15 % (`15`). |
| Hybrid system | choice / on-off | `app.json` → `settings[hybrid]`; shared settings renderer | Persisted setting `hybrid`; default `"auto"`. Choices: Auto (`auto`); Yes (`yes`); No (12 V only) (`no`). |
| Battery size when new (gross) | kWh | `app.json` → `settings[designKwh]`; shared settings renderer | Persisted setting `designKwh`; default `12`. Selectable values: 7.6, 9.2, 10.4, 11.2, 12, 14.1, 17.7, 19.4, 24, 25.7, 42.2. |
| Electricity price | EUR/kWh | `app.json` → `settings[price]`; shared settings renderer | Persisted setting `price`; default `0.25`. Selectable values: 0, 0.05, 0.1, 0.12, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7. |
| Distance unit | choice / on-off | `app.json` → `settings[distUnit]`; shared settings renderer | Persisted setting `distUnit`; default `"km"`. Choices: km (`km`); miles (`mi`). |
| Temperature unit | choice / on-off | `app.json` → `settings[tempUnit]`; shared settings renderer | Persisted setting `tempUnit`; default `"c"`. Choices: Celsius (`c`); Fahrenheit (`f`). |
| Read charge every | s | `app.json` → `settings[poll]`; shared settings renderer | Persisted setting `poll`; default `15`. Selectable values: 5, 10, 15, 30, 60. |
| Read battery health every | days | `app.json` → `settings[sohDays]`; shared settings renderer | Persisted setting `sohDays`; default `7`. Selectable values: 1, 7, 30. |
| Diagnostics pages (UDS replies, scan, raw signals) | choice / on-off | `app.json` → `settings[diagPage]`; shared settings renderer | Persisted setting `diagPage`; default `false`. Boolean toggle. |
| Power gauge up to | kW | `app.json` → `settings[gaugeKw]`; shared settings renderer | Persisted setting `gaugeKw`; default `100`. Selectable values: 60, 80, 100, 120, 150. |
| Home-screen widget: redraw per second | fps | `app.json` → `settings[widgetFps]`; shared settings renderer | Persisted setting `widgetFps`; default `8`. Selectable values: 2, 4, 8, 12. |
| Read cells, temperatures, limits every | s | `app.json` → `settings[slowPoll]`; shared settings renderer | Persisted setting `slowPoll`; default `5`. Selectable values: 2, 5, 10, 30. |
| Scan page: control unit | choice / on-off | `app.json` → `settings[scanUnit]`; shared settings renderer | Persisted setting `scanUnit`; default `"7"`. Choices: Battery (SME 0x07) (`7`); Climate, heater, A/C (IHKA 0x78) (`120`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / warmup — Warm-up (1.6.14)

Source base: `../idrive7-apps/apps/warmup/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Engine oil temperature | °C; °F | `main.js`; sharedCar CDS oil temperature | Raw −48 °C; converts to selected temperature unit; primary warm-up input. |
| Coolant temperature | °C; °F | `main.js`; sharedCar CDS coolant temperature | Raw −48 °C; displayed alongside oil rather than substituted for it. |
| Oil warm-up state | NO OIL TEMP / COLD / WARMING UP / READY / OIL HOT - EASE OFF / TURBO COOL-DOWN / COOLED - OK TO SWITCH OFF | `main.js` → warm-up state | Uses configured warm oil temperature, its preceding 20 °C band, and >125 °C hot threshold; missing oil remains unavailable. |
| Time until oil is warm | minutes; READY / engine off / not warming | `main.js` → eta / measured / etaRow | Fits last three minutes of oil temperatures by least squares once four points exist; before that uses typical idle/driving rate. Blends typical and measured rates over first two minutes, then projects (warmOil − oil) / rate. Shows >60 min, READY, ENGINE OFF below300 rpm, NOT WARMING for established slope <0.15 °C/min, or missing. |
| Time until coolant is warm | minutes; READY / ENGINE OFF / NOT WARMING / missing | `main.js` → eta("coolant") / etaRow | Same estimation algorithm as oil, but fits coolant samples independently and targets configured warmCoolant. Not substituted for oil readiness or safe RPM limit. |
| Suggested safe RPM limit | rpm | `main.js` → safe-RPM calculation | Interpolates from configured cold limit at 30 °C oil to configured redline at warm threshold, rounded to 100 rpm. Advisory estimate, not an ECU-imposed limiter. |
| Oil / coolant temperature histories | °C; °F; minutes | `main.js` → history rendering | Five-second samples; 240 points retain 20 minutes. |
| Projected oil and coolant warm-up trends | °C; °F; next five minutes | `main.js` → eta / trend rendering | Separate dashed projections from each fluid’s fitted/modelled warm-up slope toward warmOil / warmCoolant; not future measured temperatures. |
| Cooldown requirement / remaining time / completion | seconds; status | `main.js` → cooldown state | Hard use: rpm >3800 or calculated power >90 kW. Gentle: rpm <2800 and power <40 kW. Power=max(0, torque ×rpm/9549). After >8 s hard use, requirement clamp(30+hardSeconds×3,30,180). Gentle time counts it down; completion persists 20 s. |
| Demo indication | DEMO | `main.js` / `main.js` | Synthetic engine temperatures and driving state, not actual oil warm-up. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Oil is warm at | °C | `app.json` → `settings[warmOil]`; shared settings renderer | Persisted setting `warmOil`; default `80`. Selectable values: 60, 70, 75, 80, 85, 90, 100. |
| Coolant is warm at | °C | `app.json` → `settings[warmCoolant]`; shared settings renderer | Persisted setting `warmCoolant`; default `80`. Selectable values: 60, 70, 75, 80, 85, 90. |
| Rev limit when cold | rpm | `app.json` → `settings[coldLimit]`; shared settings renderer | Persisted setting `coldLimit`; default `3500`. Selectable values: 2500, 3000, 3500, 4000, 4500. |
| Redline | rpm | `app.json` → `settings[redline]`; shared settings renderer | Persisted setting `redline`; default `7000`. Selectable values: 4500, 5000, 5500, 6000, 6500, 7000, 7200, 7500, 8000, 8500, 9000. |
| Turbo cool-down after hard driving | choice / on-off | `app.json` → `settings[cooldown]`; shared settings renderer | Persisted setting `cooldown`; default `true`. Boolean toggle. |
| Temperature unit | choice / on-off | `app.json` → `settings[tempUnit]`; shared settings renderer | Persisted setting `tempUnit`; default `"c"`. Choices: Celsius (`c`); Fahrenheit (`f`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / redline — Redline (1.10.14)

Source base: `../idrive7-apps/apps/redline/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Engine speed / tachometer | rpm | `main.js`; sharedCar rpm | CDS raw ×0.25; segmented tachometer at 500-rpm spacing. |
| Shift-light progression | 12 LEDs; rpm thresholds | `main.js` → shift-light rendering | Twelve lights span the 2000 rpm before current shift target; flash at target. |
| Current shift target | rpm | `main.js` → target calculation | Configured redline − shiftBefore. With cold guard, interpolates configured cold limit at oil 30 °C to warm target at configured warm temperature; rounds to 50 rpm. |
| Gear and gearbox stage / estimate marker | gear; P/R/N/D/S/M; EST | `main.js`; sharedCar gear / selector / GearGuess | Decoded actual gear and drive program where available; ratio-derived fallback is marked estimated. |
| Vehicle speed | km/h; mph | `main.js`; sharedCar speed | Vehicle2 raw /64, converted to selected unit. |
| Oil temperature / cold warning | °C | `main.js`; sharedCar oil temperature | CDS raw −48; cold-guard / oil-warm threshold governs warning and shift target. |
| Coolant / water temperature | °C | `main.js`; sharedCar coolant temperature | CDS raw −48. |
| Peak engine speed | rpm | `main.js` → peak tracking | Highest observed RPM; optional configured peak expiry. Demo and real-session records are separate. |
| Limiter encounters | count | `main.js` → limiter tracking | Increments on entering rpm ≥ redline−60; does not count every sample above threshold. |
| Last upshift RPM | rpm | `main.js` → shift detection | Gear advance, or >18% RPM drop within 0.4 s while moving; takes maximum RPM from preceding 600 ms. |
| Last shift verdict | EARLY / SPOT ON / LATE / LIMITER / COLD REV | `main.js` → shift grading | Compares detected shift RPM with active target: early below target−250, late above target+200, limiter at redline−60; cold-rev grading also uses cold guard. |
| Shift log date/time and from/to gear | timestamp; gears | `main.js` → shift log | Retains up to 60 detected shifts, with local event time and available gear transition. |
| Shift log RPM / target / verdict | rpm; category | `main.js` → shift log | Stores observed shift RPM, target at that event and resulting grade; does not recalculate old shifts using new settings. |
| Shift accuracy | % | `main.js` → statistics | SPOT ON shifts / graded shifts ×100. |
| Counts by shift verdict | count per five categories | `main.js` → statistics | Aggregates EARLY, SPOT ON, LATE, LIMITER and COLD REV results. |
| Average shift offset | rpm | `main.js` → statistics | Mean shift RPM − target over recent 30 shifts. |
| Session maximum speed | km/h; mph | `main.js` → statistics | Maximum speed observed in current session. |
| Demo indication | DEMO | `main.js`; `main.js` | Generated driving / shifts; separate statistics from live input. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Redline | rpm | `app.json` → `settings[redline]`; shared settings renderer | Persisted setting `redline`; default `7000`. Selectable values: 4500, 5000, 5500, 6000, 6500, 7000, 7200, 7500, 7800, 8000, 8500, 9000. |
| Shift point before redline | rpm | `app.json` → `settings[shiftBefore]`; shared settings renderer | Persisted setting `shiftBefore`; default `300`. Selectable values: 0, 100, 200, 300, 500, 800, 1000. |
| Shift light style | choice / on-off | `app.json` → `settings[lights]`; shared settings renderer | Persisted setting `lights`; default `"m"`. Choices: M (green-yellow-red) (`m`); Race (green-red-blue) (`f1`); Theme colour (`mono`). |
| Blink and flash at shift point | choice / on-off | `app.json` → `settings[flash]`; shared settings renderer | Persisted setting `flash`; default `false`. Boolean toggle. |
| Cold-engine rev guard | choice / on-off | `app.json` → `settings[coldGuard]`; shared settings renderer | Persisted setting `coldGuard`; default `true`. Boolean toggle. |
| Cold rev limit | rpm | `app.json` → `settings[coldLimit]`; shared settings renderer | Persisted setting `coldLimit`; default `4500`. Selectable values: 2500, 3000, 3500, 4000, 4500, 5000, 5500. |
| Oil warm at | °C | `app.json` → `settings[warmOil]`; shared settings renderer | Persisted setting `warmOil`; default `80`. Selectable values: 60, 70, 80, 90. |
| Units | choice / on-off | `app.json` → `settings[speedUnit]`; shared settings renderer | Persisted setting `speedUnit`; default `"kmh"`. Choices: km/h (`kmh`); mph (`mph`). |
| Peak hold (0 = until reset) | s | `app.json` → `settings[peakHold]`; shared settings renderer | Persisted setting `peakHold`; default `15`. Selectable values: 0, 5, 10, 15, 30, 60. |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Speed display rate | fps | `app.json` → `settings[speedRate]`; shared settings renderer | Persisted setting `speedRate`; default `10`. Selectable values: 5, 10, 15, 30, 60. |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / gforce — G-force (1.6.14)

Source base: `../idrive7-apps/apps/gforce/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Lateral G-force | g | `main.js`; sharedCar lateral acceleration | (raw×0.002−65)/9.80665; optional axis flip. Rejects magnitudes >3 g; 150-ms smoothing. |
| Longitudinal G-force | g | `main.js`; sharedCar longitudinal acceleration | Same scaling, rejection and smoothing as lateral axis; acceleration versus braking keeps sign. |
| Combined G-force | g | `main.js` → vector calculation | hypot(lateralG,longitudinalG). |
| G-meter point and trail | g; recent positions | `main.js` → plot | Plots lateral against longitudinal g; recent trail length controlled by setting. |
| Directional envelope | g; 48 directional sectors | `main.js` → envelope | Keeps peak resultant g by angular sector; shows reached acceleration envelope. |
| Directional acceleration / braking / left / right bars | g | `main.js` → bars | Signed axes converted to their directional positive magnitudes. |
| Current speed | km/h; mph | `main.js`; sharedCar speed | Vehicle2 raw /64; converts selected unit. |
| Current engine speed | rpm | `main.js`; sharedCar rpm | CDS raw ×0.25. |
| Session launch / acceleration peak | g | `main.js` → session stats | Largest positive longitudinal g. |
| Session braking peak | g | `main.js` → session stats | Largest braking magnitude. |
| Session left cornering peak | g | `main.js` → session stats | Largest lateral magnitude on left side after configured orientation. |
| Session right cornering peak | g | `main.js` → session stats | Largest lateral magnitude on right side. |
| Session vector peak | g | `main.js` → session stats | Maximum hypot of both axes. |
| Time above 0.5 g | seconds | `main.js` → session stats | Accumulates sample intervals above threshold, capped at 250 ms per sample to avoid long-gap inflation. |
| Session top speed | km/h; mph | `main.js` → session stats | Maximum observed vehicle speed. |
| Session maximum RPM | rpm | `main.js` → session stats | Maximum observed engine speed. |
| Session duration | minutes | `main.js` → session stats | Elapsed session time. |
| All-time launch / stop / left / right / combined records | g; record date | `main.js` → persisted records | Each direction/vector record is retained with date; reset action clears records. |
| All-time top speed | km/h; mph; record date | `main.js` → persisted records | Highest observed speed and date, converted at display time. |
| Demo indication / demo records | DEMO | `main.js`; `main.js` | Synthetic accelerations; demo record changes stay in memory rather than overwriting real all-time records. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Circle size | g | `app.json` → `settings[scale]`; shared settings renderer | Persisted setting `scale`; default `1.5`. Selectable values: 1.0, 1.5, 2.0. |
| Trail length | s | `app.json` → `settings[trail]`; shared settings renderer | Persisted setting `trail`; default `4`. Selectable values: 2, 4, 8, 15. |
| Swap left / right | choice / on-off | `app.json` → `settings[flipLat]`; shared settings renderer | Persisted setting `flipLat`; default `false`. Boolean toggle. |
| Units | choice / on-off | `app.json` → `settings[speedUnit]`; shared settings renderer | Persisted setting `speedUnit`; default `"kmh"`. Choices: km/h (`kmh`); mph (`mph`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| G-force display rate | fps | `app.json` → `settings[gRate]`; shared settings renderer | Persisted setting `gRate`; default `10`. Selectable values: 5, 10, 15, 30, 60. |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / dyno — Dyno (1.4.14)

Source base: `../idrive7-apps/apps/dyno/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Estimated crankshaft power curve | hp; PS; kW | `main.js` → pull processing | wheelW = mass×acceleration×speed + 0.5×airDensity×CdA×speed³ + Crr×mass×9.80665×speed, with speed m/s; crankW=wheelW/(1−lossPercent/100). Converts W to chosen power unit. Model estimate from acceleration, not a measured dyno. |
| Estimated crankshaft torque curve | Nm; lb-ft | `main.js` → curve calculation | Torque = crankW / (rpm×π/30); lb-ft conversion. Samples averaged in 100-rpm bins; power gets five-bin smoothing before curve/torque derivation. |
| Peak estimated power | hp; PS; kW | `main.js` → pull results | Maximum smoothed crankshaft power over accepted run. |
| RPM at peak power | rpm | `main.js` → pull results | RPM bin corresponding to power maximum. |
| Peak estimated torque | Nm; lb-ft | `main.js` → pull results | Maximum derived torque over accepted run. |
| RPM at peak torque | rpm | `main.js` → pull results | RPM bin corresponding to torque maximum. |
| Wheel-equivalent power | hp; PS; kW | `main.js` → result summary | Crank estimate ×(1−configured loss%); not independently measured wheel power. |
| ECU torque overlay | Nm; lb-ft | `main.js`; sharedCar FES torque | Optional overlay of decoded actual crankshaft torque, raw×0.5−1023.5, alongside acceleration-derived curve. |
| Reference / baseline curves | power; torque; rpm | `main.js` → saved baseline rendering | Plots selected saved run as comparison; same unit conversion as active curve. |
| Power change from baseline | power units; comparison | `main.js` → comparison | Compares current peak power against selected saved baseline. |
| Run state / suitability / too-short result | status | `main.js` → pull recorder | Records when acceleration >0.12 g, speed >15 km/h and rpm >1200. >4% rpm/speed-ratio change splits gear segment; stops after 500 ms outside pull. Selects lowest-ratio segment with ≥1500-rpm span and >15 points; otherwise too short. |
| Live engine speed | rpm | `main.js`; sharedCar rpm | CDS raw×0.25, also x-axis input for run curves. |
| Saved-run date and peaks | date; power; torque; rpm | `main.js` → saved runs | Keeps 20 runs, including peak values and associated RPM. |
| Saved-run speed range | km/h; mph | `main.js` → saved runs | Minimum / maximum speed in selected recorded run segment. |
| Saved-run vehicle setup | kg; % loss; aerodynamic / rolling parameters | `main.js` → saved runs | Captures configured vehicle mass and loss/setup with run rather than presenting them as measured data. |
| Demo indication | DEMO | `main.js`; `main.js` | Synthetic pulls and curves; separate from real run store. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Weight with driver + fuel | kg | `app.json` → `settings[weight]`; shared settings renderer | Persisted setting `weight`; default `1750`. Selectable values: 1300, 1400, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900, 1950, 2000, 2100, 2200, 2300, 2400, 2500. |
| Body shape (air drag) | choice / on-off | `app.json` → `settings[body]`; shared settings renderer | Persisted setting `body`; default `"coupe"`. Choices: Coupe / sedan (`coupe`); Touring / hatch (`wagon`); SUV (`suv`). |
| Drivetrain loss | % | `app.json` → `settings[loss]`; shared settings renderer | Persisted setting `loss`; default `15`. Selectable values: 0, 10, 12, 15, 18, 20, 25. |
| Power unit | choice / on-off | `app.json` → `settings[powerUnit]`; shared settings renderer | Persisted setting `powerUnit`; default `"hp"`. Choices: hp (`hp`); PS (`ps`); kW (`kw`). |
| Torque unit | choice / on-off | `app.json` → `settings[torqueUnit]`; shared settings renderer | Persisted setting `torqueUnit`; default `"nm"`. Choices: Nm (`nm`); lb-ft (`lbft`). |
| Graph up to | rpm | `app.json` → `settings[maxRpm]`; shared settings renderer | Persisted setting `maxRpm`; default `7500`. Selectable values: 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 9000. |
| Overlay ECU torque | choice / on-off | `app.json` → `settings[ecuTorque]`; shared settings renderer | Persisted setting `ecuTorque`; default `true`. Boolean toggle. |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / brake_test — Brake Test (1.5.14)

Source base: `../idrive7-apps/apps/brake_test/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Current speed | km/h; mph | `main.js`; sharedCar speed | Vehicle2 raw/64, converted; digital display held 100 ms. |
| Current longitudinal acceleration | g | `main.js`; sharedCar longitudinal acceleration | (raw×0.002−65)/9.80665; signed two-decimal display. |
| Braking deceleration | g | `main.js` → braking calculation | Negative of longitudinal g; positive means braking. |
| Test state / start-speed instruction | status; km/h; mph | `main.js` → test state | GET ABOVE threshold+3, BRAKE HARD, STOPPING and STOPPED follow speed and configured deceleration trigger. Metric thresholds 200→0 and 100→0 km/h; imperial 100→0 and 60→0 mph. |
| Primary stopping distance | m; ft | `main.js` → stop integration | Integrates trapezoids: (previous km/h + current km/h)/2/3.6 × elapsed seconds. Interpolates exact speed-threshold crossing; stops below 0.5 km/h. Display one decimal. |
| Primary stopping time | seconds | `main.js` → stop timing | Time from interpolated high threshold to stop; two decimals. |
| Secondary stopping distance | m; ft | `main.js` → secondary threshold | The lower-speed crossing within same stop starts a separate distance accumulator; shares endpoint. |
| Secondary stopping time | seconds | `main.js` → secondary threshold | Elapsed from interpolated lower threshold until stopped. |
| Peak stopping deceleration | g | `main.js` → stop peak | Maximum −longitudinalG during recorded stop. |
| Best primary / secondary stopping distances | m; ft | `main.js` → best store | Smallest completed distances for each speed threshold; incomplete or released stops do not become records. |
| Result difference / new best | m; ft; NEW BEST | `main.js` → result comparison | Compares stop distance with stored best for same threshold. |
| Braking trace | g versus m/ft; normalized speed | `main.js` → trace rendering | Plots sampled deceleration against integrated stopping distance with relative-speed overlay. |
| Brake fade estimate | %; WARM / FADING / status | `main.js` → fade calculation | Last of up to eight stops compared with previous best; requires three stops. >4% longer WARM; >8% FADING. It does not measure disc temperature. |
| History: stop date/time | date/time | `main.js` → history | Keeps 40 completed stops with timestamps; demo history is separate. |
| History: primary distance / time | m/ft; seconds | `main.js` → history | Stored completed high-threshold result. |
| History: secondary distance / time | m/ft; seconds | `main.js` → history | Stored lower-threshold result from same stop where crossed. |
| History: peak deceleration and start speed | g; km/h or mph | `main.js` → history | Stored event peak and actual start speed. |
| Aborted / incomplete stop | status | `main.js` → stop state | Deceleration below 0.1 g for 1.2 s before stop aborts; no completed result recorded. |
| Demo indication | DEMO | `main.js`; `main.js` | Generated braking runs use separate demo storage. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Tests | choice / on-off | `app.json` → `settings[speedUnit]`; shared settings renderer | Persisted setting `speedUnit`; default `"kmh"`. Choices: 100-0 / 200-0 km/h (`kmh`); 60-0 / 100-0 mph (`mph`). |
| Counts as hard braking above | g | `app.json` → `settings[trigger]`; shared settings renderer | Persisted setting `trigger`; default `0.4`. Selectable values: 0.2, 0.3, 0.4, 0.5, 0.6. |
| Distance unit | choice / on-off | `app.json` → `settings[distUnit]`; shared settings renderer | Persisted setting `distUnit`; default `"m"`. Choices: metres (`m`); feet (`ft`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / draggy — Draggy (2.5.14)

Source base: `../idrive7-apps/apps/draggy/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Current speed | km/h; mph | `main.js`; app signal/scaling configuration; Vehicle2 speed | Raw×0.015625; invalid 65535 rejected; converts to selected unit. |
| Run elapsed time | seconds | `timer.js`; `main.js` | Two-decimal time since interpolated launch, adjusted by rollout clock if enabled. |
| Peak longitudinal acceleration | g | `main.js`; CDS2 acceleration | (raw×0.002−65)/9.80665; maximum during run. |
| Current engine speed | rpm | `main.js`; CDS engine speed | Raw×0.25; invalid 65535 rejected. |
| Arm / launch / timing state | status | `timer.js`; `main.js` | Arms after speed <0.5 km/h for one second; launch interpolates crossing 0.5 km/h. Finished results remain displayed while recorder returns to waiting. |
| Rollout state | on/off; one foot | `timer.js`; `main.js` | Optional 0.3048-m rollout delays clock and subtracts that distance from timing-distance coordinate; best records separated by rollout setting. |
| 0–50 km/h time | seconds | `timer.js` → metric split table | Interpolated launch and crossing of 50 km/h. |
| 0–100 km/h time | seconds | `timer.js` → metric split table | Interpolated launch and crossing of 100 km/h. |
| 100–200 km/h time | seconds | `timer.js` → metric split table | Difference between interpolated 100 and 200 km/h crossings. |
| 0–200 km/h time | seconds | `timer.js` → metric split table | Interpolated launch and crossing of 200 km/h. |
| 0–30 mph time | seconds | `timer.js` → imperial split table | Interpolated corresponding speed crossing; internal speed remains km/h. |
| 0–60 mph time | seconds | `timer.js` → imperial split table | Interpolated corresponding crossing. |
| 60–130 mph time | seconds | `timer.js` → imperial split table | Difference between corresponding interpolated crossings. |
| 0–100 mph time | seconds | `timer.js` → imperial split table | Time from launch to corresponding interpolated crossing. |
| Quarter-mile elapsed time / trap speed | seconds; km/h or mph | `timer.js`; `main.js` distance result | Trapezoid-integrates speed; interpolates at 402.336 m and interpolates speed at finish. |
| Eighth-mile elapsed time / trap speed | seconds; km/h or mph | `timer.js`; `main.js` distance result | Same process at 201.168 m; selected by distance setting. |
| 1000-m elapsed time / trap speed | seconds; km/h or mph | `timer.js`; `main.js` distance result | Same process at 1000 m; selected by distance setting. |
| Split / distance best result | seconds; date | `main.js` → best records | Minimum completed time per split/distance, with rollout-specific keys. |
| Difference to best / new record | seconds; NEW BEST | `main.js` → results | Current result minus same-key best; new minimum marked NEW BEST. |
| Speed-versus-time trace | km/h or mph; seconds | `timer.js`; `main.js` → graph | Samples no more often than 50 ms; thins after 1800 points. Run ends after speed drops 5 km/h from maximum, all splits finish, or 40 seconds. |
| Recent runs: date, rollout flag and three selected split results | date/time; RO marker; seconds | `main.js` → history | Retains 30 completed runs; displayed split choices follow unit/distance settings. |
| Demo indication | DEMO | `demo.js`; `main.js` | Synthetic 28-second run; automatic demo only after five seconds without provider. Demo store is separate and not persisted into live records. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Units | choice / on-off | `app.json` → `settings[speedUnit]`; shared settings renderer | Persisted setting `speedUnit`; default `"kmh"`. Choices: km/h (`kmh`); mph (`mph`). |
| Distance split | choice / on-off | `app.json` → `settings[distance]`; shared settings renderer | Persisted setting `distance`; default `"qm"`. Choices: 1/4 mile (`qm`); 1/8 mile (`em`); 1000 m (`m1000`). |
| One-foot rollout | choice / on-off | `app.json` → `settings[rollout]`; shared settings renderer | Persisted setting `rollout`; default `false`. Boolean toggle. |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Speed display rate | fps | `app.json` → `settings[speedRate]`; shared settings renderer | Persisted setting `speedRate`; default `10`. Selectable values: 5, 10, 15, 30, 60. |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / dtc_scanner — DTC Scanner (2.9.2)

Source base: `../idrive7-apps/apps/dtc_scanner/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Scan / diagnostic-link state | status | `main.js`; shared `../idrive7-apps/kit/runtime/diag.js` | Shows link availability, scanning, completed, no-answer and diagnostic error states. |
| Responding control units | count | `main.js` → scan summary | Counts distinct ECU responders to functional diagnostic scan, not all possible installed modules. |
| Fault-memory / information-memory totals | count | `main.js` → summary | Functional UDS 19 02 status mask 0C for current or FF for all; optional 19 17 mask 01 reads information memory. Counts returned records by memory. |
| Active fault count | count | `main.js` → summary | Counts records with status bit 0x01; label WARNING does not automatically imply active-count membership. |
| Check Control message count | count | `main.js` → summary / CC | Counts currently active decoded Check Control items. |
| ECU / module name and address | name; hex address | `main.js`; `unit_names` data / diagnostic identities | Uses decoded ECU address plus unit-name database / fallback mapping; shows module identity / SGBD where known. |
| ECU variant / SGBD | identifier text | `main.js` → identification; UDS 22 F150 | Reads/caches ECU variant when text database needs it; saved ecu_ids.json provides reuse. |
| Fault code | six hexadecimal digits | `main.js`; `../idrive7-apps/kit/runtime/diag.js` → DTC parser | Three code bytes rendered as zero-padded six-digit hex; info-memory records carry memory distinction. |
| Fault status / raw status | category; status byte | `main.js`; `../idrive7-apps/kit/runtime/diag.js` | 01 ACTIVE; otherwise 80 WARNING, 04 PENDING, 08 STORED, else HISTORY, in that precedence. |
| Fault description / ambiguous-description indication | text; match count | `main.js`; `known_texts`; diagnostic-text / packed databases | Lookup order: optional/known text, exact variant, address consensus, variant/wildcard, any-address code text, generic code, family; otherwise ambiguity count or no description. Loads needed compressed tables on demand; optional zh-CN text translation. |
| Per-unit scan outcome / refusal | status; NRC hex; fault count | `main.js` → unit results | Differentiates clean module, no reply and negative response; does not label a nonresponding ECU as fault-free. |
| Scan progress / last scan time | count; local date/time | `main.js` → progress / last_scan.json | Tracks replies during scan, persists latest snapshot and formats last scan locally. |
| Check Control name / detail text | text | `main.js`; CheckControlMaster.basicList and KombiInterface CC events | Accepts active AKTIV/0 items; uses short/full message names from list / newCCMessage updates. |
| Check Control identifier | ID | `main.js` → CC decoding | Supports both Identifier and misspelled Identifer source fields. |
| Check Control severity | RED / YELLOW / ORANGE / GREEN / WHITE | `main.js` → CC rendering | Maps source message color, rather than deriving severity from DTC status. |
| Check Control requesting ECU | ECU identifier | `main.js` → CC decoding | Displays requestor/source control unit where supplied. |
| Clear confirmation / result / returned faults | status; seconds; counts | `main.js` → clear operation | Second press within five seconds confirms. Sends functional 14 FF FF FF then per-unit retries. NRC22/31/33/7E/7F can trigger extended session 10 03 then retry and 10 01 return. Rescans and shows immediate returned faults / outcomes; not proof of repaired hardware. |
| Demo indication / example faults | DEMO; synthetic codes / statuses | `demo.js`; `main.js` | Example 11 faults across 25 units plus nine Check Control entries, with info-memory example; demo clear changes only demo data. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Faults to read | choice / on-off | `app.json` → `settings[scope]`; shared settings renderer | Persisted setting `scope`; default `"current"`. Choices: Current (`current`); Incl. history (`all`). |
| Also read info memory | choice / on-off | `app.json` → `settings[info]`; shared settings renderer | Persisted setting `info`; default `false`. Boolean toggle. |
| Scan when opened | choice / on-off | `app.json` → `settings[autoScan]`; shared settings renderer | Persisted setting `autoScan`; default `true`. Boolean toggle. |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / service — Service (1.4.14)

Source base: `../idrive7-apps/apps/service/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| CBS service-item name / identifier | text; service ID | `main.js`; `KombiInterface_2.cbsDataServiceList` | Parses nested service list; accepts source typo ServcieName. Item names/IDs come from the vehicle, not inferred mileage rules. |
| CBS remaining distance | vehicle-formatted distance / unit | `main.js` → service list | Displays car-supplied distance text; does not independently convert it to km or miles. |
| CBS due date | vehicle-formatted date | `main.js` → service list | Displays car-supplied date, preserving provided format. |
| Service due state / color | DUE / DUE SOON / OK; source color | `main.js` → color mapping | 0 default, 1 red DUE, 2 yellow DUE SOON, 3 green OK, 4 orange DUE SOON. |
| Service relative due month | months; this month / overdue | `main.js` → date interpretation | Parses DD.MM.YYYY, MM.YYYY or YYYY-MM into calendar-month difference; displays in N months / this month / N overdue. |
| Next-service summary distance / date / severity | vehicle-formatted distance; date; color | `main.js`; `KombiInterface_2.cbsDataSBA` | Uses car’s SBA summary fields rather than choosing an independently calculated next item. |
| Due-now and due-soon totals | counts | `main.js` → summary | Counts red/color1 as now, yellow2/orange4 as soon. |
| Service detail / hint / name / date / distance | text; vehicle units | `main.js`; `requestCBSServiceHint({id})` | Requests selected service’s hint; displays response fields or missing/error state. |
| Reset eligibility / blocking reason | service ID; reason; reserve; status | `main.js` → CBS reset; ECU0x60 UDS22 1002 | Three-byte records expose ID, reason and reserve. Only brake fluid 03 and vehicle check 64 with reason0; requires reset setting, real mode and confirmation. |
| Reset confirmation / send outcome | status; five-second confirmation | `main.js` → reset flow | Second press within five seconds sends 2E 1001 01 <id> 64 1F 80 00 0F FF 0F 3F FF 00; displays actual reply / refusal. |
| Reset result reserve / counter change | %; count delta; status | `main.js` → reset readback; UDS22 1001 | Reads 12-byte record: counter from byte4 &0x1F, availability byte5; compares before/after and reports result rather than assuming write success. |
| Raw CBS diagnostic details | reachability; raw text / JSON; list count | `main.js` → diagnostic display | Optional raw SBA, service-list count and raw list; icon data replaced with compact indicators for display. |
| Demo indication / service examples | DEMO | `main.js`; `main.js` | Six synthetic CBS items; reset is disabled in demo. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Service reset (brake fluid, vehicle check) | choice / on-off | `app.json` → `settings[resetOn]`; shared settings renderer | Persisted setting `resetOn`; default `false`. Boolean toggle. |
| Diagnostics page | choice / on-off | `app.json` → `settings[diagPage]`; shared settings renderer | Persisted setting `diagPage`; default `false`. Boolean toggle. |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / live_adjustments — Live Adjustments (0.7.0)

Source base: `../idrive7-apps/apps/live_adjustments/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Simulation / live / unavailable state | SIM; status | `main.js`; `controller.js`; `ui.js` | Tuner/arming settings select simulation versus real adapters. SIM is labeled; disabled simulation does not communicate with ECUs. |
| Exhaust-flap requested / accepted / confirmed state | OPEN / CLOSED / OEM / UNKNOWN; status | `controller.js`; `real_adapters.js`; `ui.js` | Separates requested command, positive acceptance and actual confirmation; unknown stays unknown where adapter has no readback. |
| Exhaust-flap commanded and position readback | %; OPEN / CLOSED / UNKNOWN | `real_adapters.js`; `tune.js`; DME ECU0x12 DIDs62FD / 64FD | Reads commanded / position values where supported; commanded ≤20% OPEN, ≥80% CLOSED, intermediate UNKNOWN. Real direct control: 2F 60FD 03 plus duty percent×100, open10%=03E8, closed90%=2328; OEM 2F60FD00. |
| Tuner-specific flap result | status | `tune.js`; `bm3_protocol.js`; `controller.js` | MHD 2F02 mode0/1/2 and BM3 commands report acceptance only where no readback exists; confirmed state remains UNKNOWN, not a falsely confirmed physical flap. |
| Tune map requested / accepted / confirmed slot | 1…4; UNKNOWN; status | `tune.js`; `bm3_protocol.js`; `bm3_profiles.js`; `ui.js` | BM3 locates unique profile-validated BM3_R marker at 0x807FFE50, reads memory via23 and writes via3D/3E with readback. MHD 2F01 slot−1 positive echo is acceptance only, not actual active-map readback. |
| Maximum cooling requested / accepted state | ON / OFF; unknown / status | `tune.js`; `controller.js`; `ui.js` | MHD 2F0301/00 sends cooling on/off; no real cooling-state readback. UI preserves distinction between command acceptance and confirmation. |
| Engine RPM / cooling gate | rpm; running / unknown; threshold | `main.js`; `controller.js`; `ui.js` | Uses live engine speed; cooling ON requires >500 rpm. Missing RPM is unknown, not assumed running. |
| Burble aggression target | 0…12; step0.5 | `ui.js`; `tune.js`; `bm3_protocol.js` | User-selected BM3 aggression target; not a sensor unit. |
| Burble readback / custom / off | aggression; custom / off; status | `tune.js`; `bm3_protocol.js` | Apply writes enable byte and repeated 24 signed timing bytes. Readback maps to aggression only when all 24 equal and nonpositive: −signed timing / profile factor; otherwise custom/off rather than invented aggression. |
| Active Sound Design requested / accepted state | ON / OFF; status | `tune.js`; `controller.js` | Sends ASD 2E5FFD00 for on or 2E5FFD01 for off. Shows last accepted request; no actual ASD-state readback. |
| Experimental xDrive current / requested mode | AWD / RWD / REQUESTED / UNKNOWN; status | `xdrive.js`; `ui.js`; DSC ECU0x29 DBE1 | Reads DBE1 while rpm>400: raw1 AWD, raw0 RWD. Only an OFF request exists: writes 2E DBE1 00, displays REQUESTED after positive acceptance, then meaningful readback only after engine starts. It does not send an untested ON write or DSC reset; re-enable is by ignition cycle. |
| xDrive DSC identification / support state | variant index; tested / untested / unsupported | `xdrive.js`; UDS22 F150 | Identifies DSC index; 0F2510 marked tested, other variants classified by implemented policy rather than assumed equivalent. |
| xDrive precondition status | live; engine-off; stationary; P; parking brake unknown | `xdrive.js`; `ui.js` | Requires applicable live/safety gates: engine-off rpm<50, stationary speed<0.5 km/h and park state. Parking-brake unavailable remains grey/unknown, not falsely asserted engaged. |
| Actual front-axle torque | Nm | `xdrive.js`; LMV ECU0x19 DIDDB32 | Signed16 BE at offset0 divided by4. Polled once per second with engine running. |
| Requested front-axle torque | Nm | `xdrive.js`; LMV ECU0x19 DIDDB32 | Signed16 BE at offset4 divided by4; this is requested, not actual torque. |
| Peak requested front-axle torque | Nm | `xdrive.js` → peak tracking | Tracks request peak only outside demo and at speed ≥3 km/h. |
| Action confirmation / refusal / blocker / diagnostic error | text; NRC; six-second confirmation | `controller.js`; `diaglink.js`; `ui.js`; `xdrive.js` | Displays sending, accepted, confirmed, unconfirmed, transport/NRC error and blocker text. xDrive action requires second confirmation within six seconds. |
| Demo indication | SIM / DEMO | `main.js`; `controller.js` | Simulated responses/states are labeled and are not vehicle readback. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Exhaust Flap | choice / on-off | `app.json` → `settings[arm]`; shared settings renderer | Persisted setting `arm`; default `"off"`. Choices: Disarmed · simulated (safe) (`off`); Armed · actuates the real valve (`on`). |
| Tuning software | choice / on-off | `app.json` → `settings[tuner]`; shared settings renderer | Persisted setting `tuner`; default `"off"`. Choices: Off · nothing is sent to the car (safe) (`off`); BM3 · engine map, burbles, ASD (`bm3`); MHD · engine map, Max Cooling (`mhd`). |
| xDrive (experimental) | choice / on-off | `app.json` → `settings[xdrive]`; shared settings renderer | Persisted setting `xdrive`; default `"off"`. Choices: Off · nothing is sent (safe) (`off`); On · xDrive tab, xDrive off until ignition off (`on`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Red (`m_red`); M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (default) (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"auto"`. Choices: Auto (`auto`); Always (`on`); Never (`off`). |

## idrive7-apps / zf8hp — ZF 8HP (1.5.0)

Source base: `../idrive7-apps/apps/zf8hp/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| EGS connection / freshness / variant state | NO LINK / IDENTIFYING / OTHER EGS / LINK STALE / LIVE / LIVE UNVERIFIED | `main.js`; `reader.js`; `egs.js` | Read-only ECU0x18 UDS22 allowlist. F150 index0F25D0 is verified GSZFBCE, 0F21E0 supported hybrid; others blocked unless any-variant setting. Data >12 s old marked stale. |
| EGS variant identity | SGBD; hex index | `main.js`; `reader.js`; `egs.js`; F150 | Displays decoded identification; does not treat a matching address as proof of variant compatibility. |
| Snapshot / last-read age and record errors | elapsed time; status | `main.js`; `reader.js`; `egs.js`; egs-snapshot.json | Can display cached snapshot with age; byte-length mismatch remains an error rather than decoded number. |
| Transmission oil temperature | °C; °F | `main.js`; `catalog.js`6000 | Unsigned byte−40 °C; standard Fahrenheit conversion. |
| Chip1 temperature | °C; °F | `main.js`; `catalog.js`6005 | Unsigned byte−40 °C. |
| Chip2 temperature | °C; °F | `main.js`; `catalog.js`601D | Unsigned byte−40 °C. |
| Actual transmission gear | P/R/N; 1…8 | `main.js`; DA2E first byte | Enum0P,1R,2N,3 first through9 seventh,16 eighth; unknown values remain enum/raw rather than invented gear. |
| Gear-selector position | P/R/N/D/M | `main.js`; DA2E second byte | Enum0P,1R,2N,3D,4M. |
| Turbine / input speed | rpm | `main.js`; DA2A first word | Signed16 BE, factor1. Signedness is intentional in catalog. |
| Transmission output speed | rpm | `main.js`; DA2A second word | Signed16 BE, factor1. |
| Engine speed | rpm | `main.js`; DA34 | Unsigned16 BE, factor1. |
| Torque converter clutch state | enum; text | `main.js`; DA22 | Signed16 BE:0 open;1 regulated low;2 regulated high;3 locked low;4 locked high;8 opening;9/10 to regulated low/high;11/12 to locked low/high. |
| Oil-level service temperature window | °C; °F, low/high | `main.js`; DB03 | Two unsigned bytes−40 °C; service window, not a second current oil sensor. |
| Oil-level service RPM window | rpm, low/high | `main.js`; DB04 | Two unsigned16 BE values. |
| Session oil / chip temperature histories | °C; °F; minutes | `main.js` → temperature history | Retains up to1200 samples /20 minutes, associates chip reading within15 seconds; graph0…140 °C converted for display. |
| Clutch A/B/C/D/E pressure adaptation | mbar | `main.js`;413A | Five signed16 little-endian words; each clutch gets its own value. |
| Clutch A/B/C/D/E fast-fill time adaptation | ms | `main.js`;4140 | Five signed16 little-endian words. |
| Clutch A/B/C/D/E time / pressure adaptation evaluations | raw evaluation counts | `main.js`;4130 /4131 | Five unsigned16 LE values each:4130 time evaluations,4131 pressure evaluations; no undocumented physical unit. |
| Cold clutch adaptation / evaluation / shift / start counters | raw values; counts | `main.js`;418A /4189 /418B /418C | Five signed pressure-like raw words for418A; unsigned16 LE arrays for evaluation, shift and start counters. Catalog leaves418A unit unspecified, so not silently called mbar. |
| Shift adaptation table / family / selected transition | KF1 / KF2 / cold KF1 / cold KF2; gear transition | `main.js`; `catalog.js` → maps | Selected map family and up/down/skip group choose record. Each transition record is listed in full DID table below. |
| Shift adaptation heatmap cell values | mbar; grid-cell index | `main.js`;4110…412E /4160…416F /41B6 /41B7 | Warm maps signed8×0.01 bar, then bar→mbar; usually64 cells, selected skip shifts24. Cold maps448 signed8×10 mbar, selecting64-cell gear segment. |
| Shift-map min / mean / max / cell count / read age | mbar; count; elapsed time | `main.js` → map summary | Statistics over selected decoded cells, plus current record age; no invented temperature/load axes. |
| Shift adaptation counts | count by transition | `main.js`;4133/4134 KF1,4136/4137 KF2,41B9/41BA cold | Unsigned16 LE arrays; variant-aware record lengths (hybrid4137 has18 entries instead of7). |
| Lifetime chip-temperature histogram | hours; %; temperature bands | `main.js`;4440 | 23 unsigned32 BE seconds → hours/3600 and share of total; band definitions below. |
| Lifetime oil-temperature histogram | hours; %; temperature bands | `main.js`;4441 | Same decode and bands as chip histogram; total sums bucket times. |
| Lifetime temperature bucket boundaries | °C; °F | `main.js` → histogram labels | 23 buckets: −40…−20, −19…0, 1…20, 21…40, 41…60, 61…70, 71…80, 81…90, 91…95, 96…100, 101…105, 106…110, 111…115, 116…120, 121…125, 126…130, 131…135, 136…140, 141…145, 146…150, 151…155, 156…160, >160 °C. |
| Torque-converter clutch fast-fill adaptation / count | ms; count | `main.js`;41A0 /41A1 | Signed16 LE ×10 ms; unsigned16 LE count. |
| Torque-converter clutch current-offset adaptation / count | mA; count | `main.js`;41B3 /41B4 | Signed16 LE current value and unsigned16 LE counter. |
| D1 / D2 / R engagement adaptation / counts | mbar; count | `main.js`;412F /415F | Three signed16 LE pressure adaptations, paired with unsigned16 LE counts. |
| D1 / D2 / R release adaptation / counts | mbar; count | `main.js`;41B0 /41B1 | Three signed16 LE pressure adaptations, paired with unsigned16 LE counts. |
| EGS operating time excluding standby | hours | `main.js`;6081 | Signed32 BE minutes divided by60. |
| Standstill adaptation count | count | `main.js`;6090 | Unsigned byte. |
| Fault records / read status | six-hex code; raw status byte; empty / reading / error | `main.js`; `reader.js`; `egs.js` → UDS19 02 0C | Reads EGS current faults only; no clear, reset or session write operations. |
| All-records page: decoded / raw values | record units; byte count / raw marker; age; errors | `main.js` → recordRow / details; `catalog.js`; `egs.js`; `reader.js` | Full scrolling record list on kit renderer, seven records/page on HMI-bar layout. Previews first five decoded values, temperatures converted, bar two decimals, integer otherwise. Unknown-layout record displays payload byte length and “raw”, not full payload hex. |
| Clutch-engagement reference matrix | gear; A/B/C/D/E engagement | `main.js` → reference matrix | Static1 ABC;2 ABE;3 BCE;4 BDE;5 BCD;6 CDE;7 ACD;8 ADE;R ABD. Highlights fresh actual gear. A/B brakes, C/D/E clutches; reference, not individual clutch sensor readback. |
| Demo indication | DEMO | `demo.js`; `main.js` | Explicit synthetic records / temperatures / maps; default demo off. |

### Full DID / record inventory

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| 4110 — Warm KF1 shift 1→2 adaptation cells; ADAPTIONSWERTE_GLS_KF1_1_2 | bar | `catalog.js` → `definitions["4110"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4110 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4111 — Warm KF1 shift 2→3 adaptation cells; ADAPTIONSWERTE_GLS_KF1_2_3 | bar | `catalog.js` → `definitions["4111"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4111 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4112 — Warm KF1 shift 3→4 adaptation cells; ADAPTIONSWERTE_GLS_KF1_3_4 | bar | `catalog.js` → `definitions["4112"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4112 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4113 — Warm KF1 shift 4→5 adaptation cells; ADAPTIONSWERTE_GLS_KF1_4_5 | bar | `catalog.js` → `definitions["4113"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4113 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4114 — Warm KF1 shift 5→6 adaptation cells; ADAPTIONSWERTE_GLS_KF1_5_6 | bar | `catalog.js` → `definitions["4114"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4114 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4115 — Warm KF1 shift 6→7 adaptation cells; ADAPTIONSWERTE_GLS_KF1_6_7 | bar | `catalog.js` → `definitions["4115"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4115 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4116 — Warm KF1 shift 7→8 adaptation cells; ADAPTIONSWERTE_GLS_KF1_7_8 | bar | `catalog.js` → `definitions["4116"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4116 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 411D — Warm KF1 shift 2→1 adaptation cells; ADAPTIONSWERTE_GLS_KF1_2_1 | bar | `catalog.js` → `definitions["411D"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 411D | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 411E — Warm KF1 shift 3→2 adaptation cells; ADAPTIONSWERTE_GLS_KF1_3_2 | bar | `catalog.js` → `definitions["411E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 411E | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 411F — Warm KF1 shift 4→3 adaptation cells; ADAPTIONSWERTE_GLS_KF1_4_3 | bar | `catalog.js` → `definitions["411F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 411F | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4120 — Warm KF1 shift 5→4 adaptation cells; ADAPTIONSWERTE_GLS_KF1_5_4 | bar | `catalog.js` → `definitions["4120"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4120 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4121 — Warm KF1 shift 6→5 adaptation cells; ADAPTIONSWERTE_GLS_KF1_6_5 | bar | `catalog.js` → `definitions["4121"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4121 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4122 — Warm KF1 shift 7→6 adaptation cells; ADAPTIONSWERTE_GLS_KF1_7_6 | bar | `catalog.js` → `definitions["4122"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4122 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4123 — Warm KF1 shift 8→7 adaptation cells; ADAPTIONSWERTE_GLS_KF1_8_7 | bar | `catalog.js` → `definitions["4123"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4123 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4124 — Warm KF1 shift 3→1 adaptation cells; ADAPTIONSWERTE_GLS_KF1_3_1 | bar | `catalog.js` → `definitions["4124"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4124 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 4125 — Warm KF1 shift 4→2 adaptation cells; ADAPTIONSWERTE_GLS_KF1_4_2 | bar | `catalog.js` → `definitions["4125"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4125 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 4126 — Warm KF1 shift 5→3 adaptation cells; ADAPTIONSWERTE_GLS_KF1_5_3 | bar | `catalog.js` → `definitions["4126"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4126 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 4127 — Warm KF1 shift 6→4 adaptation cells; ADAPTIONSWERTE_GLS_KF1_6_4 | bar | `catalog.js` → `definitions["4127"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4127 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 4128 — Warm KF1 shift 7→5 adaptation cells; ADAPTIONSWERTE_GLS_KF1_7_5 | bar | `catalog.js` → `definitions["4128"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4128 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 4129 — Warm KF1 shift 8→6 adaptation cells; ADAPTIONSWERTE_GLS_KF1_8_6 | bar | `catalog.js` → `definitions["4129"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4129 | 64 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412A — Warm KF1 shift 5→1 adaptation cells; ADAPTIONSWERTE_GLS_KF1_5_1 | bar | `catalog.js` → `definitions["412A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412A | 24 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412B — Warm KF1 shift 6→3 adaptation cells; ADAPTIONSWERTE_GLS_KF1_6_3 | bar | `catalog.js` → `definitions["412B"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412B | 24 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412C — Warm KF1 shift 7→1 adaptation cells; ADAPTIONSWERTE_GLS_KF1_7_1 | bar | `catalog.js` → `definitions["412C"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412C | 24 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412D — Warm KF1 shift 8→2 adaptation cells; ADAPTIONSWERTE_GLS_KF1_8_2 | bar | `catalog.js` → `definitions["412D"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412D | 24 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412E — Warm KF1 shift 8→4 adaptation cells; ADAPTIONSWERTE_GLS_KF1_8_4 | bar | `catalog.js` → `definitions["412E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412E | 24 value(s), signed 8-bit big-endian; each value = raw × 0.01 + (0). |
| 412F — D1 / D2 / R engagement pressure corrections; ADAPTIONSWERTE_GE | mbar | `catalog.js` → `definitions["412F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 412F | 3 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 4130 — Clutch A–E time-adaptation evaluations; ADAPTIONSWERTE_KSFCTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4130"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4130 | 5 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4131 — Clutch A–E pressure-adaptation evaluations; ADAPTIONSWERTE_KPFCTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4131"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4131 | 5 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4133 — KF1 upshift adaptation counts; ADAPTIONSWERTE_GLSHSCTRKF1 | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4133"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4133 | 7 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4134 — KF1 downshift adaptation counts; ADAPTIONSWERTE_GLSRSCTRKF1 | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4134"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4134 | 18 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4136 — KF2 upshift adaptation counts; ADAPTIONSWERTE_GLSHSCTRKF2 | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4136"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4136 | 7 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4137 — KF2 downshift adaptation counts; ADAPTIONSWERTE_GLSRSCTRKF2 | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4137"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4137 | 7 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). Hybrid variant overrides count to18. |
| 413A — Clutch A–E fill-pressure corrections; ADAPTIONSWERTE_KPF | mbar | `catalog.js` → `definitions["413A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 413A | 5 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 4140 — Clutch A–E fast-fill time corrections; ADAPTIONSWERTE_KSF | ms | `catalog.js` → `definitions["4140"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4140 | 5 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 4143 — KF1 shift fill-pressure adaptation array; ADAPTIONSWERTE_BFLGLSKF1 | mbar | `catalog.js` → `definitions["4143"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4143 | 25 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). Hybrid variant is retained raw where its layout is not verified. |
| 4144 — KF2 shift fill-pressure adaptation array; ADAPTIONSWERTE_BFLGLSKF2 | mbar | `catalog.js` → `definitions["4144"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4144 | 25 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). Hybrid variant is retained raw where its layout is not verified. |
| 415F — D1 / D2 / R engagement evaluations; GANG_EINLEGE_ADAPTION_CTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["415F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 415F | 3 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4160 — Warm KF2 shift 1→2 adaptation cells; ADAPTIONSWERTE_GLS_KF2_1_2 | bar | `catalog.js` → `definitions["4160"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4160 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4161 — Warm KF2 shift 2→3 adaptation cells; ADAPTIONSWERTE_GLS_KF2_2_3 | bar | `catalog.js` → `definitions["4161"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4161 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4162 — Warm KF2 shift 3→4 adaptation cells; ADAPTIONSWERTE_GLS_KF2_3_4 | bar | `catalog.js` → `definitions["4162"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4162 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4163 — Warm KF2 shift 4→5 adaptation cells; ADAPTIONSWERTE_GLS_KF2_4_5 | bar | `catalog.js` → `definitions["4163"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4163 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4164 — Warm KF2 shift 5→6 adaptation cells; ADAPTIONSWERTE_GLS_KF2_5_6 | bar | `catalog.js` → `definitions["4164"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4164 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4165 — Warm KF2 shift 6→7 adaptation cells; ADAPTIONSWERTE_GLS_KF2_6_7 | bar | `catalog.js` → `definitions["4165"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4165 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4166 — Warm KF2 shift 7→8 adaptation cells; ADAPTIONSWERTE_GLS_KF2_7_8 | bar | `catalog.js` → `definitions["4166"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4166 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 416D — Warm KF2 shift 2→1 adaptation cells; ADAPTIONSWERTE_GLS_KF2_2_1 | bar | `catalog.js` → `definitions["416D"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 416D | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 416E — Warm KF2 shift 3→2 adaptation cells; ADAPTIONSWERTE_GLS_KF2_3_2 | bar | `catalog.js` → `definitions["416E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 416E | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 416F — Warm KF2 shift 4→3 adaptation cells; ADAPTIONSWERTE_GLS_KF2_4_3 | bar | `catalog.js` → `definitions["416F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 416F | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4170 — Warm KF2 shift 5→4 adaptation cells; ADAPTIONSWERTE_GLS_KF2_5_4 | bar | `catalog.js` → `definitions["4170"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4170 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4171 — Warm KF2 shift 6→5 adaptation cells; ADAPTIONSWERTE_GLS_KF2_6_5 | bar | `catalog.js` → `definitions["4171"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4171 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4172 — Warm KF2 shift 7→6 adaptation cells; ADAPTIONSWERTE_GLS_KF2_7_6 | bar | `catalog.js` → `definitions["4172"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4172 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4173 — Warm KF2 shift 8→7 adaptation cells; ADAPTIONSWERTE_GLS_KF2_8_7 | bar | `catalog.js` → `definitions["4173"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4173 | 64 value(s), signed 8-bit little-endian; each value = raw × 0.01 + (0). |
| 4187 — KF1 cold-shift influence values; ADAGLS_BEEINF_KF1_KALT_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4187"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4187 | 7 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 4188 — KF2 cold-shift influence values; ADAGLS_BEEINF_KF2_KALT_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4188"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4188 | 7 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 4189 — Clutch A–E cold evaluations; ADAKPFCTR_KALT_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["4189"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4189 | 5 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 418A — Clutch A–E cold corrections; ADAKPF_KALT_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["418A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 418A | 5 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 418B — Clutch A–E cold-shift counters; ADAKPF_SHCTR_KALT_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["418B"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 418B | 5 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 418C — Clutch A–E start evaluations; ADAKPF_START_CTR_MEM_ID | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["418C"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 418C | 5 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 41A0 — Torque-converter clutch fast-fill correction; ADAPTIONSWERTE_TSF_WK_AUSLESEN | ms | `catalog.js` → `definitions["41A0"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41A0 | 1 value(s), signed 16-bit little-endian; each value = raw × 10 + (0). |
| 41A1 — Torque-converter clutch fast-fill evaluations; ADAPTION_WK_TSF_CTR_AUSLESEN | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["41A1"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41A1 | 1 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 41B0 — D1 / D2 / R release corrections; GANGAUSLEGE_ADAPT_SPEICHER | mbar | `catalog.js` → `definitions["41B0"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B0 | 3 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 41B1 — D1 / D2 / R release evaluations; GANGAUSLEGE_ADAPT_SPEICHER_CTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["41B1"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B1 | 3 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 41B3 — Torque-converter clutch base-point current adaptation; FUSSPUNKT_ADAPTIONSWERT_WK | mA | `catalog.js` → `definitions["41B3"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B3 | 1 value(s), signed 16-bit little-endian; each value = raw × 1 + (0). |
| 41B4 — Torque-converter clutch base-point evaluations; FUSSPUNKT_ADAPTWERT_WK_CTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["41B4"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B4 | 1 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 41B6 — Cold KF1 upshift-map array; GLS_ADAP_EHS_KF1_KALT | mbar | `catalog.js` → `definitions["41B6"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B6 | 448 value(s), signed 8-bit little-endian; each value = raw × 10 + (0). |
| 41B7 — Cold KF2 upshift-map array; GLS_ADAP_EHS_KF2_KALT | mbar | `catalog.js` → `definitions["41B7"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B7 | 448 value(s), signed 8-bit little-endian; each value = raw × 10 + (0). |
| 41B9 — Cold KF1 upshift counters; GLS_ADAP_EHS_KF1_KALT_CTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["41B9"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41B9 | 7 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 41BA — Cold KF2 upshift counters; GLS_ADAP_EHS_KF2_KALT_CTR | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["41BA"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 41BA | 7 value(s), unsigned 16-bit little-endian; each value = raw × 1 + (0). |
| 4440 — Lifetime electronics-temperature histogram; SUBSTRATTEMPERATURKOLLEKTIV | s | `catalog.js` → `definitions["4440"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4440 | 23 value(s), unsigned 32-bit big-endian; each value = raw × 1 + (0). Hybrid variant is retained raw where its layout is not verified. |
| 4441 — Lifetime oil-temperature histogram; OELTEMPERATURKOLLEKTIV | s | `catalog.js` → `definitions["4441"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4441 | 23 value(s), unsigned 32-bit big-endian; each value = raw × 1 + (0). Hybrid variant is retained raw where its layout is not verified. |
| 4800 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4800"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4800 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4801 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4801"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4801 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4802 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4802"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4802 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4803 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4803"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4803 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4804 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4804"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4804 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4805 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4805"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4805 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4806 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4806"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4806 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4807 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4807"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4807 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4808 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4808"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4808 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 4809 — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["4809"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 4809 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480A — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480A | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480B — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480B"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480B | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480C — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480C"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480C | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480D — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480D"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480D | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480E — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480E | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 480F — Documented EGS histogram (undecoded layout); documented EGS histogram | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["480F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 480F | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 6000 — Transmission oil temperature; _GETRIEBEOELTEMPERATUR | °C | `catalog.js` → `definitions["6000"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6000 | 1 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (-40). |
| 6003 — ZF system time; _SYSTEMZEIT_ZF | s | `catalog.js` → `definitions["6003"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6003 | 1 value(s), signed 32-bit big-endian; each value = raw × 1 + (0). |
| 6005 — EGS chip1 temperature; _CHIP1_TEMPERATUR | °C | `catalog.js` → `definitions["6005"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6005 | 1 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (-40). |
| 6008 — Output-shaft speed (coarse byte); _ABTRIEBSDREHZAHL | 1/min | `catalog.js` → `definitions["6008"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6008 | 1 value(s), unsigned 8-bit big-endian; each value = raw × 32 + (0). |
| 6009 — Turbine speed (coarse byte); _TURBINENDREHZAHL | 1/min | `catalog.js` → `definitions["6009"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6009 | 1 value(s), unsigned 8-bit big-endian; each value = raw × 32 + (0). |
| 600A — Engine speed (coarse byte); _MOTORDREHZAHL_ZF | 1/min | `catalog.js` → `definitions["600A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 600A | 1 value(s), unsigned 8-bit big-endian; each value = raw × 32 + (0). |
| 600B — Actual engine torque (unsigned byte); _MOTOR_ISTMOMENT | Nm | `catalog.js` → `definitions["600B"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 600B | 1 value(s), unsigned 8-bit big-endian; each value = raw × 4 + (0). |
| 600C — Current-gear raw enum; _AKTUELLER_GANG | 0-n | `catalog.js` → `definitions["600C"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 600C | 1 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (0). |
| 601D — EGS chip2 temperature; _CHIP2_TEMPERATUR | °C | `catalog.js` → `definitions["601D"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 601D | 1 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (-40). |
| 602E — Actual / target gear display raw record; _ANZEIGE_IST_UND_ZIELGANG | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["602E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 602E | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 602F — Converter-lockup / coasting raw record; _WANDLERUEBERBRUECKUNGSKUPPLUNG_UND_SEGELZUSTAND_GETRIEBE | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["602F"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 602F | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| 6031 — Engine torque (signed byte); _MOTORMOMENT | Nm | `catalog.js` → `definitions["6031"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6031 | 1 value(s), signed 8-bit big-endian; each value = raw × 4 + (-100). |
| 6081 — EGS operating time excluding standby; _BETRIEBSZEIT_DER_EGS_OHNE_STANDBY | min | `catalog.js` → `definitions["6081"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6081 | 1 value(s), signed 32-bit big-endian; each value = raw × 1 + (0). |
| 6090 — Stationary adaptation count; _ANZAHL_DER_AUSGEFUEHRTEN_STANDADAPTIONEN | raw / count (catalog has no physical unit) | `catalog.js` → `definitions["6090"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 6090 | 1 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (0). Hybrid variant is retained raw where its layout is not verified. |
| 61F8 — Pressure-control valve / engaged-clutch logic raw record; _LOGIK_ELEKTRISCHE_DRUCKSTEUERVENTILE_GESCHALTETE_KUPPLUNGEN | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["61F8"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 61F8 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| DA22 — Torque-converter clutch state; WANDLERKUPPLUNG | 0-n | `catalog.js` → `definitions["DA22"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DA22 | 1 value(s), signed 16-bit big-endian; each value = raw × 1 + (0). |
| DA2A — Turbine / output-shaft speeds; EINAUSGANG_DREHZAHL | 1/min | `catalog.js` → `definitions["DA2A"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DA2A | 2 value(s), signed 16-bit big-endian; each value = raw × 1 + (0). |
| DA2E — Actual gear / selector enums; ISTGANG | 0-n | `catalog.js` → `definitions["DA2E"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DA2E | 2 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (0). |
| DA34 — Engine speed; MOTORDREHZAHL | U/min | `catalog.js` → `definitions["DA34"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DA34 | 1 value(s), unsigned 16-bit big-endian; each value = raw × 1 + (0). |
| DB03 — Oil-level service temperature limits; OIL_LEVEL_TEMP | °C | `catalog.js` → `definitions["DB03"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DB03 | 2 value(s), unsigned 8-bit big-endian; each value = raw × 1 + (-40). |
| DB04 — Oil-level service engine-speed limits; OIL_LEVEL_RPM | 1/m | `catalog.js` → `definitions["DB04"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 DB04 | 2 value(s), unsigned 16-bit big-endian; each value = raw × 1 + (0). |
| F101 — Software component identification; SOFTWARE_COMPONENT_IDENTIFICATION | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["F101"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 F101 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. |
| F150 — SGBD identification; SGBD_IDENTIFICATION | bytes / raw status (no decoded physical unit) | `catalog.js` → `definitions["F150"]`; `egs.js` → decode; `reader.js` → read; ECU0x18 UDS22 F150 | Payload retained as raw hex internally; Records UI shows byte count + “raw”, DID/name and age, not interpreted sensor values. Identification view also uses the raw hex as the SGBD index. |

Variant handling: `reader.js` → `VARIANTS` marks 412F, 415F, 41A0, 41A1, 41B0, 41B1, 41B3, 41B4, 602F and 4800…480F absent on supported hybrid layout. Its 4137 count is18; 4143, 4144, 4440, 4441 and 6090 remain raw. Unavailable/unknown layouts are not fabricated sensor values.

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| EGS variant | choice / on-off | `app.json` → `settings[variants]`; shared settings renderer | Persisted setting `variants`; default `"verified"`. Choices: Verified only (0F25D0) (`verified`); Try any (unverified) (`any`). |
| Refresh while visible | choice / on-off | `app.json` → `settings[autoRefresh]`; shared settings renderer | Persisted setting `autoRefresh`; default `true`. Boolean toggle. |
| Live refresh interval | s | `app.json` → `settings[liveInterval]`; shared settings renderer | Persisted setting `liveInterval`; default `2`. Selectable values: 1, 2, 3, 5, 10. |
| Shift map family | choice / on-off | `app.json` → `settings[mapFamily]`; shared settings renderer | Persisted setting `mapFamily`; default `"1"`. Choices: KF1 (`1`); KF2 (`2`); Cold KF1 (`cold1`); Cold KF2 (`cold2`). |
| Shift table | choice / on-off | `app.json` → `settings[shiftGroup]`; shared settings renderer | Persisted setting `shiftGroup`; default `"up"`. Choices: Upshifts (`up`); Downshifts (`down`); Skip downshifts (`skip`). |
| Temperature | choice / on-off | `app.json` → `settings[tempUnit]`; shared settings renderer | Persisted setting `tempUnit`; default `"C"`. Choices: Celsius (`C`); Fahrenheit (`F`). |
| Colour theme | choice / on-off | `app.json` → `settings[theme]`; shared settings renderer | Persisted setting `theme`; default `"m_tricolour"`. Choices: M Tricolour (`m_tricolour`); Ice White (`ice`); Night Amber (`amber`); M Red (`m_red`). |
| Screen layout | choice / on-off | `app.json` → `settings[layout]`; shared settings renderer | Persisted setting `layout`; default `"full"`. Choices: Full screen (`full`); Standard (`standard`). |
| Renderer | choice / on-off | `app.json` → `settings[renderer]`; shared settings renderer | Persisted setting `renderer`; default `"auto"`. Choices: GPU 60 fps (`auto`); Software (`software`). |
| Demo data | choice / on-off | `app.json` → `settings[demo]`; shared settings renderer | Persisted setting `demo`; default `"off"`. Choices: Never (`off`); Always (`on`). |

## idrive7-apps / doom — DOOM (1.7.14)

Source base: `../idrive7-apps/apps/doom/`. File references in this section are relative to that base unless a full path is given.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Current / saved episode and map | E#M# | `main.js` → menu; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomgeneric_mgu.c` → `mgu_level` | Engine exports episode×10+map; wrapper splits it into E<episode>M<map> and prefixes Game / Saved game. |
| Current / saved health on wrapper menu | % | `main.js` → menu; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomgeneric_mgu.c` → `mgu_state` | Engine clamps health0…255 then packs into bits16…23; wrapper displays integer health percentage. This is game health, not vehicle data. |
| Saved-game availability / play action state | Continue / Play | `main.js` → menu / save lifecycle | Uses actual load/save success for slot to choose Continue; saves when leaving/pause occurs. |
| Engine loading / stopped / parked-only status | text | `main.js` → menu / sync | Displays engine error message or parked-only blocking reason; pauses and returns to menu while driving with parkedOnly enabled. No numeric vehicle-speed gauge is rendered. |
| 3D game view | pixels; game-space geometry | `main.js` → game frame; `../idrive7-apps/third_party/doomgeneric/doomgeneric/r_main.c` → `R_RenderPlayerView` | Renders game level from player viewpoint, including visible map geometry, sprites and weapon; framebuffer is displayed by app. Not a camera or vehicle sensor image. |
| Ready-weapon ammunition | rounds / charges; blank for no-ammo weapons | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets / ST_updateWidgets` | Indexes player.ammo using weaponinfo[readyweapon].ammo; fist/chainsaw no-ammo type does not become a bogus numerical count. |
| Player health HUD | % | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets` | Draws player.health; the underlying game may grant health above100%. |
| Armor HUD | % | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets` | Draws player.armorpoints. |
| Weapon ownership indicators | slots2…7; owned/not owned | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets` | Six indicators use weaponowned[i+1], not a weapon count sensor. |
| Blue key card / skull indicator | owned / icon | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_updateWidgets` | Reads player.cards for blue card/skull; skull/card changes icon. |
| Yellow key card / skull indicator | owned / icon | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_updateWidgets` | Reads yellow card/skull ownership. |
| Red key card / skull indicator | owned / icon | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_updateWidgets` | Reads red card/skull ownership. |
| Player face / damage / death / invulnerability state | icon | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_updateFaceWidget / ST_calcPainOffset` | Selects face from health bands, damage/attack direction, firing, weapon pickup, death and invulnerability game state. |
| Bullets held / maximum | rounds | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets`; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomdef.h` → am_clip | Draws player.ammo[0] and maxammo[0]. |
| Shells held / maximum | shells | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets`; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomdef.h` → am_shell | Draws ammo[1] / maxammo[1]. |
| Energy cells held / maximum | cells | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets`; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomdef.h` → am_cell | Draws ammo[2] / maxammo[2]. |
| Rockets held / maximum | rockets | `../idrive7-apps/third_party/doomgeneric/doomgeneric/st_stuff.c` → `ST_createWidgets`; `../idrive7-apps/third_party/doomgeneric/doomgeneric/doomdef.h` → am_misl | Draws ammo[3] / maxammo[3]. |
| Pickup / game status messages | text | `../idrive7-apps/third_party/doomgeneric/doomgeneric/hu_stuff.c` → `HU_Ticker / HU_Drawer` | Draws player.message when messages are enabled or forced, then expires via HU_MSGTIMEOUT; includes messages generated by game events rather than vehicle alerts. |
| Automap level title | text | `../idrive7-apps/third_party/doomgeneric/doomgeneric/hu_stuff.c` → `HU_Start / HU_Drawer` | Selects mission/episode/map title from engine title tables; shown when automap active. |
| Automap discovered walls / player position and facing | game-map image | `../idrive7-apps/third_party/doomgeneric/doomgeneric/am_map.c` → `AM_drawWalls / AM_drawPlayers` | Conditional engine automap draws mapped/visible linedefs and player position/angle, with wall colors for geometry/type. Grid/marks are engine options, not GPS coordinates. |
| Completed / entering level and world-map progression | level name; map-node state | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_drawLF / WI_drawEL / WI_drawShowNextLoc` | Uses intermission last/next level indices and secret-completion flag; highlights corresponding episode map nodes. |
| End-of-level kills | % | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_updateStats / WI_drawStats` | Player level kills ×100 / map maxkills; zero denominator normalized to1 by intermission initialization. |
| End-of-level items | % | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_updateStats / WI_drawStats` | Player collected items ×100 / map maxitems, denominator normalized to1 if zero. |
| End-of-level secrets | % | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_updateStats / WI_drawStats` | Player secrets found ×100 / map maxsecret, denominator normalized to1 if zero. |
| Level completion time | minutes:seconds | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_updateStats / WI_drawTime` | Player level time in tics /TICRATE becomes integer seconds, formatted as time; animated count-up converges to final value. |
| Level par time | minutes:seconds | `../idrive7-apps/third_party/doomgeneric/doomgeneric/wi_stuff.c` → `WI_updateStats / WI_drawStats` | Map partime /TICRATE; shown for episodes with defined par display (epsd<3). |
| Engine menu episode / skill choices | episode; difficulty | `../idrive7-apps/third_party/doomgeneric/doomgeneric/m_menu.c` → `M_DrawEpisode / M_DrawNewGame` | Draws engine menu choices and cursor; wrapper new-game settings also select episode and skill. |
| Engine options / sound sliders | on/off; high/low; slider position | `../idrive7-apps/third_party/doomgeneric/doomgeneric/m_menu.c` → `M_DrawOptions / M_DrawSound` | Displays message visibility, detail level, mouse sensitivity, screen size and sound/music-volume variables when corresponding engine menus are open; slider values are game settings, not physical units. |
| Engine load / save descriptions and confirmation messages | slot description; text | `../idrive7-apps/third_party/doomgeneric/doomgeneric/m_menu.c` → `M_ReadSaveStrings / M_DrawLoad / M_DrawSave` | Reads save-file description strings for six engine slots, marks missing slots empty/disabled and draws selected descriptions / confirmation dialogs. Wrapper uses its autosave slot independently. |
| Help / credit / ending art and story text | image; text | `../idrive7-apps/third_party/doomgeneric/doomgeneric/m_menu.c` → `M_DrawReadThis1 / M_DrawReadThis2`; `../idrive7-apps/third_party/doomgeneric/doomgeneric/f_finale.c` → `F_TextWrite / F_ArtScreenDrawer` | WAD assets and engine episode-finale strings; data-dependent presentation rather than numeric vehicle metrics. |

### Displayed settings

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Parked only (pauses while driving) | choice / on-off | `app.json` → `settings[parkedOnly]`; shared settings renderer | Persisted setting `parkedOnly`; default `true`. Boolean toggle. |
| Difficulty (new game) | choice / on-off | `app.json` → `settings[skill]`; shared settings renderer | Persisted setting `skill`; default `"3"`. Choices: I'm too young to die (`1`); Hey, not too rough (`2`); Hurt me plenty (`3`); Ultra-Violence (`4`); Nightmare! (`5`). |
| Episode (new game) | choice / on-off | `app.json` → `settings[episode]`; shared settings renderer | Persisted setting `episode`; default `"1"`. Choices: 1: Outpost Outbreak (`1`); 2: Military Labs (`2`); 3: Event Horizon (`3`); 4: Double Impact (`4`). |
| Move speed | choice / on-off | `app.json` → `settings[run]`; shared settings renderer | Persisted setting `run`; default `"slow"`. Choices: Slow walk (easiest to steer) (`slow`); Walk (`walk`); Run (`run`). |
| Aim speed (controller turn) | choice / on-off | `app.json` → `settings[aim]`; shared settings renderer | Persisted setting `aim`; default `"normal"`. Choices: Slow (`slow`); Normal (`normal`); Fast (`fast`). |
| Aim direction | choice / on-off | `app.json` → `settings[aimdir]`; shared settings renderer | Persisted setting `aimdir`; default `"normal"`. Choices: Normal (`normal`); Reversed (`reversed`). |
| Render resolution | choice / on-off | `app.json` → `settings[detail]`; shared settings renderer | Persisted setting `detail`; default `"full"`. Choices: Full: 1920 x 504, every screen pixel (`full`); Medium: 1440 x 378 (`medium`); Low: 960 x 252 (`low`). |

## idrive-apps / robertn_waze_cluster — Waze on Cluster (0.4.0)

| Displayed data | Units | Source / code | Retrieval, decoding or calculation |
|---|---|---|---|
| CarPlay cluster navigation picture | Pixels; units/text supplied by phone | `../idrive-apps/native/waze-on-cluster/src/avb_source.cpp:28–64`; `../idrive-apps/native/waze-on-cluster/src/video_producer.cpp:155–269`; `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:81–109,165–184` | Receives the phone's second-screen H.264 via the AVB media bus (also supports UDP/FIFO), decodes frames and submits a video layer to the shared cluster renderer. The map is an image, not decoded speed/position/route fields; this repo cannot enumerate the phone application's changing map/HUD contents. Layer is hidden when stream is absent/frozen. |
| Patch/service connection state | Status | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:58–60,118–162,347–365` | Newline-delimited JSON over `/dev/shm/waze-on-cluster/patch.sock`; socket state maps to Connecting, service unavailable or restarting. |
| Patch installed/original/unknown/error; failure/conflict reason | Status/text | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:347–395,434–452`; `../idrive-apps/native/waze-on-cluster/patch/patchd.js:246–324` | Formats patch daemon `ev=status`, `state`, `reason`, `conflict`; daemon runs `carplay_patch.js status`, parses binary/patch inspection. Outdated panel/mode/resolution/safe-area settings generate an update-patch message rather than numeric gauges. |
| Pending patch installation/removal; restart-needed/restarting state | Status | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:259–285,315–323,347–375` | Reads daemon `pending`/`carplay=deferred`; when socket unavailable reads `/dev/shm/waze-on-cluster/activation-pending` JSON `action`. Local reboot request flag supplies restarting message. |
| Map starting/showing/waiting/frozen/error; error/reason | Status/text | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:392–408,424–431`; `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:212–260` | Reads `ev=status` from `/dev/shm/waze-on-cluster/ctl.sock`. Native feed derives state from renderer connection, stream liveness/freeze detector, layer state and slot ownership; UI displays `page` and `reason` while showing, error reason on failure. |
| Map presentation frame rate | frames/s | `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:153–169,236–240`; `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:400–401` | Counts accepted renderer frame submissions over elapsed monotonic milliseconds: integer `frames × 1000 / elapsed_ms`; included in showing-page text. |
| Captured video byte total | B / KB / MB | `../idrive-apps/native/waze-on-cluster/src/video_producer.cpp:301–332`; `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:400–401` | Adds FIFO, UDP and AVB received-byte counters; displays bytes below 1024, integer KB below 1 MiB, otherwise one decimal MB, using 1024-based divisors. Included in native `page` text while showing. |
| Total decoded frames | Frames | `../idrive-apps/native/waze-on-cluster/src/video_producer.cpp:230–259,309–332` | Atomic frame counter increments once per decoder output; included with captured-byte total in native page text. |
| Decode error count and last error | Count/text | `../idrive-apps/native/waze-on-cluster/src/video_producer.cpp:208–227,319–327`; `../idrive-apps/native/waze-on-cluster/src/main.cpp:279–285` | Counts decoder initialization/feed failures; appends total and first 70 characters of last error to decode status. Also forwarded in diagnostic log lines. |
| Active upload cap | KB/s | `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:62–65,212–240` | Renderer budget callback supplies cap/max; native showing-page text includes cap only when nonzero and below maximum. `upload_reason` is additionally present in status JSON forwarded into state-change logs. |
| Capture state and capture error | Status/text | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:326–342,434–437`; `../idrive-apps/native/waze-on-cluster/patch/patchd.js:729–751,925–929,1139–1141` | Patch daemon polls DLT capture helper and sends `ev=capture`; formats unavailable/opening/open/closing/stopped/error. Dynamic button says Stop capture while opening/open, otherwise Capture logs (5 min). The label is a fixed duration, not a countdown. |
| Map/patch diagnostic log, including timestamps and errors | Text; up to 30 rows | `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:411–459`; `../idrive-apps/apps/robertn_waze_cluster/src/robertn_waze_cluster.js:47–50,329–345`; `../idrive-apps/native/waze-on-cluster/src/main.cpp:109–120`; `../idrive-apps/native/waze-on-cluster/patch/patchd.js:167–172` | Receives both services' `ev=log.line`; prefixes `map:` / `patch:`, prepends newest, retains 30, removes source backlog on reconnect, flattens whitespace and truncates displayed row to 90 characters. Patch lines include ISO timestamp; arbitrary service messages are not separate vehicle sensors. |
| Stream live/frozen/stopped transition; alternate-screen connected/absent/unreadable | Status in log | `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:172–184`; `../idrive-apps/native/waze-on-cluster/src/main.cpp:255–272` | Logs liveness/freeze transitions and polls alternate-screen connection once per second; forwarded as map log rows. |
| Frames decoded in last minute; changed-frame count; last-picture blank/not blank | Frames/minute; count; status in log | `../idrive-apps/native/waze-on-cluster/src/video_producer.cpp:240–247,289–292`; `../idrive-apps/native/waze-on-cluster/src/main.cpp:274–278` | Frame tally tracks decoded frames, luma-change detection and blank classification; emits a minute log that appears in merged service rows. |
| Patch/resync diagnostic parameters | Mixed; text in log | `../idrive-apps/native/waze-on-cluster/patch/patchd.js:417–423,508–543,835–836,882–900`; `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:449–459` | Forwarded log text can expose capture panel/sink, process PID, no-keyframe waiting seconds, resync attempt count and total this boot, patcher stdout/stderr and filesystem/reboot errors. Values are service diagnostics, not vehicle telemetry. |
| Renderer diagnostic parameters | Mixed; text in log | `../idrive-apps/native/waze-on-cluster/src/map_feed.cpp:34–76,81–109`; `../idrive-apps/native/waze-on-cluster/src/main.cpp:271–272`; `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js:424–431` | Forwarded log text includes renderer backend/available targets, selected target, scene and quad dimensions/position in pixels, layer state/reason, status JSON and connection failures. |
| Required cluster display setting | instruction text | `../idrive-apps/apps/robertn_waze_cluster/src/robertn_waze_cluster.js` → SETUP_TEXT / _render | Static instruction: “Set Instrument cluster > Central display area to Map view”. This is a required HMI configuration, not a readback of current cluster setting. |
| Enable / disable / restart / capture control availability | visible / enabled / disabled | `../idrive-apps/apps/robertn_waze_cluster/src/robertn_waze_cluster.js` → _render; `../idrive-apps/apps/robertn_waze_cluster/src/waze_cluster_control.js` → canEnable / canDisable / restartNeeded | Enable/Disable follows patch state and pending operation; Restart shown only for deferred patch awaiting head-unit start, disabled after request. Capture requires reachable patch daemon and not restarting/closing. These are control state indicators, not independent vehicle data. |

## car-apps / iteriodev_cardash — Car Data (1.1.6)

Source base: `../car-apps/apps/iteriodev_cardash/iteriodev_cardash@1.1.6.tgz:package/`. References below name members inside that archive.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Engine speed | rpm | `javascript/main.js` → engine snapshot; CDS engine speed / OBD010C | Fresh (<1.5 s) raw CDS value×0.25, rejecting65535; otherwise OBD010C unsigned16 /4. Integer display with three-second peak hold. |
| Vehicle speed | km/h | `javascript/main.js`; CDS Vehicle2 speed / OBD010D | CDS raw/64 when fresh; otherwise OBD010D unsigned byte. |
| Boost pressure | bar | `javascript/main.js`; `javascript/obd.js` → 70 /87 /0B /33; FES boost fallback | Chooses highest fresh (<5 s) absolute pressure among supported OBD70/87/0B readings, subtracts barometric PID33 and divides kPa by100. Otherwise FES sport boost×0.01; source explicitly calls FES calibration a guess. Two decimals, peak hold. |
| Current gear / selector | D1…D10; P/R/N; gear estimate | `javascript/main.js` → gearText / gearShown | VI gear raw1R,2N/P,3…12 gears1…10, or enum-name strings; selector stage1P,2R,3N,4D. DDS20…27 fallback gears1…8 while moving. Otherwise nearest8HP ratio [5,3.2,2.143,1.72,1.313,1,0.823,0.64] from RPM/speed above8 km/h /600 rpm, rejecting abs(log ratio error)>0.08. Initial k23, learns2% toward inferred k when error<0.04. Prefixes D in D stage. |
| Engine torque | Nm | `javascript/main.js`; FES actual torque / OBD0162 +0163 | FES raw×0.5−1023.5; fallback actual torque percentage×reference torqueNm/100. Numeric and bar/peak presentation. |
| Engine power | hp | `javascript/main.js` → snapshot | TorqueNm×RPM/9549.3 gives kW, then ×1.341 hp. Derived estimate, not a dyno measurement. |
| Engine oil temperature | °C | `javascript/main.js`; CDS oil temperature | Raw CDS−48. OBD5C appears separately in details but is not the main oil-gauge fallback. |
| Engine coolant temperature | °C | `javascript/main.js`; CDS coolant temperature | Raw CDS−48; separate OBD05 value is available in diagnostic details. |
| Intake-air temperature | °C | `javascript/main.js`; `javascript/obd.js` →010F | OBD unsigned byte−40. |
| Gauge peaks and red zones | rpm /bar /hp /Nm | `javascript/main.js` → peak / redFrom; `renderer/screens.json` | Three-second peak hold for bar gauges; red zone begins at90% of user-selected maximum, not an ECU limit. |
| Details: raw gear diagnostics | raw enums; estimate scale | `javascript/main.js` → details / gear diagnostics | Displays ddsGear, ddsGearOld, ptGear, ptPos, viGear, viStage, gearMode, decoded OBD gear and learned ratio scale k. Raw enums are not all confirmed physical gears. |
| Details: FES raw values | raw values /%; reported maxima | `javascript/main.js` → FES details | Displays torque, torquePct, powerPct, maxTorque, maxPower, sportBoost, sportBoostMax, sportLat and sportLon. Raw sport fields remain raw unless explicitly converted for main gauge. |
| Details: raw bus values | raw values | `javascript/main.js` → details | Shows raw engine RPM, displayed RPM, rev/power/speed/pedal/coolant/oil/outside values received from selected bus subscriptions; preserves raw values for diagnosis, not normalized units. |
| Details: M Drive configuration | raw enum values | `javascript/main.js` → M Drive details | AWD setup qualifier, gearbox program and Drivelogic status are raw bus configuration fields. |
| OBD calculated engine load (04) | % | `javascript/obd.js`; `javascript/main.js` → OBD details | Unsigned byte×100/255. |
| OBD coolant temperature (05) | °C | `javascript/obd.js` →05 | Unsigned byte−40. |
| OBD low-pressure fuel pressure (0A) | bar | `javascript/obd.js` →0A | Unsigned byte×0.03 bar. |
| OBD manifold absolute pressure (0B) | kPa absolute | `javascript/obd.js` →0B | Unsigned byte, factor1; one boost candidate, not already gauge boost. |
| OBD engine speed (0C) | rpm | `javascript/obd.js` →0C | Unsigned16 BE /4. |
| OBD vehicle speed (0D) | km/h | `javascript/obd.js` →0D | Unsigned byte. |
| OBD ignition timing advance (0E) | degrees | `javascript/obd.js` →0E | Unsigned byte/2−64. |
| OBD intake temperature (0F) | °C | `javascript/obd.js` →0F | Unsigned byte−40. |
| OBD mass airflow (10) | g/s | `javascript/obd.js` →10 | Unsigned16 BE /100. |
| OBD high-pressure fuel rail (23) | bar | `javascript/obd.js` →23 | Unsigned16 BE×0.1 bar. |
| OBD barometric pressure (33) | kPa absolute | `javascript/obd.js` →33 | Unsigned byte; subtracted from absolute-pressure candidate for boost. |
| OBD outside / ambient temperature (46) | °C | `javascript/obd.js` →46 | Unsigned byte−40. |
| OBD engine oil temperature (5C) | °C | `javascript/obd.js` →5C | Unsigned byte−40; details value, separate from main CDS oil gauge. |
| OBD driver-demand engine torque (61) | % reference torque | `javascript/obd.js` →61 | Unsigned byte−125. |
| OBD actual engine torque (62) | % reference torque | `javascript/obd.js` →62 | Unsigned byte−125. |
| OBD reference engine torque (63) | Nm | `javascript/obd.js` →63 | Unsigned16 BE. Combined with62 for torque fallback. |
| OBD pressure sensors (70) | kPa absolute | `javascript/obd.js` →70 | With PID data indexed from0: if d[0]&2, (256×d[3]+d[4])/32; else if d[0]&8, (256×d[7]+d[8])/32; otherwise unavailable. Chooses supported actual sensorA elseB, not the commanded-pressure bytes. |
| OBD pressure sensors (87) | kPa absolute | `javascript/obd.js` →87 | If d[0]&1, (256×d[1]+d[2])/32; otherwise unavailable. SensorA actual absolute pressure. |
| OBD transmission gear (A4) | gear enum | `javascript/obd.js` →A4 | If d[0]&2, d[1]>>4; otherwise unavailable. Raw OBD decoded gear is shown in diagnostic details; main fallback uses bus / ratio estimate. |
| Supported PID inventory / multi-PID state | hex PID list; on/off | `javascript/main.js` → supported / multi | Requests service01 from DME0x12 and EGS0x18, up to six PIDs/batch; support bitmaps guide subsequent queries. Batch timeout/NRC disables multi-PID where implemented. |
| Diagnostic / bus / source state | link; error; pause; source changes/s | `javascript/main.js` → OBD / details status | Two-second query timeout,10 ms request gap; polling active for30 minutes after tap. Displays failures, source switching and SOME/IP connectivity rather than silently replacing missing data with zero. |
| RPM bar maximum | rpm | `javascript/main.js` → RANGES.rpm; `renderer/screens.json` | User setting default8000, range5000…10000, step500; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Boost bar maximum | bar | `javascript/main.js` → RANGES.boost; `renderer/screens.json` | User setting default2.5, range0.5…4, step0.25; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Power bar maximum | hp | `javascript/main.js` → RANGES.power; `renderer/screens.json` | User setting default500, range200…1000, step50; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Torque bar maximum | Nm | `javascript/main.js` → RANGES.torque; `renderer/screens.json` | User setting default700, range300…1200, step50; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Oil bar maximum | °C | `javascript/main.js` → RANGES.oil; `renderer/screens.json` | User setting default150, range100…180, step5; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Coolant bar maximum | °C | `javascript/main.js` → RANGES.coolant; `renderer/screens.json` | User setting default130, range100…160, step5; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |
| Intake bar maximum | °C | `javascript/main.js` → RANGES.intake; `renderer/screens.json` | User setting default80, range40…120, step5; clamped/snapped and persisted to app data/settings.json. Gauge presentation limit, not ECU calibration. |

## car-apps / iteriodev_draggy — Draggy (1.1.5)

Source base: `../car-apps/apps/iteriodev_draggy/iteriodev_draggy@1.1.5.tgz:package/`. References below name members inside that archive.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Fused current speed | km/h; mph | `javascript/main.js`; `javascript/fuse.js` → SpeedFuser | Combines Vehicle2 raw speed/64 (50 ms poll,400 ms freshness) with longitudinal acceleration raw×0.002−65 m/s² (50 ms poll,200 ms freshness), optional GPS calibration, then km/h×0.621371 for mph. |
| Speed-source / sensor health | wheel / accel / GPS; missing / error | `javascript/main.js`; `javascript/fuse.js` | Marks freshness/availability of fusion inputs; GPS read once per second, fresh for2 s. Uses GPSPositionExtendedCAN.speedGPSCAN×configured scale(default1, raw scale not established); rejects implausible >400 km/h/disagreement; quality accepted when absent or <1000. |
| Wheel-speed calibration factor | ratio | `javascript/fuse.js`; `javascript/main.js` → sensor status | Learns GPS/wheel correction under steady motion >30 km/h, clamps0.9…1.1; shown to two decimals. Not a tire circumference measurement. |
| Wheelspin indication | WHEELSPIN flag | `javascript/fuse.js` | Compares wheel-derived change with accelerometer prediction; integrates acceleration and corrects toward wheel signal advanced0.3 s, with wheelspin gating. Standstill learns acceleration bias. |
| Run / launch state | WAIT / READY / RUN | `javascript/timer.js` → RunTimer | Arms after speed<0.5 km/h for one second; launch timestamp interpolated at0.5 km/h. Finishes after slowdown>5 km/h from peak, all configured splits, or40 s. |
| Current / completed elapsed time | s, two decimals | `javascript/timer.js` → elapsed; `javascript/main.js` | Elapsed from interpolated launch, not time since UI refresh. Archived app sets rollout false. |
| 0–50 km/h split | s | `javascript/main.js` → SPLITS.kmh; `javascript/timer.js` | Interpolates50 km/h crossing from launch. |
| 0–100 km/h split | s | `javascript/timer.js`; `javascript/main.js` → splits | Interpolates100 km/h crossing; time from launch. |
| 100–200 km/h split | s | `javascript/timer.js`; `javascript/main.js` → splits | Interpolates both speed crossings, subtracts timestamps. |
| 0–200 km/h split | s | `javascript/timer.js`; `javascript/main.js` → splits | Interpolates200 km/h crossing from launch. |
| 0–30 mph split | s | `javascript/main.js` → SPLITS.mph; `javascript/timer.js` | Converts30 mph to48.28032 km/h and interpolates crossing from launch. |
| 0–60 mph split | s | `javascript/timer.js`; `javascript/main.js` → splits | Converts target speed to internal km/h, interpolates crossing from launch. |
| 60–130 mph split | s | `javascript/timer.js`; `javascript/main.js` → splits | Converts mph boundaries to km/h, interpolates and subtracts crossing timestamps. |
| 0–100 mph split | s | `javascript/timer.js`; `javascript/main.js` → splits | Converts100 mph to160.9344 km/h, then interpolates crossing from launch. |
| Selected distance elapsed time | s | `javascript/timer.js` → distance split | Interpolates time where accumulated metres cross selected distance; no GPS straight-line-distance computation. |
| Distance trap speed | km/h; mph | `javascript/timer.js` → trapSpeed | Interpolates speed at the same distance-crossing fraction, not peak speed or an averaged trap interval. |
| Speed-versus-time trace | s; km/h; mph | `javascript/timer.js` → trace; `javascript/main.js` → chart | Samples trace at ≥50 ms; thins every other point above1800. Chart minimum extent15 s /300 km/h or200 mph, scaled for selected units. |
| Best split / distance result | s; trap speed; DD.MM HH:MM | `javascript/main.js`; data/draggy.json | Persists minimum time per result key across metric and imperial splits and distance choices; shows best date/time and trap for distance. Not a chronological full-run history. |
| Speed units setting | km/h / mph | `javascript/main.js`; data/draggy.json | Persisted UI choice controls shown speed and split group; underlying timer uses km/h. |
| Distance setting | 1/8 mi /1/4 mi /1 km | `javascript/main.js` → distance choices | Targets:1/8 mile201.168 m;1/4 mile402.336 m;1000 m. Selects distance split and best-result key; default1/4 mile. No standalone travelled-distance readout is rendered. |
| Timing / sensor / no-data feedback | text | `javascript/main.js`; `renderer/screens.json` | Displays source errors, waiting/ready/running state and best-result availability; missing sources are not represented as measured zero. |

## car-apps / iteriodev_dtcscan — DTC Scanner (1.1.2)

Source base: `../car-apps/apps/iteriodev_dtcscan/iteriodev_dtcscan@1.1.2.tgz:package/`. References below name members inside that archive.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Scan phase / responders / last scan | status; count; date/time | `javascript/main.js` → doScan / scanSub; `javascript/diag.js` | Functional target0xDF UDS19 02 0C asks all units for fault records. Ends after4 s reply idle or25 s maximum; displays responder count and persisted/current scan timestamp. |
| Total fault codes | count | `javascript/main.js` → render / scanSub | Sums each answering ECU dtcs.length; before scan shows dash, not zero. |
| Control units with fault codes | count | `javascript/main.js` → withFaults / render | Counts fault-bearing modules separately from total responders; clear-all row uses this count. |
| Faulted-module list | module name; hex address; fault count; active/stored | `javascript/main.js` → moduleItems | Only modules with faults, sorted by fault count/address. Active count is status&1; no active bits gives stored. Badge colors active critical, otherwise warning. |
| Selected module identity | name; 0xaddress; SGBD variant; code count | `javascript/main.js` → unitName / variantOf / render | Resolves unit dictionary and F150-derived SGBD identity; leaves missing variant absent instead of using wrong text dictionary. |
| BMW DTC code | six hexadecimal digits | `javascript/diag.js`; `javascript/main.js` → faultItems | Three DTC bytes formatted hex per responding ECU; not converted into generic SAE P-codes. |
| DTC state / badge / color | active / warning lamp / pending / stored / history | `javascript/main.js` → statusInfo / statusColor | Status precedence bits01,80,04,08,else history. Color critical for0x81, warning for0x0C, dim otherwise; full raw byte retained for fallback. |
| DTC description or raw status fallback | text; hex byte | `javascript/main.js` → describe / faultItems; dtc_texts / texts resources | Looks up address-specific dtc_texts, then F150 identity-specific texts/<SGBD>.json. Unknown code/variant displays raw status byte, not a guessed cross-module description. |
| Scan diagnostic notes | NRC; names coverage; clean modules; link/error text | `javascript/main.js` → hintText | Shows latest message, link state, per-module refusals, identified units with ISTA text support, and answering modules with no codes. |
| Clear target / confirmation | all or selected module; count; text | `javascript/main.js` → confirmClear / render | Confirmation uses current faulted targets. Parked guard must pass; no confirmation page while guard says unsafe. |
| Clear progress / success / stopped reason | cleared count / target count; text | `javascript/main.js` → doClear; `javascript/diag.js` | Fresh car safety read before each physical14 FF FF FF; counts positive54 replies. Guard refusal stops further units; waits1.5 s then rescans, so accepted clearing is not falsely claimed to mean all faults gone. |
| Check Control current active-message count / read state | count; status | `javascript/main.js` → readCc / ccState / render | Reads CCM and Kombi sources; distinguishes no active messages from missing source/list. |
| Check Control message content / name | text; message ID | `javascript/main.js` → ccItems / readCc | Merges active CCM data with cluster message-name list; sorted messages preserve IDs. Unknown names remain identifiable. |
| Check Control origin / linked fault / severity | origin ECU; fault-origin flag; ID; color | `javascript/main.js` → ccItems | Shows requestor ECU name, literal “from a fault code” when reason contains DTC, and message ID. Does not show an associated numeric DTC code here. RED/1→RED, YELLOW/2→YEL, ORANGE/4→ORA, GREEN/3→GRN, WHITE/5→WHT; cluster names have non-ASCII stripped. |
| Check Control refresh / unavailable status | text | `javascript/main.js` → ccState / render | Reports source-link failure and cluster-name-list unavailable separately from empty active list. |
| Parked / clearing blocker | text | `javascript/main.js` → parkedOrSay / doClear; `bundle.js` → createGuard | Shared guard gates writes using fresh vehicle speed / engine state. These are safety inputs; this app does not render numeric RPM/speed gauges. |

## car-apps / iteriodev_liveadjust — Live Adjustments (1.0.3)

Source base: `../car-apps/apps/iteriodev_liveadjust/iteriodev_liveadjust@1.0.3.tgz:package/`. References below name members inside that archive.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| DME link / answer status | not asked / answers / not answering | `javascript/main.js` → poll / render; `javascript/diag.js` | Every2 s polls DME0x12 for service01 speed/RPM and UDS22 64FD flap; any answer counts as DME answering, not proof of MHD feature support. |
| Map-switch safety state | standing still / Map locked + reason | `javascript/main.js` → still / setMap / render; `bundle.js` → createGuard | Guard configured engineRunning:true and freshness5000 ms; map switch refreshes speed immediately and requires stationary (<1 km/h) fresh data. Engine may run. RPM/speed are gating inputs, not numeric gauges on this app. |
| Accepted MHD map slot | MAP --; MAP1…MAP4 | `javascript/main.js` → setMap / sendMhd | Sends DME2F 01 (slot−1). Updates local map only if positive6F echoes every requested byte; UI explicitly says accepted by DME. No actual active-map readback or persistent ECU-state claim. |
| Exhaust flap position / intermediate duty | OPEN / CLOSED /%; -- / NONE | `javascript/main.js` → readFlap / render; UDS22 64FD | Signed16 BE response bytes3…4 /100%; ≤20 OPEN, ≥80 CLOSED, otherwise actual percentage. Negative reply other than busy21/conditions22 marks NONE; intermediate position is not coerced open/closed. |
| Exhaust flap illustration | open / closed icon | `javascript/main.js` → render; `renderer/screens.json` | Pipe imagery follows decoded OPEN state; this is visualization of same readback, not a second sensor. |
| Exhaust override target / acceptance / OEM state | Open / Closed / OEM; text | `javascript/main.js` → FLAP / setFlap | DME2F60FD03 with10% duty03E8 for open or90%2328 for closed; OEM2F60FD00. Re-reads64FD after response; override controls reflect requested mode. |
| Exhaust override remaining time | s | `javascript/main.js` → overrideUntil / render | After accepted override, local20-second countdown ceil((deadline−now)/1000); then “the DME decides”. Not read from ECU timer. |
| Max Cooling accepted state | ON / OFF | `javascript/main.js` → setCooling / sendMhd | Local default OFF. DME2F0301/00, changes display only on exact positive6F echo. No cooling-state readback; last accepted request, not measured fan/pump operation. |
| Max Cooling engine gate | Engine stopped / unknown / blocked reason | `javascript/main.js` → readRpm / rpmKnown / engineStopped | On refreshes OBD010C: unsigned16 BE /4 rpm, ≤500 rpm stopped, fresh ≤5 s. Unknown blocks sending; Off/flap allowed at any speed. Numeric RPM intentionally absent from screen. |
| Action progress / success / diagnostic error | text; NRC; 8-second feedback | `javascript/main.js` → run / say / line; `javascript/diag.js` | Per-card Sending/accepted/refused/no reply/unsupported text replaces state line for8 s. Diagnostic transport handles pending10 s and temporary/busy backoff1/2/3/4 s, up to four retries; failures remain visible. |

## car-apps / iteriodev_tailscale — Tailscale (1.0.2)

Source base: `../car-apps/apps/iteriodev_tailscale/iteriodev_tailscale@1.0.2.tgz:package/`. References below name members inside that archive.

| Displayed data | Units | Source / input | What the code does |
|---|---|---|---|
| Tailscale backend / connectivity state | Connected / Log in needed / Waiting for approval / Disconnected / Connecting / Not running | `javascript/main.js` → kind / STATE / readAll; `javascript/tsapi.js` | Reads LocalAPI GET/localapi/v0/status over /run/iteriodev-tailscale/tailscaled.sock; Running, NeedsLogin+AuthURL, NeedsMachineAuth, Stopped and missing daemon map to distinct states. Refreshes every2 s. |
| Tailnet device name | hostname | `javascript/main.js` → tailnetName / render; status.Self | First label of Self.DNSName, otherwise Self.HostName; dash when absent. |
| Tailnet IP address | IP string | `javascript/main.js` → render; status.Self.TailscaleIPs | First address only; info table shows it only when connected, otherwise --. |
| Tailnet account | login name | `javascript/main.js` → render; status.User | Indexes status.User by Self.UserID and shows LoginName only when connected; -- if unavailable. |
| Internet uplink state / connection name | online / state; device name | `javascript/main.js` → readAll / online / render; /run/mgu-uplink/status.json | Reads uplink state and device.name. Chip reports Internet:<name/state> or No internet uplink; connecting/login state adds internet-needed hint when offline. |
| Tailscale version | version string | `javascript/main.js` → render; status.Version | Displays version substring before first hyphen; no daemon gives Tailscale not running. |
| Login / authorization URL | URL text | `javascript/main.js` → render; status.AuthURL | Shows AuthURL without leading http(s):// as text; uses full URL for QR and login action. |
| Login QR image | 540-pixel QR | `javascript/main.js` → showQr; `javascript/qr.js`; `javascript/qrcode.js` | Encodes complete AuthURL with QR error correctionM, smallest fitting version and four-module quiet zone; regenerates when URL changes, not a network-provided bitmap. |
| SSH connection command by hostname | ssh root@<name> | `javascript/main.js` → render / reach1 | Constructs command from tailnet device name when connected; does not execute SSH. |
| SSH connection command by IP | ssh root@<IP> | `javascript/main.js` → render / reach2 | Constructs alternative command from first tailnet IP; does not execute it. |
| Editable device name / validation / default | hostname; hint text | `javascript/main.js` → typeKey / saveName; `javascript/tsapi.js` → prefs / setHostname | Loads requested hostname with GET prefs, else current tailnet name. Lowercase a-z,0-9,hyphen, max63; cannot start/end hyphen. Empty restores default mgu. PATCH prefs HostnameSet:true,Hostname:<value> then reports acceptance, warns tailnet propagation/admin override. |
| Action button / logout confirmation state | Log out / Confirm log out / Connect / New login link / Refresh | `javascript/main.js` → EVENTS / armed / render | Depends on backend state; logout needs second tap within5 s. Connect PATCH prefs WantRunningSet/WantRunning true; login additionally POST login-interactive; logout POST logout. |
| Action / failure / setup instructions | text; 8-second feedback | `javascript/main.js` → act / say / render; `javascript/tsapi.js` → call | Shows progress, errors, missing Store tool/restart instruction and login/approval steps. LocalAPI requests time out after5 s and reject non-2xx with bounded response text; action message replaces standard state hint for8 s. |
