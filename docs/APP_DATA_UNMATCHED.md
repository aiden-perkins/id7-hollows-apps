# Unmatched app data connections

Reference: [APP_DATA_INVENTORY.md](APP_DATA_INVENTORY.md).

Scope: `apps/trip_data` and `apps/live_data_viewer`. Ambient Lighting is excluded.

This records data that could not be matched confidently to the reference inventory. Similar wording alone is not sufficient: physical quantity, sensor location, pressure reference, counter period, cylinder mapping, units and decoding must agree.

- **Unavailable:** no sufficiently established connection; no speculative replacement was added.
- **Existing source retained:** the app already has a vehicle-specific connection, but the reference inventory does not establish an exact equivalent. An inventory mismatch does not itself mean the existing connection is incorrect.
- Candidate sources below are related possibilities, not approved substitutions.
- This was a source/inventory audit, not on-vehicle validation. No tests, previews or project code were executed. Runtime availability and calibration remain unverified.

## Trip Data

| Display / data | Current connection or required input | Potential inventory source and units | Why not matched / action |
|---|---|---|---|
| Fuel used; average US MPG; rolling economy; speed-band and gear fuel/MPG breakdowns; fuel coverage | Unavailable. Existing calculations expect a monotonically cumulative fuel-consumed counter in US gal, then calculate deltas. A validated fuel-rate source would require integration. | Fuel pressures: bar/psi, inventory lines 55–56, 98–104, 903, 910. Mass airflow: g/s, line 909. eDrive energy/consumption: SOC %, kWh and energy-per-distance, lines 170–214. | Pressure is not consumed volume; airflow needs additional mixture/fuel assumptions; battery energy is not liquid-fuel consumption. Left unavailable. |
| Automatic ignition recording | Unavailable; requires validated ignition-on/off state or events. | RPM-derived engine-running state, line 176. Ignition timing advance, degrees BTDC, lines 57, 121–122, 907. | Engine running is not an ignition boundary, especially with stop/start. Ignition timing advance is unrelated to ignition power state. Left unavailable. |
| Altitude; elevation graph; first/last/net/min/max height; ascent/descent; vertical speed; valid height coverage | Existing Positioning `Main_Instance.rawPositionData.position.height.rawLengthMeter`, presumed metres, converted to feet; vertical speed in ft/min. Height requires a valid 3D fix and height-valid flag. | Inventory GPS references at lines 937–938 describe `GPSPositionExtendedCAN.speedGPSCAN`, km/h, with unestablished scaling; not altitude. | No matching altitude definition, datum, accuracy or vertical-response information. Existing connection retained with its uncertainty. |
| GPS coordinates, source-only | Existing latitude/longitude in degrees; used for internal coverage, not displayed trip distance. | No matching coordinate contract in the inventory. | Existing connection retained. Trip distance remains derived from vehicle speed, not these coordinates. |

### Gear uncertainties retained

The existing `VehicleInformation.DataPowerTrain2.statusGearSelectionDrive` connection is a documented match to the alternative enum described at inventory line 27; it was not replaced.

- `NP` remains unresolved N/P, not an invented P or N reading.
- No D/S/M transmission program is inferred from this enum.
- Related alternatives are actual gear/selector signals, EGS DA2E (lines 648–649, 785), and ratio-derived gear estimates (line 28). These are not interchangeable without checking semantics.
- Existing display limitation: the source accepts gear 9, while the graphical table has rows 1–8; gear-9 duration contributes to Unknown. No visual change was made.

## Live Data Viewer: unavailable readings

| Display wording / quantity | Current state and units | Potential source / units | Why not matched |
|---|---|---|---|
| Converter temperature | No source; requested display °F. | EGS 6000 transmission oil, 6005/601D chip temperatures, °C/°F; 4440/4441 historical temperature histograms, hours per temperature band. Inventory lines 645–667. | Oil/chip temperatures and historical bins are not a current torque-converter temperature sensor. |
| Cabin temperature | No source; requested display °F. | Climate-state/raw diagnostic information, inventory lines 210–234. | No established cabin-temperature measurement or scaling. |
| CC coolant | No source; requested display °F. | DME F477 charge-air temperature, °C, line 96; eDrive DD6C HV-battery coolant, °C, line 232. | Charge air is a different medium; HV-battery coolant is a different circuit. |
| Intake B1 | No source; requested display °F. | F40F / OBD 0F generic intake temperature, °C; F477 bank-1 sensor-1 charge-air temperature, °C. Lines 95–97. | Neither establishes the requested bank-specific intake-air sensor. |
| Rear diff temperature | No source; requested display °F. | No close inventory candidate. | No differential-temperature match. |
| Trans press. / transmission oil pressure | No source; live unit/scaling unestablished. | EGS clutch adaptation corrections, mbar/bar, lines 657–662, 670–671. | Adaptation corrections are not live transmission oil pressure. |
| Oil pressure / Actual | No source; live unit/scaling unestablished. | No close inventory candidate. | Engine oil-temperature channels are not pressure. |
| High-pressure fuel / Target | No source; target unit/scaling unestablished. | F423 / OBD 23 gauge rail pressure, bar; F459 absolute rail pressure, bar. Lines 98–100. | These are actual measurements, not requested rail-pressure targets. |
| Low-pressure fuel / Target | No source; target unit/scaling unestablished. | F40A / OBD 0A gauge pressure, bar; F422 / OBD 22 manifold-relative pressure, bar. Lines 101–104. | Actual measurements with different pressure references, not a supply-pressure target. |
| C1–C8 TIM / timing correction | Eight unavailable slots, degrees. | OBD 0E / F40E cylinder-1 timing advance, degrees BTDC. Lines 57, 121–122. | Advance is not correction and cannot populate eight cylinder channels. |
| MAX TIMING CORR | Unavailable derived maximum absolute session correction, degrees. | Same cylinder-1 advance candidates above. | Correction extrema cannot be derived from a different quantity. |
| C1–C8 KNOCK | Eight unavailable slots, V·ms. | No inventory input. Existing definition notes identify ISTA `SPG_KLOPF_ZYL1..6`, BE32 × 0.05 / 65536 V·ms. | Physical C1–C8 mapping across both DMEs is unresolved. These quantities are not knock-event counts. |
| C1–C8 MISS / TOTAL MISFIRES | Eight unavailable slots and unavailable total, counts. | Mode 06 MID A0/A2… with TID 0C, or UDS F6xx fallback; intended current-drive-cycle counts. Lines 65–66. | Inventory single-ECU monitor handling does not establish dual-DME physical-cylinder mapping or equivalent fallback counter periods. |

## Live Data Viewer: existing sources without an exact inventory match

These connections were preserved. Related inventory candidates are not necessarily better or equivalent.

| Display / source group | Existing input and units | Closest inventory candidate / remaining uncertainty |
|---|---|---|
| BOOST source inputs | DME 4205: unsigned BE16 × 20/256 hPa absolute, pre-throttle. DME 4201: unsigned BE16 × 10/256 hPa ambient. Difference displayed in psi. | Inventory 580B/F470/OBD 70 boost and F433/OBD 33 barometer, kPa absolute, lines 107–118. Exact existing inputs are not listed; no reason established to replace them. |
| Battery voltage (IBS) | DME 586A, signed BE16 × 0.02 V. | F442 / OBD 42 system voltage, V, line 178. Not established as the identical IBS quantity. |
| Fuel tank total / left / right; gallons and tank graphic | KOMBI D11F: total/left/right at offsets 4/2/0, unsigned BE16 /128 L, phase-1 validity; converted to US gallons. | No inventory counterpart. Existing percentage uses a nominal 68-L capacity, not ECU-reported tank capacity. |
| BRAKE / brake-system pressure | DSC DB29, signed BE16 at offset 2 /10 bar. | Inventory braking acceleration/distance, g/metres, lines 458–470, is not hydraulic pressure. |
| ACCELERATOR / pedal position | DME 480B, signed BE16 × 0.01220703 %. | Inventory raw pedal data is unnormalized, line 899. Engine load and relative air charge, %, lines 61–62 and 901, are different measurements. |
| PARKING BRAKE | Vehicle2 `statusStandstillFunctions.statusParkingBrake`, state. | Inventory preconditions can leave parking brake unknown, line 618; no exact replacement mapping. |
| KICKDOWN | DME 4007, byte 0 mask 0x04, bit 2, switch state. | No inventory match. |
| Global driving mode | FES `statusFESVehicleDynamicSwitchHMI.actualValueModeDrivingExperience`, enum. | No exact inventory driving-mode mapping. |
| Front/rear effective steering angles | DME 58C6 and rear-steering ECU DB33, degrees. | No calibrated axle-effective angle equivalent in the inventory. These are not individually measured wheel toe angles. |
| Four wheel speeds | DSC DBE4, individually qualified signed BE16 /100 km/h, converted to mph. | Vehicle2/GPS road speed, km/h or mph, cannot replace four individual wheel speeds. |
| Front/rear anti-roll data | ECUs 0x25/0x04: D699 actuator torque, Nm; D69A requested/actual motor torque, Nm; D6BB angle, radians converted to degrees, plus state; D69B current, A. | No inventory anti-roll equivalents. |
| Intake B2 | DME 562A, byte × 0.75 − 48 °C, converted to °F. | Generic intake/charge-air sources do not establish the same bank-specific sensor. |
| Generic intake fallback | DME 580F, byte × 0.75 − 48 °C, converted to °F, after F40F / OBD 0F candidates. | No exact 580F inventory entry. Retained as generic intake, not used to invent bank-1 identity. |
| Pre-thr. air | DME 59D4, unsigned BE16 × 0.0234375 − 273.15 °C, converted to °F. | Generic intake/charge-air candidates are not established at the same measurement location. |
| Exh B1/B2 mdl | DME 5896, signed16 × 0.1 − 273.14 °C; 5897, unsigned16 × 0.0234375 − 273.15 °C; converted to °F. | No inventory exhaust-model temperature counterparts. |
| Cat gas B1/B2 | DME 5079/50D6, signed16 /10 °C, converted to °F. | No inventory equivalent. Existing quantities are gas models, not catalyst-substrate sensors. |
| Clutch mdl / transfer-case clutch temperature model | LMV 4004, signed BE32 /4194304 °C, converted to °F. | Inventory LMV DB32 is front-axle torque, Nm, not clutch/transfer-case temperature. |
| Exhaust controls and output readback | Separate left/right DME 64FD electrical-output bands; 62FD capability/command and 2F60FD control paths. | Inventory lines 607–609 and 990–993 support the DID family but not mechanical flap-position readback or this dual-DME mapping. Button selection represents an accepted request, not measured mechanical position. |
| Front/rear HP | Existing crankshaft hp × reported rear torque share or its complement. | Inventory torque share, %, lines 70–71, and front-axle DB32 torque, Nm, lines 72 and 619–620, do not establish measured axle horsepower. Existing values remain estimates. |

## Live Data Viewer: hidden / source-only uncertainties

These definitions were also reviewed but are not all visible gauges in the current UI.

| Data | Existing input / units | Unmatched detail |
|---|---|---|
| GPS altitude | Positioning `Main_Instance.rawPositionData`, valid 3D fix and height-valid flag; metres converted to feet. | Inventory does not establish altitude datum or accuracy. |
| Driver steering-wheel angle | Qualified XView steering field, degrees. | No exact inventory calibration; distinct from effective road-wheel angle. |
| Brake pedal switch | DSC D9EF, state. | No exact inventory equivalent; not hydraulic pressure or braking acceleration. |
| DSC / traction state | FES enum. | No exact inventory replacement. |
| Individual wheel directions | DSC DBE4, individually qualified enums. | Road speed or selected gear is not an equivalent direction source. |
| Sensor-slot 1–4 identities | TPMSInternalData serials, decimal/hex. | Physical wheel positions for the radio slots are not established by the inventory. |
| Reported wheel state 1–4 | No source. | Aggregate qualifiers do not establish individual wheel state. |

## Boundaries

- No uncertain source above was substituted solely because its wording looked similar.
- Successfully corrected speed/RPM decoding, TPMS unit normalization and actual fuel-pressure connections are not outstanding unmatched items.
- Recognized existing gear decoding remains connected; its ambiguity is recorded separately above.
- Local timers, storage, settings, recording metadata and explicitly synthetic demo data are not missing vehicle-sensor bindings.
- Existing calibration warnings do not constitute on-vehicle validation, even where an inventory-backed decoder is now connected.
