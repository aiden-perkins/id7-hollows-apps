# MGU Lab findings

Review of the saved Oct. 25-26, 2026 results. No new car tests were run.

## Sources and limits

- [Oct. 25 export](../../out/mgu-lab-20261025-170559-a8b2e3f4/): initial input and mode results.
- [Oct. 26, 20:25 export](../../out/mgu-lab-20261026-202547-a08b8b3e/): vehicle experiments.
- [Oct. 26, 20:34 export](../../out/mgu-lab-20261026-203444-5cdfa8f3/): later readings and controller touch.

Reviewed `mgu_lab-events.jsonl`, rotated `.jsonl.1` files, `mgu_lab.log`, snapshots, settings and UI trials. UTC timestamps extend into Oct. 27. The two Oct. 26 snapshots have cumulative counters from the same app session; their sample counts should not be added together.

Names below match the saved `key.field` identifiers. Full interfaces are in [app.json](app.json), [services.js](services.js) and [vehicle_lab.js](vehicle_lab.js).

## Channels returning data

| Channel | Evidence and useful behavior | Remaining limit |
| --- | --- | --- |
| `mode.statusFESVehicleDynamicSwitchHMI` | 65 retained mode-change events: Comfort/Comfort Plus, Sport Dynamic/Expert/Individual, Eco Pro Efficient/Individual. Suitable for mode display. | None of these changes was logged while the app was hidden. |
| `engine.statusEngineSpeed2`, `statusEngineTemperature`, `statusBattery2` | Latest snapshot: 602 RPM samples; raw RPM `3220`, temperatures `90/75`, battery field `46`. | Existing app scaling gives 805 RPM and 42/27 C; compare scaling and battery meaning with vehicle instruments. |
| `vehicle.statusCarSpeed2` | Speed returned raw `0`. | Only 3 speed samples; the latest snapshot's speed reading was about 44 minutes old. Moving-speed behavior is unproven. |
| `fuel.statusRangeTankStatus` | Retained events show total raw `15-16`, left `10 -> 0`, right `17 -> 28`, range `112`. Separate tank readings are available and change. | Units need calibration; left + right does not equal the reported total. Do not label these raw values as liters yet. |
| `fuelEstimate.dataCombinedInstrumentCluster`, `mileageRange` | Display tank-level field changed `54 -> 53` between snapshots; `mileageRange.fluidLevelFuelTank` returned `15/16`. | Several other cluster fields contain maximum/default values. No `fuelSupply` payload was captured. |
| `gps.rawPositionData` | 2,666 samples by the latest snapshot. All 242 retained GPS events have `FIX_3D`, valid coordinates and valid height of `5-6 m`. | Location/elevation display is possible; height reference, accuracy and response to elevation changes remain unconfirmed. |
| `steering.statusSteeringAngleDriver`, `statusFrontAxleSteeringAngle`; three `steeringChassis` events | XView driver-angle raw values span `26441-39481`. Latest XView and chassis no-CRC driver readings both equal `32974`. | Movement is observable. Center, direction and degrees need calibration; CRC-bearing variants have different raw values. |
| `pedal.AngleAcceleratorPedal` | 18,834 samples by the latest snapshot with a valid-value qualifier. | All 266 retained pedal events have actual/virtual pedal values `0`; response to movement and percentage scaling are unproven. |
| `braking.StabilizationManagement` | 212,789 samples by the latest snapshot; retained driver-braking values `0/23`, MSA braking values `0/5`. | Changing brake-related data is available, but pedal position/pressure and even the status meanings remain undecoded. |
| `touchpad.ZBETouchFrontSide` | 761 touch records in the latest export, despite relay creation failing. Direct controller-touch data is available independently of the relay. | Decoder labels all records as two fingers, but X1 is only `0/1` and Y2 is always `0`. Validate coordinate layout and contact detection before using gestures. |

## Channels without a useful result yet

| Channel / operation | Recorded result |
| --- | --- |
| `tpms.statusTyrePressure`, `statusTyreTemperature`, `statusTargetTyrePressure` | Calls return, but all four wheels give `65534` for pressure/temperature and `65533` for targets. No usable physical measurements established. The local catalog lists default `65535` but does not explain these other codes. |
| Other `tpms` fields | Status and available-tyre-list updates arrive; front/rear/summer/winter dimensions are zero-filled. The available list describes selectable options, not installed tyres or sensor identities. Getter/event enums use different representations. |
| `tpms.tyreParkSupervision` | Repeated getter timeouts after 1,200 ms. |
| `tpmsInternal.*` | No provider announcement or payloads: sensor IDs, battery, radio, calibration, QR and tyre mileage remain unavailable in these captures. |
| `wheel.statusRotaryPress`, `statusRotarySteps`, `statusAudioVolumeButton` | Only invalid/no-action results: `SIGNAL_UNGUELTIG`, `255`, `KEINE_AKTION...`. No useful wheel-button interaction captured. |
| Input relay | `InputRelayManagerInst1` became available, but creation returned `INTERNAL_ERROR`. No relay key/touch events; managers 2/3 remain unproven. |
| Other controller touch | Rear-side coordinates are `4095`/unfilled in snapshots. No captured `operationZBETouch2/3` payloads; touchscreen delivery remains unproven. |

## What is possible

- A live dashboard for engine values, tank split and GPS height; raw steering/pedal/braking views while conversions are resolved.
- Native selectable live-data pages. UI trials contain six sessions across five layouts at a configured 500 ms refresh. Rows recorded 27 focus changes/3 actions; columns 6/2. All ratings are `unrated`, and no action-panel trial was saved, so a preferred layout is not established.

## Follow-up testing

1. **Measurements:** compare fuel, steering, engine and battery values with known references. Capture deliberate pedal/brake movement and fresh moving-speed updates before assigning units or physical meanings.
2. **TPMS:** capture when the car's own tyre display has valid readings; retry pressure/temperature/targets and the internal provider. Resolve `65534/65533` and park-supervision timeouts.
3. **Providers/input:** investigate missing services in other vehicle states or instances; compare relay managers 2/3. Validate controller coordinate packing, contact count and touchscreen delivery.
4. **UI/lifecycle:** gather layout ratings and longer sessions; investigate `openEntryState ... INVALID_UUID` errors and two renderer connection closures in the saved app log. Later interaction continued, so these do not establish a permanent failure.

Experimental payload logging is limited to once per field every five seconds, logs rotate, and snapshots retain the latest value. Sample counts include reads and notifications; a `live` label can outlast fresh data. These exports do not establish loss-free delivery or long-term reliability.