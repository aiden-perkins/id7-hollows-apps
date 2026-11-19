# Lab data channel inventory

- Scope: retained lab data under `out/`; `out/downloads/` and all PNG files excluded. No project code was executed.
- Replaces and incorporates the substantive channel definitions, provenance and limitations from the former other-data findings document. No implementation/source-code references.
- **Captured** = present in retained readings/journals, not a fresh vehicle measurement. **Definition only** = schema/diagnostic definition, no usable captured value. **Synthetic/demo** = never evidence of a live sensor.
- **Unknown units stay unknown.** Raw CDS/SOME/IP values are not automatically RPM, °C, Nm, %, bar or degrees; diagnostic definitions and demo labels are separate sources.

## Source locations

Paths below are relative to this repository root. Source keys in the tables expand using this list; `/...` denotes a JSON pointer, and journal locations name the record selector plus its value object.

| Key | Data location | Contents |
| --- | --- | --- |
| G1 | `out/mgu-lab-20261025-170559-a8b2e3f4` | General lab snapshots, input events and UI trials |
| G2 | `out/mgu-lab-20261026-202547-a08b8b3e` | General lab snapshots, input events and UI trials |
| G3 | `out/mgu-lab-20261026-203444-5cdfa8f3` | General lab snapshots, input events and UI trials |
| O | `out/other-data-evidence-1793411802398.json` | Diagnostic/native retained evidence |
| S | `out/other-data-synthetic-decoder-output.json` | Explicitly synthetic decoder samples |
| H | `out/headunit-rea-evidence-20261029.json` | Retained headunit analysis; parking-style schema, not vehicle readings |

## Captured vehicle and input channels

One row per retained leaf field. Equivalent service aliases are grouped; exact interface spelling is retained. Locations identify a captured value, not a fresh reading. Journal line numbers are one-based. Numeric defaults/sentinels are not measurements.

### `engine.statusEngineTemperature`

Sources / aliases: `engine.statusEngineTemperature` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Engine/coolant temperature signal | `temperatureEngineDrive` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusEngineTemperature/value/temperatureEngineDrive` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Engine-oil temperature signal | `temperatureEngineOilDrive` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusEngineTemperature/value/temperatureEngineOilDrive` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `fes.statusFESVehicleDynamicSwitchHMI`

Sources / aliases: `mode.statusFESVehicleDynamicSwitchHMI` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Selected driving-experience mode | `actualValueModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/actualValueModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueModeDrivingExperience2/items`. |
| Request Switch Driving Experience MMI Display | `requestSwitchDrivingExperienceMMIDisplay` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/requestSwitchDrivingExperienceMMIDisplay` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceMMIDisplay/items`. |
| Request Switch Driving Experience Instrument Pack Display | `requestSwitchDrivingExperienceInstrumentPackDisplay` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/requestSwitchDrivingExperienceInstrumentPackDisplay` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceInstrumentPackDisplay/items`. |
| Status Setup Start Up Modus Driving Experience | `statusSetupStartUpModusDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/statusSetupStartUpModusDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupStartUpModusDrivingExperience/items`. |
| Display Availibility Mode Driving Experience | `displayAvailibilityModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayAvailibilityModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayAvailibilityModeDrivingExperience/items`. |
| Display Mode Driving Experience | `displayModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience/items`. |
| Display Mode Driving Experience2 | `displayModeDrivingExperience2` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayModeDrivingExperience2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience/items`. |

### `gps.rawPositionData`

Sources / aliases: `gps.rawPositionData` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| GPS fix type | `fixType` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/fixType` | Reported enum/text; full enum map is not implied by observed values. |
| UTC date/time invalid flag | `utcDateTime/date/invalid` | Boolean | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/date/invalid` | UTC date component; invalid flag must be preserved. |
| Year | `utcDateTime/date/year` | calendar component | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/date/year` | UTC date component; invalid flag must be preserved. |
| Month | `utcDateTime/date/month` | calendar component | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/date/month` | UTC date component; invalid flag must be preserved. |
| Day | `utcDateTime/date/day` | calendar component | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/date/day` | UTC date component; invalid flag must be preserved. |
| UTC date/time invalid flag | `utcDateTime/time/invalid` | Boolean | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/time/invalid` | UTC time component; invalid flag must be preserved. |
| Hour | `utcDateTime/time/hour` | h | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/time/hour` | UTC time component; invalid flag must be preserved. |
| Minute | `utcDateTime/time/minute` | min | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/time/minute` | UTC time component; invalid flag must be preserved. |
| Seconds | `utcDateTime/time/seconds` | s | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/utcDateTime/time/seconds` | UTC time component; invalid flag must be preserved. |
| GPS heading signal | `heading` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/heading` | Raw numeric signal; retained capture does not declare engineering scale/unit. Coordinate/heading scale is not declared; no personal coordinates reproduced. |
| GPS coordinate-valid flag | `position/coordinatesValid` | Boolean | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/coordinatesValid` | Reported flag; no independent physical confirmation. |
| GPS height-valid flag | `position/heightValid` | Boolean | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/heightValid` | Reported flag; no independent physical confirmation. |
| GPS longitude signal | `position/longitude` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/longitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. Coordinate/heading scale is not declared; no personal coordinates reproduced. |
| GPS latitude signal | `position/latitude` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/latitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. Coordinate/heading scale is not declared; no personal coordinates reproduced. |
| Height display-unit selector | `position/height/unit` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/height/unit` | Reported enum/text; full enum map is not implied by observed values. |
| Height formatted in the selected length unit | `position/height/displayLength` | selected unit | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/height/displayLength` | Read alongside position.height.unit; retained selector is METER. |
| GPS altitude/height in metres | `position/height/rawLengthMeter` | m | `G2/lab-vehicle-snapshot.json` `/readings/gps.rawPositionData/value/position/height/rawLengthMeter` | Metres explicitly identified by the field name. |

### `pedal.AngleAcceleratorPedal`

Sources / aliases: `pedal.AngleAcceleratorPedal` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Angle Accelerator Pedal | `cRCAngleAcceleratorPedal` | raw check value | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/cRCAngleAcceleratorPedal` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Angle Accelerator Pedal | `aliveAngleAcceleratorPedal` | count | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/aliveAngleAcceleratorPedal` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/dummy` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusECU/items`. |
| Accelerator-pedal angle signal | `actualValueAngleAcceleratorPedal` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/actualValueAngleAcceleratorPedal` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Actual Value Angle Accelerator Pedal | `qualifierActualValueAngleAcceleratorPedal` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/qualifierActualValueAngleAcceleratorPedal` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueAngleAcceleratorPedal/items`. |
| Virtual accelerator-pedal angle signal | `actualValueAngleAcceleratorPedalVirtual` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/actualValueAngleAcceleratorPedalVirtual` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Accelerator-pedal angle gradient | `gradientActualValueAngleAcceleratorPedal` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/gradientActualValueAngleAcceleratorPedal` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/dummy2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystem/items`. |
| Unnamed/reserved field dummy3; physical meaning not established | `dummy3` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/dummy3` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.ECOAngleAcceleratorPedal/items`. |
| Unnamed/reserved field dummy4; physical meaning not established | `dummy4` | raw; unknown | `G2/lab-vehicle-snapshot.json` `/readings/pedal.AngleAcceleratorPedal/value/dummy4` | No physical label, scale or unit established. |

### `stability.StabilizationManagement`

Sources / aliases: `braking.StabilizationManagement` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Status Stabilisation DSC | `cRCStatusStabilisationDSC` | raw check value | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/cRCStatusStabilisationDSC` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Status Stabilisation DSC | `aliveStatusStabilisationDSC` | count | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/aliveStatusStabilisationDSC` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/dummy` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusECUReserved/items`. |
| Signal/state qualifier: Function FDR | `qualifierFunctionFDR` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/qualifierFunctionFDR` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Function ABS | `qualifierFunctionABS` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/qualifierFunctionABS` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Function ASC | `qualifierFunctionASC` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/qualifierFunctionASC` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Braking MSA | `statusBrakingMSA` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/statusBrakingMSA` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Braking Driver | `statusBrakingDriver` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/statusBrakingDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Unit Run DSC | `statusUnitRunDSC` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/braking.StabilizationManagement/value/statusUnitRunDSC` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusUnitRunDSC/items`. |

### `steering.ActualSteeringAngleDriver`

Sources / aliases: `steeringChassis.ActualSteeringAngleDriver` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Actual Value Steering Angle Driver | `cRCActualValueSteeringAngleDriver` | raw check value | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/cRCActualValueSteeringAngleDriver` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Actual Value Steering Angle Driver | `aliveActualValueSteeringAngleDriver` | count | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/aliveActualValueSteeringAngleDriver` | Rolling/alive counter; rollover not established here. |
| Control Hands Off Recognition Vehicle Guiding | `controlHandsOffRecognitionVehicleGuiding` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/controlHandsOffRecognitionVehicleGuiding` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.ControlHandsOffRecognition/items`. |
| Unnamed/reserved field dummy1; physical meaning not established | `dummy1` | raw; unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/dummy1` | No physical label, scale or unit established. |
| Driver/steering-wheel angle signal | `actualValueSteeringAngleDriver` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/actualValueSteeringAngleDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Driver steering-angle velocity signal | `actualValueSteeringAngleVelocityDriver` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/actualValueSteeringAngleVelocityDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | raw; unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/dummy2` | No physical label, scale or unit established. |
| Signal/state qualifier: Actual Value Steering Angle Driver | `qualifierActualValueSteeringAngleDriver` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.ActualSteeringAngleDriver/value/qualifierActualValueSteeringAngleDriver` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierActualValueSteeringAngleDriver1/items`. |

### `steering.SteeringAngleFrontAxleEffective`

Sources / aliases: `steeringChassis.SteeringAngleFrontAxleEffective` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Steering Angle Front Axle Effective | `cRCSteeringAngleFrontAxleEffective` | raw check value | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/cRCSteeringAngleFrontAxleEffective` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Steering Angle Front Axle Effective | `aliveSteeringAngleFrontAxleEffective` | count | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/aliveSteeringAngleFrontAxleEffective` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/dummy` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusECU/items`. |
| Effective front-axle steering angle (not rear steer) | `steeringAngleFrontAxleEffective` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/steeringAngleFrontAxleEffective` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Steering Angle Front Axle Effective | `qualifierSteeringAngleFrontAxleEffective` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/qualifierSteeringAngleFrontAxleEffective` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierSteeringAngleFrontAxleEffektiv2/items`. |
| Status Condition Steering Angle | `statusConditionSteeringAngle` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/statusConditionSteeringAngle` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Steering Angle Front Axle Effective Error Amplitude | `steeringAngleFrontAxleEffectiveErrorAmplitude` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.SteeringAngleFrontAxleEffective/value/steeringAngleFrontAxleEffectiveErrorAmplitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `steering.actualSteeringAngleDriverNoCRC`

Sources / aliases: `steeringChassis.actualSteeringAngleDriverNoCRC` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Driver/steering-wheel angle signal | `actualValueSteeringAngleDriver` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.actualSteeringAngleDriverNoCRC/value/actualValueSteeringAngleDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Steering Angle Driver | `qualifierSteeringAngleDriver` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steeringChassis.actualSteeringAngleDriverNoCRC/value/qualifierSteeringAngleDriver` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierActualValueSteeringAngleDriver1/items`. |

### `steering.statusFrontAxleSteeringAngle`

Sources / aliases: `steering.statusFrontAxleSteeringAngle` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Effective front-axle steering angle (not rear steer) | `steeringAngleFrontAxleEffective` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steering.statusFrontAxleSteeringAngle/value/steeringAngleFrontAxleEffective` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `steering.statusSteeringAngleDriver`

Sources / aliases: `steering.statusSteeringAngleDriver` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Driver/steering-wheel angle signal | `actualValueSteeringAngleDriver` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/steering.statusSteeringAngleDriver/value/actualValueSteeringAngleDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Actual Value Steering Angle Driver | `qualifierActualValueSteeringAngleDriver` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/steering.statusSteeringAngleDriver/value/qualifierActualValueSteeringAngleDriver` | Reported enum/text; full enum map is not implied by observed values. |

### `vehicle.statusCarSpeed2`

Sources / aliases: `vehicle.statusCarSpeed2` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Vehicle speed at centre of gravity | `speedVehicleCentreOfGravity` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusCarSpeed2/value/speedVehicleCentreOfGravity` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `wheel.statusAudioVolumeButton`

Sources / aliases: `wheel.statusAudioVolumeButton` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Operation Push Button Audio Audio Volume Steering Wheel | `operationPushButtonAudioAudioVolumeSteeringWheel` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/wheel.statusAudioVolumeButton/value/operationPushButtonAudioAudioVolumeSteeringWheel` | Reported enum/text; full enum map is not implied by observed values. |

### `wheel.statusRotaryPress`

Sources / aliases: `wheel.statusRotaryPress` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Operation Push Button Knurl Steering Wheel | `operationPushButtonKnurlSteeringWheel` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/wheel.statusRotaryPress/value/operationPushButtonKnurlSteeringWheel` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |

### `wheel.statusRotarySteps`

Sources / aliases: `wheel.statusRotarySteps` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Operation Steps Knurl Steering Wheel | `operationStepsKnurlSteeringWheel` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/wheel.statusRotarySteps/value/operationStepsKnurlSteeringWheel` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

## Diagnostic channels — retained values and artifact definitions

- `O /evidenceLevel`: **Offline artifact-defined; no new live vehicle validation**. The latest diagnostic records listed below have `synthetic:false`, but `transportVerdict:REQUEST_PENDING`; none is promoted here to an independently verified physical measurement. Positive UDS structure and ECU/SID/DID matching do not establish request ownership.
- Row locators use `O /latest/<ECU-DID>/decoded/fields/<index>`. Byte offsets start **after `62 DIDhi DIDlo`**, not at the TASU envelope. SID is `0x22`; addresses and DIDs below are hexadecimal.
- Negative replies and raw-only/unknown-enum fields are retained as such. A decoded number, a target command, a qualifier and a physical measurement are distinct data.

### `0x29 / 22 DBE4` — Integrated brake / wheel speeds

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Front-left wheel speed | `STAT_GESCHWINDIGKEIT_RAD_VL_WERT` | km/h | `O /latest/29-DBE4/decoded/fields/0` (payload byte 0) | Signed BE16 / 100 km/h. |
| Front-right wheel speed | `STAT_GESCHWINDIGKEIT_RAD_VR_WERT` | km/h | `O /latest/29-DBE4/decoded/fields/1` (payload byte 2) | Signed BE16 / 100 km/h. |
| Rear-left wheel speed | `STAT_GESCHWINDIGKEIT_RAD_HL_WERT` | km/h | `O /latest/29-DBE4/decoded/fields/2` (payload byte 4) | Signed BE16 / 100 km/h. |
| Rear-right wheel speed | `STAT_GESCHWINDIGKEIT_RAD_HR_WERT` | km/h | `O /latest/29-DBE4/decoded/fields/3` (payload byte 6) | Signed BE16 / 100 km/h. |
| Vehicle speed | `STAT_GESCHWINDIGKEIT_FZG_WERT` | km/h | `O /latest/29-DBE4/decoded/fields/4` (payload byte 8) | Signed BE16 / 100 km/h. |
| Front-left wheel rotation direction | `STAT_DREHRICHTUNG_VL` | enum/state | `O /latest/29-DBE4/decoded/fields/5` (payload byte 10) | Unsigned byte: 0 standstill, 1 forward, 2 reverse, 3 undefined; other values unknown. |
| Front-right wheel rotation direction | `STAT_DREHRICHTUNG_VR` | enum/state | `O /latest/29-DBE4/decoded/fields/6` (payload byte 11) | Unsigned byte: 0 standstill, 1 forward, 2 reverse, 3 undefined; other values unknown. |
| Rear-left wheel rotation direction | `STAT_DREHRICHTUNG_HL` | enum/state | `O /latest/29-DBE4/decoded/fields/7` (payload byte 12) | Unsigned byte: 0 standstill, 1 forward, 2 reverse, 3 undefined; other values unknown. |
| Rear-right wheel rotation direction | `STAT_DREHRICHTUNG_HR` | enum/state | `O /latest/29-DBE4/decoded/fields/8` (payload byte 13) | Unsigned byte: 0 standstill, 1 forward, 2 reverse, 3 undefined; other values unknown. |
| Reference travel direction | `STAT_DREHRICHTUNG_REF` | enum/state | `O /latest/29-DBE4/decoded/fields/9` (payload byte 14) | Unsigned byte: 0 standstill, 1 forward, 2 reverse, 3 undefined; other values unknown. |
| Front-left wheel-speed signal quality | `STAT_SIGNALQUALITAET_VL_WERT` | % | `O /latest/29-DBE4/decoded/fields/10` (payload byte 15) | Unsigned byte percent quality: <10 no signal; 10–50 weak; >50 OK. Not a drivetrain-health score. |
| Front-right wheel-speed signal quality | `STAT_SIGNALQUALITAET_VR_WERT` | % | `O /latest/29-DBE4/decoded/fields/11` (payload byte 16) | Unsigned byte percent quality: <10 no signal; 10–50 weak; >50 OK. Not a drivetrain-health score. |
| Rear-left wheel-speed signal quality | `STAT_SIGNALQUALITAET_HL_WERT` | % | `O /latest/29-DBE4/decoded/fields/12` (payload byte 17) | Unsigned byte percent quality: <10 no signal; 10–50 weak; >50 OK. Not a drivetrain-health score. |
| Rear-right wheel-speed signal quality | `STAT_SIGNALQUALITAET_HR_WERT` | % | `O /latest/29-DBE4/decoded/fields/13` (payload byte 18) | Unsigned byte percent quality: <10 no signal; 10–50 weak; >50 OK. Not a drivetrain-health score. |

### `0x12 / 22 62FD` — Right DME / exhaust command

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Tester command to electrical exhaust flap | `STAT_ASW_EAGK_WERT` | % | `O /latest/12-62FD/decoded/fields/0` (payload byte 0) | Signed BE16 / 100%; tester request, NOT measured flap angle or verified percent-open. |

### `0x12 / 22 64FD` — Right DME / exhaust output

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Electrical exhaust-flap output/control quantity | `STAT_ASG_EAGK_WERT` | % | `O /latest/12-64FD/decoded/fields/0` (payload byte 0) | Signed BE16 / 100%; output/control/PWM quantity, NOT measured flap angle or verified percent-open. |

### `0x13 / 22 62FD` — Left DME / exhaust command

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Tester command to electrical exhaust flap | `STAT_ASW_EAGK_WERT` | % | `O /latest/13-62FD/decoded/fields/0` (payload byte 0) | Signed BE16 / 100%; tester request, NOT measured flap angle or verified percent-open. |

### `0x13 / 22 64FD` — Left DME / exhaust output

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Electrical exhaust-flap output/control quantity | `STAT_ASG_EAGK_WERT` | % | `O /latest/13-64FD/decoded/fields/0` (payload byte 0) | Signed BE16 / 100%; output/control/PWM quantity, NOT measured flap angle or verified percent-open. |

### `0x2B / 22 DB33` — Rear steering / actual and target

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| actual rear axle angle | `STAT_LENKWINKEL_ISTWERT_WERT` | ° | `O /latest/2B-DB33/decoded/fields/0` (payload byte 0) | Unsigned BE16 × 0.002747 − 90°. Rear-axle actuator angle, not separate left/right wheel toe. |
| actual-angle qualifier | `STAT_LENKWINKEL_ISTWERT_GUELTIGKEIT_NR` | enum/state | `O /latest/2B-DB33/decoded/fields/1` (payload byte 2) | 1 valid; 6 invalid; 8 initialization; other codes unknown. |
| requested rear angle | `STAT_LENKWINKEL_SOLLWERT_WERT` | ° | `O /latest/2B-DB33/decoded/fields/2` (payload byte 3) | Unsigned BE16 × 0.002747 − 90°. Requested angle, not measured position. |
| motor zero-position angle | `STAT_MOTORWINKEL_NULLLAGE_WERT` | ° | `O /latest/2B-DB33/decoded/fields/3` (payload byte 5) | Unsigned BE16 / 100°; FFFF means uncalibrated. |
| sensor A zero-position | `STAT_ANALOGSENSOR_A_NULLLAGE_WERT` | raw only; declared HEX | `O /latest/2B-DB33/decoded/fields/4` (payload byte 7) | Unsigned BE16 raw hex; source describes 0000–7FFF range. |
| sensor B zero-position | `STAT_ANALOGSENSOR_B_NULLLAGE_WERT` | raw only; declared HEX | `O /latest/2B-DB33/decoded/fields/5` (payload byte 9) | Unsigned BE16 raw hex; source describes 8000–FFFF range. |

### `0x2B / 22 DB35` — Rear steering / service telemetry

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| service qualifier | `STAT_QUALIFIER_HSR` | enum/state | `O /latest/2B-DB35/decoded/fields/0` (payload byte 0) | Artifact-defined field; retain qualifier and transport status separately. |
| rear angle error amplitude | `STAT_FEHLER_AMPLITUDE_WERT` | ° | `O /latest/2B-DB35/decoded/fields/1` (payload byte 1) | Unsigned BE16 × 0.002747°. |
| steering current | `STAT_IST_STROM_WERT` | A | `O /latest/2B-DB35/decoded/fields/2` (payload byte 3) | Unsigned byte, A. |
| motor actual torque | `STAT_MOTOR_ISTMOMENT_WERT` | Nm | `O /latest/2B-DB35/decoded/fields/3` (payload byte 4) | Signed BE16 / 1024 Nm; actuator motor torque. |
| motor requested torque | `STAT_MOTOR_SOLLMOMENT_WERT` | Nm | `O /latest/2B-DB35/decoded/fields/4` (payload byte 6) | Signed BE16 / 1024 Nm; actuator motor target. |

### `0x2B / 22 DB36` — Rear steering / QDM target

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| target-angle filter time constant | `STAT_FILTER_ZEIT_KONSTANTE_WERT` | raw only; declared HEX | `O /latest/2B-DB36/decoded/fields/0` (payload byte 0) | Two-byte filter constant; time unit/scale not established; preserve raw. |
| QDM requested rear angle | `STAT_SOLL_LENKWINKEL_HINTERACHSE_WERT` | ° | `O /latest/2B-DB36/decoded/fields/1` (payload byte 2) | Unsigned BE16 × 0.002747 − 90°. QDM request, not measured position. |
| target qualifier | `STAT_QUALIFIER_SOLL_LENKWINKEL_HINTERACHSE` | enum/state | `O /latest/2B-DB36/decoded/fields/2` (payload byte 4) | Source enum distinguishes active/diagnostic/standby/invalid. Retained 228 means diagnostic/do not implement target. |

### `0x25 / 22 D499` — Front electric anti-roll / D499

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| terminal 30 voltage | `STAT_KL30_WERT` | raw only; declared - | `O /latest/25-D499/decoded/fields/0` (payload byte 0) | Unsigned BE16 / 1638; voltage-labelled but original unit “-”. V is not independently established. |
| terminal 15 voltage | `STAT_KL15_WERT` | raw only; declared - | `O /latest/25-D499/decoded/fields/1` (payload byte 2) | Unsigned BE16 / 1638; voltage-labelled but original unit “-”. V is not independently established. |

### `0x25 / 22 D699` — Front electric anti-roll / D699

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| actual actuator torque | `STAT_MOMENT_AKTUATOR_IST_WERT` | Nm | `O /latest/25-D699/decoded/fields/0` (payload byte 0) | Signed BE16 / 26 Nm; separate reference plane from motor torque. |
| actual motor speed | `STAT_DREHZAHL_MOTOR_IST_WERT` | 1/min | `O /latest/25-D699/decoded/fields/1` (payload byte 2) | Signed BE16 / 3 rpm. |
| actual motor angle | `STAT_WINKEL_MOTOR_IST_WERT` | ° | `O /latest/25-D699/decoded/fields/2` (payload byte 4) | Signed BE16 degrees; motor angle, not suspension/body angle. |

### `0x25 / 22 D69A` — Front electric anti-roll / D69A

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| target motor torque | `STAT_SOLL_MOTOR_MOMENT_WERT` | Nm | `O /latest/25-D69A/decoded/fields/0` (payload byte 0) | Signed BE16 / 3276 Nm. |
| actual motor torque | `STAT_IST_MOTOR_MOMENT_WERT` | Nm | `O /latest/25-D69A/decoded/fields/1` (payload byte 2) | Signed BE16 / 3276 Nm. |

### `0x25 / 22 D69B` — Front electric anti-roll / D69B

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| phase RMS current | `STAT_PHASENSTROM_RMS_WERT` | A | `O /latest/25-D69B/decoded/fields/0` (payload byte 0) | Signed BE16 / 150 A. |
| d-axis current | `STAT_STROM_D_ACHSE_WERT` | A | `O /latest/25-D69B/decoded/fields/1` (payload byte 2) | Signed BE16 / 150 A. |
| q-axis current | `STAT_STROM_Q_ACHSE_WERT` | A | `O /latest/25-D69B/decoded/fields/2` (payload byte 4) | Signed BE16 / 150 A. |

### `0x25 / 22 D69C` — Front electric anti-roll / D69C

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| d-axis voltage | `STAT_SPANNUNG_D_ACHSE_WERT` | V | `O /latest/25-D69C/decoded/fields/0` (payload byte 0) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| q-axis voltage | `STAT_SPANNUNG_Q_ACHSE_WERT` | V | `O /latest/25-D69C/decoded/fields/1` (payload byte 2) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U1 | `STAT_U1_WERT` | V | `O /latest/25-D69C/decoded/fields/2` (payload byte 4) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U2 | `STAT_U2_WERT` | V | `O /latest/25-D69C/decoded/fields/3` (payload byte 6) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U3 | `STAT_U3_WERT` | V | `O /latest/25-D69C/decoded/fields/4` (payload byte 8) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U4 | `STAT_U4_WERT` | V | `O /latest/25-D69C/decoded/fields/5` (payload byte 10) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U5 | `STAT_U5_WERT` | V | `O /latest/25-D69C/decoded/fields/6` (payload byte 12) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U6 | `STAT_U6_WERT` | V | `O /latest/25-D69C/decoded/fields/7` (payload byte 14) | Unsigned BE16 / 1638 V; separate internal voltage channel. |

### `0x25 / 22 D69D` — Front electric anti-roll / D69D

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| motor temp | `STAT_TEMPERATUR_E_MOTOR_WERT` | ° | `O /latest/25-D69D/decoded/fields/0` (payload byte 0) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| magnet temp | `STAT_TEMPERATUR_MOTORMAGNETE_WERT` | ° | `O /latest/25-D69D/decoded/fields/1` (payload byte 1) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| power board temp | `STAT_TEMPERATUR_POWERBOARD_WERT` | ° | `O /latest/25-D69D/decoded/fields/2` (payload byte 2) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| logic board temp | `STAT_TEMPERATUR_LOGIKBOARD_WERT` | ° | `O /latest/25-D69D/decoded/fields/3` (payload byte 3) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |

### `0x25 / 22 D6BB` — Front electric anti-roll / D6BB

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| controller command/function state | `STAT_STRG_FKT_XA_ARS` | enum/state | `O /latest/25-D6BB/decoded/fields/0` (payload byte 0) | Artifact-defined field; retain qualifier and transport status separately. |
| requested stabilizer torque | `STAT_SOLLMOM_STABI_ARS_WERT` | Nm | `O /latest/25-D6BB/decoded/fields/1` (payload byte 1) | BE IEEE754 float, Nm; stabilizer-level target, distinct from motor target. |
| external stabilizer twist at motor level | `STAT_WNKL_VERDRHNG_EXTN_XA_ARS_WERT` | rad | `O /latest/25-D6BB/decoded/fields/2` (payload byte 5) | BE IEEE754 float, rad; external stabilizer twist represented at motor level (~158 ratio), not body roll angle. |
| external-twist FlexRay qualifier | `STAT_QU_WNKL_VERDRHNG_EXTN_XA_ARS_WERT` | qualifier/state | `O /latest/25-D6BB/decoded/fields/3` (payload byte 9) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| actuator controller state | `STAT_ST_FN_XA_ARS` | enum/state | `O /latest/25-D6BB/decoded/fields/4` (payload byte 10) | 144 active/all OK/requested; 16 ready/not requested; 96 no regulation possible. Other enum states include degraded and null-position fallback. |
| motor controller enable | `STAT_KONF_ENA_MOT_ARS_WERT` | unit not specified | `O /latest/25-D6BB/decoded/fields/5` (payload byte 11) | Motor-regulator activation command; 0 inactive, 1 active. Not an engagement percentage. |
| requested motor torque | `STAT_SOLL_MOM_MOT_ARS_WERT` | Nm | `O /latest/25-D6BB/decoded/fields/6` (payload byte 12) | BE IEEE754 float, Nm; requested electric-motor torque. |
| null-position control active | `STAT_EARSARSBS_B_NPR_AKTIV_WERT` | unit not specified | `O /latest/25-D6BB/decoded/fields/7` (payload byte 16) | Null-position regulation active flag; not proof anti-roll is off. |
| stored null position | `STAT_EARSARSBS_NULLPOSITION_WERT` | rad | `O /latest/25-D6BB/decoded/fields/8` (payload byte 17) | BE IEEE754 float, rad; stored multi-turn motor null position for this ignition cycle. |
| absolute accumulated motor angle | `STAT_IST_WNKL_ABS_EMOT_ARS_WERT` | rad | `O /latest/25-D6BB/decoded/fields/9` (payload byte 21) | BE IEEE754 float, rad; accumulated motor angle, not wheel or vehicle roll angle. |
| motor-angle sensor qualifier | `STAT_QU_IST_WNKL_ABS_EMOT_ARS_WERT` | qualifier/state | `O /latest/25-D6BB/decoded/fields/10` (payload byte 25) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| motor speed | `STAT_IST_DREHZHL_EMOT_ARS_WERT` | rad/s | `O /latest/25-D6BB/decoded/fields/11` (payload byte 26) | BE IEEE754 float, rad/s; motor rotational speed, not rpm without conversion. |
| speed sensor qualifier | `STAT_QU_IST_DREHZHL_EMOT_ARS_WERT` | qualifier/state | `O /latest/25-D6BB/decoded/fields/12` (payload byte 30) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| actual stabilizer torque | `STAT_ISTMOM_STABI_ARS_WERT` | raw only; declared Nm | `O /latest/25-D6BB/decoded/fields/13` (payload byte 31) | RAW ONLY: unsigned declaration conflicts with ±1200 Nm comment; no invented signedness, offset or physical torque. |
| actual torque qualifier | `STAT_QU_ISTMOM_STABI_ARS` | qualifier/state | `O /latest/25-D6BB/decoded/fields/14` (payload byte 33) | Unknown enum; implausible source Nm qualifier cell does not make this a torque measurement. |

### `0x04 / 22 D499` — Rear electric anti-roll / D499

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| terminal 30 voltage | `STAT_KL30_WERT` | raw only; declared - | `O /latest/04-D499/decoded/fields/0` (payload byte 0) | Unsigned BE16 / 1638; voltage-labelled but original unit “-”. V is not independently established. |
| terminal 15 voltage | `STAT_KL15_WERT` | raw only; declared - | `O /latest/04-D499/decoded/fields/1` (payload byte 2) | Unsigned BE16 / 1638; voltage-labelled but original unit “-”. V is not independently established. |

### `0x04 / 22 D699` — Rear electric anti-roll / D699

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| actual actuator torque | `STAT_MOMENT_AKTUATOR_IST_WERT` | Nm | `O /latest/04-D699/decoded/fields/0` (payload byte 0) | Signed BE16 / 26 Nm; separate reference plane from motor torque. |
| actual motor speed | `STAT_DREHZAHL_MOTOR_IST_WERT` | 1/min | `O /latest/04-D699/decoded/fields/1` (payload byte 2) | Signed BE16 / 3 rpm. |
| actual motor angle | `STAT_WINKEL_MOTOR_IST_WERT` | ° | `O /latest/04-D699/decoded/fields/2` (payload byte 4) | Signed BE16 degrees; motor angle, not suspension/body angle. |

### `0x04 / 22 D69A` — Rear electric anti-roll / D69A

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| target motor torque | `STAT_SOLL_MOTOR_MOMENT_WERT` | Nm | `O /latest/04-D69A/decoded/fields/0` (payload byte 0) | Signed BE16 / 3276 Nm. |
| actual motor torque | `STAT_IST_MOTOR_MOMENT_WERT` | Nm | `O /latest/04-D69A/decoded/fields/1` (payload byte 2) | Signed BE16 / 3276 Nm. |

### `0x04 / 22 D69B` — Rear electric anti-roll / D69B

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| phase RMS current | `STAT_PHASENSTROM_RMS_WERT` | A | `O /latest/04-D69B/decoded/fields/0` (payload byte 0) | Signed BE16 / 150 A. |
| d-axis current | `STAT_STROM_D_ACHSE_WERT` | A | `O /latest/04-D69B/decoded/fields/1` (payload byte 2) | Signed BE16 / 150 A. |
| q-axis current | `STAT_STROM_Q_ACHSE_WERT` | A | `O /latest/04-D69B/decoded/fields/2` (payload byte 4) | Signed BE16 / 150 A. |

### `0x04 / 22 D69C` — Rear electric anti-roll / D69C

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| d-axis voltage | `STAT_SPANNUNG_D_ACHSE_WERT` | V | `O /latest/04-D69C/decoded/fields/0` (payload byte 0) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| q-axis voltage | `STAT_SPANNUNG_Q_ACHSE_WERT` | V | `O /latest/04-D69C/decoded/fields/1` (payload byte 2) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U1 | `STAT_U1_WERT` | V | `O /latest/04-D69C/decoded/fields/2` (payload byte 4) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U2 | `STAT_U2_WERT` | V | `O /latest/04-D69C/decoded/fields/3` (payload byte 6) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U3 | `STAT_U3_WERT` | V | `O /latest/04-D69C/decoded/fields/4` (payload byte 8) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U4 | `STAT_U4_WERT` | V | `O /latest/04-D69C/decoded/fields/5` (payload byte 10) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U5 | `STAT_U5_WERT` | V | `O /latest/04-D69C/decoded/fields/6` (payload byte 12) | Unsigned BE16 / 1638 V; separate internal voltage channel. |
| Internal voltage U6 | `STAT_U6_WERT` | V | `O /latest/04-D69C/decoded/fields/7` (payload byte 14) | Unsigned BE16 / 1638 V; separate internal voltage channel. |

### `0x04 / 22 D69D` — Rear electric anti-roll / D69D

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| motor temp | `STAT_TEMPERATUR_E_MOTOR_WERT` | ° | `O /latest/04-D69D/decoded/fields/0` (payload byte 0) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| magnet temp | `STAT_TEMPERATUR_MOTORMAGNETE_WERT` | ° | `O /latest/04-D69D/decoded/fields/1` (payload byte 1) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| power board temp | `STAT_TEMPERATUR_POWERBOARD_WERT` | ° | `O /latest/04-D69D/decoded/fields/2` (payload byte 2) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |
| logic board temp | `STAT_TEMPERATUR_LOGIKBOARD_WERT` | ° | `O /latest/04-D69D/decoded/fields/3` (payload byte 3) | Unsigned byte − 40; original unit cell is °, not explicitly °C. |

### `0x04 / 22 D6BB` — Rear electric anti-roll / D6BB

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| controller command/function state | `STAT_STRG_FKT_XA_ARS` | enum/state | `O /latest/04-D6BB/decoded/fields/0` (payload byte 0) | Artifact-defined field; retain qualifier and transport status separately. |
| requested stabilizer torque | `STAT_SOLLMOM_STABI_ARS_WERT` | Nm | `O /latest/04-D6BB/decoded/fields/1` (payload byte 1) | BE IEEE754 float, Nm; stabilizer-level target, distinct from motor target. |
| external stabilizer twist at motor level | `STAT_WNKL_VERDRHNG_EXTN_XA_ARS_WERT` | rad | `O /latest/04-D6BB/decoded/fields/2` (payload byte 5) | BE IEEE754 float, rad; external stabilizer twist represented at motor level (~158 ratio), not body roll angle. |
| external-twist FlexRay qualifier | `STAT_QU_WNKL_VERDRHNG_EXTN_XA_ARS_WERT` | qualifier/state | `O /latest/04-D6BB/decoded/fields/3` (payload byte 9) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| actuator controller state | `STAT_ST_FN_XA_ARS` | enum/state | `O /latest/04-D6BB/decoded/fields/4` (payload byte 10) | 144 active/all OK/requested; 16 ready/not requested; 96 no regulation possible. Other enum states include degraded and null-position fallback. |
| motor controller enable | `STAT_KONF_ENA_MOT_ARS_WERT` | unit not specified | `O /latest/04-D6BB/decoded/fields/5` (payload byte 11) | Motor-regulator activation command; 0 inactive, 1 active. Not an engagement percentage. |
| requested motor torque | `STAT_SOLL_MOM_MOT_ARS_WERT` | Nm | `O /latest/04-D6BB/decoded/fields/6` (payload byte 12) | BE IEEE754 float, Nm; requested electric-motor torque. |
| null-position control active | `STAT_EARSARSBS_B_NPR_AKTIV_WERT` | unit not specified | `O /latest/04-D6BB/decoded/fields/7` (payload byte 16) | Null-position regulation active flag; not proof anti-roll is off. |
| stored null position | `STAT_EARSARSBS_NULLPOSITION_WERT` | rad | `O /latest/04-D6BB/decoded/fields/8` (payload byte 17) | BE IEEE754 float, rad; stored multi-turn motor null position for this ignition cycle. |
| absolute accumulated motor angle | `STAT_IST_WNKL_ABS_EMOT_ARS_WERT` | rad | `O /latest/04-D6BB/decoded/fields/9` (payload byte 21) | BE IEEE754 float, rad; accumulated motor angle, not wheel or vehicle roll angle. |
| motor-angle sensor qualifier | `STAT_QU_IST_WNKL_ABS_EMOT_ARS_WERT` | qualifier/state | `O /latest/04-D6BB/decoded/fields/10` (payload byte 25) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| motor speed | `STAT_IST_DREHZHL_EMOT_ARS_WERT` | rad/s | `O /latest/04-D6BB/decoded/fields/11` (payload byte 26) | BE IEEE754 float, rad/s; motor rotational speed, not rpm without conversion. |
| speed sensor qualifier | `STAT_QU_IST_DREHZHL_EMOT_ARS_WERT` | qualifier/state | `O /latest/04-D6BB/decoded/fields/12` (payload byte 30) | Reported signal qualifier: 2 IO; 6 NIO; 255 communication error; do not turn invalid inputs into valid measurements. |
| actual stabilizer torque | `STAT_ISTMOM_STABI_ARS_WERT` | raw only; declared Nm | `O /latest/04-D6BB/decoded/fields/13` (payload byte 31) | RAW ONLY: unsigned declaration conflicts with ±1200 Nm comment; no invented signedness, offset or physical torque. |
| actual torque qualifier | `STAT_QU_ISTMOM_STABI_ARS` | qualifier/state | `O /latest/04-D6BB/decoded/fields/14` (payload byte 33) | Unknown enum; implausible source Nm qualifier cell does not make this a torque measurement. |

### Definition-only exhaust channels with retained negative replies

| ECUs / DID | Data | Units / layout | Where found | Availability |
| --- | --- | --- | --- | --- |
| `0x12`, `0x13` / `22 631E` | Regulated exhaust-flap command, bank 1 | %; signed BE16 / 81.92 at payload byte 0 | `O /latest/12-631E` and `/latest/13-631E`; imported ISTA `dme8ff_r.prg`, `dme8ff_l.prg`, `RES_0X631E_D` | Definition only; retained NRC31 (request out of range), no decoded measured value. Bank name does not establish exclusive ECU ownership; not percent-open. |
| `0x12`, `0x13` / `22 631E` | Regulated exhaust-flap command, bank 2 | %; signed BE16 / 81.92 at payload byte 2 | `O /latest/12-631E` and `/latest/13-631E`; imported ISTA `dme8ff_r.prg`, `dme8ff_l.prg`, `RES_0X631E_D` | Definition only; retained NRC31 (request out of range), no decoded measured value. Bank name does not establish exclusive ECU ownership; not percent-open. |
| `0x12`, `0x13` / `22 651E` | Regulated exhaust-flap tester/output quantity, bank 1 | %; unsigned BE16 × 0.00152588 at payload byte 0 | `O /latest/12-651E` and `/latest/13-651E`; imported ISTA `dme8ff_r.prg`, `dme8ff_l.prg`, `RES_0X651E_D` | Definition only; retained NRC31 (request out of range), no decoded measured value. Bank name does not establish exclusive ECU ownership; not percent-open. |
| `0x12`, `0x13` / `22 651E` | Regulated exhaust-flap tester/output quantity, bank 2 | %; unsigned BE16 × 0.00152588 at payload byte 2 | `O /latest/12-651E` and `/latest/13-651E`; imported ISTA `dme8ff_r.prg`, `dme8ff_l.prg`, `RES_0X651E_D` | Definition only; retained NRC31 (request out of range), no decoded measured value. Bank name does not establish exclusive ECU ownership; not percent-open. |

## Schema-defined channels without captured values

These definitions are retained data, not proof that a provider exists or a sensor value was received. Units are deliberately not inferred from field names. Field and enum definitions come from the native SOME/IP type catalogue listed under Imported diagnostic provenance and definition-only context.

### `split.basicDataSet` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Lateral Acceleration Centre Of Gravity | `lateralAccelerationCentreOfGravity` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Lateral Acceleration Centre Of Gravity | `qualifierLateralAccelerationCentreOfGravity` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierLateralAccelerationCentreOfGravity` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 4=RESERVED, 7=RESERVED_1, 3=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 1=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT, 9=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUELTIG. |
| Longitudinal Acceleration Centre Of Gravity | `longitudinalAccelerationCentreOfGravity` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Longitudinal Acceleration Centre Of Gravity | `qualifierLongitudinalAccelerationCentreOfGravity` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierLongitudinalAccelerationSchwerpunkt2` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 1=RESERVED, 4=RESERVED_1, 7=RESERVED_2, 9=RESERVED_3, 3=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUELTIG. |
| Vertical Acceleration Center Of Gravity | `verticalAccelerationCenterOfGravity` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Vertical Acceleration Center Of Gravity | `qualifierVerticalAccelerationCenterOfGravity` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierVerticalAccelerationCentreOfGravity` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 1=RESERVED, 4=RESERVED_1, 9=RESERVED_2, 7=SENSOR_NICHT_VORHANDEN, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 3=SIGNALWERT_IST_NICHT_VERTRAUENSWUERDIG, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUETLIG. |
| Ground Uneveness Right Backend | `groundUnevenessRightBackend` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Operation Horn Button | `operationHornButton` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.OperationPushButtonHorn` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 1=HORN_MINUS_TASTER_GEDRUECKT, 0=KEINE_AKTION, 3=SIGNAL_UNGUELTIG. |
| Rpm Em E Tract Sys1 Actual Value | `rpmEmETractSys1ActualValue` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Torquerpm Em E Tract Sys1 Actual Value | `torquerpmEmETractSys1ActualValue` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Rpm Em E Tract Sys1 Actual Value | `qualifierRpmEmETractSys1ActualValue` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 15=SIGNAL_UNBEFUELLT, 2=WERT_GUELTIG_EINFACHE_QUALITAET, 3=WERT_GUELTIG_EINGESCHRAENKT, 4=WERT_GUELTIG_ERSATZWERT, 1=WERT_GUELTIG_HOECHSTE_QUALITAET, 9=WERT_GUELTIG_MITTLERE_QUALITAET, 14=WERT_NICHT_VERFUEGBAR, 6=WERT_NICHT_VERFUEGBAR_FEHLER. |
| Rpm Em E Tract Sys2 Actual Value | `rpmEmETractSys2ActualValue` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Torque Em E Tract Sys2 Actual Value | `torqueEmETractSys2ActualValue` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Rpm Em E Tract Sys2 Actual Value | `qualifierRpmEmETractSys2ActualValue` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 15=SIGNAL_UNBEFUELLT, 2=WERT_GUELTIG_EINFACHE_QUALITAET, 3=WERT_GUELTIG_EINGESCHRAENKT, 4=WERT_GUELTIG_ERSATZWERT, 1=WERT_GUELTIG_HOECHSTE_QUALITAET, 9=WERT_GUELTIG_MITTLERE_QUALITAET, 14=WERT_NICHT_VERFUEGBAR, 6=WERT_NICHT_VERFUEGBAR_FEHLER. |
| Mue Estimated Tyres Street | `mueEstimatedTyresStreet` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Mue Estimated Tyres Street Error Amplitude | `mueEstimatedTyresStreetErrorAmplitude` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Air Pressure Motor | `valueAirPressureMotor` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Transmission Oil | `valueTemperatureTransmissionOil` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Dc Dc Converter | `valueTemperatureDcDcConverter` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Operation Gear Selector Switch | `operationGearSelectorSwitch` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.OperationGearSelectionSwitch` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 3=D, 14=INIT, 8=L, 7=M, 4=M_MINUS, 5=M_PLUS, 6=M_S, 2=N, 0=NA, 1=R, 15=SIGNAL_UNGUELTIG. |
| Filling Level Scr Active Tank | `fillingLevelScrActiveTank` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Autonomous Driving | `statusAutonomousDriving` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Scr Catalytic Converter | `valueTemperatureScrCatalyticConverter` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Fuel | `valueTemperatureFuel` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Engine Speed | `statusEngineSpeed` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Status Engine Speed | `qualifierStatusEngineSpeed` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRPMMotorCrankshaft` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 6=FEHLER, 8=INITIALISIERUNG, 14=RESERVIERT, 2=SIGNALWERT_IST_GUELTIG_NOCKENWELLENNOTLAUF, 1=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT, 15=SIGNAL_UNBEFUELLT. |
| Status Voltage Intelligent Boardnet Sensor | `statusVoltageIntelligentBoardnetSensor` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Fuel Tank Relative Pressure | `valueFuelTankRelativePressure` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Combustion Engine | `statusCombustionEngine` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.StatusCombustionEngineDrive` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 3=MOTOR_IM_AUSLAUF, 2=MOTOR_LAEUFT, 1=MOTOR_STARTET, 0=MOTOR_STEHT, 14=RESERVIERT, 15=SIGNAL_UNBEFUELLT. |
| Status Announcement MSA Engine | `statusAnnouncementMSAEngine` | enum | SOME/IP datatype `de.bmw.infotainment.misctypes.MiscTypes.StatusAnnouncementMSAEngineStop` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 1=ANKUENDIGUNG_MSA_MINUS_MOTORSTOPP, 0=KEIN_ANKUENDIGUNG, 3=SIGNAL_UNGUELTIG. |
| Data Fog Up Window Front | `dataFogUpWindowFront` | raw; engineering unit/scale not defined | SOME/IP service definition (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |

## Diagnostic identity data

| Data | Units / encoding | Where found | Interpretation |
| --- | --- | --- | --- |
| ECU family/identification index | 3 raw bytes / hex | `O /diagnostics/identities/<decimal ECU>/index` | Retained family matches do not establish exact software compatibility. |
| ECU diagnostic family matched | Boolean | `O /diagnostics/identities/<decimal ECU>/matched` | Family gate only; not vehicle-wide sensor validation. |
| Identity provider generation | generation/index | `O /diagnostics/identities/<decimal ECU>/epoch` | Match belongs to the recorded provider epoch. |

## Capture quality, timing and provider data

| Data | Units / encoding | Where found | Meaning / limits |
| --- | --- | --- | --- |
| Sample capture time | Unix milliseconds | General snapshots `/readings/<family>/at`; journals `/at`; O `/latest/<probe>/at` | Time of retained observation, not current vehicle time. |
| Monotonic capture time | ms | O latest and events `/monoMs` | Within-session elapsed clock; do not compare as wall time across sessions. |
| Sample count | count | G2/G3 `lab-vehicle-snapshot.json /readings/<family>/samples` | Repeated observations, not channel count. |
| Sample/provider epoch | generation token | snapshots `/providerEpochs`; O `/providers/<interface>/epoch` | Prevents mixing old-provider and new-provider observations. |
| Provider availability | Boolean / null + detail | Snapshots `/services/<service>`; provider events; O `/providers/<interface>` | Offered/connecting/unavailable is not individual field support. |
| Read errors | error text | G snapshots `/readErrors` | Missing/error data must remain unavailable. |
| Preview and app visibility | Boolean | journal visibility events; O `/preview` | Runtime context, not evidence of physical state. |
| Diagnostic transport outcome | enum/text | O `/latest/<probe>/transportVerdict` | REQUEST_PENDING is not a successful attributable read. |
| Diagnostic request/target/DID/provider correlation | IDs/raw integers/flags | O latest `/requestId`, `/target`, `/did`, `/epoch`, `/correlation` | Correlation evidence; no end-to-end ownership token. |
| Diagnostic raw response and payload | bytes / hex | O latest `/response`, `/payload`, `/uds` | Keep raw/negative/pending data independently from decoded fields. |
| Diagnostic UDS response state/NRC | enum / byte | O latest `/uds` | NRC31 means request out of range; no fabricated numeric result. |
| Diagnostic elapsed time | ms | O latest `/elapsedMs`; diagnostic journal entries | Call duration, not sensor sampling period. |
| Decoded field status | enum/text | O `/latest/<probe>/decoded/state` and `/decoded/fields/<index>/state` | Artifact-decoded / reported-state / raw-only / unknown-enum; not physical confirmation. |
| Decoded field raw value / hex | integer or bytes | O `/latest/<probe>/decoded/fields/<index>/raw`, `/rawHex` | Original representation remains usable when physical interpretation is unresolved. |
| Decoded field physical value / label / original unit / source note | number/text/null | Same field objects: `/value`, `/enumLabel`, `/unit`, `/note`, `/sourceInfo` | Null means unavailable/unresolved, not zero. |
| Diagnostic enable/quarantine/in-flight/busy state | Boolean | O `/diagnostics/enabled`, `/quarantine`, `/inflight`, `/busy` | Lab diagnostic-session state, not vehicle health. |
| Evidence level and attribution limit | text | O `/evidenceLevel`, `/attributionLimit` | Offline definition provenance and traffic-origin limitation. |
| Retained/evicted history | count | O `/retention` | O retains 256 events after 136848 evictions; retained history is not a full-session trace. |

## UI/input/session and runtime-performance data

| Data | Units | Where found | Meaning |
| --- | --- | --- | --- |
| Front/rear touch position, pressure/contact and system/alive state | raw coordinates / raw status | Captured `touchpad.ZBETouchFrontSide` and `touchpad.ZBETouchRearSide` tables above; G journals kind touch `/raw/value` | No pixels, mm or force calibration supplied; retain interface typos and sentinel-like values. |
| Touch event interpretation | text | G journals kind touch `/text` | Controller side/contact-count interpretation; raw touch fields remain separate. |
| Steering-wheel rotary/push/audio operations | enum | Captured wheel.statusRotaryPress / statusRotarySteps / statusAudioVolumeButton; G journals kind steering wheel | Knurl button/steps/volume-button operations, not wheel steering angle. |
| Native menu focus and action | row index / Boolean / subtype | Captured native focus and native action tables; G journals matching `/kind` | UI interaction, not vehicle telemetry. |
| UI selected layout/refresh | text / ms | G2/G3 `lab-ui-trials.json /lastLayout`, `/refreshMs` | Refresh setting is not measured vehicle update frequency. |
| Layout ratings | enum/text | Same files `/ratings/<layout>`; `/sessions/<index>/rating` | User trial ratings, including unrated. |
| UI session layout and last focus | text/identifier | Same files `/sessions/<index>/{layout,lastFocus}` | Layout/focus context. |
| UI session action count | count | Same files `/sessions/<index>/actions` | UI actions during recorded layout session. |
| UI session focus-change count | count | Same files `/sessions/<index>/focusChanges` | UI focus transitions. |
| UI session start/end/elapsed | Unix ms / duration ms | Same files `/sessions/<index>/{startedAt,endedAt,elapsedMs}` | UI trial timing. |
| Lab settings | Boolean / enum / identifier | G1–G3 `settings.json`: section, logging, relayManager, theme, layout, renderer, _themeV | Saved UI and runtime settings; not extra sensor channels. |
| UI/result/service messages | text / status | G journals kinds result, service, visibility, vehicle field | Operational events, unavailable-field evidence and UI trial outcomes. |
| Display frame rate sent | frames/s | G `mgu_lab.log`: `display: ... fps sent` | Headunit rendering throughput, not vehicle sampling rate. |
| JavaScript main-loop frame time | ms/frame | G logs: `loop MAIN: ... ms per frame in JS` | UI processing time, not ECU latency. |

## Retained parking/map-style database schema — not parking sensor data

`H /records/14/normalized_result/schema/tables` retains schema only; no table rows were returned. These fields describe map rendering/styles, not available parking spaces, obstacle ranges or vehicle sensor samples. Column types below are database storage types; physical/display units are not declared.

| Data group | Exact table and columns | Units / encoding | Where found |
| --- | --- | --- | --- |
| Meta Info | `MetaInfo`: `VersionMajor` (INTEGER), `VersionMinor` (INTEGER) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/0/columns` |
| Sqlite sequence | `sqlite_sequence`: `name` (), `seq` () | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/1/columns` |
| Icon Set Ids Table | `IconSetIdsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `Name` (TEXT), `LastModified` (TEXT) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/2/columns` |
| Icon Sets Table | `IconSetsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `IconId` (INTEGER), `MinScale` (INTEGER), `MaxScale` (INTEGER), `UsageMask` (INTEGER), `AnchorX` (INTEGER), `AnchorY` (INTEGER), `OffsetX` (INTEGER), `OffsetY` (INTEGER), `Priority` (INTEGER), `MapObjectType` (INTEGER), `ZOrder` (INTEGER), `LabelId` (INTEGER) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/3/columns` |
| Icons Table | `IconsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `Name` (TEXT), `LastModified` (TEXT), `FormatType` (INTEGER), `Width` (INTEGER), `Height` (INTEGER), `Image` (BLOB) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/4/columns` |
| Labels Table | `LabelsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `Name` (TEXT), `LastModified` (TEXT), `AnchorType` (INTEGER), `AlignmentHType` (INTEGER), `AlignmentVType` (INTEGER), `OffsetX` (INTEGER), `OffsetY` (INTEGER), `PlacementType` (INTEGER), `FontId` (INTEGER), `FontSize` (INTEGER), `FontBodyColor` (INTEGER), `FontOutlineColor` (INTEGER), `FontOutlineWidth` (INTEGER), `FrameRoundedCorner` (INTEGER), `FrameMinWidth` (INTEGER), `FrameMinHeight` (INTEGER), `FrameMarginLeft` (INTEGER), `FrameMarginRight` (INTEGER), `FrameMarginTop` (INTEGER), `FrameMarginBottom` (INTEGER), `FrameFillingColor` (INTEGER), `FrameFillingTextureId` (INTEGER), `FrameOutlineColor` (INTEGER), `FrameOutlineWidth` (INTEGER) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/5/columns` |
| Line Ids Table | `LineIdsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `Name` (TEXT), `LastModified` (TEXT) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/6/columns` |
| Lines Table | `LinesTable`: `ClientId` (INTEGER), `Id` (INTEGER), `MinScale` (INTEGER), `MaxScale` (INTEGER), `UsageMask` (INTEGER), `ZOrder` (INTEGER), `FillingColor0` (INTEGER), `FillingColor1` (INTEGER), `FillingPattern` (INTEGER), `FillingWidth` (INTEGER), `BorderColor0` (INTEGER), `BorderColor1` (INTEGER), `BorderPattern` (INTEGER), `BorderWidth` (INTEGER), `BaseLineType` (INTEGER), `AlignmentType` (INTEGER), `Offset` (INTEGER) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/7/columns` |
| Polygon Ids Table | `PolygonIdsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `Name` (TEXT), `LastModified` (TEXT) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/8/columns` |
| Polygons Table | `PolygonsTable`: `ClientId` (INTEGER), `Id` (INTEGER), `MinScale` (INTEGER), `MaxScale` (INTEGER), `UsageMask` (INTEGER), `ZOrder` (INTEGER), `FillingColor` (INTEGER), `FillingTextureId` (INTEGER), `FillingTextureMode` (INTEGER), `FillingOuterColor` (INTEGER), `OutlineColor0` (INTEGER), `OutlineColor1` (INTEGER), `OutlinePattern` (INTEGER), `OutlineWidth` (INTEGER), `InlineColor0` (INTEGER), `InlineColor1` (INTEGER), `InlinePattern` (INTEGER), `InlineWidth` (INTEGER) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/9/columns` |
| Client Ids Table | `ClientIdsTable`: `Id` (INTEGER), `Name` (TEXT) | Schema only; unit not specified | `H /records/14/normalized_result/schema/tables/10/columns` |

## Synthetic examples — not captured vehicle channels

| Synthetic record | Data exercised | Units / state | Where | Limit |
| --- | --- | --- | --- | --- |
| 0 — `12-64FD` | Exhaust output/control | artifact-decoded | `S /0` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 2 — `29-DBE4` | Four wheel speeds/directions/quality and reference direction | artifact-decoded | `S /2` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 3 — `2B-DB33` | Rear actual/target angle, qualifiers and uncalibrated zero position | artifact-decoded | `S /3` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 4 — `25-D699` | Signed anti-roll actuator torque, motor speed and angle | artifact-decoded | `S /4` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 5 — `04-D69B` | RMS/d/q motor currents | artifact-decoded | `S /5` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 6 — `25-D6BB` | Mixed anti-roll targets, states, angles, speed and raw contradictory torque | artifact-decoded | `S /6` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
| 7 — `2B-DB35` | Short/incorrect-layout rear-steering reply | layout-mismatch | `S /7` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |

## GIF dashboard fields — DEMO, not lab measurements

All nine retained GIFs display DEMO. Rows below inventory what their dashboards show; no sensor availability, calibration or live acquisition is inferred. Min/max and history are display-derived statistics, not separate sensors.

| Key | Display artifacts |
| --- | --- |
| D | `out/driving-sport.gif`, `out/driving-comfort.gif`, `out/driving-eco-pro.gif` |
| Y | `out/dynamics-sport.gif`, `out/dynamics-comfort.gif`, `out/dynamics-eco-pro.gif` |
| T | `out/temperatures-sport.gif`, `out/temperatures-comfort.gif`, `out/temperatures-eco-pro.gif` |

| Displayed data | Displayed units | Where shown | Displayed statistics | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Boost | psi | D — driving panel | current / maximum | DEMO only; display unit does not establish raw-signal scaling. |
| Engine power | hp | D — driving panel | current / maximum | DEMO only; display unit does not establish raw-signal scaling. |
| Engine torque | lb-ft | D — driving panel | current / maximum | DEMO only; display unit does not establish raw-signal scaling. |
| Battery voltage | V | D — driving panel | current / minimum / maximum | DEMO only; display unit does not establish raw-signal scaling. |
| Fuel total | L and G | D — driving panel | current | DEMO only. G is a gallon label; US/Imperial convention is not declared. |
| Fuel left tank | G | D — driving panel | current | DEMO only. G is a gallon label; US/Imperial convention is not declared. |
| Fuel right tank | G | D — driving panel | current | DEMO only. G is a gallon label; US/Imperial convention is not declared. |
| Fuel level | % | D — driving panel | current | DEMO only; display unit does not establish raw-signal scaling. |
| Exhaust mode selection | Open / Closed / OEM | D — exhaust controls | selected/requested mode | Buttons/selected mode; not measured flap angle or verified percent-open. |
| Longitudinal acceleration | G | Y — dynamics plot / numeric readout | current / plotted trace | DEMO only; no matching live data channel established by the image. |
| Lateral acceleration | G | Y — dynamics plot / numeric readout | current / plotted trace | DEMO only; no matching live data channel established by the image. |
| Front-left tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-left tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-left wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-left displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Front-right tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Rear-left tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Rear-right tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Brake pressure | bar | Y SPORT — vehicle-state strip | current display | DEMO only; no matching live data channel established by the image. |
| Accelerator pedal | % | Y SPORT — vehicle-state strip | current display | DEMO only; no matching live data channel established by the image. |
| Parking brake | applied/released state | Y SPORT — vehicle-state strip | current display | DEMO only; no matching live data channel established by the image. |
| Quick/kickdown | pressed/released state | Y SPORT — vehicle-state strip | current display | DEMO only; no matching live data channel established by the image. |
| Engine oil | °F | T — Engine/environment | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Coolant | °F | T — Engine/environment | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| CC coolant | °F | T — Engine/environment | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Outside air | °F | T — Engine/environment | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Cabin | °F | T — Engine/environment | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Intake air | °F | T — Air | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Intake bank 1 | °F | T — Air | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Intake bank 2 | °F | T — Air | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| CC B1/5 | °F | T — Air | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Pre-throttle | °F | T — Air | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Transmission oil — vehicle | °F | T — Transmission | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Transmission oil — EGS | °F | T — Transmission | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Torque converter | °F | T — Transmission | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Rear differential | °F | T — rear differential | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Exhaust bank 1 model | °F | T — Exhaust | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Exhaust bank 2 model | °F | T — Exhaust | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Catalyst gas bank 1 | °F | T — Exhaust | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Catalyst gas bank 2 | °F | T — Exhaust | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Oil pressure | psi | T — pressure group | current / minimum / maximum / 180 s history | DEMO only; no matching live data channel established by the image. |
| Transmission pressure | psi | T — pressure group | current / minimum / maximum / 180 s history | DEMO only; no matching live data channel established by the image. |
| Fuel-supply pressure | psi | T — pressure group | current / minimum / maximum / 180 s history | DEMO only; no matching live data channel established by the image. |

## Imported diagnostic provenance and definition-only context

The following source references are carried forward from the previous findings. They were not a new scan of excluded downloads or a new vehicle connection. Their measurement definitions are consolidated above; implementation/build instructions and old verification write-ups are intentionally not channel rows.

| ECU / recorded family | Definition source | Relevant data / where in the definition |
| --- | --- | --- |
| 0x12 DME8FF_R | `C:/Program Files/BMW/ISPI/TRIC/ISTA/Ecu/dme8ff_r.prg` | 62FD/64FD inline SG_FUNKTIONEN selectors; RES_0X631E_D data offset 5629387; RES_0X651E_D 5629677. |
| 0x13 DME8FF_L | Same Ecu root: `dme8ff_l.prg` | 62FD/64FD inline selectors; RES_0X631E_D data offset 5525142; RES_0X651E_D 5525432. |
| 0x29 IB_G05 | Same Ecu root: `ib_g05.prg` | RES_0XDBE4_D data 1250418 / directory 1346788 (19 bytes); TAB_DREHRICHTUNG data 1323439 / directory 1350468. |
| 0x2B HSR_G11 | Same Ecu root: `hsr_g11.prg` | RES_0XDB33_D data 716102 (11 bytes); DB35 data 717538 (8 bytes); DB36 data 718173 (5 bytes); actual-angle qualifier table data 729057. |
| 0x25 EMARS_V1 front | Same Ecu root: `emars_v1.prg` | D499 data 716850; D699 717056; D69A 717345; D69B 717557; D69C 717823; D69D 718433; D6BB 719906. |
| 0x04 EMARS_H1 rear | Same Ecu root: `emars_h1.prg` | Separate rear definitions for D499, D699–D69D and D6BB; do not substitute front file offsets or assume byte-identical files. |
| 0x39 VIP_G05 | Historical family identification; no read-channel definition established here | 684A–684F names were fault-environment context, not established ReadDataByIdentifier channels. |
| Native SOME/IP type catalogue | `bmw-extracted/reference/someip-interfaces.json` | SHA-256 645b929b273197df927dd45d958e82c823a3f1f843f71587baaba03c205c74e4. Type/instance definitions do not prove offered providers or numeric scaling. |

| Definition-only/context data | Where to find it | Units / limit |
| --- | --- | --- |
| Exhaust-flap variant | DME definitions, DID 3020 | Variant metadata only; not retained position feedback. |
| Exhaust-flap presence / learned actuator type | DME definitions, DID 5FF2 | Actuator metadata only; no captured result here. |
| Exhaust control/actuator context | ISTA `SQLiteDBs/xmlvalueprimitive_ENGB.sqlite`: docs 2000016292247204, 2000036636323104, 2000036674994104, 2000078038574204, 2000080426638404, 2000015417115304, 2000073064434104 | Historical documentation mixes actuator descriptions; 10%/90% descriptions do not establish percent-open for every variant. |
| N63 / S63 engine applicability | Same ISTA database: docs 2000044781407404, 2000063971080204 | Architecture context; do not exchange engine-family layouts. |
| Integrated brake architecture | Same ISTA database: doc 2000045315142904 | G05/G15-era context, not a substitute for exact IB_G05 layout. |
| Rear-steering architecture | Same ISTA database: docs 200000467235304, 2000074015379604 | Not individual wheel-toe calibration. |
| Older hydraulic ARS descriptions | Same ISTA database: docs 200000467275004, 200000468251104 | Other platforms; no hydraulic-pressure measurement established for these EMARS units. |
| ECU programming/variant declarations | `C:/Data/psdzdata/mainseries/S18A/S18A_25_03_571_V_004_000_001/odx/src/odx-d/` | HSR2, EMARS, DSC_VIP/IB and DME8.8T context; not the recovered measurement layouts or live compatibility proof. |
| Unread diagnostic-document database | ISTA `SQLiteDBs/DiagDocDb.sqlite` | Not readable as ordinary SQLite in the inherited investigation; no claim of complete diagnostic-graph coverage. |

## Unavailable or unresolved channels — do not fabricate

| Requested data / apparent channel | Available evidence | What is not established |
| --- | --- | --- |
| Measured exhaust-flap position / angle / percent-open | 62FD/64FD command/output; 631E/651E definitions with NRC31 | No verified actual position, degrees, fitted binary/continuous actuator mapping, or physical command-to-position correlation. |
| Usable captured tyre pressure/temperature | Native TPMS fields retained as 65534 / target 65533 | Those raw values are not usable pressure or temperature measurements. |
| Tyre parked-supervision data | G2/G3 `/readErrors/tpms.tyreParkSupervision` and matching journal error events | 1200 ms getter timeout; no captured value or invented extra schema. |
| BasicDataSet live measurements | Schema only; O provider CONNECTING and null sample | No retained physical values. |
| Individual rear left/right wheel toe | HSR rear-axle actuator angle; front/driver native steering fields | No independent left/right rear toe, no rear-angle SOME/IP field established, and no validated VIP 684A–684F read DID. |
| D6BB actual stabilizer torque as signed Nm | Unsigned declaration and conflicting ±1200 Nm comment | Keep raw only until exact software representation is resolved. D699 is a separate signed actuator-torque definition. |
| Hydraulic anti-roll pressure / universal anti-roll engaged percent | Electric EMARS front/rear torque/current/voltage/state definitions | No hydraulic-pressure DID, universal engagement percentage or numeric thermal cutoff established. mars01.prg describes media hardware, not anti-roll. |
| Parking-space availability / obstacle distance | ParkingSpotStyleDB schema | Only rendering/style columns, no rows or parking-sensor measurements. |
| Extra vehicle channels from integrity/signature binary analysis | H retains native binary and security-analysis records | Exports, ELF metadata and analysis graph facts are not vehicle measurements. |
| Demo boost / power / pressures / expanded temperatures | Nine GIF dashboards marked DEMO | Rendered labels/animations do not establish a captured sensor route. |

## Data coverage and retention

| Data set | Material inspected | Coverage / limit |
| --- | --- | --- |
| General lab | 3 folders; all 21 text files including 5 event-journal rotations | 6219 JSONL records; snapshots contain 38 reading families. No PNGs/downloads opened. |
| General archive mirrors | 3 matching .tar.gz files, 21 member files | Every text member is byte-identical to its extracted folder counterpart; no extra channels. |
| Other-data evidence | O latest records, native readings, provider/diagnostic state and retained events; S decoder examples | O retains 256 events. The S entries shown above are synthetic. |
| Headunit analysis evidence | H complete retained JSON record bundle, including both database schema inspections | 15 retained evidence records, no runtime capture; schema-only parking/map style data, no table rows. |
| Dashboard GIFs | All 9 retained driving/dynamics/temperatures GIFs, all mode variants; representative frames inspected | DEMO display inventory only, not live data proof or an exhaustive per-frame numerical transcript. |
| Excluded | out/downloads/ and all PNG files | Not read or scanned; inherited historical findings retained only as clearly marked provenance/context. |
