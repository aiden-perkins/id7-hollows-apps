# Lab data channel inventory

- Scope: retained lab data under `out/`; `out/downloads/` and all PNG files excluded. No project code was executed.
- Replaces and incorporates the substantive channel definitions, provenance and limitations from the former other-data findings document. No implementation/source-code references.
- **Captured** = present in retained readings/journals, not a fresh vehicle measurement. **Definition only** = schema/diagnostic definition, no usable captured value. **Synthetic/demo** = never evidence of a live sensor.
- **Unknown units stay unknown.** Raw CDS/SOME/IP values are not automatically RPM, °C, Nm, %, bar or degrees; diagnostic definitions and demo labels are separate sources.

## Source locations

Paths below are relative to this repository root. Source keys in the tables expand using this list; `/...` denotes a JSON pointer, and journal locations name the record selector plus its value object.

| Key | Data location | Contents |
| --- | --- | --- |
| G1 | `out/mgu-lab-20261025-170559-a8b2e3f4` | General lab snapshots, input events, presets and UI trials |
| G2 | `out/mgu-lab-20261026-202547-a08b8b3e` | General lab snapshots, input events, presets and UI trials |
| G3 | `out/mgu-lab-20261026-203444-5cdfa8f3` | General lab snapshots, input events, presets and UI trials |
| X1 | `out/xdrive-vehicle-session-1793406295847` | xDrive baseline/state/recorder, four raw-journal rotations and runtime log |
| X2 | `out/xdrive-db32-session-1793406452778` | xDrive baseline/state/recorder, four raw-journal rotations and runtime log |
| X3 | `out/xdrive-fault-session-1793406541389` | xDrive baseline/state/recorder, four raw-journal rotations and runtime log |
| X4 | `out/xdrive-export-session-1793406587416` | xDrive baseline/state/recorder, four raw-journal rotations and runtime log |
| L1 | `out/lighting-mode-ambient-1793410926059` | Lighting baseline/snapshot/trial, two event-journal rotations and runtime log |
| L2 | `out/lighting-exterior-investigation-1793409759824` | Lighting baseline/snapshot/trial, two event-journal rotations and runtime log |
| L3 | `out/lighting-disabled-controls-1793408752951` | Lighting baseline/snapshot/trial, two event-journal rotations and runtime log |
| O | `out/other-data-evidence-1793411802398.json` | Diagnostic/native retained evidence |
| S | `out/other-data-synthetic-decoder-output.json` | Explicitly synthetic decoder samples |
| H | `out/headunit-rea-evidence-20261029.json` | Retained headunit analysis; parking-style schema, not vehicle readings |
| E | `out/xdrive-lab-export-1793406697165-19105-1.json` | xDrive export including baseline/current, diagnostics, complete embedded journals and catalog |
| A | `out/lighting-ambient-snapshot-1793410482244.json` | Ambient snapshot and trial history |
| AT | `out/lighting-ambient-snapshot-1793410482244-trial.json` | Ambient trial and previous trial |

## Captured vehicle and input channels

One row per retained leaf field. Equivalent service aliases are grouped; exact interface spelling is retained. Locations identify a captured value, not a fresh reading. Journal line numbers are one-based. Numeric defaults/sentinels are not measurements.

### `engine.statusBattery2`

Sources / aliases: `engine.statusBattery2` (General), `engine.statusBattery2` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Battery charging-condition signal (physical interpretation unconfirmed) | `conditionBatteryChargingCondition` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusBattery2/value/conditionBatteryChargingCondition` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `engine.statusEngineSpeed2`

Sources / aliases: `engine.statusEngineSpeed2` (General), `engine.statusEngineSpeed2` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Engine crankshaft speed | `actualValueRPMEngineCrankshaft` | RPM named; raw scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusEngineSpeed2/value/actualValueRPMEngineCrankshaft` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `engine.statusEngineStatus`

Sources / aliases: `engine.statusEngineStatus` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Engine Run Drive | `statusEngineRunDrive` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/engine.statusEngineStatus/value/statusEngineRunDrive` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.vehicletypes.VehicleTypes.StatusEngineRunDrive/items`. |

### `engine.statusEngineTemperature`

Sources / aliases: `engine.statusEngineTemperature` (General), `engine.statusEngineTemperature` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Engine/coolant temperature signal | `temperatureEngineDrive` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusEngineTemperature/value/temperatureEngineDrive` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Engine-oil temperature signal | `temperatureEngineOilDrive` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/engine.statusEngineTemperature/value/temperatureEngineOilDrive` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `engine.statusGearIndicator`

Sources / aliases: `engine.statusGearIndicator` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Display Gear Shift Indicator Drive | `displayGearShiftIndicatorDrive` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/engine.statusGearIndicator/value/displayGearShiftIndicatorDrive` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.vehicletypes.VehicleTypes.DisplayGearShiftIndicatorDrive/items`. |

### `engine.statusHandBrake`

Sources / aliases: `engine.statusHandBrake` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Contact Hand Brake | `statusContactHandBrake` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/engine.statusHandBrake/value/statusContactHandBrake` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.vehicletypes.VehicleTypes.StatusContactHandBrake/items`. |

### `fes.statusActualValueTorque2`

Sources / aliases: `fes.statusActualValueTorque2` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Engine crankshaft torque signal | `actualValueTorqueCrankshaft` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/fes.statusActualValueTorque2/value/actualValueTorqueCrankshaft` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `fes.statusDSCSwitchHMI`

Sources / aliases: `fes.statusDSCSwitchHMI` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Display Status DSC2 | `displayStatusDSC2` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusDSCSwitchHMI/value/displayStatusDSC2` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayStatusDSC2/items`. |
| Counter Control Display Status DSC | `counterControlDisplayStatusDSC` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusDSCSwitchHMI/value/counterControlDisplayStatusDSC` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.CounterControlDisplayStatusDSC/items`. |

### `fes.statusFESDriveDynamics`

Sources / aliases: `fes.statusFESDriveDynamics` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Sport Cluster Group Vertical Dynamics Driving Experience | `statusSportClusterGroupVerticalDynamicsDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusSportClusterGroupVerticalDynamicsDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupVerticalDynamicsDrivingExperience/items`. |
| Status Sport Cluster Group Handling Driving Experience | `statusSportClusterGroupHandlingDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusSportClusterGroupHandlingDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupHandlingDrivingExperience/items`. |
| Status ECO Cluster Group Vertical Dynamics Driving Experience | `statusECOClusterGroupVerticalDynamicsDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusECOClusterGroupVerticalDynamicsDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupVerticalDynamicsDrivingExperience/items`. |
| Status ECO Cluster Group Handling Driving Experience | `statusECOClusterGroupHandlingDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusECOClusterGroupHandlingDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupHandlingDrivingExperience/items`. |
| Status Comfort Clustergroup Handling Drivingexperience | `statusComfortClustergroupHandlingDrivingexperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusComfortClustergroupHandlingDrivingexperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupHandlingDrivingExperience/items`. |
| Status Comfort Clustergroup Vertical Dynamics Drivingexperience | `statusComfortClustergroupVerticalDynamicsDrivingexperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusComfortClustergroupVerticalDynamicsDrivingexperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupVerticalDynamicsDrivingExperience/items`. |
| Status Sport Function Brake Pedal Driving Experience | `statusSportFunctionBrakePedalDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusSportFunctionBrakePedalDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSFnBrkPdDxp/items`. |
| Status Sport Cluster Group Driving Dynamics Driving Experience | `statusSportClusterGroupDrivingDynamicsDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveDynamics/value/statusSportClusterGroupDrivingDynamicsDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSClugDrvDynDxp/items`. |

### `fes.statusFESDriveStrategy`

Sources / aliases: `fes.statusFESDriveStrategy` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status ECO Function Sailing Driving Experience | `statusECOFunctionSailingDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusECOFunctionSailingDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionSailingDrivingExperience/items`. |
| Status ECO Function MSA Driving Experience | `statusECOFunctionMSADrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusECOFunctionMSADrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionMSADrivingExperience/items`. |
| Status Sport Function Shift Assistant Driving Experience | `statusSportFunctionShiftAssistantDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSportFunctionShiftAssistantDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportFunctionShiftAssistantDrivingExperience/items`. |
| Status Sport Cluster RPM Path Driving Experience | `statusSportClusterRPMPathDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSportClusterRPMPathDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterDrivingExperience/items`. |
| Status Sport Cluster Group Engine Driving Experience | `statusSportClusterGroupEngineDrivingExperience` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSportClusterGroupEngineDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterDrivingExperience/items`. |
| Status Adjust Sailing Vehicle | `statusAdjustSailingVehicle` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusAdjustSailingVehicle` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustSailingVehicle/items`. |
| Status Adjust Engine Sound Vehicle | `statusAdjustEngineSoundVehicle` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusAdjustEngineSoundVehicle` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustEngineSoundVehicle/items`. |
| Driver Configuration Intelligent Range Display | `driverConfigurationIntelligentRangeDisplay` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/driverConfigurationIntelligentRangeDisplay` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Setup Preference Electric Drive Driving | `statusSetupPreferenceElectricDriveDriving` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSetupPreferenceElectricDriveDriving` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupPreferenceElectricDriveDriving/items`. |
| Status Setup Battery Control | `statusSetupBatteryControl` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSetupBatteryControl` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupBatteryControl/items`. |
| Status Setup Electric Mode | `statusSetupElectricMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/fes.statusFESDriveStrategy/value/statusSetupElectricMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupElectricMode/items`. |

### `fes.statusFESVehicleDynamicSwitchHMI`

Sources / aliases: `mode.statusFESVehicleDynamicSwitchHMI` (General), `fes.statusFESVehicleDynamicSwitchHMI` (xDrive), `mode.statusFESVehicleDynamicSwitchHMI` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Selected driving-experience mode | `actualValueModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/actualValueModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueModeDrivingExperience2/items`. |
| Request Switch Driving Experience MMI Display | `requestSwitchDrivingExperienceMMIDisplay` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/requestSwitchDrivingExperienceMMIDisplay` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceMMIDisplay/items`. |
| Request Switch Driving Experience Instrument Pack Display | `requestSwitchDrivingExperienceInstrumentPackDisplay` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/requestSwitchDrivingExperienceInstrumentPackDisplay` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceInstrumentPackDisplay/items`. |
| Status Setup Start Up Modus Driving Experience | `statusSetupStartUpModusDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/statusSetupStartUpModusDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupStartUpModusDrivingExperience/items`. |
| Display Availibility Mode Driving Experience | `displayAvailibilityModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayAvailibilityModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayAvailibilityModeDrivingExperience/items`. |
| Display Mode Driving Experience | `displayModeDrivingExperience` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayModeDrivingExperience` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience/items`. |
| Display Mode Driving Experience2 | `displayModeDrivingExperience2` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/mode.statusFESVehicleDynamicSwitchHMI/value/displayModeDrivingExperience2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience/items`. |

### `fuel.statusRangeTankStatus`

Sources / aliases: `fuel.statusRangeTankStatus` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Fuel tank fluid-level signal | `fluidLevelFuelTank` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/fluidLevelFuelTank` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Left fuel-tank fluid-level signal | `fluidLevelFuelTankLeftHand` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/fluidLevelFuelTankLeftHand` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Right fuel-tank fluid-level signal | `fluidLevelFuelTankRightHand` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/fluidLevelFuelTankRightHand` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Fluid Level Fuel Tank Spare | `statusFluidLevelFuelTankSpare` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/statusFluidLevelFuelTankSpare` | Reported enum/text; full enum map is not implied by observed values. |
| Remaining driving-range signal | `range` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/range` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Odometer/mileage signal | `mileageKilometre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuel.statusRangeTankStatus/value/mileageKilometre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `fuelEstimate.dataCombinedInstrumentCluster`

Sources / aliases: `fuelEstimate.dataCombinedInstrumentCluster` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Electrical driving-range signal | `electricalRange` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.dataCombinedInstrumentCluster/value/electricalRange` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed fuel-tank level | `displayActualValueFuelTankFluidLevel` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.dataCombinedInstrumentCluster/value/displayActualValueFuelTankFluidLevel` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Average consumption used for range calculation | `averageRangeConsumption` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.dataCombinedInstrumentCluster/value/averageRangeConsumption` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Auxiliary-consumer power signal | `presentAuxiliaryConsumerPower` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.dataCombinedInstrumentCluster/value/presentAuxiliaryConsumerPower` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Average vehicle speed signal | `averageSpeed` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.dataCombinedInstrumentCluster/value/averageSpeed` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `fuelEstimate.mileageRange`

Sources / aliases: `fuelEstimate.mileageRange` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Fuel tank fluid-level signal | `fluidLevelFuelTank` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/fuelEstimate.mileageRange/value/fluidLevelFuelTank` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

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

### `lamps.IndicatorSteeringColumnComplete`

Sources / aliases: `lamps.IndicatorSteeringColumnComplete` (General), `lamps.IndicatorSteeringColumnComplete` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Operation Column Stalks | `operationColumnStalks` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.IndicatorSteeringColumnComplete/value/operationColumnStalks` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Push Button Main Beam Assistant | `statusPushButtonMainBeamAssistant` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.IndicatorSteeringColumnComplete/value/statusPushButtonMainBeamAssistant` | Reported enum/text; full enum map is not implied by observed values. |

### `lamps.LampExterior`

Sources / aliases: `lamps.LampExterior` (General), `lamps.LampExterior` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Control Lamp Exterior | `cRCControlLampExterior` | raw check value | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/cRCControlLampExterior` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Control Lamp Exterior | `aliveControlLampExterior` | count | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/aliveControlLampExterior` | Rolling/alive counter; rollover not established here. |
| Control Brightness Level Lamp Exterior | `controlBrightnessLevelLampExterior` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlBrightnessLevelLampExterior` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Control Function Welcome Light | `controlFunctionWelcomeLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionWelcomeLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Rear Fog Lamp | `controlFunctionRearFogLamp` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionRearFogLamp` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Position Light | `controlFunctionPositionLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionPositionLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Parking Light | `controlFunctionParkingLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionParkingLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Reversing Lamp | `controlFunctionReversingLamp` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionReversingLamp` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Brake Force Display | `controlFunctionBrakeForceDisplay` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionBrakeForceDisplay` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Daytime Running Light | `controlFunctionDaytimeRunningLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionDaytimeRunningLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Brake Light | `controlFunctionBrakeLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionBrakeLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Follow Me Home | `controlFunctionFollowMeHome` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionFollowMeHome` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Remote Light | `controlFunctionRemoteLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionRemoteLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Goodbye Light | `controlFunctionGoodbyeLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/controlFunctionGoodbyeLight` | Reported enum/text; full enum map is not implied by observed values. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | raw; unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LampExterior/value/dummy2` | No physical label, scale or unit established. |

### `lamps.LampExterior2`

Sources / aliases: `lamps.LampExterior2` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Control Lamp Exterior2 | `cRCControlLampExterior2` | raw check value | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/cRCControlLampExterior2` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Control Lamp Exterior2 | `aliveControlLampExterior2` | count | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/aliveControlLampExterior2` | Rolling/alive counter; rollover not established here. |
| Control Function Laser Left Hand | `controlFunctionLaserLeftHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionLaserLeftHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Laser Right Hand | `controlFunctionLaserRightHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionLaserRightHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Dipped Beam Left Hand | `controlFunctionDippedBeamLeftHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionDippedBeamLeftHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Light Distribution Low Beam Left Hand | `controlLightDistributionLowBeamLeftHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlLightDistributionLowBeamLeftHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Dipped Beam Right Hand | `controlFunctionDippedBeamRightHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionDippedBeamRightHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Light Distribution Low Beam Right Hand | `controlLightDistributionLowBeamRightHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlLightDistributionLowBeamRightHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Cornering Light Left Hand | `controlFunctionCorneringLightLeftHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionCorneringLightLeftHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Cornering Light Right Hand | `controlFunctionCorneringLightRightHand` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionCorneringLightRightHand` | Reported enum/text; full enum map is not implied by observed values. |
| Control Phase Function Special Flashing | `controlPhaseFunctionSpecialFlashing` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlPhaseFunctionSpecialFlashing` | Reported enum/text; full enum map is not implied by observed values. |
| Control Mode Function Special Flashing | `controlModeFunctionSpecialFlashing` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlModeFunctionSpecialFlashing` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Main Beam | `controlFunctionMainBeam` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionMainBeam` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function OVT | `controlFunctionOVT` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionOVT` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Front Fog Light | `controlFunctionFrontFogLight` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionFrontFogLight` | Reported enum/text; full enum map is not implied by observed values. |
| Control Function Maneuver Light | `controlFunctionManeuverLight` | enum / text | `L1/lighting-lab-baseline.json` `/readings/lamps.LampExterior2/value/controlFunctionManeuverLight` | Reported enum/text; full enum map is not implied by observed values. |

### `lamps.LowBeam`

Sources / aliases: `lamps.LowBeam` (General), `lamps.LowBeam` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Low Beam | `statusLowBeam` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/statusLowBeam` | Reported enum/text; full enum map is not implied by observed values. |
| Status Sensor Low Beam | `statusSensorLowBeam` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/statusSensorLowBeam` | Reported enum/text; full enum map is not implied by observed values. |
| Ambient Brightness Low Beam | `ambientBrightnessLowBeam` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/ambientBrightnessLowBeam` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Low Beam Reason | `statusLowBeamReason` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/statusLowBeamReason` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Value Low Beam | `statusValueLowBeam` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/statusValueLowBeam` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| State Value Driving Light MB3 | `stateValueDrivingLightMB3` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/stateValueDrivingLightMB3` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| State MB3 | `stateMB3` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.LowBeam/value/stateMB3` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |

### `lamps.statusOperationLightExterior`

Sources / aliases: `lamps.statusOperationLightExterior` (General), `lamps.statusOperationLightExterior` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Lamp Switch | `statusLampSwitch` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.statusOperationLightExterior/value/statusLampSwitch` | Reported enum/text; full enum map is not implied by observed values. |
| Recognition Event Lamp Switch | `recognitionEventLampSwitch` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/lamps.statusOperationLightExterior/value/recognitionEventLampSwitch` | Reported enum/text; full enum map is not implied by observed values. |

### `legacy.statusALEV4`

Sources / aliases: `legacy.statusALEV4` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Brightness ALEV4 Interior Lighting2 | `statusBrightnessALEV4InteriorLighting2` | raw; unit/scale unknown | `L1/lighting-lab-baseline.json` `/readings/legacy.statusALEV4/value/statusBrightnessALEV4InteriorLighting2` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Mode ALEV4 Interior Lighting2 | `statusModeALEV4InteriorLighting2` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusALEV4/value/statusModeALEV4InteriorLighting2` | Reported enum/text; full enum map is not implied by observed values. |
| Status Condition ALEV4 Illumination | `statusConditionALEV4Illumination` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusALEV4/value/statusConditionALEV4Illumination` | Reported enum/text; full enum map is not implied by observed values. |
| Status Mode ALEV4 White Interior Lighting | `statusModeALEV4WhiteInteriorLighting` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusALEV4/value/statusModeALEV4WhiteInteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |

### `legacy.statusAmbientLightInteriorColour`

Sources / aliases: `legacy.statusAmbientLightInteriorColour` (General), `legacy.statusAmbientLightInteriorColour` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Hue Interior Lighting | `statusHueInteriorLighting` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusHueInteriorLighting` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Menu Ambiente Panoramic Roof Interior Lighting | `statusMenuAmbientePanoramicRoofInteriorLighting` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusMenuAmbientePanoramicRoofInteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |
| Status Hue Value Layer1 Individual Group | `statusHueValueLayer1IndividualGroup` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusHueValueLayer1IndividualGroup` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Hue Value Layer2 Individual Group | `statusHueValueLayer2IndividualGroup` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusHueValueLayer2IndividualGroup` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Hue Value Layer3 Individual Group | `statusHueValueLayer3IndividualGroup` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusHueValueLayer3IndividualGroup` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Brightness Value Brightness Offset Ambiente Panoramic Roof Interior Lighting | `statusBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Mode Ambiente Panoramic Roof Interior Lighting | `statusModeAmbientePanoramicRoofInteriorLighting` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusModeAmbientePanoramicRoofInteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |
| Status Dynamic Interior Lighting | `statusDynamicInteriorLighting` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusDynamicInteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |
| Status Dynamic Ambiente Iinterior Lighting | `statusDynamicAmbienteIinteriorLighting` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/legacy.statusAmbientLightInteriorColour/value/statusDynamicAmbienteIinteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |

### `legacy.statusAmbientLightInteriorUserSetting`

Sources / aliases: `legacy.statusAmbientLightInteriorUserSetting` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Brightness Lightsaber Interior Lighting | `statusBrightnessLightsaberInteriorLighting` | raw; unit/scale unknown | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusBrightnessLightsaberInteriorLighting` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Brightness ALEV4 Interior Lighting | `statusBrightnessALEV4InteriorLighting` | raw; unit/scale unknown | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusBrightnessALEV4InteriorLighting` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Hue Value Individual Group Panoramic Roof | `statusHueValueIndividualGroupPanoramicRoof` | raw; unit/scale unknown | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusHueValueIndividualGroupPanoramicRoof` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |
| Status Mode Lightsaber Interior Lighting | `statusModeLightsaberInteriorLighting` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusModeLightsaberInteriorLighting` | Reported enum/text; full enum map is not implied by observed values. |
| Status Mode ALEV4 Interior Lighting | `statusModeALEV4InteriorLighting` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusModeALEV4InteriorLighting` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |
| Status Touch Command SIA Charging | `statusTouchCommandSIACharging` | enum / text | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusTouchCommandSIACharging` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |
| Status Condition Ambiente Interior Lighting | `statusConditionAmbienteInteriorLighting` | raw; unit/scale unknown | `L1/lighting-lab-baseline.json` `/readings/legacy.statusAmbientLightInteriorUserSetting/value/statusConditionAmbienteInteriorLighting` | Raw numeric signal; retained capture does not declare engineering scale/unit. Do not relabel raw brightness/hue/status as percent, lux or kelvin. |

### `mdrive.controlDisplayMSystems`

Sources / aliases: `mdrive.controlDisplayMSystems` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Control Display ASR Mode | `controlDisplayASRMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayASRMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayASRMode/items`. |
| Control Display Driving Mode | `controlDisplayDrivingMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayDrivingMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayDrivingMode/items`. |
| Control Display List Driving Mode | `controlDisplayListDrivingMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayListDrivingMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayListDrivingMode/items`. |
| Control Display Pop Up Instrument Pack Inquiry | `controlDisplayPopUpInstrumentPackInquiry` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayPopUpInstrumentPackInquiry` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Control Display Pop Up Instrument Pack Information | `controlDisplayPopUpInstrumentPackInformation` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayPopUpInstrumentPackInformation` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayPopUpInstrumentPackInformation/items`. |
| Control Display CID | `controlDisplayCID` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayCID` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayCID/items`. |
| Control Display EPAS Mode | `controlDisplayEPASMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayEPASMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode/items`. |
| Control Display Electronic Damper Control Mode | `controlDisplayElectronicDamperControlMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayElectronicDamperControlMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode/items`. |
| Control Display Engine Mode | `controlDisplayEngineMode` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.controlDisplayMSystems/value/controlDisplayEngineMode` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode/items`. |

### `mdrive.dataDisplayGearbox`

Sources / aliases: `mdrive.dataDisplayGearbox` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Display Program Gearbox | `displayProgramGearbox` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.dataDisplayGearbox/value/displayProgramGearbox` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.DisplayProgramGearbox/items`. |
| Display Drive Logic Gearbox | `displayDriveLogicGearbox` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.dataDisplayGearbox/value/displayDriveLogicGearbox` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.DisplayDriveLogicGearbox/items`. |

### `mdrive.statusMDriveTwo`

Sources / aliases: `mdrive.statusMDriveTwo` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status M Drive2 | `statusMDrive2` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2/items`. |
| Control Display M Drive2 | `controlDisplayMDrive2` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/controlDisplayMDrive2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMDrive2/items`. |
| Status M Drive2 DSC | `statusMDrive2DSC` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2DSC` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDrive2DSC/items`. |
| Status M Drive2 Index | `statusMDrive2Index` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2Index` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2Index/items`. |
| Status M Drive2 Stage Gearbox | `statusMDrive2StageGearbox` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2StageGearbox` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDriveStageGearbox/items`. |
| Status M Drive2 Engine | `statusMDrive2Engine` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2Engine` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDrive2Engine/items`. |
| Status M Drive2 Electronic Damper Control | `statusMDrive2ElectronicDamperControl` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2ElectronicDamperControl` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDrive2Mode/items`. |
| Status M Drive2 EPAS | `statusMDrive2EPAS` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2EPAS` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDrive2Mode/items`. |
| Status M Drive2 Display HUD | `statusMDrive2DisplayHUD` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2DisplayHUD` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDrive2DisplayHUD/items`. |
| Status M Drive2 Display Shiftlights | `statusMDrive2DisplayShiftlights` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2DisplayShiftlights` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDriveDisplayShiftlights/items`. |
| Status M Drive2 Mode Gearbox | `statusMDrive2ModeGearbox` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2ModeGearbox` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.MDriveModeGearbox/items`. |
| Request Audible Message M Drive2 | `requestAudibleMessageMDrive2` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/requestAudibleMessageMDrive2` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.RequestAudibleMessageMDrive2/items`. |
| Status M Drive2 All Wheel | `statusMDrive2AllWheel` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMDriveTwo/value/statusMDrive2AllWheel` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.AllWheelSetup/items`. |

### `mdrive.statusMSystem`

Sources / aliases: `mdrive.statusMSystem` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status All Wheel Setup | `statusAllWheelSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusAllWheelSetup` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusAllWheelSetup/items`. |
| Signal/state qualifier: Function All Wheel | `qualifierFunctionAllWheel` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/qualifierFunctionAllWheel` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionAllWheel/items`. |
| Status Brake Pedal Setup | `statusBrakePedalSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusBrakePedalSetup` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusBrakePedalSetup/items`. |
| Signal/state qualifier: Function Brake Pedal | `qualifierFunctionBrakePedal` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/qualifierFunctionBrakePedal` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionBrakePedal/items`. |
| Status M Control Plus Drift Setup | `statusMControlPlusDriftSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusMControlPlusDriftSetup` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMControlPlusDriftSetup/items`. |
| Status Drift Support Level Setup | `statusDriftSupportLevelSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusDriftSupportLevelSetup` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusDriftLevel/items`. |
| Status M Control Plus Traction Level Setup | `statusMControlPlusTractionLevelSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusMControlPlusTractionLevelSetup` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusTractionLevel/items`. |
| Status M Control Plus Brake Balance Level Setup | `statusMControlPlusBrakeBalanceLevelSetup` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/mdrive.statusMSystem/value/statusMControlPlusBrakeBalanceLevelSetup` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusBalanceLevel/items`. |

### `motion.CharacteristicSpeed`

Sources / aliases: `motion.CharacteristicSpeed` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Characteristic Speed | `characteristicSpeed` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.CharacteristicSpeed/value/characteristicSpeed` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Characteristic Speed Error Amplitude | `characteristicSpeedErrorAmplitude` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.CharacteristicSpeed/value/characteristicSpeedErrorAmplitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Characteristic Speed | `qualifierCharacteristicSpeed` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.CharacteristicSpeed/value/qualifierCharacteristicSpeed` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierCharacteristicSpeed/items`. |

### `motion.LateralAccelerationCenterOfGravity`

Sources / aliases: `motion.LateralAccelerationCenterOfGravity` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Longitudinal Acceleration Centre Of Gravity | `cRCLongitudinalAccelerationCentreOfGravity` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/cRCLongitudinalAccelerationCentreOfGravity` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Longitudinal Acceleration Centre Of Gravity | `aliveLongitudinalAccelerationCentreOfGravity` | count | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/aliveLongitudinalAccelerationCentreOfGravity` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/dummy` | No physical label, scale or unit established. |
| Lateral Acceleration Centre Of Gravity | `lateralAccelerationCentreOfGravity` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/lateralAccelerationCentreOfGravity` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Lateral Acceleration Centre Of Gravity Error Amplitude | `lateralAccelerationCentreOfGravityErrorAmplitude` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/lateralAccelerationCentreOfGravityErrorAmplitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Lateral Acceleration Centre Of Gravity | `qualifierLateralAccelerationCentreOfGravity` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.LateralAccelerationCenterOfGravity/value/qualifierLateralAccelerationCentreOfGravity` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierLateralAccelerationCentreOfGravity/items`. |

### `motion.LongitudinalAccelerationCentreOfGravity`

Sources / aliases: `motion.LongitudinalAccelerationCentreOfGravity` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Longitudinal Acceleration Centre Of Gravity | `cRCLongitudinalAccelerationCentreOfGravity` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/cRCLongitudinalAccelerationCentreOfGravity` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Longitudinal Acceleration Centre Of Gravity | `aliveLongitudinalAccelerationCentreOfGravity` | count | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/aliveLongitudinalAccelerationCentreOfGravity` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/dummy` | No physical label, scale or unit established. |
| Longitudinal Acceleration Centre Of Gravity | `longitudinalAccelerationCentreOfGravity` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/longitudinalAccelerationCentreOfGravity` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Longitudinal Acceleration Centre Of Gravity Error Amplitude | `longitudinalAccelerationCentreOfGravityErrorAmplitude` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/longitudinalAccelerationCentreOfGravityErrorAmplitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Longitudinal Acceleration Centre Of Gravity | `qualifierLongitudinalAccelerationCentreOfGravity` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.LongitudinalAccelerationCentreOfGravity/value/qualifierLongitudinalAccelerationCentreOfGravity` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierLongitudinalAccelerationSchwerpunkt2/items`. |

### `motion.YawSpeedVehicle`

Sources / aliases: `motion.YawSpeedVehicle` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Yaw Velocity Vehicle | `cRCYawVelocityVehicle` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/cRCYawVelocityVehicle` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Yaw Velocity Vehicle | `aliveYawVelocityVehicle` | count | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/aliveYawVelocityVehicle` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/dummy` | No physical label, scale or unit established. |
| Yaw Velocity Vehicle | `yawVelocityVehicle` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/yawVelocityVehicle` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Yaw Velocity Vehicle Error Amplitude | `yawVelocityVehicleErrorAmplitude` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/yawVelocityVehicleErrorAmplitude` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Yaw Velocity Vehicle | `qualifierYawVelocityVehicle` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.YawSpeedVehicle/value/qualifierYawVelocityVehicle` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierYawVelocityVehicle/items`. |

### `motion.drivingDirection`

Sources / aliases: `motion.drivingDirection` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Driving Direction Confirmed | `drivingDirectionConfirmed` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.drivingDirection/value/drivingDirectionConfirmed` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleConfirmed/items`. |
| Driving Direction Unconfirmed | `drivingDirectionUnconfirmed` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.drivingDirection/value/drivingDirectionUnconfirmed` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleUnconfirmed/items`. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.drivingDirection/value/dummy` | No physical label, scale or unit established. |

### `motion.vehicleSpeed`

Sources / aliases: `motion.vehicleSpeed` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message alive/rolling counter; Alive Speed Vehicle | `aliveSpeedVehicle` | count | `X1/xdrive-lab-baseline.json` `/readings/motion.vehicleSpeed/value/aliveSpeedVehicle` | Rolling/alive counter; rollover not established here. |
| Status Speed Vehicle Near Standstill | `statusSpeedVehicleNearStandstill` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.vehicleSpeed/value/statusSpeedVehicleNearStandstill` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusSpeedVehicleNearStandstill/items`. |
| Vehicle speed at centre of gravity | `speedVehicleCentreOfGravity` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/motion.vehicleSpeed/value/speedVehicleCentreOfGravity` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Speed Vehicle Centre Of Gravity | `qualifierSpeedVehicleCentreOfGravity` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/motion.vehicleSpeed/value/qualifierSpeedVehicleCentreOfGravity` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierSpeedVehicleCentreOfGravity/items`. |

### `native action`

Sources / aliases: `native action` (Input).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Native menu row index | `row` | raw; unit/scale unknown | `G1/mgu_lab-events.jsonl` `line 44 /raw/row` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Native action subtype | `subType` | raw; unit/scale unknown | `G1/mgu_lab-events.jsonl` `line 44 /raw/subType` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `native focus`

Sources / aliases: `native focus` (Input).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Native menu row index | `row` | raw; unit/scale unknown | `G1/mgu_lab-events.jsonl` `line 10 /raw/row` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Native focus state flag | `value` | Boolean | `G1/mgu_lab-events.jsonl` `line 12 /raw/value` | Reported flag; no independent physical confirmation. |

### `pedal.AngleAcceleratorPedal`

Sources / aliases: `pedal.AngleAcceleratorPedal` (General), `pedal.AngleAcceleratorPedal` (xDrive).

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

### `rsu.isRsuSessionActive`

Sources / aliases: `rsu.isRsuSessionActive` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Remote-software-update diagnostic session active | `(scalar)` | Boolean | `X1/xdrive-lab-baseline.json` `/readings/rsu.isRsuSessionActive/value` | Reported flag; no independent physical confirmation. |

### `stability.StabilizationManagement`

Sources / aliases: `braking.StabilizationManagement` (General), `stability.StabilizationManagement` (xDrive).

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

### `stability.StandStillFunction`

Sources / aliases: `stability.StandStillFunction` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Status Standstill Function DSC | `cRCStatusStandstillFunctionDSC` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/cRCStatusStandstillFunctionDSC` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Status Standstill Function DSC | `aliveStatusStandstillFunctionDSC` | count | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/aliveStatusStandstillFunctionDSC` | Rolling/alive counter; rollover not established here. |
| C HL Status Standstill Function DSC | `cHLStatusStandstillFunctionDSC` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/cHLStatusStandstillFunctionDSC` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Rollback Risk | `statusRollbackRisk` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/statusRollbackRisk` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusRollbackRisk/items`. |
| Status Hillhold Assistant | `statusHillholdAssistant` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/statusHillholdAssistant` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusHillholdAssistant/items`. |
| Status Auto H | `statusAutoH` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/statusAutoH` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusAutoH/items`. |
| Status Hydraulic Dynamic Braking Function | `statusHydraulicDynamicBrakingFunction` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/statusHydraulicDynamicBrakingFunction` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusHydraulicDynamicBrakingFunction/items`. |
| Status Parking Brake | `statusParkingBrake` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/statusParkingBrake` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.StatusParkingBrake/items`. |
| Request Drive Torque Reduction Standstill Function | `requestDriveTorqueReductionStandstillFunction` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/requestDriveTorqueReductionStandstillFunction` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.RequestDriveTorqueReductionStandstillFunction/items`. |
| Unnamed/reserved field dummy1; physical meaning not established | `dummy1` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/dummy1` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.ControlLedAutoHold/items`. |
| Operation Push Button EPB | `operationPushButtonEPB` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/operationPushButtonEPB` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.OperationPushButtonEPB/items`. |
| Signal/state qualifier: Function Postcrash I Brake | `qualifierFunctionPostcrashIBrake` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/qualifierFunctionPostcrashIBrake` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.chassistypes.ChassisTypes.QualifierFunctionPostcrashIBrake/items`. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/stability.StandStillFunction/value/dummy2` | No physical label, scale or unit established. |

### `steering.ActualSteeringAngleDriver`

Sources / aliases: `steeringChassis.ActualSteeringAngleDriver` (General), `steering.ActualSteeringAngleDriver` (xDrive).

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

Sources / aliases: `steeringChassis.SteeringAngleFrontAxleEffective` (General), `steering.SteeringAngleFrontAxleEffective` (xDrive).

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

Sources / aliases: `steeringChassis.actualSteeringAngleDriverNoCRC` (General), `steering.actualSteeringAngleDriverNoCRC` (xDrive).

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

### `tasu.tasuModeStatus`

Sources / aliases: `tasu.tasuModeStatus` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| TASU exclusive/diagnostic mode status | `(scalar)` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/tasu.tasuModeStatus/value` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/com.harman.infotainment.systemfunctions.tasu.TasuTypes.TasuExclusiveMode/items`. |

### `touchpad.ZBETouchFrontSide`

Sources / aliases: `touchpad.ZBETouchFrontSide` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message alive/rolling counter; Alive Status ZBE Touch Front Side | `aliveStatusZBETouchFrontSide` | count | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/aliveStatusZBETouchFrontSide` | Rolling/alive counter; rollover not established here. |
| Status System Mode Front Side | `statusSystemModeFrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/statusSystemModeFrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates X1 Front Side | `touchCoordinatesX1FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCoordinatesX1FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Y1 Front Side | `touchCoordinatesY1FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCoordinatesY1FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Z1 Front Side | `touchCoordinatesZ1FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCoordinatesZ1FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Z2 Front Side | `touchCoordinatesZ2FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCoordinatesZ2FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Ccoordinates X2 Front Side | `touchCcoordinatesX2FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCcoordinatesX2FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Y2 Front Side | `touchCoordinatesY2FrontSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchFrontSide/value/touchCoordinatesY2FrontSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `touchpad.ZBETouchRearSide`

Sources / aliases: `touchpad.ZBETouchRearSide` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message alive/rolling counter; Alive Status ZBE Touch Rear Side | `aliveStatusZBETouchRearSide` | count | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/aliveStatusZBETouchRearSide` | Rolling/alive counter; rollover not established here. |
| Status System Mode Rear Side | `statusSystemModeRearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/statusSystemModeRearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates X1 Rear Side | `touchCoordinatesX1RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCoordinatesX1RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Y1 Rear Side | `touchCoordinatesY1RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCoordinatesY1RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Z1 Rear Side | `touchCoordinatesZ1RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCoordinatesZ1RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Z2 Rear Side | `touchCoordinatesZ2RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCoordinatesZ2RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Ccoordinates X2 Rear Side | `touchCcoordinatesX2RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCcoordinatesX2RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Touch Coordinates Y2 Rear Side | `touchCoordinatesY2RearSide` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/touchpad.ZBETouchRearSide/value/touchCoordinatesY2RearSide` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `tpms.statusAvailableTypeTyreList`

Sources / aliases: `tpms.statusAvailableTypeTyreList` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Type Tyre | `widthTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/widthTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Relation Side Type Tyre | `relationSideTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/relationSideTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Radius Type Tyre | `radiusTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/radiusTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Index Load Capacity Type Tyre | `indexLoadCapacityTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/indexLoadCapacityTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Type Tyre | `indexSpeedTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/indexSpeedTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Carcass Type Tyre | `carcassTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/carcassTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Season Type Tyre | `seasonTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/seasonTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Runflat Type Tyre | `runflatTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/runflatTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Tyre-object/list identifier | `statusTyreObjectListID` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreList/value/statusTyreObjectListID` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `tpms.statusAvailableTypeTyreListEvent`

Sources / aliases: `tpms.statusAvailableTypeTyreListEvent` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Type Tyre | `widthTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/widthTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Relation Side Type Tyre | `relationSideTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/relationSideTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Radius Type Tyre | `radiusTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/radiusTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Index Load Capacity Type Tyre | `indexLoadCapacityTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/indexLoadCapacityTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Type Tyre | `indexSpeedTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/indexSpeedTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Carcass Type Tyre | `carcassTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/carcassTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Season Type Tyre | `seasonTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/seasonTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Runflat Type Tyre | `runflatTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/runflatTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Tyre-object/list identifier | `statusTyreObjectListID` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusAvailableTypeTyreListEvent/value/statusTyreObjectListID` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `tpms.statusFrontAxleTyre`

Sources / aliases: `tpms.statusFrontAxleTyre` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Front Axle Type Tyre | `widthFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/widthFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Relation Side Front Axle Type Tyre | `relationSideFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/relationSideFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Radius Front Axle Type Tyre | `radiusFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/radiusFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Index Load Capacity Front Axle Type Tyre | `indexLoadCapacityFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/indexLoadCapacityFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Front Axle Type Tyre | `indexSpeedFrontAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/indexSpeedFrontAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Carcass Front Axle Type Tyre | `carcassFrontAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/carcassFrontAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Season Front Axle Type Tyre | `seasonFrontAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/seasonFrontAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Runflat Front Axle Type Tyre | `runflatFrontAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/runflatFrontAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Abrasion Front Axle Type Tyre | `abrasionFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/abrasionFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Age Front Axle Type Tyre | `ageFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/ageFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Length Of Run Front Axle Type Tyre | `lengthOfRunFrontAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusFrontAxleTyre/value/lengthOfRunFrontAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |

### `tpms.statusRearAxleTyre`

Sources / aliases: `tpms.statusRearAxleTyre` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Back Axle Type Tyre | `widthBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/widthBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Relation Side Back Axle Type Tyre | `relationSideBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/relationSideBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Radius Back Axle Type Tyre | `radiusBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/radiusBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Index Load Capacity Back Axle Type Tyre | `indexLoadCapacityBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/indexLoadCapacityBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Back Axle Type Tyre | `indexSpeedBackAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/indexSpeedBackAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Carcass Back Axle Type Tyre | `carcassBackAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/carcassBackAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Season Back Axle Type Tyre | `seasonBackAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/seasonBackAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Runflat Back Axle Type Tyre | `runflatBackAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/runflatBackAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Abrasion Back Axle Type Tyre | `abrasionBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/abrasionBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Age Back Axle Type Tyre | `ageBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/ageBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Length Of Run Back Axle Type Tyre | `lengthOfRunBackAxleTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/lengthOfRunBackAxleTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Status Selection Back Axle Type Tyre | `statusSelectionBackAxleTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusRearAxleTyre/value/statusSelectionBackAxleTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |

### `tpms.statusSummerTyre`

Sources / aliases: `tpms.statusSummerTyre` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Summertyre Type Tyre | `widthSummertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/widthSummertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Carcass Summertyre Type Tyre | `carcassSummertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/carcassSummertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Radius Summertyre Type Tyre | `radiusSummertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/radiusSummertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Runflat Summertyre Type Tyre | `runflatSummertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/runflatSummertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Season Summertyre Type Tyre | `seasonSummertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/seasonSummertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Index Load Capacity Summertyre Type Tyre | `indexLoadCapacitySummertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/indexLoadCapacitySummertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Summertyre Type Tyre | `indexSpeedSummertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/indexSpeedSummertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Relation Side Summertyre Type Tyre | `relationSideSummertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusSummerTyre/value/relationSideSummertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |

### `tpms.statusTargetTyrePressure`

Sources / aliases: `tpms.statusTargetTyrePressure` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Target Pressure Tyre FLH | `targetPressureTyreFLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTargetTyrePressure/value/targetPressureTyreFLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained values include 65533; not a usable target pressure. |
| Target Pressure Tyre FRH | `targetPressureTyreFRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTargetTyrePressure/value/targetPressureTyreFRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained values include 65533; not a usable target pressure. |
| Target Pressure Tyre RLH | `targetPressureTyreRLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTargetTyrePressure/value/targetPressureTyreRLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained values include 65533; not a usable target pressure. |
| Target Pressure Tyre RRH | `targetPressureTyreRRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTargetTyrePressure/value/targetPressureTyreRRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained values include 65533; not a usable target pressure. |

### `tpms.statusTyrePressure`

Sources / aliases: `tpms.statusTyrePressure` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Actual Value Pressure Tyre FLH | `actualValuePressureTyreFLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyrePressure/value/actualValuePressureTyreFLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Pressure Tyre FRH | `actualValuePressureTyreFRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyrePressure/value/actualValuePressureTyreFRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Pressure Tyre RLH | `actualValuePressureTyreRLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyrePressure/value/actualValuePressureTyreRLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Pressure Tyre RRH | `actualValuePressureTyreRRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyrePressure/value/actualValuePressureTyreRRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |

### `tpms.statusTyreState`

Sources / aliases: `tpms.statusTyreState` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Tyre-pressure monitoring initialization/display qualifier | `qualifierRDCInitializationDisplay` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/qualifierRDCInitializationDisplay` | Raw numeric signal; retained capture does not declare engineering scale/unit. Includes limit/default-like values; no invented validity mapping. |
| Length Object List Type Tyre | `lengthObjectListTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/lengthObjectListTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Tyre Season Tyre Pressure Control | `statusTyreSeasonTyrePressureControl` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusTyreSeasonTyrePressureControl` | Reported enum/text; full enum map is not implied by observed values. |
| Status Selection Wintertyre Available | `statusSelectionWintertyreAvailable` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusSelectionWintertyreAvailable` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Target Pressure Loading Condition Tyre Pressure Control | `statusTargetPressureLoadingConditionTyrePressureControl` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusTargetPressureLoadingConditionTyrePressureControl` | Reported enum/text; full enum map is not implied by observed values. |
| Status Selection Tyre | `statusSelectionTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusSelectionTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Status Selection Summertyre Available | `statusSelectionSummertyreAvailable` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusSelectionSummertyreAvailable` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Tyre-related instrument/message-centre operation | `operationIDRmessageCenter` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/operationIDRmessageCenter` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |
| Status Manual Selection | `statusManualSelection` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreState/value/statusManualSelection` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. |

### `tpms.statusTyreTemperature`

Sources / aliases: `tpms.statusTyreTemperature` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Actual Value Temperature Tyre FLH | `actualValueTemperatureTyreFLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreTemperature/value/actualValueTemperatureTyreFLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Temperature Tyre FRH | `actualValueTemperatureTyreFRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreTemperature/value/actualValueTemperatureTyreFRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Temperature Tyre RLH | `actualValueTemperatureTyreRLH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreTemperature/value/actualValueTemperatureTyreRLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |
| Actual Value Temperature Tyre RRH | `actualValueTemperatureTyreRRH` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyreTemperature/value/actualValueTemperatureTyreRRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained wheel values include 65534; do not display them as pressure/temperature. |

### `tpms.statusTyresStatus`

Sources / aliases: `tpms.statusTyresStatus` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message alive/rolling counter; Alive Status Tyre | `aliveStatusTyre` | count | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyresStatus/value/aliveStatusTyre` | Rolling/alive counter; rollover not established here. |
| Signal/state qualifier: Function Tyre Information | `qualifierFunctionTyreInformation` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyresStatus/value/qualifierFunctionTyreInformation` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Tyre Pressure Loss | `qualifierTyrePressureLoss` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyresStatus/value/qualifierTyrePressureLoss` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Tyre Failure | `qualifierTyreFailure` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusTyresStatus/value/qualifierTyreFailure` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `tpms.statusWinterTyre`

Sources / aliases: `tpms.statusWinterTyre` (General).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Width Wintertyre Type Tyre | `widthWintertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/widthWintertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Carcass Wintertyre Type Tyre | `carcassWintertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/carcassWintertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Radius Wintertyre Type Tyre | `radiusWintertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/radiusWintertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |
| Runflat Wintertyre Type Tyre | `runflatWintertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/runflatWintertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Season Wintertyre Type Tyre | `seasonWintertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/seasonWintertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Index Load Capacity Wintertyre Type Tyre | `indexLoadCapacityWintertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/indexLoadCapacityWintertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Index Speed Wintertyre Type Tyre | `indexSpeedWintertyreTypeTyre` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/indexSpeedWintertyreTypeTyre` | Reported enum/text; full enum map is not implied by observed values. |
| Relation Side Wintertyre Type Tyre | `relationSideWintertyreTypeTyre` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/tpms.statusWinterTyre/value/relationSideWintertyreTypeTyre` | Raw numeric signal; retained capture does not declare engineering scale/unit. Tyre catalogue/index encoding is not established as mm, inches, years or km. |

### `vehicle.statusCarSpeed2`

Sources / aliases: `vehicle.statusCarSpeed2` (General), `vehicle.statusCarSpeed2` (xDrive), `vehicle.statusCarSpeed2` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Vehicle speed at centre of gravity | `speedVehicleCentreOfGravity` | raw; unit/scale unknown | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusCarSpeed2/value/speedVehicleCentreOfGravity` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `vehicle.statusDisplayedCCMessage`

Sources / aliases: `vehicle.statusDisplayedCCMessage` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Number Check Control Message Display | `statusNumberCheckControlMessageDisplay` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/vehicle.statusDisplayedCCMessage/value/statusNumberCheckControlMessageDisplay` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `vehicle.statusLightStatus`

Sources / aliases: `vehicle.statusLightStatus` (General), `vehicle.statusLightStatus` (Lighting).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Status Main Beam headlight Flasher | `statusMainBeam_headlightFlasher` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusMainBeam_headlightFlasher` | Reported enum/text; full enum map is not implied by observed values. |
| Status Front Fog Light | `statusFrontFogLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusFrontFogLight` | Reported enum/text; full enum map is not implied by observed values. |
| Status Rear Fog Light | `statusRearFogLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusRearFogLight` | Reported enum/text; full enum map is not implied by observed values. |
| Status Position Light | `statusPositionLight` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusPositionLight` | Reported enum/text; full enum map is not implied by observed values. |
| Status Light Status Error | `statusLightStatusError` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusLightStatusError` | Reported enum/text; full enum map is not implied by observed values. |
| Status Dipped Beam | `statusDippedBeam` | enum / text | `G2/lab-vehicle-snapshot.json` `/readings/vehicle.statusLightStatus/value/statusDippedBeam` | Reported enum/text; full enum map is not implied by observed values. |

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

### `wheels.ActualValueRPMWheel`

Sources / aliases: `wheels.ActualValueRPMWheel` (xDrive).

Additional native capture: `O /native/de.bmw.powertrain.Powertrain.ActualValueRPMWheel/raw`. ActualValueRPMWheel is notification-only, not an available getter; wheel ordering is RL, RR, FL, FR.

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Actual Value RPM Wheel | `CRCActualValueRPMWheel` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/CRCActualValueRPMWheel` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Actual Value RPM Wheel | `aliveActualValueRPMWheel` | count | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/aliveActualValueRPMWheel` | Rolling/alive counter; rollover not established here. |
| Unnamed/reserved field dummy; physical meaning not established | `dummy` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/dummy` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusRPMSource/items`. |
| Rear-left wheel rotational-speed signal | `actualValueRPMWheelRLH` | RPM named; raw scale unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/actualValueRPMWheelRLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained raw wheel values include 65407; catalog default is 65535, but RPM scaling is absent. |
| Rear-right wheel rotational-speed signal | `actualValueRPMWheelRRH` | RPM named; raw scale unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/actualValueRPMWheelRRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained raw wheel values include 65407; catalog default is 65535, but RPM scaling is absent. |
| Front-left wheel rotational-speed signal | `actualValueRPMWheelFLH` | RPM named; raw scale unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/actualValueRPMWheelFLH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained raw wheel values include 65407; catalog default is 65535, but RPM scaling is absent. |
| Front-right wheel rotational-speed signal | `actualValueRPMwheelFRH` | RPM named; raw scale unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/actualValueRPMwheelFRH` | Raw numeric signal; retained capture does not declare engineering scale/unit. Retained raw wheel values include 65407; catalog default is 65535, but RPM scaling is absent. |
| Signal/state qualifier: Actual Value RPM Wheel RLH | `qualifierActualValueRPMWheelRLH` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/qualifierActualValueRPMWheelRLH` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel/items`. |
| Signal/state qualifier: Actual Value RPM Wheel RRH | `qualifierActualValueRPMWheelRRH` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/qualifierActualValueRPMWheelRRH` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel/items`. |
| Signal/state qualifier: Actual Value RPM Wheel FLH | `qualifierActualValueRPMWheelFLH` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/qualifierActualValueRPMWheelFLH` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Qualifier differs between xDrive baseline and later native capture. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel/items`. |
| Signal/state qualifier: Actual Value RPM Wheel FRH | `qualifierActualValueRPMWheelFRH` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.ActualValueRPMWheel/value/qualifierActualValueRPMWheelFRH` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel/items`. |

### `wheels.WheelMomentDrive1`

Sources / aliases: `wheels.WheelMomentDrive1` (xDrive).

Additional native capture: `O /native/de.bmw.powertrain.Powertrain.WheelMomentDrive1/raw`. ActualValueRPMWheel is notification-only, not an available getter; wheel ordering is RL, RR, FL, FR.

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Wheel Moment Drive1 | `cRCWheelMomentDrive1` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/cRCWheelMomentDrive1` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Wheel Moment Drive1 | `aliveWheelMomentDrive1` | count | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/aliveWheelMomentDrive1` | Rolling/alive counter; rollover not established here. |
| Driver Availibility Fast | `driverAvailibilityFast` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/driverAvailibilityFast` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.DriverAvailibilityFast/items`. |
| Unnamed/reserved field dummy1; physical meaning not established | `dummy1` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/dummy1` | No physical label, scale or unit established. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/dummy2` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueWheelMomentPowerTrainSum/items`. |
| Unnamed/reserved field dummy3; physical meaning not established | `dummy3` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/dummy3` | No physical label, scale or unit established. |
| Unnamed/reserved field dummy4; physical meaning not established | `dummy4` | raw; unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/dummy4` | No physical label, scale or unit established. |
| Unnamed/reserved field dummy5; physical meaning not established | `dummy5` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive1/value/dummy5` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierReinforcementPowerTrain/items`. |

### `wheels.WheelMomentDrive4`

Sources / aliases: `wheels.WheelMomentDrive4` (xDrive).

Additional native capture: `O /native/de.bmw.powertrain.Powertrain.WheelMomentDrive4/raw`. ActualValueRPMWheel is notification-only, not an available getter; wheel ordering is RL, RR, FL, FR.

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Wheel Moment Drive4 | `cRCWheelMomentDrive4` | raw check value | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/cRCWheelMomentDrive4` | Transport integrity metadata, not an engineering measurement. |
| Message alive/rolling counter; Alive Wheel Moment Drive4 | `aliveWheelMomentDrive4` | count | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/aliveWheelMomentDrive4` | Rolling/alive counter; rollover not established here. |
| Status Interface Driver Assistence System Target Limit | `statusInterfaceDriverAssistenceSystemTargetLimit` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/statusInterfaceDriverAssistenceSystemTargetLimit` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystemTargetLimit/items`. |
| Status Driving Direction Drivers Choice | `statusDrivingDirectionDriversChoice` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/statusDrivingDirectionDriversChoice` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusDrivingDirectionDriver_sChoice/items`. |
| Signal/state qualifier: Actual Value RPM Back Axle Redundant | `qualifierActualValueRPMBackAxleRedundant` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/qualifierActualValueRPMBackAxleRedundant` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMBackAxleRedundant/items`. |
| Redundant rear-axle rotational-speed signal | `actualValueRPMBackAxleRedundant` | RPM named; raw scale unknown | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/actualValueRPMBackAxleRedundant` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Status Positive Engagement Power Train | `statusPositiveEngagementPowerTrain` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/statusPositiveEngagementPowerTrain` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusPositiveEngagementPowerTrain/items`. |
| Status Availibility Intervention Power Train DRS | `statusAvailibilityInterventionPowerTrainDRS` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/statusAvailibilityInterventionPowerTrainDRS` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.StatusAvailibilityInterventionPowerTrainDRS/items`. |
| Unnamed/reserved field dummy1; physical meaning not established | `dummy1` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/wheels.WheelMomentDrive4/value/dummy1` | Reported enum/text; full enum map is not implied by observed values. Includes unfilled, invalid or substitute-value state; preserve it. Enum definitions: E `/payload/catalog/datatypes/de.bmw.powertraintypes.PowertrainTypes.ControlActivationPowerHop/items`. |

### `xview.statusDisplayDriveDynamic`

Sources / aliases: `xview.statusDisplayDriveDynamic` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Displayed front-left wheel-moment value; not calibrated axle torque | `displayFLHWheelMoment` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayFLHWheelMoment` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed front-right wheel-moment value; not calibrated axle torque | `displayFRHWheelMoment` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayFRHWheelMoment` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed rear-left wheel-moment value; not calibrated axle torque | `displayRLHWheelMoment` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayRLHWheelMoment` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed rear-right wheel-moment value; not calibrated axle torque | `displayRRHWheelMoment` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayRRHWheelMoment` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Control Wheel Moment Display | `controlWheelMomentDisplay` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/controlWheelMomentDisplay` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed longitudinal road gradient | `displayLongitudinalGradientRoadway` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayLongitudinalGradientRoadway` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Displayed road-gradient percent signal (raw encoding) | `displayLongitudinalGradientRoadwayPercent` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusDisplayDriveDynamic/value/displayLongitudinalGradientRoadwayPercent` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `xview.statusFrontAxleSteeringAngle`

Sources / aliases: `xview.statusFrontAxleSteeringAngle` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Effective front-axle steering angle (not rear steer) | `steeringAngleFrontAxleEffective` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusFrontAxleSteeringAngle/value/steeringAngleFrontAxleEffective` | Raw numeric signal; retained capture does not declare engineering scale/unit. |

### `xview.statusSteeringAngleDriver`

Sources / aliases: `xview.statusSteeringAngleDriver` (xDrive).

| Data | Exact field | Units / encoding | Where captured | Interpretation / limits |
| --- | --- | --- | --- | --- |
| Driver/steering-wheel angle signal | `actualValueSteeringAngleDriver` | raw; unit/scale unknown | `X1/xdrive-lab-baseline.json` `/readings/xview.statusSteeringAngleDriver/value/actualValueSteeringAngleDriver` | Raw numeric signal; retained capture does not declare engineering scale/unit. |
| Signal/state qualifier: Actual Value Steering Angle Driver | `qualifierActualValueSteeringAngleDriver` | enum / text | `X1/xdrive-lab-baseline.json` `/readings/xview.statusSteeringAngleDriver/value/qualifierActualValueSteeringAngleDriver` | Reported enum/text; full enum map is not implied by observed values. Enum definitions: E `/payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.QualifierActualValueSteeringAngleDriver1/items`. |

## Diagnostic channels — retained values and artifact definitions

- `O /evidenceLevel`: **Offline artifact-defined; no new live vehicle validation**. All 30 latest diagnostic records have `synthetic:false`, but `transportVerdict:REQUEST_PENDING`; none is promoted here to an independently verified physical measurement. Positive UDS structure and ECU/SID/DID matching do not establish request ownership.
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

### `0x19 / 22 DB32` — Transfer case / front torque

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| actual torque toward front axle | `STAT_ISTMOMENT_WERT` | Nm | `O /latest/19-DB32/decoded/fields/0` (payload byte 0) | Signed BE16 / 4 Nm; reported actual/requested front torque, not a load-cell proof. |
| actual torque qualifier | `STAT_QUALIFIER_ISTMOMENT_WERT` | raw only; declared - | `O /latest/19-DB32/decoded/fields/1` (payload byte 2) | Unsigned BE16 raw qualifier; numeric meaning unresolved. Do not borrow a SOME/IP validity enum. |
| requested torque toward front axle | `STAT_SOLLMOMENT_WERT` | Nm | `O /latest/19-DB32/decoded/fields/2` (payload byte 4) | Signed BE16 / 4 Nm; reported actual/requested front torque, not a load-cell proof. |
| requested torque qualifier | `STAT_QUALIFIER_SOLLMOMENT_WERT` | raw only; declared - | `O /latest/19-DB32/decoded/fields/3` (payload byte 6) | Unsigned BE16 raw qualifier; numeric meaning unresolved. Do not borrow a SOME/IP validity enum. |

### `0x19 / 22 DFEA` — Transfer case / service states

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| Transfer-case service-basis qualifier | `STAT_QU_SER_BASIS_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/0` (payload byte 0) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Limp-controller state | `STAT_QU_SER_NOTLAUF_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/1` (payload byte 1) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Transfer-case actuator-position state | `STAT_QU_SER_POSITION_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/2` (payload byte 2) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Transfer-case protection-function state | `STAT_QU_SER_SCHUTZ_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/3` (payload byte 3) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Transfer-case released/not-released state in normal operation | `STAT_QU_LMV_LUEFTSTATUS_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/4` (payload byte 4) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Clutch availability state | `STAT_QU_SER_VV_KUPPLUNG_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/5` (payload byte 5) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |
| Actuator availability state | `STAT_QU_SER_VV_STELLGLIED_WERT` | raw only; declared - | `O /latest/19-DFEA/decoded/fields/6` (payload byte 6) | Unsigned byte; numeric mapping unresolved. Do not assign 0/1 to clutch open/closed. |

### `0x19 / 22 4004` — Transfer case / clutch and actuator

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| lamella temperature | `STAT_TMPBLADE_WERT` | °C | `O /latest/19-4004/decoded/fields/0` (payload byte 0) | Reported/model-derived lamella temperature; signed BE32 / 4194304, not proof of a direct temperature sensor. |
| low-misuse counter | `STAT_CNTMISUSEDETLOW_WERT` | count | `O /latest/19-4004/decoded/fields/1` (payload byte 4) | Artifact-defined field; retain qualifier and transport status separately. |
| chain lifetime work | `STAT_WORKCHAIN_WERT` | kWh | `O /latest/19-4004/decoded/fields/2` (payload byte 6) | Artifact-defined field; retain qualifier and transport status separately. |
| clutch lifetime work | `STAT_WORKCLUTCH_WERT` | kWh | `O /latest/19-4004/decoded/fields/3` (payload byte 10) | Artifact-defined field; retain qualifier and transport status separately. |
| oil work | `STAT_WORKOIL_WERT` | kWh | `O /latest/19-4004/decoded/fields/4` (payload byte 14) | Artifact-defined field; retain qualifier and transport status separately. |
| backup function request | `STAT_CMDBACKUPFCN_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/5` (payload byte 16) | Artifact-defined field; retain qualifier and transport status separately. |
| clutch differential speed | `STAT_DELTAPHICLUTCH_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/6` (payload byte 17) | Label describes clutch differential rotation in rad per 10 ms; source unit cell is “-”. |
| thermal clutch stress | `STAT_PRCTMPSTRESSCLUTCH_WERT` | % | `O /latest/19-4004/decoded/fields/7` (payload byte 19) | Thermal clutch stress, NOT clutch-engagement percentage. |
| measured actuator current | `STAT_IBLDC_WERT` | A | `O /latest/19-4004/decoded/fields/8` (payload byte 20) | Signed BE16 / 512 A. |
| actuator rotational speed, corrected for worm ratio | `STAT_NATR_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/9` (payload byte 22) | Artifact-defined field; retain qualifier and transport status separately. |
| measured actuator angle | `STAT_PHIATR_WERT` | ° | `O /latest/19-4004/decoded/fields/10` (payload byte 24) | Signed BE16 / 64 degrees; actuator angle, not clutch closure percent. |
| measured battery voltage | `STAT_UBATT_WERT` | V | `O /latest/19-4004/decoded/fields/11` (payload byte 26) | Signed BE16 / 1024 V. |
| actuator voltage | `STAT_UBLDC_WERT` | V | `O /latest/19-4004/decoded/fields/12` (payload byte 28) | Explicitly currently not in use; not a fitted/working sensor claim. |
| front/rear axle speed difference | `STAT_DLTNFRAX2RAX_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/13` (payload byte 30) | Artifact-defined field; retain qualifier and transport status separately. |
| engine speed | `STAT_NENGINE_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/14` (payload byte 32) | Label explicitly says rpm although source unit cell is “-”. |
| engine speed qualifier | `STAT_NENGINE_QF_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/15` (payload byte 34) | Artifact-defined field; retain qualifier and transport status separately. |
| front axle rotational speed | `STAT_NFRAX_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/16` (payload byte 35) | Artifact-defined field; retain qualifier and transport status separately. |
| powertrain engaged | `STAT_STPTENGAGED_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/17` (payload byte 37) | Artifact-defined field; retain qualifier and transport status separately. |
| qualifier of powertrain engaged | `STAT_STPTENGAGED_QF_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/18` (payload byte 38) | Artifact-defined field; retain qualifier and transport status separately. |
| bridge temperature | `STAT_TMPBRIDGE_WERT` | °C | `O /latest/19-4004/decoded/fields/19` (payload byte 39) | Artifact-defined field; retain qualifier and transport status separately. |
| brake driver torque request | `STAT_TRQBRAKEDRIVERREQ_WERT` | Nm | `O /latest/19-4004/decoded/fields/20` (payload byte 41) | Artifact-defined field; retain qualifier and transport status separately. |
| torque request qualifier | `STAT_TRQBRAKEDRIVERREQ_QF_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/21` (payload byte 43) | Artifact-defined field; retain qualifier and transport status separately. |
| gearbox type | `STAT_TYPEGEARBOX_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/22` (payload byte 44) | Artifact-defined field; retain qualifier and transport status separately. |
| minimum front vehicle speed | `STAT_VFRONTMIN_WERT` | km/h | `O /latest/19-4004/decoded/fields/23` (payload byte 45) | Artifact-defined field; retain qualifier and transport status separately. |
| minimum speed qualifier | `STAT_VFRONTMIN_QF_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/24` (payload byte 47) | Artifact-defined field; retain qualifier and transport status separately. |
| low-temperature compensation active | `STAT_STMISUSELOWTEMPACTIVE_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/25` (payload byte 48) | Artifact-defined field; retain qualifier and transport status separately. |
| maximum allowed torque | `STAT_TRQMISUSESETPOINTMAX_WERT` | Nm | `O /latest/19-4004/decoded/fields/26` (payload byte 49) | Artifact-defined field; retain qualifier and transport status separately. |
| wear-oil gain correction | `STAT_WEAROILGAIN_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/27` (payload byte 51) | Artifact-defined field; retain qualifier and transport status separately. |
| wear-oil offset correction | `STAT_WEAROILOFFSET_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/28` (payload byte 53) | Artifact-defined field; retain qualifier and transport status separately. |
| internal misuse-detector phi | `STAT_PHIINT_WERT` | unit not specified | `O /latest/19-4004/decoded/fields/29` (payload byte 55) | Artifact-defined field; retain qualifier and transport status separately. |
| misuse-detector blade temperature | `STAT_MISUSE_TMPBLADE_WERT` | °C | `O /latest/19-4004/decoded/fields/30` (payload byte 57) | Artifact-defined field; retain qualifier and transport status separately. |

### `0x19 / 22 4005` — Transfer case / electronics

| Data | Exact result name | Units | Where / payload offset | Interpretation |
| --- | --- | --- | --- | --- |
| BLDC half-bridge footpoint measured current | `STAT_BLDC_STROM_WERT` | A | `O /latest/19-4005/decoded/fields/0` (payload byte 0) | Artifact-defined field; retain qualifier and transport status separately. |
| rotor-shaft internal angle | `STAT_BLDC_RPS_WINKEL_WERT` | ° | `O /latest/19-4005/decoded/fields/1` (payload byte 4) | Artifact-defined field; retain qualifier and transport status separately. |
| TLE9180 bridge-driver status | `STAT_BLDC_BD_STATUS_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/2` (payload byte 6) | Artifact-defined field; retain qualifier and transport status separately. |
| high-side current | `STAT_HS_STROM_WERT` | A | `O /latest/19-4005/decoded/fields/3` (payload byte 7) | Artifact-defined field; retain qualifier and transport status separately. |
| DC-link voltage | `STAT_UDC_WERT` | V | `O /latest/19-4005/decoded/fields/4` (payload byte 11) | Artifact-defined field; retain qualifier and transport status separately. |
| terminal 30 voltage | `STAT_UKL30_WERT` | V | `O /latest/19-4005/decoded/fields/5` (payload byte 13) | Artifact-defined field; retain qualifier and transport status separately. |
| temperature near bridge | `STAT_TEMP_NTC_WERT` | °C | `O /latest/19-4005/decoded/fields/6` (payload byte 15) | Artifact-defined field; retain qualifier and transport status separately. |
| microcontroller temperature | `STAT_TEMP_CONTROLLER_WERT` | °C | `O /latest/19-4005/decoded/fields/7` (payload byte 17) | Artifact-defined field; retain qualifier and transport status separately. |
| position sensor temperature | `STAT_TEMP_RPS_WERT` | °C | `O /latest/19-4005/decoded/fields/8` (payload byte 19) | Artifact-defined field; retain qualifier and transport status separately. |
| external monitoring unit/SBC temperature | `STAT_TEMP_SBC_WERT` | °C | `O /latest/19-4005/decoded/fields/9` (payload byte 21) | Artifact-defined field; retain qualifier and transport status separately. |
| reserved external-sensor signal voltage | `STAT_EXTERNAL_SENSOR_SIGNAL_WERT` | V | `O /latest/19-4005/decoded/fields/10` (payload byte 23) | Explicit unoccupied placeholder; no external sensor established. |
| reserved external-sensor supply voltage | `STAT_EXTERNAL_SENSOR_SUPPLY_WERT` | V | `O /latest/19-4005/decoded/fields/11` (payload byte 25) | Explicit unoccupied placeholder; no external sensor established. |
| reserved external-sensor current value | `STAT_EXTERNAL_SENSOR_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/12` (payload byte 27) | Explicit unoccupied placeholder; no external sensor established. |
| active protection function in NIA software | `STAT_ACTIVE_BF_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/13` (payload byte 31) | Artifact-defined field; retain qualifier and transport status separately. |
| maximum commutation interrupt runtime | `STAT_ISR_WECT_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/14` (payload byte 32) | Artifact-defined field; retain qualifier and transport status separately. |
| maximum latency | `STAT_ISR_WEP_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/15` (payload byte 36) | Artifact-defined field; retain qualifier and transport status separately. |
| combined SBC status | `STAT_SBC_STATUS_BITS_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/16` (payload byte 40) | Artifact-defined field; retain qualifier and transport status separately. |
| combined bridge-driver status | `STAT_BLDC_BD_STATUS_BITS_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/17` (payload byte 44) | Artifact-defined field; retain qualifier and transport status separately. |
| combined RPS status | `STAT_RPS_STATUS_BITS_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/18` (payload byte 48) | Artifact-defined field; retain qualifier and transport status separately. |
| ECU/SBC wake-up cause | `STAT_SBC_AUFWACH_GRUND_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/19` (payload byte 52) | Artifact-defined field; retain qualifier and transport status separately. |
| overtemperature counter | `STAT_ECU_OVERTEMP_COUNTER_WERT` | unit not specified | `O /latest/19-4005/decoded/fields/20` (payload byte 53) | Artifact-defined field; retain qualifier and transport status separately. |

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

These definitions are retained data, not proof that a provider exists or a sensor value was received. Units are deliberately not inferred from field names. Catalog type/enum definitions are at `E /payload/catalog/datatypes`; field declarations at `/payload/catalog/services`.

### `fes.modeAvailabilityDSC` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Mode DSC Availability | `modeDSCAvailability` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ModeDSCAvailability` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 9=KEINE, 8=MID, 15=SIGNAL_UNBEFUELLT, 4=TRAKTION, 5=TRAKTIONSOPTIMIERT_STUFE_1, 6=TRAKTIONSOPTIMIERT_STUFE_2, 7=TRAKTIONSOPTIMIERT_STUFE_3, 2=VOLL, 3=VOLL_SPORT, 1=VOLL_UND_FAILSAFE_PARAMETER. |

### `gear.statusGearboxDrive` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Message CRC/check value; Status Gearbox Drive | `cRCStatusGearboxDrive` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |
| Message alive/rolling counter; Aliv Status Gearbox Drive | `alivStatusGearboxDrive` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |
| C HL Status Gearbox Drive | `cHLStatusGearboxDrive` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |
| Status Actual Stage Drive | `statusActualStageDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infrastructuretypes.InfrastructureTypes.StatusStageDrive` | No retained reading; not the same as engine.statusGearIndicator. Defined enum: 4=D, 5=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 6=FUNKTION_MELDET_FEHLER, 0=INITIALISIERUNG, 3=N, 1=P, 2=R, 7=SIGNAL_UNBEFUELLT. |
| Status Actual Gear Drive | `statusActualGearDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infrastructuretypes.InfrastructureTypes.StatusActualGearDrive` | No retained reading; not the same as engine.statusGearIndicator. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 3=G1, 12=G10, 4=G2, 5=G3, 6=G4, 7=G5, 8=G6, 9=G7, 10=G8, 11=G9, 0=INITIALISIERUNG, 2=N_OR_P, 1=R, 15=SIGNAL_UNBEFUELLT. |
| Unnamed/reserved field dummy1; physical meaning not established | `dummy1` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |
| Status Target Stage Drive | `statusTargetStageDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infrastructuretypes.InfrastructureTypes.StatusStageDrive` | No retained reading; not the same as engine.statusGearIndicator. Defined enum: 4=D, 5=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 6=FUNKTION_MELDET_FEHLER, 0=INITIALISIERUNG, 3=N, 1=P, 2=R, 7=SIGNAL_UNBEFUELLT. |
| Unnamed/reserved field dummy2; physical meaning not established | `dummy2` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | No retained reading; not the same as engine.statusGearIndicator. |
| Signal/state qualifier: Status Actual Stage Drive | `qualifierStatusActualStageDrive` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |
| Unnamed/reserved field dummy3; physical meaning not established | `dummy3` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | No retained reading; not the same as engine.statusGearIndicator. |

### `mdrive.controlDisplayMSystemsMDrive` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Control Display M Systems Disclaimer M Drive | `controlDisplayMSystemsDisclaimerMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDisclaimerMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 0=KEINE_MKONFIGURATION_AKTIV, 1=M1_AKTIV, 2=M2_AKTIV, 3=SIGNAL_UNBEFUELLT. |
| Control Display M Systems Modustafel M Drive | `controlDisplayMSystemsModustafelMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsModustafelMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=FAHRMODUSTAFEL1, 2=FAHRMODUSTAFEL2, 4=FAHRMODUSTAFEL3, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_TAFEL_ANZEIGEN, 15=SIGNAL_UNBEFUELLT. |
| Control Display M Systems ENGM Drive | `controlDisplayMSystemsENGMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 9=COMFORT_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS, 12=SPORTPLUS_NICHT_BEDIENBAR, 10=SPORT_NICHT_BEDIENBAR, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems EPSM Drive | `controlDisplayMSystemsEPSMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 9=COMFORT_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS, 12=SPORTPLUS_NICHT_BEDIENBAR, 10=SPORT_NICHT_BEDIENBAR, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems VDCM Drive | `controlDisplayMSystemsVDCMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 9=COMFORT_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS, 12=SPORTPLUS_NICHT_BEDIENBAR, 10=SPORT_NICHT_BEDIENBAR, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems ADRM Drive | `controlDisplayMSystemsADRMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsADRMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 2=ADR_OFF, 1=ADR_ON, 0=KEIN_ADR, 3=SIGNAL_UNBEFUELLT. |
| Control Display M Systems TRCLM Drive | `controlDisplayMSystemsTRCLMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsTRCLMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 63=SIGNAL_UNBEFUELLT, 33=TRAKTIONLEVEL0, 1=TRAKTIONLEVEL0_NICHT_BEDIENBAR, 34=TRAKTIONLEVEL1, 43=TRAKTIONLEVEL10, 11=TRAKTIONLEVEL10_NICHT_BEDIENBAR, 2=TRAKTIONLEVEL1_NICHT_BEDIENBAR, 35=TRAKTIONLEVEL2, 3=TRAKTIONLEVEL2_NICHT_BEDIENBAR, 36=TRAKTIONLEVEL3, 4=TRAKTIONLEVEL3_NICHT_BEDIENBAR, 37=TRAKTIONLEVEL4, 5=TRAKTIONLEVEL4_NICHT_BEDIENBAR, 38=TRAKTIONLEVEL5, 6=TRAKTIONLEVEL5_NICHT_BEDIENBAR, 39=TRAKTIONLEVEL6, 7=TRAKTIONLEVEL6_NICHT_BEDIENBAR, 40=TRAKTIONLEVEL7, 8=TRAKTIONLEVEL7_NICHT_BEDIENBAR, 41=TRAKTIONLEVEL8, 9=TRAKTIONLEVEL8_NICHT_BEDIENBAR, 42=TRAKTIONLEVEL9, 10=TRAKTIONLEVEL9_NICHT_BEDIENBAR, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems BBLM Drive | `controlDisplayMSystemsBBLMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBBLMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 33=BREMSBALANCELEVEL0, 1=BREMSBALANCELEVEL0_NICHT_BEDIENBAR, 34=BREMSBALANCELEVEL1, 43=BREMSBALANCELEVEL10, 11=BREMSBALANCELEVEL10_NICHT_BEDIENBAR, 2=BREMSBALANCELEVEL1_NICHT_BEDIENBAR, 35=BREMSBALANCELEVEL2, 3=BREMSBALANCELEVEL2_NICHT_BEDIENBAR, 36=BREMSBALANCELEVEL3, 4=BREMSBALANCELEVEL3_NICHT_BEDIENBAR, 37=BREMSBALANCELEVEL4, 5=BREMSBALANCELEVEL4_NICHT_BEDIENBAR, 38=BREMSBALANCELEVEL5, 6=BREMSBALANCELEVEL5_NICHT_BEDIENBAR, 39=BREMSBALANCELEVEL6, 7=BREMSBALANCELEVEL6_NICHT_BEDIENBAR, 40=BREMSBALANCELEVEL7, 8=BREMSBALANCELEVEL7_NICHT_BEDIENBAR, 41=BREMSBALANCELEVEL8, 9=BREMSBALANCELEVEL8_NICHT_BEDIENBAR, 42=BREMSBALANCELEVEL9, 10=BREMSBALANCELEVEL9_NICHT_BEDIENBAR, 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 63=SIGNAL_UNBEFUELLT, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems AWM Drive | `controlDisplayMSystemsAWMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsAWMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 3=AWDSAND, 11=AWDSAND_NICHT_BEDIENBAR, 2=AWDSPORT, 10=AWDSPORT_NICHT_BEDIENBAR, 1=AWDSTANDARD, 9=AWDSTANDARD_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 4=RWD, 12=RWD_NICHT_BEDIENBAR, 15=SIGNAL_UNBEFUELLT, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems BRPDM Drive | `controlDisplayMSystemsBRPDMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBRPDMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG, 1=KENNLINIE1, 9=KENNLINIE1_NICHT_BEDIENBAR, 2=KENNLINIE2, 10=KENNLINIE2_NICHT_BEDIENBAR, 4=KENNLINIE3, 12=KENNLINIE3_NICHT_BEDIENBAR, 15=SIGNAL_UNBEFUELLT, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems RECUM Drive | `controlDisplayMSystemsRECUMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsRECUMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT, 1=STUFE1, 9=STUFE1_NICHT_BEDIENBAR, 2=STUFE2, 10=STUFE2_NICHT_BEDIENBAR, 4=STUFE3, 12=STUFE3_NICHT_BEDIENBAR, 0=VERFUEGBAR_NICHT_BEDIENBAR. |
| Control Display M Systems Fahrmodus M Drive | `controlDisplayMSystemsFahrmodusMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsFahrmodusMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=FAHRMODUS1, 2=FAHRMODUS2, 4=FAHRMODUS3, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEIN_FAHRMODUS, 15=SIGNAL_UNBEFUELLT. |
| Control Display M Systems SOUM Drive | `controlDisplayMSystemsSOUMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsSOUMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 0=AVAILABLE_NOT_INTERACTIVE, 1=CONDITION1, 2=CONDITION2, 4=CONDITION3, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT. |
| Control Display M Systems DLM Drive | `controlDisplayMSystemsDLMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDLMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 0=AVAILABLE_NOT_INTERACTIVE, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 1=PROGRAM1, 9=PROGRAM1_NOT_INTERACTIVE, 2=PROGRAM2, 10=PROGRAM2_NOT_INTERACTIVE, 4=PROGRAM3, 12=PROGRAM3_NOT_INTERACTIVE, 15=SIGNAL_UNBEFUELLT. |
| Control Display M Systems POPUPINFOM Drive | `controlDisplayMSystemsPOPUPINFOMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINFOMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER, 0=KEINE_ANZEIGE, 16=M1_NICHT_AKTIVIERBARMDRIVE, 17=M1_NICHT_AKTIVIERBAR_E1, 18=M1_NICHT_AKTIVIERBAR_E2, 19=M1_NICHT_AKTIVIERBAR_E3, 21=M1_NICHT_AKTIVIERBAR_V1, 22=M1_NICHT_AKTIVIERBAR_V2, 23=M1_NICHT_AKTIVIERBAR_V3, 32=M2_NICHT_AKTIVIERBARMDRIVE, 33=M2_NICHT_AKTIVIERBAR_E1, 34=M2_NICHT_AKTIVIERBAR_E2, 35=M2_NICHT_AKTIVIERBAR_E3, 37=M2_NICHT_AKTIVIERBAR_V1, 38=M2_NICHT_AKTIVIERBAR_V2, 39=M2_NICHT_AKTIVIERBAR_V3, 63=SIGNAL_UNBEFUELLT. |
| Control Display M Systems POPUPINQYM Drive | `controlDisplayMSystemsPOPUPINQYMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINQYMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEIN_POPUP, 2=M1_MIT_DSC_MDM, 4=M1_MIT_DSC_OFF, 1=M1_MIT_DSC_ON, 10=M2_MIT_DSC_MDM, 12=M2_MIT_DSC_OFF, 9=M2_MIT_DSC_ON, 15=SIGNAL_UNBEFUELLT. |
| Control Display M Systems M Symbol M Drive | `controlDisplayMSystemsMSymbolMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsMSymbolMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEIN_SYMBOL, 1=M1_SYMBOL, 2=M2_SYMBOL, 15=SIGNAL_UNBEFUELLT. |

### `mdrive.statusMConfigurationMDrive` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Status M Configuration IDXM Drive | `statusMConfigurationIDXMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationIDXMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 0=KEINE_KONFIGURATION, 1=KONFIGURATION1, 2=KONFIGURATION2, 3=SIGNAL_UNBEFUELLT. |
| Status M Configuration RQAUDM Drive | `statusMConfigurationRQAUDMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRQAUDMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=AKUSTIKMELDUNG_MTASTE, 0=KEINE_TONANFORDERUNG, 3=SIGNAL_UNBEFUELLT. |
| Status M Configuration SOUM Drive | `statusMConfigurationSOUMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationSOUMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 1=KENNLINIE1, 2=KENNLINIE2, 4=KENNLINIE3, 15=SIGNAL_UNBEFUELLT. |
| Status M Configuration MSAM Drive | `statusMConfigurationMSAMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMSAMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 2=MSA_OFF, 1=MSA_ON, 3=SIGNAL_UNBEFUELLT. |
| Status M Configuration ADRM Drive | `statusMConfigurationADRMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationADRMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 2=ADR_OFF, 1=ADR_ON, 3=SIGNAL_UNBEFUELLT. |
| Status M Configuration TRCLM Drive | `statusMConfigurationTRCLMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationTRCLMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER, 63=SIGNAL_UNBEFUELLT, 33=TRAKTIONLEVEL0, 1=TRAKTIONLEVEL0_NICHT_BEDIENBAR, 34=TRAKTIONLEVEL1, 43=TRAKTIONLEVEL10, 11=TRAKTIONLEVEL10_NICHT_BEDIENBAR, 2=TRAKTIONLEVEL1_NICHT_BEDIENBAR, 35=TRAKTIONLEVEL2, 3=TRAKTIONLEVEL2_NICHT_BEDIENBAR, 36=TRAKTIONLEVEL3, 4=TRAKTIONLEVEL3_NICHT_BEDIENBAR, 37=TRAKTIONLEVEL4, 5=TRAKTIONLEVEL4_NICHT_BEDIENBAR, 38=TRAKTIONLEVEL5, 6=TRAKTIONLEVEL5_NICHT_BEDIENBAR, 39=TRAKTIONLEVEL6, 7=TRAKTIONLEVEL6_NICHT_BEDIENBAR, 40=TRAKTIONLEVEL7, 8=TRAKTIONLEVEL7_NICHT_BEDIENBAR, 41=TRAKTIONLEVEL8, 9=TRAKTIONLEVEL8_NICHT_BEDIENBAR, 42=TRAKTIONLEVEL9, 10=TRAKTIONLEVEL9_NICHT_BEDIENBAR. |
| Status M Configuration BBLM Drive | `statusMConfigurationBBLMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationBBLMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 33=BREMSBALANCELEVEL0, 1=BREMSBALANCELEVEL0_NICHT_BEDIENBAR, 34=BREMSBALANCELEVEL1, 43=BREMSBALANCELEVEL10, 11=BREMSBALANCELEVEL10_NICHT_BEDIENBAR, 2=BREMSBALANCELEVEL1_NICHT_BEDIENBAR, 35=BREMSBALANCELEVEL2, 3=BREMSBALANCELEVEL2_NICHT_BEDIENBAR, 36=BREMSBALANCELEVEL3, 4=BREMSBALANCELEVEL3_NICHT_BEDIENBAR, 37=BREMSBALANCELEVEL4, 5=BREMSBALANCELEVEL4_NICHT_BEDIENBAR, 38=BREMSBALANCELEVEL5, 6=BREMSBALANCELEVEL5_NICHT_BEDIENBAR, 39=BREMSBALANCELEVEL6, 7=BREMSBALANCELEVEL6_NICHT_BEDIENBAR, 40=BREMSBALANCELEVEL7, 8=BREMSBALANCELEVEL7_NICHT_BEDIENBAR, 41=BREMSBALANCELEVEL8, 9=BREMSBALANCELEVEL8_NICHT_BEDIENBAR, 42=BREMSBALANCELEVEL9, 10=BREMSBALANCELEVEL9_NICHT_BEDIENBAR, 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER, 63=SIGNAL_UNBEFUELLT. |
| Status M Configuration BRPDM Drive | `statusMConfigurationBRPDMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1BRPDMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 1=KENNLINIE1, 2=KENNLINIE2, 4=KENNLINIE3, 15=SIGNAL_UNBEFUELLT. |
| Status M Configuration DSCM Drive | `statusMConfigurationDSCMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationDSCMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 2=DSC_MDM, 4=DSC_OFF, 1=DSC_ON, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT. |
| Status M Configuration AWM Drive | `statusMConfigurationAWMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationAWMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 3=AWDSAND, 11=AWDSAND_NICHT_BEDIENBAR, 2=AWDSPORT, 10=AWDSPORT_NICHT_BEDIENBAR, 1=AWDSTANDARD, 9=AWDSTANDARD_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 4=RWD, 12=RWD_NICHT_BEDIENBAR, 15=SIGNAL_UNBEFUELLT. |
| Status M Configuration GRBM Drive | `statusMConfigurationGRBMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationGRBMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=D1, 33=D1_NICHT_BEDIENBAR, 2=D2, 34=D2_NICHT_BEDIENBAR, 4=D3, 36=D3_NICHT_BEDIENBAR, 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER, 17=S1, 49=S1_NICHT_BEDIENBAR, 18=S2, 50=S2_NICHT_BEDIENBAR, 20=S3, 52=S3_NICHT_BEDIENBAR, 63=SIGNAL_UNBEFUELLT. |
| Status M Configuration ENGM Drive | `statusMConfigurationENGMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationENGMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 9=COMFORT_NICHT_BEDIENBAR, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS, 12=SPORTPLUS_NICHT_BEDIENBAR, 10=SPORT_NICHT_BEDIENBAR. |
| Status M Configuration EPSM Drive | `statusMConfigurationEPSMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1EPSMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS. |
| Status M Configuration VDCM Drive | `statusMConfigurationVDCMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1EPSMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 1=COMFORT, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS. |
| Status M Configuration EPOWM Drive | `statusMConfigurationEPOWMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationEPOWMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 1=KENNLINIE1, 9=KENNLINIE1_NICHT_BEDIENBAR, 2=KENNLINIE2, 10=KENNLINIE2_NICHT_BEDIENBAR, 4=KENNLINIE3, 12=KENNLINIE3_NICHT_BEDIENBAR, 15=SIGNAL_UNBEFUELLT. |
| Status M Configuration RECUM Drive | `statusMConfigurationRECUMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRECUMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 15=SIGNAL_UNBEFUELLT, 1=STUFE1, 9=STUFE1_NICHT_BEDIENBAR, 2=STUFE2, 10=STUFE2_NICHT_BEDIENBAR, 4=STUFE3, 12=STUFE3_NICHT_BEDIENBAR. |
| Status M Configuration ELCM Drive | `statusMConfigurationELCMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationELCMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 2=ELEKTRISCHERANTRIEB_OFF, 1=ELEKTRISCHERANTRIEB_ON, 3=SIGNAL_UNBEFUELLT. |
| Status M Configuration MHYBRIDM Drive | `statusMConfigurationMHYBRIDMDrive` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMHYBRIDMDrive` | Getter timed out after 1200 ms; schema does not turn that failure into a value. Defined enum: 6=BSG6, 14=BSG6_NOT_OPERABLE, 2=ELECTRIC, 10=ELECTRIC_NOT_OPERABLE, 4=ENDURANCE, 12=ENDURANCE_NOT_OPERABLE, 61=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 62=FUNKTION_MELDET_FEHLER, 5=HOTLAP, 13=HOTLAP_NOT_OPERABLE, 1=HYBRID, 9=HYBRID_NOT_OPERABLE, 3=PRECON, 11=PRECON_NOT_OPERABLE, 63=SIGNAL_UNBEFUELLT. |

### `split.basicDataSet` — definition only

| Data | Exact field | Units | Where defined | Availability / interpretation |
| --- | --- | --- | --- | --- |
| Lateral Acceleration Centre Of Gravity | `lateralAccelerationCentreOfGravity` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Lateral Acceleration Centre Of Gravity | `qualifierLateralAccelerationCentreOfGravity` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierLateralAccelerationCentreOfGravity` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 4=RESERVED, 7=RESERVED_1, 3=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 1=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT, 9=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUELTIG. |
| Longitudinal Acceleration Centre Of Gravity | `longitudinalAccelerationCentreOfGravity` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Longitudinal Acceleration Centre Of Gravity | `qualifierLongitudinalAccelerationCentreOfGravity` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierLongitudinalAccelerationSchwerpunkt2` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 1=RESERVED, 4=RESERVED_1, 7=RESERVED_2, 9=RESERVED_3, 3=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUELTIG. |
| Vertical Acceleration Center Of Gravity | `verticalAccelerationCenterOfGravity` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Vertical Acceleration Center Of Gravity | `qualifierVerticalAccelerationCenterOfGravity` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierVerticalAccelerationCentreOfGravity` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 1=RESERVED, 4=RESERVED_1, 9=RESERVED_2, 7=SENSOR_NICHT_VORHANDEN, 11=SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER, 2=SIGNALWERT_IST_GUELTIG, 10=SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 3=SIGNALWERT_IST_NICHT_VERTRAUENSWUERDIG, 6=SIGNALWERT_IST_UNGUELTIG, 14=SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER, 15=SIGNAL_UNGUETLIG. |
| Ground Uneveness Right Backend | `groundUnevenessRightBackend` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Operation Horn Button | `operationHornButton` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationPushButtonHorn` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 1=HORN_MINUS_TASTER_GEDRUECKT, 0=KEINE_AKTION, 3=SIGNAL_UNGUELTIG. |
| Rpm Em E Tract Sys1 Actual Value | `rpmEmETractSys1ActualValue` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Torquerpm Em E Tract Sys1 Actual Value | `torquerpmEmETractSys1ActualValue` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Rpm Em E Tract Sys1 Actual Value | `qualifierRpmEmETractSys1ActualValue` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 15=SIGNAL_UNBEFUELLT, 2=WERT_GUELTIG_EINFACHE_QUALITAET, 3=WERT_GUELTIG_EINGESCHRAENKT, 4=WERT_GUELTIG_ERSATZWERT, 1=WERT_GUELTIG_HOECHSTE_QUALITAET, 9=WERT_GUELTIG_MITTLERE_QUALITAET, 14=WERT_NICHT_VERFUEGBAR, 6=WERT_NICHT_VERFUEGBAR_FEHLER. |
| Rpm Em E Tract Sys2 Actual Value | `rpmEmETractSys2ActualValue` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Torque Em E Tract Sys2 Actual Value | `torqueEmETractSys2ActualValue` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Rpm Em E Tract Sys2 Actual Value | `qualifierRpmEmETractSys2ActualValue` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 15=SIGNAL_UNBEFUELLT, 2=WERT_GUELTIG_EINFACHE_QUALITAET, 3=WERT_GUELTIG_EINGESCHRAENKT, 4=WERT_GUELTIG_ERSATZWERT, 1=WERT_GUELTIG_HOECHSTE_QUALITAET, 9=WERT_GUELTIG_MITTLERE_QUALITAET, 14=WERT_NICHT_VERFUEGBAR, 6=WERT_NICHT_VERFUEGBAR_FEHLER. |
| Mue Estimated Tyres Street | `mueEstimatedTyresStreet` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Mue Estimated Tyres Street Error Amplitude | `mueEstimatedTyresStreetErrorAmplitude` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Air Pressure Motor | `valueAirPressureMotor` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Transmission Oil | `valueTemperatureTransmissionOil` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Dc Dc Converter | `valueTemperatureDcDcConverter` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Operation Gear Selector Switch | `operationGearSelectorSwitch` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationGearSelectionSwitch` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 3=D, 14=INIT, 8=L, 7=M, 4=M_MINUS, 5=M_PLUS, 6=M_S, 2=N, 0=NA, 1=R, 15=SIGNAL_UNGUELTIG. |
| Signal/state qualifier: Value Distribution Longitudinal Torque Rear Axis Front Axis | `qualifierValueDistributionLongitudinalTorqueRearAxisFrontAxis` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRepartitionLongitudinalTorqueFrontAxleBackAxle` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 12=ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER, 8=INITIALISIERUNG, 2=SIGNALWERT_IST_GUELTIG, 10=SIGNALWERT_IST_GUELTIG__REKALIBRIERUNGSBEDARF, 6=SIGNALWERT_IST_UNGUELTIG, 15=SIGNAL_UNGUELTIG. |
| Value Distribution Longitudinal Torque Rear Axis Front Axis | `valueDistributionLongitudinalTorqueRearAxisFrontAxis` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. UInt16 default 65535; no split scale or front/rear convention established; not a power percentage. |
| Filling Level Scr Active Tank | `fillingLevelScrActiveTank` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Autonomous Driving | `statusAutonomousDriving` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Scr Catalytic Converter | `valueTemperatureScrCatalyticConverter` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Temperature Fuel | `valueTemperatureFuel` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Engine Speed | `statusEngineSpeed` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Signal/state qualifier: Status Engine Speed | `qualifierStatusEngineSpeed` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRPMMotorCrankshaft` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 6=FEHLER, 8=INITIALISIERUNG, 14=RESERVIERT, 2=SIGNALWERT_IST_GUELTIG_NOCKENWELLENNOTLAUF, 1=SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT, 15=SIGNAL_UNBEFUELLT. |
| Status Voltage Intelligent Boardnet Sensor | `statusVoltageIntelligentBoardnetSensor` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Value Fuel Tank Relative Pressure | `valueFuelTankRelativePressure` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt16) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |
| Status Combustion Engine | `statusCombustionEngine` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusCombustionEngineDrive` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 3=MOTOR_IM_AUSLAUF, 2=MOTOR_LAEUFT, 1=MOTOR_STARTET, 0=MOTOR_STEHT, 14=RESERVIERT, 15=SIGNAL_UNBEFUELLT. |
| Status Announcement MSA Engine | `statusAnnouncementMSAEngine` | enum | `E /payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusAnnouncementMSAEngineStop` | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. Defined enum: 1=ANKUENDIGUNG_MSA_MINUS_MOTORSTOPP, 0=KEIN_ANKUENDIGUNG, 3=SIGNAL_UNGUELTIG. |
| Data Fog Up Window Front | `dataFogUpWindowFront` | raw; engineering unit/scale not defined | `E /payload/catalog/services` (UInt8) | Provider remained CONNECTING with null value in O; no captured BasicDataSet sample. |

### Native write/request data — not measured vehicle feedback

Schema-only request fields are included as available data definitions, not evidence that requests succeeded or that a vehicle changed state.

#### `mSystem`

| Request data | Exact field | Units | Where defined | Defined states |
| --- | --- | --- | --- | --- |
| Control All Wheel Setup | `controlAllWheelSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlAllWheelSetup` | 3=KEINE_AENDERUNG, 7=SIGNAL_UNBEFUELLT, 2=_2WD, 1=_4WD_ALTERNATIV, 4=_4WD_DSC_ON, 5=_4WD_SPORT_MDM, 0=_4WD_STANDARD |
| Control EPS Setup | `controlEPSSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlEPSSetup` | 0=KEINE_AENDERUNG, 1=KOMFORT, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 3=SPORT_PLUS |
| Control VDC Setup | `controlVDCSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlVDCSetup` | 0=KEINE_AENDERUNG, 1=KOMFORT, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 3=SPORT_PLUS |
| Control Engine Setup | `controlEngineSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlEngineSetup` | 0=KEINE_AENDERUNG, 1=KOMFORT, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 3=SPORT_PLUS |
| Control ASR Setup | `controlASRSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlASRSetup` | 2=AN, 1=AUS, 0=KEINE_AENDERUNG, 3=SIGNAL_UNBEFUELLT |
| Control Driving Mode Inquiry | `controlDrivingModeInquiry` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDrivingModeInquiry` | 2=BESTAETIGT, 0=KEINE_AENDERUNG, 1=NICHT_BESTAETIGT, 3=SIGNAL_UNBEFUELLT |
| Control Brake Pedal Setup | `controlBrakePedalSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlBrakePedalSetup` | 0=KEINE_AENDERUNG, 1=KENNLINIE_1, 2=KENNLINIE_2, 3=KENNLINIE_3, 15=SIGNAL_UNBEFUELLT |
| Control Drift Support Level Setup | `controlDriftSupportLevelSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusDriftLevel` | 1=ASSISTENZ_LEVEL_0, 2=ASSISTENZ_LEVEL_1, 11=ASSISTENZ_LEVEL_10, 3=ASSISTENZ_LEVEL_2, 4=ASSISTENZ_LEVEL_3, 5=ASSISTENZ_LEVEL_4, 6=ASSISTENZ_LEVEL_5, 7=ASSISTENZ_LEVEL_6, 8=ASSISTENZ_LEVEL_7, 9=ASSISTENZ_LEVEL_8, 10=ASSISTENZ_LEVEL_9, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=NICHT_GENUTZT, 15=SIGNAL_UNBEFUELLT |
| Control Drift M Control Plus Traction Level Setup | `controlDriftMControlPlusTractionLevelSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusTractionLevel` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=NICHT_GENUTZT, 15=SIGNAL_UNBEFUELLT, 1=TRAKTION_LEVEL_0, 2=TRAKTION_LEVEL_1, 11=TRAKTION_LEVEL_10, 3=TRAKTION_LEVEL_2, 4=TRAKTION_LEVEL_3, 5=TRAKTION_LEVEL_4, 6=TRAKTION_LEVEL_5, 7=TRAKTION_LEVEL_6, 8=TRAKTION_LEVEL_7, 9=TRAKTION_LEVEL_8, 10=TRAKTION_LEVEL_9 |
| Control Drift M Control Plus Brake Balance Level Setup | `controlDriftMControlPlusBrakeBalanceLevelSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.StatusBalanceLevel` | 1=BREMSBALANCE_LEVEL_0, 2=BREMSBALANCE_LEVEL_1, 11=BREMSBALANCE_LEVEL_10, 3=BREMSBALANCE_LEVEL_2, 4=BREMSBALANCE_LEVEL_3, 5=BREMSBALANCE_LEVEL_4, 6=BREMSBALANCE_LEVEL_5, 7=BREMSBALANCE_LEVEL_6, 8=BREMSBALANCE_LEVEL_7, 9=BREMSBALANCE_LEVEL_8, 10=BREMSBALANCE_LEVEL_9, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=NICHT_GENUTZT, 15=SIGNAL_UNBEFUELLT |
| Control Drift Setup | `controlDriftSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDriftSetup` | 0=KEINE_AENDERUNG, 2=M_DRIFT_BESTAETIGT, 1=M_DRIFT_NICHT_BESTAETIGT, 3=SIGNAL_UNBEFUELLT |
| Control Drift Reset | `controlDriftReset` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDriftReset` | 0=KEINE_BEDIENUNG, 1=RESET_LAST_BEST_DRIFT, 3=SIGNAL_UNBEFUELLT |
| Control Drift Recording | `controlDriftRecording` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlDriftRecording` | 0=KEINE_BEDIENUNG, 3=SIGNAL_UNBEFUELLT, 1=START_RECORDING, 2=STOPP_RECORDING |
| Control M Mode Setup | `controlMModeSetup` | enum/request state | `E /payload/catalog/writeTypes/mSystem`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.ControlMModeSetup` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 1=MMODE1, 2=MMODE2, 4=MMODE3, 0=NO_CHANGE, 15=SIGNAL_UNBEFUELLT |

#### `operationMSystemsMDrive`

| Request data | Exact field | Units | Where defined | Defined states |
| --- | --- | --- | --- | --- |
| Operation M Systems Drift Aufzeichnung M Drive | `operationMSystemsDriftAufzeichnungMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftAufzeichnungMDrive` | 1=AUFZEICHNUNG_STARTEN, 2=AUFZEICHNUNG_STOPPEN, 0=KEINE_BEDIENUNG, 3=SIGNAL_UNBEFUELLT |
| Operation M Systems Drift Reset M Drive | `operationMSystemsDriftResetMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftResetMDrive` | 0=KEINE_BEDIENUNG, 1=RESET_LAST_BEST_DRIFT, 3=SIGNAL_UNBEFUELLT |
| Operation M Systems Fahrmodus Drift M Drive | `operationMSystemsFahrmodusDriftMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusDriftMDrive` | 2=DRIFT_AKTIVIERT, 1=DRIFT_DEAKTIVIERT, 0=KEINE_BEDIENUNG, 3=SIGNAL_UNBEFUELLT |
| Operation M Systems Fahrmodus INQYM Drive | `operationMSystemsFahrmodusINQYMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusINQYMDrive` | 2=ABFRAGE_BESTAETIGT, 1=ABFRAGE_NICHT_BESTAETIGT, 0=KEINE_BEDIENUNG, 3=SIGNAL_UNBEFUELLT |
| Operation M Systems TRCLM Drive | `operationMSystemsTRCLMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsTRCLMDrive` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT, 1=TRAKTIONLEVEL0, 2=TRAKTIONLEVEL1, 11=TRAKTIONLEVEL10, 3=TRAKTIONLEVEL2, 4=TRAKTIONLEVEL3, 5=TRAKTIONLEVEL4, 6=TRAKTIONLEVEL5, 7=TRAKTIONLEVEL6, 8=TRAKTIONLEVEL7, 9=TRAKTIONLEVEL8, 10=TRAKTIONLEVEL9 |
| Operation M Systems BBLM Drive | `operationMSystemsBBLMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsBBLMDrive` | 1=BREMSBALANCELEVEL0, 2=BREMSBALANCELEVEL1, 11=BREMSBALANCELEVEL10, 3=BREMSBALANCELEVEL2, 4=BREMSBALANCELEVEL3, 5=BREMSBALANCELEVEL4, 6=BREMSBALANCELEVEL5, 7=BREMSBALANCELEVEL6, 8=BREMSBALANCELEVEL7, 9=BREMSBALANCELEVEL8, 10=BREMSBALANCELEVEL9, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT |
| Operation M Systems AWM Drive | `operationMSystemsAWMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsAWMDrive` | 2=AWDALTERNATIV, 8=AWDSAND, 1=AWDSTANDARD, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 4=RWD, 15=SIGNAL_UNBEFUELLT |
| Operation M Systems BRPDM Drive | `operationMSystemsBRPDMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationBRPDMDrive` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 1=KENNLINIE1, 2=KENNLINIE2, 4=KENNLINIE3, 15=SIGNAL_UNBEFUELLT |
| Operation M Systems ENGM Drive | `operationMSystemsENGMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive` | 1=COMFORT, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS |
| Operation M Systems VDCM Drive | `operationMSystemsVDCMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive` | 1=COMFORT, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS |
| Operation M Systems EPSM Drive | `operationMSystemsEPSMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive` | 1=COMFORT, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT, 2=SPORT, 4=SPORTPLUS |
| Operation M Systems ADRM Drive | `operationMSystemsADRMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsADRMDrive` | 2=ADR_OFF, 1=ADR_ON, 0=KEINE_AENDERUNG, 3=SIGNAL_UNBEFUELLT |
| Operation M Systems RECUM Drive | `operationMSystemsRECUMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsRECUMDrive` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEINE_AENDERUNG, 15=SIGNAL_UNBEFUELLT, 1=STUFE1, 2=STUFE2, 4=STUFE3 |
| Operation M Systems Fahrmodus M Drive | `operationMSystemsFahrmodusMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusMDrive` | 1=FAHRMODUS1, 2=FAHRMODUS2, 4=FAHRMODUS3, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=KEIN_FAHRMODUS, 15=SIGNAL_UNBEFUELLT |
| Operation M Systems DLM Drive | `operationMSystemsDLMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDLMDrive` | 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=NO_CHANGE, 1=PROGRAM1, 2=PROGRAM2, 4=PROGRAM3, 15=SIGNAL_UNBEFUELLT |
| Operation M Systems SOUM Drive | `operationMSystemsSOUMDrive` | enum/request state | `E /payload/catalog/writeTypes/operationMSystemsMDrive`; `/payload/catalog/datatypes/de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsSOUMDrive` | 1=CONDITION1, 2=CONDITION2, 4=CONDITION3, 13=FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR, 14=FUNKTION_MELDET_FEHLER, 0=NO_CHANGE, 15=SIGNAL_UNBEFUELLT |

### Exterior lightswitch operation — installed descriptor only

Source: `L2/installed-exterior-descriptor.json`, service 20492, instance 1, version 1.0. These are descriptor definitions, not received lamp-status values or physical confirmation.

| Data | Exact descriptor field | Units | Where defined | States / availability |
| --- | --- | --- | --- | --- |
| Foglight Front | `foglightFront` | Boolean | `L2/installed-exterior-descriptor.json /fields/foglightFront/schema` | Definition only. No received value in these captures. |
| Foglight Rear | `foglightRear` | Boolean | `L2/installed-exterior-descriptor.json /fields/foglightRear/schema` | Definition only. No received value in these captures. |
| Lightswitch Button Availability — push Button Driving Light | `lightswitchButtonAvailability/pushButtonDrivingLight` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/0` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button AUTO | `lightswitchButtonAvailability/pushButtonAUTO` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/1` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Position Light | `lightswitchButtonAvailability/pushButtonPositionLight` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/2` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Parklight Left | `lightswitchButtonAvailability/pushButtonParklightLeft` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/3` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Parklight Right | `lightswitchButtonAvailability/pushButtonParklightRight` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/4` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Off | `lightswitchButtonAvailability/pushButtonOff` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/5` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Foglight Front | `lightswitchButtonAvailability/pushButtonFoglightFront` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/6` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — push Button Foglight Rear | `lightswitchButtonAvailability/pushButtonFoglightRear` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/7` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Lightswitch Button Availability — headlamp Range Adjustment | `lightswitchButtonAvailability/headlampRangeAdjustment` | enum | `L2/installed-exterior-descriptor.json /fields/lightswitchButtonAvailability/schema/e/8` | Definition only. 0=NOT_AVAILABLE, 1=NOT_OPERABLE, 2=OPERABLE |
| Main Lightswitch State | `mainLightswitchState` | enum | `L2/installed-exterior-descriptor.json /fields/mainLightswitchState/schema` | Definition only. 1=AUTO, 0=DRIVINGLIGHT, 5=LIGHT_OFF, 3=PARKINGLIGHT_LEFT, 4=PARKINGLIGHT_RIGHT, 2=POSITIONLIGHT |
| Show Lightswitch Operation Feedback — operated Lightswitch Button | `showLightswitchOperationFeedback/operatedLightswitchButton` | enum | `L2/installed-exterior-descriptor.json /events/showLightswitchOperationFeedback/schema/e/0` | Definition only. 1=AUTO, 0=DRIVINGLIGHT, 6=FOGLIGHT_FRONT, 7=FOGLIGHT_REAR, 5=LIGHT_OFF, 3=PARKINGLIGHT_LEFT, 4=PARKINGLIGHT_RIGHT, 2=POSITIONLIGHT |
| Show Lightswitch Operation Feedback — successful | `showLightswitchOperationFeedback/successful` | Boolean | `L2/installed-exterior-descriptor.json /events/showLightswitchOperationFeedback/schema/e/1` | Definition only. No received value in these captures. |
| Show Lightswitch Operation Feedback — additonal Lightswitch Information | `showLightswitchOperationFeedback/additonalLightswitchInformation` | enum | `L2/installed-exterior-descriptor.json /events/showLightswitchOperationFeedback/schema/e/2` | Definition only. 2=ABOVE_SPEED_THRESHOLD, 1=BELOW_SPEED_THRESHOLD, 5=FOG_LIGHT_FRONT_OFF, 6=LONG_PRESS_FOR_OFF, 3=NOT_DURING_DRIVING, 0=NO_ADDITIONAL_INFORMATION, 4=VEHICLE_STATE_CHANGE_TO_DRIVING |
| Show Lightswitch Operation Feedback — lightswitch Speed Threshold | `showLightswitchOperationFeedback/lightswitchSpeedThreshold` | raw UInt16 | `L2/installed-exterior-descriptor.json /events/showLightswitchOperationFeedback/schema/e/3` | Definition only. No received value in these captures. UInt16; speed unit/scale not declared. |

| Operation data | Where defined | Interpretation |
| --- | --- | --- |
| `pushButtonAuto` (method ID 7) | `L2/installed-exterior-descriptor.json /methods/pushButtonAuto` | Fire-and-forget button request definition; no measurement or success response. |
| `pushButtonDrivingLight` (method ID 6) | `L2/installed-exterior-descriptor.json /methods/pushButtonDrivingLight` | Fire-and-forget button request definition; no measurement or success response. |
| `pushButtonLightOff` (method ID 11) | `L2/installed-exterior-descriptor.json /methods/pushButtonLightOff` | Fire-and-forget button request definition; no measurement or success response. |
| `pushButtonParkinglightLeft` (method ID 9) | `L2/installed-exterior-descriptor.json /methods/pushButtonParkinglightLeft` | Fire-and-forget button request definition; no measurement or success response. |
| `pushButtonParkinglightRight` (method ID 10) | `L2/installed-exterior-descriptor.json /methods/pushButtonParkinglightRight` | Fire-and-forget button request definition; no measurement or success response. |
| `pushButtonPositionLight` (method ID 8) | `L2/installed-exterior-descriptor.json /methods/pushButtonPositionLight` | Fire-and-forget button request definition; no measurement or success response. |

## Diagnostic identity and fault-memory data

The xDrive export contains 45 diagnostic stage records for nine operations. Result envelopes remain `REQUEST_PENDING`; decoded reply structure alone does not validate origin, ownership or vehicle state.

| Data | Units / encoding | Where found | Interpretation |
| --- | --- | --- | --- |
| ECU family/identification index | 3 raw bytes / hex | `E /payload/diagnostics` entries with `sid:34`, `did:61776` (22 F150), and `evidence.payload`; `O /diagnostics/identities/<decimal ECU>/index` | Export targets: 0F, 29, 39, 19. O also retains 04, 12, 13, 19, 25, 29, 2B family matches. Not exact software compatibility. |
| ECU diagnostic family matched | Boolean | `O /diagnostics/identities/<decimal ECU>/matched` | Family gate only; not vehicle-wide sensor validation. |
| Identity provider generation | generation/index | `O /diagnostics/identities/<decimal ECU>/epoch` | Match belongs to the recorded provider epoch. |
| DTC status availability mask | 8-bit mask | `E /payload/diagnostics` result entries for `sid:25` (19 02 FF), `evidence.dtcStatusAvailabilityMask` | Advertised DTC-status bits, not a health percentage. |
| Fault/DTC identifier | 3 raw bytes | Same entries: `evidence.dtcs/<index>/codeBytes` | No retained descriptions/engineering units; do not invent fault meanings. |
| Fault/DTC status | 8-bit status mask | Same entries: `evidence.dtcs/<index>/status` | Keep per-code status bits and ECU association. |
| Front-axle actual/requested torque and raw qualifiers | Nm / raw qualifiers | `E /payload/diagnostics` LMV `target:25`, `sid:34`, `did:56114` (22 DB32), `evidence.payload` | 8-byte reply-shaped payload FF F6 00 0C 00 00 00 1B: actual −2.5 Nm, target 0 Nm, qualifiers 12/27. Transport still pending; not a verified physical torque reading. |

| ECU target in export | Retained F150 payload | Retained DTC entries | Where |
| --- | --- | --- | --- |
| `0x0F` | 0F2550 | 12 | `E /payload/diagnostics` filter `evidence.target:15` |
| `0x29` | 0F2500 | 102 | `E /payload/diagnostics` filter `evidence.target:41` |
| `0x39` | 0F2520 | 215 | `E /payload/diagnostics` filter `evidence.target:57` |
| `0x19` | 0F2180 | 145 | `E /payload/diagnostics` filter `evidence.target:25` |

## Capture quality, timing and provider data

| Data | Units / encoding | Where found | Meaning / limits |
| --- | --- | --- | --- |
| Sample capture time | Unix milliseconds | General snapshots `/readings/<family>/at`; X baselines `/readings/<family>/at`; L baselines `/readings/<family>/at`; journals `/at`; O `/latest/<probe>/at` | Time of retained observation, not current vehicle time. |
| Monotonic capture time | ms | X readings `/monoMs`; O latest and events `/monoMs` | Within-session elapsed clock; do not compare as wall time across sessions. |
| Sample count | count | G2/G3 `lab-vehicle-snapshot.json /readings/<family>/samples`; X baseline same path | Repeated observations, not channel count. |
| Sample origin | enum/text | X baseline `/readings/<family>/source`; journal `/raw/reading/source` | Getter / notification / event; preserve source distinction. |
| Getter sample count | count | X baseline `/readings/<family>/getterSamples` | Polling/read contribution. |
| Notification sample count | count | X baseline `/readings/<family>/notificationSamples` | Subscription contribution. |
| Event sample count | count | X baseline `/readings/<family>/eventSamples` | Event contribution. |
| First retained sample time | Unix ms | X baseline `/readings/<family>/firstAt` | First sample associated with recorded field state. |
| Minimum sample gap | ms | X baseline `/readings/<family>/minGapMs` | Observed interval; not a promised update rate. |
| Maximum sample gap | ms | X baseline `/readings/<family>/maxGapMs` | Observed interval/freshness context. |
| Last sample gap | ms | X baseline `/readings/<family>/lastGapMs` | Latest recorded interval. |
| Sample/provider epoch | generation token | X baseline `/readings/<family>/epoch`; snapshots `/providerEpochs`; O `/providers/<interface>/epoch` | Prevents mixing old-provider and new-provider observations. |
| Provider availability | Boolean / null + detail | Snapshots `/services/<service>`; provider events; O `/providers/<interface>` | Offered/connecting/unavailable is not individual field support. |
| Read/getter/subscription errors | error text | G snapshots `/readErrors`; X `/readErrors`, `/getterErrors`, `/subscriptionErrors`; L `/readErrors` | Missing/error data must remain unavailable. |
| Snapshot refresh error | error text/null | X/L baseline `/refreshError` | Failure of refresh does not produce replacement measurements. |
| Preview and app visibility | Boolean | X/L snapshots `/preview`, `/visible`; journal visibility events; O `/preview` | Runtime context, not evidence of physical state. |
| Diagnostic transport outcome | enum/text | O `/latest/<probe>/transportVerdict`; E `/payload/diagnostics` result envelopes | REQUEST_PENDING is not a successful attributable read. |
| Diagnostic request/target/DID/provider correlation | IDs/raw integers/flags | O latest `/requestId`, `/target`, `/did`, `/epoch`, `/correlation` | Correlation evidence; no end-to-end ownership token. |
| Diagnostic raw response and payload | bytes / hex | O latest `/response`, `/payload`, `/uds`; E diagnostic `evidence` | Keep raw/negative/pending data independently from decoded fields. |
| Diagnostic UDS response state/NRC | enum / byte | O latest `/uds` | NRC31 means request out of range; no fabricated numeric result. |
| Diagnostic elapsed time | ms | O latest `/elapsedMs`; diagnostic journal entries | Call duration, not sensor sampling period. |
| Decoded field status | enum/text | O `/latest/<probe>/decoded/state` and `/decoded/fields/<index>/state` | Artifact-decoded / reported-state / raw-only / unknown-enum; not physical confirmation. |
| Decoded field raw value / hex | integer or bytes | O `/latest/<probe>/decoded/fields/<index>/raw`, `/rawHex` | Original representation remains usable when physical interpretation is unresolved. |
| Decoded field physical value / label / original unit / source note | number/text/null | Same field objects: `/value`, `/enumLabel`, `/unit`, `/note`, `/sourceInfo` | Null means unavailable/unresolved, not zero. |
| Diagnostic enable/quarantine/in-flight/busy state | Boolean | O `/diagnostics/enabled`, `/quarantine`, `/inflight`, `/busy` | Lab diagnostic-session state, not vehicle health. |
| Evidence level and attribution limit | text | O `/evidenceLevel`, `/attributionLimit` | Offline definition provenance and traffic-origin limitation. |
| Retained/evicted history | count | O `/retention`; E `/recorder` and session recorder files | O retains 256 events after 136848 evictions; retained history is not a full-session trace. |

| Recorder data | Units | Where found | Meaning |
| --- | --- | --- | --- |
| Accepted | count | `X1–X4/xdrive-lab-recorder.json /counts/accepted` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Written | count | `X1–X4/xdrive-lab-recorder.json /counts/written` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Written Bytes | bytes | `X1–X4/xdrive-lab-recorder.json /counts/writtenBytes` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Dropped | count | `X1–X4/xdrive-lab-recorder.json /counts/dropped` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Dropped Bytes | bytes | `X1–X4/xdrive-lab-recorder.json /counts/droppedBytes` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Error Count | count | `X1–X4/xdrive-lab-recorder.json /counts/errorCount` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Rotations | count | `X1–X4/xdrive-lab-recorder.json /counts/rotations` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Evicted Records | count | `X1–X4/xdrive-lab-recorder.json /counts/evictedRecords` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Evicted Bytes | bytes | `X1–X4/xdrive-lab-recorder.json /counts/evictedBytes` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Uncertain Records | count | `X1–X4/xdrive-lab-recorder.json /counts/uncertainRecords` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Interrupted Sessions | count | `X1–X4/xdrive-lab-recorder.json /counts/interruptedSessions` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Batches | count | `X1–X4/xdrive-lab-recorder.json /counts/batches` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Last Flush At | Unix ms | `X1–X4/xdrive-lab-recorder.json /counts/lastFlushAt` | Recorded count/time; evictions, drops, errors and uncertain records are separate. |
| Queued records | count | Same files `/queued` | Not yet written at snapshot time. |
| Queued bytes | bytes | Same files `/queuedBytes` | Not yet written at snapshot time. |
| File retained size | bytes | Same files `/files/<filename>/bytes` | Per rotated journal file. |
| File retained record count | count | Same files `/files/<filename>/records` | Per rotated journal file. |
| Clean shutdown | Boolean | Same files `/cleanShutdown` | A false value is not proof every sample is corrupt. |
| Recorder errors | keyed count/text | Same files `/errors` | Persisted recorder failures. |
| Export journal completeness/hash | Boolean, bytes, record count, SHA-256 | E `/journals/<index>/{complete,bytes,recordCount,sha256}` | Four embedded rawJsonl copies; does not recover evicted older history. |

## Lighting presets, requests and observations

| Data | Units / encoding | Where found | Interpretation |
| --- | --- | --- | --- |
| Saved ambient hue | raw hue value | G1–G3 `lab-presets.json /<A/B/C>/values/statusHueInteriorLighting`; `lab-original-lighting.json /legacy/values/statusHueInteriorLighting` | Saved configuration/readback, not a calibrated colour temperature. |
| Saved ambient menu/colour selection | raw code / enum | Same objects `/statusMenuAmbientePanoramicRoofInteriorLighting` | Preset target or original captured selection. |
| Saved individual layer-1 hue | raw code | Same objects `/statusHueValueLayer1IndividualGroup` | No degree/percent unit established. |
| Preset backend and capture time | text; Unix ms | G1–G3 `lab-presets.json /<A/B/C>/{backend,capturedAt}` | Which API and when the preset was captured. |
| Selected trial control and requested value | control ID; raw/enum | A/AT and L snapshot/trial files `/trial/{controlId,value}` and `/lastTrial/{controlId,value}` | Menu, hue, individualHue and individualLayer1 requests are not measurements. |
| Trial status | enum/text | Same objects `/{trial,lastTrial}/status`; L event journals | Prepared/pending/apply-reported/unresolved/restored are lab states. |
| Before / after / restored readings | same units as captured-channel tables | Same trial objects `/before/readings`, `/after/readings`, `/restoreBefore/readings`, `/restored/readings` | State at each trial phase; do not collapse request and feedback. |
| Original raw value and restore plan | raw fields; structured plan | Same trial objects `/originalRaw`, `/restorePlan` | Captured pre-trial state and intended restore, not proof of restored state. |
| Apply/restore target checks | Boolean; raw requested value | Same trial objects `/applyCheck`, `/restoreCheck`, `/applyVerification`, `/restoreVerification` | Readback match is distinct from physical effect. |
| Reported target matched | Boolean | A `/trial/applyVerification/matched` and `/getters/matched`; L event kind apply-readback `/raw/matched` | A records FARBAUSWAHL_5 matched in getter readback; other hue/layer values stayed distinct. |
| Lightswitch feedback | nullable structured event | Same trial verification objects `/feedback` | A has null feedback; a successful transport return does not manufacture one. |
| Physical result reported by operator | yes/no/unknown; time/stage/note | A `/trial/physical`; L trial objects `/physical` | A contains user-reported yes; independent of getter matching and transport acknowledgment, not sensor proof for every field. |
| Dispatch phase / service / field / raw request | text / raw values | L journals kind transport-returned `/raw/{phase,request}`; trial `/dispatches`, `/applyRequest` | What was requested and what transport returned, not actuator success. |
| Trial errors, annotations and restore attempts | text/list/count | L trial objects `/errors`, `/annotations`, `/restoreAttempts`; snapshots `/storageErrors`, `/notes`, `/notice` | Failure/operator/context data. |
| Trial safety/session state | Unix ms; Boolean | L snapshots `/armedUntil`, `/busy`, `/startedAt`; trial `/providerEpochs` | Lab arming and provider context, not a vehicle safety rating. |

| Request field | Units | Where found | Interpretation |
| --- | --- | --- | --- |
| Control Hue Interior Lighting | raw request value | `A /trial/applyRequest/value/controlHueInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Menu Ambiente Panoramic Roof Interior Lighting | enum/request state | `A /trial/applyRequest/value/controlMenuAmbientePanoramicRoofInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Hue Value Layer1 Individual Group | raw request value | `A /trial/applyRequest/value/controlHueValueLayer1IndividualGroup` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Hue Value Layer2 Individual Group | raw request value | `A /trial/applyRequest/value/controlHueValueLayer2IndividualGroup` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Hue Value Layer3 Individual Group | raw request value | `A /trial/applyRequest/value/controlHueValueLayer3IndividualGroup` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Brightness Value Brightness Offset Ambiente Panoramic Roof Interior Lighting | raw request value | `A /trial/applyRequest/value/controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Mode Ambiente Panoramic Roof Interior Lighting | enum/request state | `A /trial/applyRequest/value/controlModeAmbientePanoramicRoofInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Dynamic Interior Lighting | enum/request state | `A /trial/applyRequest/value/controlDynamicInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |
| Control Dynamic Ambiente Interior Lighting | enum/request state | `A /trial/applyRequest/value/controlDynamicAmbienteInteriorLighting` | Requested ambient-light control value; engineering units not defined, and defaults/no-change fields are not physical effects. |

## UI/input/session and runtime-performance data

| Data | Units | Where found | Meaning |
| --- | --- | --- | --- |
| Front/rear touch position, pressure/contact and system/alive state | raw coordinates / raw status | Captured `touchpad.ZBETouchFrontSide` and `touchpad.ZBETouchRearSide` tables above; G journals kind touch `/raw/value` | No pixels, mm or force calibration supplied; retain interface typos and sentinel-like values. |
| Touch event interpretation | text | G journals kind touch `/text` | Controller side/contact-count interpretation; raw touch fields remain separate. |
| Steering-wheel rotary/push/audio operations | enum | Captured wheel.statusRotaryPress / statusRotarySteps / statusAudioVolumeButton; G journals kind steering wheel | Knurl button/steps/volume-button operations, not wheel steering angle. |
| Native menu focus and action | row index / Boolean / subtype | Captured native focus and native action tables; G journals matching `/kind` | UI interaction, not vehicle telemetry. |
| UI selected layout/preset/refresh | text / identifier / ms | G2/G3 `lab-ui-trials.json /lastLayout`, `/selectedPreset`, `/refreshMs` | Refresh setting is not measured vehicle update frequency. |
| Layout ratings | enum/text | Same files `/ratings/<layout>`; `/sessions/<index>/rating` | User trial ratings, including unrated. |
| UI session layout and last focus | text/identifier | Same files `/sessions/<index>/{layout,lastFocus}` | Layout/focus context. |
| UI session action count | count | Same files `/sessions/<index>/actions` | UI actions during recorded layout session. |
| UI session focus-change count | count | Same files `/sessions/<index>/focusChanges` | UI focus transitions. |
| UI session start/end/elapsed | Unix ms / duration ms | Same files `/sessions/<index>/{startedAt,endedAt,elapsedMs}` | UI trial timing. |
| Lab settings | Boolean / enum / identifier | G1–G3 `settings.json`: section, logging, lightApi, relayManager, mapSport, mapComfort, mapEco, theme, layout, renderer, _themeV | Saved UI/backend/preset mapping; not extra sensor channels. |
| UI/result/service messages | text / status | G journals kinds result, service, visibility, vehicle field; L journals error/unresolved/visibility | Operational events, unavailable-field evidence and trial outcomes. |
| Display frame rate sent | frames/s | G `mgu_lab.log`, X `xdrive_lab.log`, L `lighting_lab.log`: `display: ... fps sent` | Headunit rendering throughput, not vehicle sampling rate. |
| Renderer frame rate | frames/s | X/L logs: `renderer ... fps` | Renderer throughput. |
| Average display frame time | ms/frame | X/L logs: `ms per frame` | Rendering performance. |
| Maximum display frame time | ms/frame | X/L logs: `ms per frame (max ...)` | Reported maximum rendering time. |
| JavaScript main-loop frame time | ms/frame | G/X/L logs: `loop MAIN: ... ms per frame in JS` | UI processing time, not ECU latency. |

## Service discovery and transport configuration data

| Data | Units / encoding | Where found | Meaning / limit |
| --- | --- | --- | --- |
| Raw discovery packet | base64-encoded bytes | `L2/service-discovery-baseline.json /packets/<index>/data`; `service-discovery-lowbeam-on.json` same pointer | Service discovery, not decoded lamp-state or sensor payloads. |
| Packet time / source address / UDP port | Unix ms / IP / port | Same files `/packets/<index>/{at,address,port}` | Packet provenance; addresses are not physical channel values. |
| Capture multicast group / interface / port | IP / port | Same files `/group`, `/interface`, `/port` | Discovery capture context. |
| Capture start/end / packet and omitted counts | Unix ms / count | Discovery and offer summaries `/startedAt`, `/finishedAt`, `/packetsObserved` or `/packets`, `/omitted` | Retention and timing; omitted traffic is not reconstructed. |
| Service identifier | UInt16 / hex | `L2/service-offers-summary.json /offers/<index>/{service,serviceHex}`; `service-offers-lowbeam-summary.json /offers/<index>/service` | Offered interface ID; does not prove every field is available. |
| Service instance identifier | integer | Same offer objects `/instance` | Instance selector. |
| Service major/minor version | integer pair | Same offer objects `/major`, `/minor` | Declared interface version. |
| Service offer type and lifetime | enum / seconds | Same offer objects `/type`, `/ttl` | Discovery offer metadata, not vehicle operating lifetime. |
| Offer source / observation count / first and last time | IP / count / Unix ms | Same offer objects `/source`, `/observations`, `/firstAt`, `/lastAt` (where present) | Some low-beam summary entries do not carry first/last time. |
| Discovery parse issues and operator context | text/list | Summary `/parseIssues`; lowbeam summary `/operatorContext` | Low beams on is an inherited operator report, not an emitted command or decoded feedback. |
| Service/method/event access policy | IDs / access rules | `L2/vsomeip/**/*.json` (108 retained configuration files) | Configuration only: UID/GID access, allowed services/instances/methods/events, requester policy. Not proof of received data. |
| Transport endpoint / logging / timing configuration | IP / port / flags / configured delays | Same vsomeip configuration files | Configured addresses, ports, application IDs, discovery/debounce/whitelist/logging settings; no additional decoded sensor channels. |

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
| 1 — `19-DB32` | Actual/target front torque and raw qualifiers | artifact-decoded | `S /1` | Every entry has synthetic:true; examples never establish sensor availability or physical correctness. |
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
| Front-left requested torque display | Nm | Y — torque readouts | requested/top value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; bars use a 10 Nm display scale, not vehicle maximum. |
| Front-left actual torque display | Nm | Y — torque readouts | actual/bottom value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; no calibrated wheel-torque provenance. |
| Front-right tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Front-right displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Front-right requested torque display | Nm | Y — torque readouts | requested/top value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; bars use a 10 Nm display scale, not vehicle maximum. |
| Front-right actual torque display | Nm | Y — torque readouts | actual/bottom value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; no calibrated wheel-torque provenance. |
| Rear-left tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-left displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Rear-left requested torque display | Nm | Y — torque readouts | requested/top value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; bars use a 10 Nm display scale, not vehicle maximum. |
| Rear-left actual torque display | Nm | Y — torque readouts | actual/bottom value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; no calibrated wheel-torque provenance. |
| Rear-right tyre pressure | PSI | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right tyre temperature | °F | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right wheel speed | MPH | Y SPORT — tyre/wheel cards | current display | DEMO only; no matching live data channel established by the image. |
| Rear-right displayed angle | ° | Y — wheel/axle drawing | current angle display | DEMO geometry/readout; not proof of independent left/right toe or rear-axle sensor availability. |
| Rear-right requested torque display | Nm | Y — torque readouts | requested/top value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; bars use a 10 Nm display scale, not vehicle maximum. |
| Rear-right actual torque display | Nm | Y — torque readouts | actual/bottom value | DEMO only. COMFORT/ECO PRO explicitly label sign-based halves, not wheel measurements; no calibrated wheel-torque provenance. |
| Front axle power | HP | Y SPORT — axle power readout | current display | DEMO only; not evidence of a measured axle power fraction. |
| Rear axle power | HP | Y SPORT — axle power readout | current display | DEMO only; not evidence of a measured axle power fraction. |
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
| Transfer-case clutch model | °F | T — Transfer case/rear differential | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
| Rear differential | °F | T — Transfer case/rear differential | current / minimum / maximum / 180 s history | DEMO only; model-labelled values remain models, and no captured channel is established by the drawing. |
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
| 0x19 LMV_G11 | Same Ecu root: `lmv_g11.prg` | RES_0XDB32_D data 963308 / directory entry 987396; DFEA data 971194; 4004 data 956119 (31 fields / 59 bytes); 4005 data 958964 (21 fields / 55 bytes). |
| 0x29 IB_G05 | Same Ecu root: `ib_g05.prg` | RES_0XDBE4_D data 1250418 / directory 1346788 (19 bytes); TAB_DREHRICHTUNG data 1323439 / directory 1350468. |
| 0x2B HSR_G11 | Same Ecu root: `hsr_g11.prg` | RES_0XDB33_D data 716102 (11 bytes); DB35 data 717538 (8 bytes); DB36 data 718173 (5 bytes); actual-angle qualifier table data 729057. |
| 0x25 EMARS_V1 front | Same Ecu root: `emars_v1.prg` | D499 data 716850; D699 717056; D69A 717345; D69B 717557; D69C 717823; D69D 718433; D6BB 719906. |
| 0x04 EMARS_H1 rear | Same Ecu root: `emars_h1.prg` | Separate rear definitions for D499, D699–D69D and D6BB; do not substitute front file offsets or assume byte-identical files. |
| 0x39 VIP_G05 | Historical family identification; no read-channel definition established here | 684A–684F names were fault-environment context, not established ReadDataByIdentifier channels. |
| Native SOME/IP type catalogue | `E /payload/catalog`; original data source `bmw-extracted/reference/someip-interfaces.json` | SHA-256 645b929b273197df927dd45d958e82c823a3f1f843f71587baaba03c205c74e4. Type/instance definitions do not prove offered providers or numeric scaling. |

| Definition-only/context data | Where to find it | Units / limit |
| --- | --- | --- |
| Exhaust-flap variant | DME definitions, DID 3020 | Variant metadata only; not retained position feedback. |
| Exhaust-flap presence / learned actuator type | DME definitions, DID 5FF2 | Actuator metadata only; no captured result here. |
| Transfer-case calibration context | LMV definitions DFE8 / DFEE | Context, not captured engagement telemetry; no calibration operation performed. |
| Exhaust control/actuator context | ISTA `SQLiteDBs/xmlvalueprimitive_ENGB.sqlite`: docs 2000016292247204, 2000036636323104, 2000036674994104, 2000078038574204, 2000080426638404, 2000015417115304, 2000073064434104 | Historical documentation mixes actuator descriptions; 10%/90% descriptions do not establish percent-open for every variant. |
| N63 / S63 engine applicability | Same ISTA database: docs 2000044781407404, 2000063971080204 | Architecture context; do not exchange engine-family layouts. |
| ATC13-1 transfer-case operation / calculated wear/load/temperature | Same ISTA database: doc 2000088102734904 (rowid 252709) | DSC requests and geared-ring actuation/model context; not a direct front torque load cell. |
| M-xDrive context | Same ISTA database: doc 2000088103044204 | Other mode/split claims are not evidence for this car. |
| Integrated brake architecture | Same ISTA database: doc 2000045315142904 | G05/G15-era context, not a substitute for exact IB_G05 layout. |
| Rear-steering architecture | Same ISTA database: docs 200000467235304, 2000074015379604 | Not individual wheel-toe calibration. |
| Older hydraulic ARS descriptions | Same ISTA database: docs 200000467275004, 200000468251104 | Other platforms; no hydraulic-pressure measurement established for these EMARS units. |
| ECU programming/variant declarations | `C:/Data/psdzdata/mainseries/S18A/S18A_25_03_571_V_004_000_001/odx/src/odx-d/` | LMV, HSR2, EMARS, DSC_VIP/IB and DME8.8T context; not the recovered measurement layouts or live compatibility proof. |
| Unread diagnostic-document database | ISTA `SQLiteDBs/DiagDocDb.sqlite` | Not readable as ordinary SQLite in the inherited investigation; no claim of complete diagnostic-graph coverage. |

## Unavailable or unresolved channels — do not fabricate

| Requested data / apparent channel | Available evidence | What is not established |
| --- | --- | --- |
| Measured exhaust-flap position / angle / percent-open | 62FD/64FD command/output; 631E/651E definitions with NRC31 | No verified actual position, degrees, fitted binary/continuous actuator mapping, or physical command-to-position correlation. |
| Transfer-case clutch engagement percentage | DB32 torque, DFEA raw states, 4004 current/angle/thermal stress | No calibrated percent-engagement or release-state numeric map; angle/current/thermal percent are not interchangeable. |
| Front/rear axle power percentage | DB32 front torque and BasicDataSet raw distribution schema | No compatible torque/speed reference-plane calibration or defined distribution scale. Do not infer power fraction from engine torque/gearing. |
| Four wheel directions from native wheel RPM | Powertrain raw rotational values and qualifiers | Direction comes separately from IB DBE4; no per-wheel direction in native RPM fields and no established physical RPM scaling. |
| Usable captured tyre pressure/temperature | Native TPMS fields retained as 65534 / target 65533 | Those raw values are not usable pressure or temperature measurements. |
| Tyre parked-supervision data | G2/G3 `/readErrors/tpms.tyreParkSupervision` and matching journal error events | 1200 ms getter timeout; no captured value or invented extra schema. |
| MDrive configuration/control-display and DSC availability readings | X baseline read/getter errors; schema rows above | statusMConfigurationMDrive, controlDisplayMSystemsMDrive and modeAvailabilityDSC time out after 1200 ms. |
| BasicDataSet live measurements | Schema only; O provider CONNECTING and null sample | No retained physical values, including raw longitudinal torque distribution. |
| Individual rear left/right wheel toe | HSR rear-axle actuator angle; front/driver native steering fields | No independent left/right rear toe, no rear-angle SOME/IP field established, and no validated VIP 684A–684F read DID. |
| D6BB actual stabilizer torque as signed Nm | Unsigned declaration and conflicting ±1200 Nm comment | Keep raw only until exact software representation is resolved. D699 is a separate signed actuator-torque definition. |
| Hydraulic anti-roll pressure / universal anti-roll engaged percent | Electric EMARS front/rear torque/current/voltage/state definitions | No hydraulic-pressure DID, universal engagement percentage or numeric thermal cutoff established. mars01.prg describes media hardware, not anti-roll. |
| Physical lamp state from discovery or acknowledgments | Offer packets, descriptor, getter values and operator notes | Discovery/policy/transport-returned do not independently show light output. Requested, reported and physically observed states stay separate. |
| Parking-space availability / obstacle distance | ParkingSpotStyleDB schema | Only rendering/style columns, no rows or parking-sensor measurements. |
| Extra vehicle channels from integrity/signature binary analysis | H retains native binary and security-analysis records | Exports, ELF metadata and analysis graph facts are not vehicle measurements. |
| Demo boost / power / pressures / expanded temperatures | Nine GIF dashboards marked DEMO | Rendered labels/animations do not establish a captured sensor route. |

## Data coverage and retention

| Data set | Material inspected | Coverage / limit |
| --- | --- | --- |
| General lab | 3 folders; all 21 text files including 5 event-journal rotations | 6219 JSONL records; snapshots contain 38 reading families. No PNGs/downloads opened. |
| General archive mirrors | 3 matching .tar.gz files, 21 member files | Every text member is byte-identical to its extracted folder counterpart; no extra channels. |
| xDrive lab | 4 folders; 12 JSON snapshots/state/recorder files, 16 journal rotations, 4 logs | 64642 journal records (including repeated historical material across folders); 37 captured reading families, plus catalog-only definitions. |
| xDrive export | E complete JSON, payload baseline/current, diagnostics/catalog and all 4 embedded rawJsonl journals | 17880 embedded journal records; not counted as new independent samples or additional physical channels. |
| Lighting lab | 3 folders, 11 baseline/snapshot/trial JSON files including A/AT, 6 event-journal rotations, 3 logs | 3950 journal records; 11 captured reading families. Trial snapshots/restore/getter readbacks reviewed. |
| Exterior/discovery artifacts | 5 discovery/summary/descriptor JSON files; 108 vsomeip JSON configuration files | Schema and offer/configuration evidence kept separate from vehicle measurements. |
| Other-data evidence | O latest records, native readings, provider/diagnostic state and retained events; S complete synthetic examples | 30 latest diagnostic records / 3 native records; 256 retained events, older events evicted; all 8 S entries synthetic. |
| Headunit analysis evidence | H complete retained JSON record bundle, including both database schema inspections | 15 retained evidence records, no runtime capture; schema-only parking/map style data, no table rows. |
| Runtime logs | All 10 general/xDrive/lighting logs | 5682 lines; performance/lifecycle/provider/error context, no extra calibrated sensor route. |
| Dashboard GIFs | All 9 retained driving/dynamics/temperatures GIFs, all mode variants; representative frames inspected | DEMO display inventory only, not live data proof or an exhaustive per-frame numerical transcript. |
| Deployment/builder artifacts | Lighting deployment manifest/view and mgu executable classified as application/build artifacts | No extra measurement channels inferred from executable/deployed source; no execution. |
| Excluded | out/downloads/ and all PNG files | Not read or scanned; inherited historical findings retained only as clearly marked provenance/context. |

