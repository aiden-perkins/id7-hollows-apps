# MGU Lab findings

Review of the saved Oct. 25-26, 2026 results. No new car tests were run.

## Sources and limits

- [Oct. 25 export](../../out/mgu-lab-20261025-170559-a8b2e3f4/): initial input, mode and lighting results.
- [Oct. 26, 20:25 export](../../out/mgu-lab-20261026-202547-a08b8b3e/): successful lighting writes and vehicle experiments.
- [Oct. 26, 20:34 export](../../out/mgu-lab-20261026-203444-5cdfa8f3/): later readings, controller touch and exterior-light failures.

Reviewed `mgu_lab-events.jsonl`, rotated `.jsonl.1` files, `mgu_lab.log`, snapshots, presets, settings and UI trials. UTC timestamps extend into Oct. 27. The two Oct. 26 snapshots have cumulative counters from the same app session; their sample counts should not be added together.

Names below match the saved `key.field` identifiers. Full interfaces are in [app.json](app.json), [services.js](services.js) and [vehicle_lab.js](vehicle_lab.js).

## Channels returning data

| Channel | Evidence and useful behavior | Remaining limit |
| --- | --- | --- |
| `mode.statusFESVehicleDynamicSwitchHMI` | 65 retained mode-change events: Comfort/Comfort Plus, Sport Dynamic/Expert/Individual, Eco Pro Efficient/Individual. Suitable for mode display and linked actions. | None of these changes was logged while the app was hidden. |
| `legacy.statusAmbientLightInteriorColour` / write `ambientLightInteriorColour` | **12 later preset writes matched readback:** A = 3, B = 4, C = 5. Mode changes were followed by matching presets. Latest saved mappings: Sport -> A/menu 12, Comfort -> B/menu 5, Eco -> C/menu 8. | Physical colors need visual confirmation; these writes do not demonstrate brightness, independent layers or dynamic-light control. |
| `engine.statusEngineSpeed2`, `statusEngineTemperature`, `statusBattery2` | Latest snapshot: 602 RPM samples; raw RPM `3220`, temperatures `90/75`, battery field `46`. | Existing app scaling gives 805 RPM and 42/27 C; compare scaling and battery meaning with vehicle instruments. |
| `vehicle.statusCarSpeed2`, `statusLightStatus` | Speed returned raw `0`; dipped-beam and position-light states changed between `AUS` and `EIN`. | Only 3 speed samples; the latest snapshot's speed reading was about 44 minutes old. Moving-speed behavior is unproven. |
| `lamps.LampExterior`, `statusOperationLightExterior`, `IndicatorSteeringColumnComplete`, `LowBeam` | 88,770 `LampExterior` samples by the latest snapshot; brake-light and daytime-running-light fields show on/off states. Switch status includes `STELLUNG_0` and `STELLUNG_AUTOMATIK_1`. | Monitoring works; lamp control is unproven. `LowBeam` returned only 3 samples. |
| `fuel.statusRangeTankStatus` | Retained events show total raw `15-16`, left `10 -> 0`, right `17 -> 28`, range `112`. Separate tank readings are available and change. | Units need calibration; left + right does not equal the reported total. Do not label these raw values as liters yet. |
| `fuelEstimate.dataCombinedInstrumentCluster`, `mileageRange` | Display tank-level field changed `54 -> 53` between snapshots; `mileageRange.fluidLevelFuelTank` returned `15/16`. | Several other cluster fields contain maximum/default values. No `fuelSupply` payload was captured. |
| `gps.rawPositionData` | 2,666 samples by the latest snapshot. All 242 retained GPS events have `FIX_3D`, valid coordinates and valid height of `5-6 m`. | Location/elevation display is possible; height reference, accuracy and response to elevation changes remain unconfirmed. |
| `steering.statusSteeringAngleDriver`, `statusFrontAxleSteeringAngle`; three `steeringChassis` events | XView driver-angle raw values span `26441-39481`. Latest XView and chassis no-CRC driver readings both equal `32974`. | Movement is observable. Center, direction and degrees need calibration; CRC-bearing variants have different raw values. |
| `pedal.AngleAcceleratorPedal` | 18,834 samples by the latest snapshot with a valid-value qualifier. | All 266 retained pedal events have actual/virtual pedal values `0`; response to movement and percentage scaling are unproven. |
| `braking.StabilizationManagement` | 212,789 samples by the latest snapshot; retained driver-braking values `0/23`, MSA braking values `0/5`. | Changing brake-related data is available, but pedal position/pressure and even the status meanings remain undecoded. |
| `touchpad.ZBETouchFrontSide` | 761 touch records in the latest export, despite relay creation failing. Direct controller-touch data is available independently of the relay. | Decoder labels all records as two fingers, but X1 is only `0/1` and Y2 is always `0`. Validate coordinate layout and contact detection before using gestures. |

The Oct. 25 lighting writes failed 11 times with `controlMenuAmbientePanoramicRoofInteriorLighting: Not a string`. Later readbacks succeeded, and the current [command mapping](domain.js) sends named enums such as `FARBAUSWAHL_12`. The early failure should not be treated as the final result.

## Channels without a useful result yet

| Channel / operation | Recorded result |
| --- | --- |
| `tpms.statusTyrePressure`, `statusTyreTemperature`, `statusTargetTyrePressure` | Calls return, but all four wheels give `65534` for pressure/temperature and `65533` for targets. No usable physical measurements established. The local catalog lists default `65535` but does not explain these other codes. |
| Other `tpms` fields | Status and available-tyre-list updates arrive; front/rear/summer/winter dimensions are zero-filled. The available list describes selectable options, not installed tyres or sensor identities. Getter/event enums use different representations. |
| `tpms.tyreParkSupervision` | Repeated getter timeouts after 1,200 ms. |
| `tpmsInternal.*` | No provider announcement or payloads: sensor IDs, battery, radio, calibration, QR and tyre mileage remain unavailable in these captures. |
| `exterior.*` / `LightswitchOperation` | No provider announcement. Front fog on/off, lights off, position-light and automatic-light requests failed with `Exterior lighting provider is unavailable`. No successful exterior-light command captured. |
| `profile.currentInteriorLightProfile` | No provider announcement or payload. Legacy lighting is the demonstrated backend on this car. |
| `wheel.statusRotaryPress`, `statusRotarySteps`, `statusAudioVolumeButton` | Only invalid/no-action results: `SIGNAL_UNGUELTIG`, `255`, `KEINE_AKTION...`. No useful wheel-button interaction captured. |
| Input relay | `InputRelayManagerInst1` became available, but creation returned `INTERNAL_ERROR`. No relay key/touch events; managers 2/3 remain unproven. |
| Other controller touch | Rear-side coordinates are `4095`/unfilled in snapshots. No captured `operationZBETouch2/3` payloads; touchscreen delivery remains unproven. |

## What is possible

- Mode-aware ambient-light presets using the legacy backend, with reported-state confirmation.
- A live dashboard for engine values, tank split, GPS height and lamp status; raw steering/pedal/braking views while conversions are resolved.
- Native selectable live-data pages. UI trials contain six sessions across five layouts at a configured 500 ms refresh. Rows recorded 27 focus changes/3 actions; columns 6/2. All ratings are `unrated`, and no action-panel trial was saved, so a preferred layout is not established.

## Follow-up testing

1. **Lighting:** visually confirm menus 5/8/12, original-state restore, restart persistence, rapid mode changes and operation while hidden.
2. **Measurements:** compare fuel, steering, engine and battery values with known references. Capture deliberate pedal/brake movement and fresh moving-speed updates before assigning units or physical meanings.
3. **TPMS:** capture when the car's own tyre display has valid readings; retry pressure/temperature/targets and the internal provider. Resolve `65534/65533` and park-supervision timeouts.
4. **Providers/input:** investigate missing services in other vehicle states or instances; compare relay managers 2/3. Validate controller coordinate packing, contact count and touchscreen delivery. Exterior-light control needs a working provider before physical response can be assessed.
5. **UI/lifecycle:** gather layout ratings and longer sessions; investigate `openEntryState ... INVALID_UUID` errors and two renderer connection closures in the saved app log. Later interaction continued, so these do not establish a permanent failure.

Experimental payload logging is limited to once per field every five seconds, logs rotate, and snapshots retain the latest value. Sample counts include reads and notifications; a `live` label can outlast fresh data. These exports do not establish loss-free delivery or long-term reliability.