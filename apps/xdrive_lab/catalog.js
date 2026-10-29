'use strict';
// Catalog subset retained for raw schema inspection and request validation.
module.exports = {
  "schemaVersion": 1,
  "source": "bmw-extracted/reference/someip-interfaces.json",
  "sourceSha256": "645b929b273197df927dd45d958e82c823a3f1f843f71587baaba03c205c74e4",
  "services": [
    {
      "key": "mdrive",
      "label": "MDrive / AWD mode",
      "iface": "de.bmw.infotainment.misc.MDrive",
      "instance": "1",
      "serviceId": 46367,
      "version": {
        "major": 1,
        "minor": 3
      },
      "fields": [
        {
          "name": "statusMSystem",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMSystemWrapper"
        },
        {
          "name": "statusMDriveTwo",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMDriveTwoWrapper"
        },
        {
          "name": "statusMConfigurationMDrive",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMDriveWrapper"
        },
        {
          "name": "controlDisplayMSystemsMDrive",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsMDriveWrapper"
        },
        {
          "name": "controlDisplayMSystems",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsWrapper"
        },
        {
          "name": "dataDisplayGearbox",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.DataDisplayGearboxWrapper"
        }
      ],
      "writes": [
        "mSystem",
        "operationMSystemsMDrive"
      ]
    },
    {
      "key": "fes",
      "label": "Driving mode / DSC / torque",
      "iface": "de.bmw.infotainment.drivingexcitement.FES",
      "instance": "1",
      "serviceId": 46349,
      "version": {
        "major": 1,
        "minor": 3
      },
      "fields": [
        {
          "name": "statusFESVehicleDynamicSwitchHMI",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESVehicleDynamicSwitchHMIWrapper"
        },
        {
          "name": "statusDSCSwitchHMI",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DSCSwitchHMIWrapper"
        },
        {
          "name": "modeAvailabilityDSC",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ModeDSCAvailabilityWrapper"
        },
        {
          "name": "statusFESDriveDynamics",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESDriveDynamicsWrapper"
        },
        {
          "name": "statusFESDriveStrategy",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESDriveStrategyWrapper"
        },
        {
          "name": "statusActualValueTorque2",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueTorque2Wrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "split",
      "label": "Reported axle torque split",
      "iface": "de.bmw.infrastructure.analytics.BasicDataSet",
      "instance": "1",
      "serviceId": 4096,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "basicDataSet",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.BasicDataSetWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "wheels",
      "label": "Wheel RPM / drive direction",
      "iface": "de.bmw.powertrain.Powertrain",
      "instance": "1",
      "serviceId": 38192,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "ActualValueRPMWheel",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.ActualValueRPMWheelWrapper"
        },
        {
          "name": "WheelMomentDrive4",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.WheelMomentDrive4Wrapper"
        },
        {
          "name": "WheelMomentDrive1",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.WheelMomentDrive1Wrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "xview",
      "label": "XView moments / steering",
      "iface": "de.bmw.infotainment.drivingexcitement.XView",
      "instance": "1",
      "serviceId": 46343,
      "version": {
        "major": 1,
        "minor": 1
      },
      "fields": [
        {
          "name": "statusDisplayDriveDynamic",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AnzeigeFahrdynamikWrapper"
        },
        {
          "name": "statusSteeringAngleDriver",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SteeringAngleDriverWrapper"
        },
        {
          "name": "statusFrontAxleSteeringAngle",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFrontAxleSteeringAngleWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "motion",
      "label": "Vehicle motion / yaw",
      "iface": "de.bmw.chassis.SpeedAcceleration",
      "instance": "1",
      "serviceId": 30003,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "vehicleSpeed",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.VehicleSpeedWrapper"
        },
        {
          "name": "CharacteristicSpeed",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.CharacteristicSpeedWrapper"
        },
        {
          "name": "LateralAccelerationCenterOfGravity",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.LateralAccelerationCenterOfGravityWrapper"
        },
        {
          "name": "LongitudinalAccelerationCentreOfGravity",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.LongitudinalAccelerationCentreOfGravityWrapper"
        },
        {
          "name": "YawSpeedVehicle",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.YawSpeedVehicleWrapper"
        },
        {
          "name": "drivingDirection",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.DrivingDirectionWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "vehicle",
      "label": "Vehicle speed / warnings",
      "iface": "de.bmw.infotainment.vehicle.Vehicle2",
      "instance": "1",
      "serviceId": 46361,
      "version": {
        "major": 1,
        "minor": 3
      },
      "fields": [
        {
          "name": "statusCarSpeed2",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.CarSpeed2Wrapper"
        },
        {
          "name": "statusDisplayedCCMessage",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusDisplayedCCMessageWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "gear",
      "label": "Gearbox selector",
      "iface": "de.bmw.infrastructure.VehicleInformation",
      "instance": "1",
      "serviceId": 5430,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "statusGearboxDrive",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.infrastructuretypes.InfrastructureTypes.StatusGearboxDriveWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "engine",
      "label": "Engine / brake / temperatures",
      "iface": "de.bmw.infotainment.vehicle.CDS",
      "instance": "1",
      "serviceId": 46355,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "statusEngineSpeed2",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusEngineSpeed2Wrapper"
        },
        {
          "name": "statusEngineStatus",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.EngineStatusWrapper"
        },
        {
          "name": "statusEngineTemperature",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.EngineTemperatureWrapper"
        },
        {
          "name": "statusBattery2",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusBattery2Wrapper"
        },
        {
          "name": "statusHandBrake",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusHandBrakeWrapper"
        },
        {
          "name": "statusGearIndicator",
          "getter": true,
          "notify": true,
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusGearIndicatorWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "pedal",
      "label": "Accelerator pedal",
      "iface": "de.bmw.powertrain.AcceleratorPedal",
      "instance": "1",
      "serviceId": 38193,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "AngleAcceleratorPedal",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.AngleAcceleratorPedalWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "stability",
      "label": "ABS / ASC / stabilization",
      "iface": "de.bmw.chassis.VehicleStabilizationManagement",
      "instance": "1",
      "serviceId": 30004,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "StabilizationManagement",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StabilizationManagementWrapper"
        },
        {
          "name": "StandStillFunction",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StandStillFunctionWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "steering",
      "label": "Chassis steering angle",
      "iface": "de.bmw.chassis.SteeringAngle",
      "instance": "1",
      "serviceId": 30002,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "ActualSteeringAngleDriver",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.ActualSteeringAngleDriverWrapper"
        },
        {
          "name": "actualSteeringAngleDriverNoCRC",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.ActualSteeringAngleDriverNoCRCWrapper"
        },
        {
          "name": "SteeringAngleFrontAxleEffective",
          "getter": false,
          "notify": true,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.SteeringAngleFrontAxleEffectiveWrapper"
        }
      ],
      "writes": []
    },
    {
      "key": "rsu",
      "label": "Remote software update session",
      "iface": "com.harman.infotainment.systemfunctions.aoldiagnosticsession.AolDiagnosticSession",
      "instance": "AolDiagnosticSessionService_Inst1",
      "serviceId": 63663,
      "version": {
        "major": 1,
        "minor": 0
      },
      "fields": [
        {
          "name": "isRsuSessionActive",
          "getter": true,
          "notify": true,
          "dataRef": "Bool"
        }
      ],
      "writes": []
    },
    {
      "key": "tasu",
      "label": "Read-only diagnostic transport",
      "iface": "com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu",
      "instance": "SystemFunctionsInternalTasuInst1",
      "serviceId": 63654,
      "version": {
        "major": 1,
        "minor": 2
      },
      "fields": [
        {
          "name": "tasuModeStatus",
          "getter": true,
          "notify": true,
          "dataRef": "com.harman.infotainment.systemfunctions.tasu.TasuTypes.TasuExclusiveMode"
        }
      ],
      "writes": [],
      "events": [
        "sendTasuResponse"
      ],
      "methods": [
        "sendTasuRequest"
      ]
    }
  ],
  "datatypes": {
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMSystemWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusAllWheelSetup",
          "defaultValue": 7,
          "name": "statusAllWheelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionAllWheel",
          "defaultValue": 15,
          "name": "qualifierFunctionAllWheel"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusBrakePedalSetup",
          "defaultValue": 15,
          "name": "statusBrakePedalSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionBrakePedal",
          "defaultValue": 15,
          "name": "qualifierFunctionBrakePedal"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMControlPlusDriftSetup",
          "defaultValue": 15,
          "name": "statusMControlPlusDriftSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusDriftLevel",
          "defaultValue": 15,
          "name": "statusDriftSupportLevelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusTractionLevel",
          "defaultValue": 15,
          "name": "statusMControlPlusTractionLevelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusBalanceLevel",
          "defaultValue": 15,
          "name": "statusMControlPlusBrakeBalanceLevelSetup"
        }
      ],
      "name": "StatusMSystemWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusAllWheelSetup": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "AWDSAND": 3,
        "RESERVIERT_FEHLER": 6,
        "RESERVIERT_NICHT_VERFUEGBAR": 5,
        "SIGNAL_UNBEFUELLT": 7,
        "_2WD": 2,
        "_4WD_ALTERNATIV": 1,
        "_4WD_STANDARD": 0
      },
      "name": "StatusAllWheelSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionAllWheel": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 14,
        "FUNKTION_NICHT_VERFUEGBAR_FEHLER": 6,
        "FUNKTION_VERFUEGBAR_AKTIV": 10,
        "FUNKTION_VERFUEGBAR_BEREIT": 2,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "QualifierFunctionAllWheel",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusBrakePedalSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KENNLINIE_1": 1,
        "KENNLINIE_2": 2,
        "KENNLINIE_3": 3,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusBrakePedalSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierFunctionBrakePedal": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 14,
        "FUNKTION_NICHT_VERFUEGBAR_FEHLER": 6,
        "FUNKTION_VERFUEGBAR_AKTIV": 9,
        "FUNKTION_VERFUEGBAR_BEREIT": 1,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "QualifierFunctionBrakePedal",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMControlPlusDriftSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DFT_AN_MCP_AUS": 2,
        "DFT_AUS_MCP_AN": 3,
        "DFT_AUS_MCP_AUS": 1,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NICHT_GENUTZT": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusMControlPlusDriftSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusDriftLevel": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ASSISTENZ_LEVEL_0": 1,
        "ASSISTENZ_LEVEL_1": 2,
        "ASSISTENZ_LEVEL_10": 11,
        "ASSISTENZ_LEVEL_2": 3,
        "ASSISTENZ_LEVEL_3": 4,
        "ASSISTENZ_LEVEL_4": 5,
        "ASSISTENZ_LEVEL_5": 6,
        "ASSISTENZ_LEVEL_6": 7,
        "ASSISTENZ_LEVEL_7": 8,
        "ASSISTENZ_LEVEL_8": 9,
        "ASSISTENZ_LEVEL_9": 10,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NICHT_GENUTZT": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusDriftLevel",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusTractionLevel": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NICHT_GENUTZT": 0,
        "SIGNAL_UNBEFUELLT": 15,
        "TRAKTION_LEVEL_0": 1,
        "TRAKTION_LEVEL_1": 2,
        "TRAKTION_LEVEL_10": 11,
        "TRAKTION_LEVEL_2": 3,
        "TRAKTION_LEVEL_3": 4,
        "TRAKTION_LEVEL_4": 5,
        "TRAKTION_LEVEL_5": 6,
        "TRAKTION_LEVEL_6": 7,
        "TRAKTION_LEVEL_7": 8,
        "TRAKTION_LEVEL_8": 9,
        "TRAKTION_LEVEL_9": 10
      },
      "name": "StatusTractionLevel",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusBalanceLevel": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "BREMSBALANCE_LEVEL_0": 1,
        "BREMSBALANCE_LEVEL_1": 2,
        "BREMSBALANCE_LEVEL_10": 11,
        "BREMSBALANCE_LEVEL_2": 3,
        "BREMSBALANCE_LEVEL_3": 4,
        "BREMSBALANCE_LEVEL_4": 5,
        "BREMSBALANCE_LEVEL_5": 6,
        "BREMSBALANCE_LEVEL_6": 7,
        "BREMSBALANCE_LEVEL_7": 8,
        "BREMSBALANCE_LEVEL_8": 9,
        "BREMSBALANCE_LEVEL_9": 10,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NICHT_GENUTZT": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusBalanceLevel",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMDriveTwoWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2",
          "defaultValue": 3,
          "name": "statusMDrive2"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMDrive2",
          "defaultValue": 3,
          "name": "controlDisplayMDrive2"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDrive2DSC",
          "defaultValue": 15,
          "name": "statusMDrive2DSC"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2Index",
          "defaultValue": 15,
          "name": "statusMDrive2Index"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDriveStageGearbox",
          "defaultValue": 15,
          "name": "statusMDrive2StageGearbox"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDrive2Engine",
          "defaultValue": 15,
          "name": "statusMDrive2Engine"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDrive2Mode",
          "defaultValue": 15,
          "name": "statusMDrive2ElectronicDamperControl"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDrive2Mode",
          "defaultValue": 15,
          "name": "statusMDrive2EPAS"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDrive2DisplayHUD",
          "defaultValue": 15,
          "name": "statusMDrive2DisplayHUD"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDriveDisplayShiftlights",
          "defaultValue": 15,
          "name": "statusMDrive2DisplayShiftlights"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.MDriveModeGearbox",
          "defaultValue": 7,
          "name": "statusMDrive2ModeGearbox"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.RequestAudibleMessageMDrive2",
          "defaultValue": 3,
          "name": "requestAudibleMessageMDrive2"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.AllWheelSetup",
          "defaultValue": 7,
          "name": "statusMDrive2AllWheel"
        }
      ],
      "name": "StatusMDriveTwoWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "M_MINUS_DRIVE_AUS": 0,
        "M_MINUS_DRIVE_EIN": 1,
        "M_MINUS_DRIVE_UNVERAENDERT": 2,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusMDrive2",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMDrive2": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "M1_M2_TASTE_AKTIV": 1,
        "M1_M2_TASTE_NICHT_AKTIV": 0,
        "M_MINUS_DRIVE_MINUS_ANZEIGE_EIN__BLINKEN": 2,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDisplayMDrive2",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDrive2DSC": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DSC_AUS": 1,
        "DSC_EIN": 2,
        "DSC_MDM": 3,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "MDrive2DSC",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMDrive2Index": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_KONFIGURATION": 2,
        "KONFIGURATION_1": 0,
        "KONFIGURATION_2": 1,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "StatusMDrive2Index",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDriveStageGearbox": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNGUELTIG": 15,
        "STUFE_1": 1,
        "STUFE_2": 2,
        "STUFE_3": 3,
        "STUFE_4": 4,
        "STUFE_5": 5,
        "STUFE_6": 6
      },
      "name": "MDriveStageGearbox",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDrive2Engine": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KOMFORT": 1,
        "SIGNAL_UNGUELTIG": 15,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "MDrive2Engine",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDrive2Mode": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KOMFORT": 1,
        "SIGNAL_UNGUELTIG": 15,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "MDrive2Mode",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDrive2DisplayHUD": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AG_MINUS_DARSTELLUNG": 2,
        "KEINE_AENDERUNG": 0,
        "M_MINUS_SPEZIFISCHE_DARSTELLUNG": 1,
        "SIGNAL_UNGUELTIG": 15,
        "UNVERAENDERT": 3
      },
      "name": "MDrive2DisplayHUD",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDriveDisplayShiftlights": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "SHIFTLIGHTS_AUS": 1,
        "SHIFTLIGHTS_EIN": 2,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "MDriveDisplayShiftlights",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.MDriveModeGearbox": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "AUTOMATIC": 1,
        "KEINE_AENDERUNG": 0,
        "SEQUENTIELL": 2,
        "SIGNAL_UNGUELTIG": 7
      },
      "name": "MDriveModeGearbox",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.RequestAudibleMessageMDrive2": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AKUSTIKMELDUNG_M_MINUS_TASTE": 2,
        "AKUSTIKMELDUNG_TON_1": 1,
        "KEINE_TONANFORDERUNG": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "RequestAudibleMessageMDrive2",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.AllWheelSetup": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 3,
        "SIGNAL_UNBEFUELLT": 7,
        "_2WD": 2,
        "_4WD_ALTERNATIV": 1,
        "_4WD_STANDARD": 0
      },
      "name": "AllWheelSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMDriveWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationIDXMDrive",
          "defaultValue": 3,
          "name": "statusMConfigurationIDXMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRQAUDMDrive",
          "defaultValue": 3,
          "name": "statusMConfigurationRQAUDMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationSOUMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationSOUMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMSAMDrive",
          "defaultValue": 3,
          "name": "statusMConfigurationMSAMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationADRMDrive",
          "defaultValue": 3,
          "name": "statusMConfigurationADRMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationTRCLMDrive",
          "defaultValue": 63,
          "name": "statusMConfigurationTRCLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationBBLMDrive",
          "defaultValue": 63,
          "name": "statusMConfigurationBBLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1BRPDMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationBRPDMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationDSCMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationDSCMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationAWMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationAWMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationGRBMDrive",
          "defaultValue": 63,
          "name": "statusMConfigurationGRBMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationENGMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationENGMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1EPSMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationEPSMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1EPSMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationVDCMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationEPOWMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationEPOWMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRECUMDrive",
          "defaultValue": 15,
          "name": "statusMConfigurationRECUMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationELCMDrive",
          "defaultValue": 3,
          "name": "statusMConfigurationELCMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMHYBRIDMDrive",
          "defaultValue": 63,
          "name": "statusMConfigurationMHYBRIDMDrive"
        }
      ],
      "name": "StatusMConfigurationMDriveWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationIDXMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_KONFIGURATION": 0,
        "KONFIGURATION1": 1,
        "KONFIGURATION2": 2,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusMConfigurationIDXMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRQAUDMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AKUSTIKMELDUNG_MTASTE": 1,
        "KEINE_TONANFORDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusMConfigurationRQAUDMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationSOUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KENNLINIE1": 1,
        "KENNLINIE2": 2,
        "KENNLINIE3": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusMConfigurationSOUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMSAMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "MSA_OFF": 2,
        "MSA_ON": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusMConfigurationMSAMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationADRMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ADR_OFF": 2,
        "ADR_ON": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusMConfigurationADRMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationTRCLMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER": 62,
        "SIGNAL_UNBEFUELLT": 63,
        "TRAKTIONLEVEL0": 33,
        "TRAKTIONLEVEL0_NICHT_BEDIENBAR": 1,
        "TRAKTIONLEVEL1": 34,
        "TRAKTIONLEVEL10": 43,
        "TRAKTIONLEVEL10_NICHT_BEDIENBAR": 11,
        "TRAKTIONLEVEL1_NICHT_BEDIENBAR": 2,
        "TRAKTIONLEVEL2": 35,
        "TRAKTIONLEVEL2_NICHT_BEDIENBAR": 3,
        "TRAKTIONLEVEL3": 36,
        "TRAKTIONLEVEL3_NICHT_BEDIENBAR": 4,
        "TRAKTIONLEVEL4": 37,
        "TRAKTIONLEVEL4_NICHT_BEDIENBAR": 5,
        "TRAKTIONLEVEL5": 38,
        "TRAKTIONLEVEL5_NICHT_BEDIENBAR": 6,
        "TRAKTIONLEVEL6": 39,
        "TRAKTIONLEVEL6_NICHT_BEDIENBAR": 7,
        "TRAKTIONLEVEL7": 40,
        "TRAKTIONLEVEL7_NICHT_BEDIENBAR": 8,
        "TRAKTIONLEVEL8": 41,
        "TRAKTIONLEVEL8_NICHT_BEDIENBAR": 9,
        "TRAKTIONLEVEL9": 42,
        "TRAKTIONLEVEL9_NICHT_BEDIENBAR": 10
      },
      "name": "StatusMConfigurationTRCLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationBBLMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "BREMSBALANCELEVEL0": 33,
        "BREMSBALANCELEVEL0_NICHT_BEDIENBAR": 1,
        "BREMSBALANCELEVEL1": 34,
        "BREMSBALANCELEVEL10": 43,
        "BREMSBALANCELEVEL10_NICHT_BEDIENBAR": 11,
        "BREMSBALANCELEVEL1_NICHT_BEDIENBAR": 2,
        "BREMSBALANCELEVEL2": 35,
        "BREMSBALANCELEVEL2_NICHT_BEDIENBAR": 3,
        "BREMSBALANCELEVEL3": 36,
        "BREMSBALANCELEVEL3_NICHT_BEDIENBAR": 4,
        "BREMSBALANCELEVEL4": 37,
        "BREMSBALANCELEVEL4_NICHT_BEDIENBAR": 5,
        "BREMSBALANCELEVEL5": 38,
        "BREMSBALANCELEVEL5_NICHT_BEDIENBAR": 6,
        "BREMSBALANCELEVEL6": 39,
        "BREMSBALANCELEVEL6_NICHT_BEDIENBAR": 7,
        "BREMSBALANCELEVEL7": 40,
        "BREMSBALANCELEVEL7_NICHT_BEDIENBAR": 8,
        "BREMSBALANCELEVEL8": 41,
        "BREMSBALANCELEVEL8_NICHT_BEDIENBAR": 9,
        "BREMSBALANCELEVEL9": 42,
        "BREMSBALANCELEVEL9_NICHT_BEDIENBAR": 10,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER": 62,
        "SIGNAL_UNBEFUELLT": 63
      },
      "name": "StatusMConfigurationBBLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1BRPDMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KENNLINIE1": 1,
        "KENNLINIE2": 2,
        "KENNLINIE3": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlSetting1BRPDMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationDSCMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DSC_MDM": 2,
        "DSC_OFF": 4,
        "DSC_ON": 1,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusMConfigurationDSCMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationAWMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AWDSAND": 3,
        "AWDSAND_NICHT_BEDIENBAR": 11,
        "AWDSPORT": 2,
        "AWDSPORT_NICHT_BEDIENBAR": 10,
        "AWDSTANDARD": 1,
        "AWDSTANDARD_NICHT_BEDIENBAR": 9,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "RWD": 4,
        "RWD_NICHT_BEDIENBAR": 12,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusMConfigurationAWMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationGRBMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "D1": 1,
        "D1_NICHT_BEDIENBAR": 33,
        "D2": 2,
        "D2_NICHT_BEDIENBAR": 34,
        "D3": 4,
        "D3_NICHT_BEDIENBAR": 36,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER": 62,
        "S1": 17,
        "S1_NICHT_BEDIENBAR": 49,
        "S2": 18,
        "S2_NICHT_BEDIENBAR": 50,
        "S3": 20,
        "S3_NICHT_BEDIENBAR": 52,
        "SIGNAL_UNBEFUELLT": 63
      },
      "name": "StatusMConfigurationGRBMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationENGMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "COMFORT": 1,
        "COMFORT_NICHT_BEDIENBAR": 9,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORTPLUS": 4,
        "SPORTPLUS_NICHT_BEDIENBAR": 12,
        "SPORT_NICHT_BEDIENBAR": 10
      },
      "name": "StatusMConfigurationENGMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlSetting1EPSMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "COMFORT": 1,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORTPLUS": 4
      },
      "name": "ControlSetting1EPSMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationEPOWMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KENNLINIE1": 1,
        "KENNLINIE1_NICHT_BEDIENBAR": 9,
        "KENNLINIE2": 2,
        "KENNLINIE2_NICHT_BEDIENBAR": 10,
        "KENNLINIE3": 4,
        "KENNLINIE3_NICHT_BEDIENBAR": 12,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusMConfigurationEPOWMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationRECUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "STUFE1": 1,
        "STUFE1_NICHT_BEDIENBAR": 9,
        "STUFE2": 2,
        "STUFE2_NICHT_BEDIENBAR": 10,
        "STUFE3": 4,
        "STUFE3_NICHT_BEDIENBAR": 12
      },
      "name": "StatusMConfigurationRECUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationELCMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ELEKTRISCHERANTRIEB_OFF": 2,
        "ELEKTRISCHERANTRIEB_ON": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusMConfigurationELCMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusMConfigurationMHYBRIDMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "BSG6": 6,
        "BSG6_NOT_OPERABLE": 14,
        "ELECTRIC": 2,
        "ELECTRIC_NOT_OPERABLE": 10,
        "ENDURANCE": 4,
        "ENDURANCE_NOT_OPERABLE": 12,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER": 62,
        "HOTLAP": 5,
        "HOTLAP_NOT_OPERABLE": 13,
        "HYBRID": 1,
        "HYBRID_NOT_OPERABLE": 9,
        "PRECON": 3,
        "PRECON_NOT_OPERABLE": 11,
        "SIGNAL_UNBEFUELLT": 63
      },
      "name": "StatusMConfigurationMHYBRIDMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsMDriveWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDisclaimerMDrive",
          "defaultValue": 3,
          "name": "controlDisplayMSystemsDisclaimerMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsModustafelMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsModustafelMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsENGMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsEPSMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsVDCMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsADRMDrive",
          "defaultValue": 3,
          "name": "controlDisplayMSystemsADRMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsTRCLMDrive",
          "defaultValue": 63,
          "name": "controlDisplayMSystemsTRCLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBBLMDrive",
          "defaultValue": 63,
          "name": "controlDisplayMSystemsBBLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsAWMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsAWMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBRPDMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsBRPDMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsRECUMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsRECUMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsFahrmodusMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsFahrmodusMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsSOUMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsSOUMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDLMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsDLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINFOMDrive",
          "defaultValue": 63,
          "name": "controlDisplayMSystemsPOPUPINFOMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINQYMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsPOPUPINQYMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsMSymbolMDrive",
          "defaultValue": 15,
          "name": "controlDisplayMSystemsMSymbolMDrive"
        }
      ],
      "name": "ControlDisplayMSystemsMDriveWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDisclaimerMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_MKONFIGURATION_AKTIV": 0,
        "M1_AKTIV": 1,
        "M2_AKTIV": 2,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDisplayMSystemsDisclaimerMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsModustafelMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRMODUSTAFEL1": 1,
        "FAHRMODUSTAFEL2": 2,
        "FAHRMODUSTAFEL3": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_TAFEL_ANZEIGEN": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsModustafelMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsENGMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "COMFORT": 1,
        "COMFORT_NICHT_BEDIENBAR": 9,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORTPLUS": 4,
        "SPORTPLUS_NICHT_BEDIENBAR": 12,
        "SPORT_NICHT_BEDIENBAR": 10,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsENGMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsADRMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ADR_OFF": 2,
        "ADR_ON": 1,
        "KEIN_ADR": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDisplayMSystemsADRMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsTRCLMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG": 62,
        "SIGNAL_UNBEFUELLT": 63,
        "TRAKTIONLEVEL0": 33,
        "TRAKTIONLEVEL0_NICHT_BEDIENBAR": 1,
        "TRAKTIONLEVEL1": 34,
        "TRAKTIONLEVEL10": 43,
        "TRAKTIONLEVEL10_NICHT_BEDIENBAR": 11,
        "TRAKTIONLEVEL1_NICHT_BEDIENBAR": 2,
        "TRAKTIONLEVEL2": 35,
        "TRAKTIONLEVEL2_NICHT_BEDIENBAR": 3,
        "TRAKTIONLEVEL3": 36,
        "TRAKTIONLEVEL3_NICHT_BEDIENBAR": 4,
        "TRAKTIONLEVEL4": 37,
        "TRAKTIONLEVEL4_NICHT_BEDIENBAR": 5,
        "TRAKTIONLEVEL5": 38,
        "TRAKTIONLEVEL5_NICHT_BEDIENBAR": 6,
        "TRAKTIONLEVEL6": 39,
        "TRAKTIONLEVEL6_NICHT_BEDIENBAR": 7,
        "TRAKTIONLEVEL7": 40,
        "TRAKTIONLEVEL7_NICHT_BEDIENBAR": 8,
        "TRAKTIONLEVEL8": 41,
        "TRAKTIONLEVEL8_NICHT_BEDIENBAR": 9,
        "TRAKTIONLEVEL9": 42,
        "TRAKTIONLEVEL9_NICHT_BEDIENBAR": 10,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsTRCLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBBLMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "BREMSBALANCELEVEL0": 33,
        "BREMSBALANCELEVEL0_NICHT_BEDIENBAR": 1,
        "BREMSBALANCELEVEL1": 34,
        "BREMSBALANCELEVEL10": 43,
        "BREMSBALANCELEVEL10_NICHT_BEDIENBAR": 11,
        "BREMSBALANCELEVEL1_NICHT_BEDIENBAR": 2,
        "BREMSBALANCELEVEL2": 35,
        "BREMSBALANCELEVEL2_NICHT_BEDIENBAR": 3,
        "BREMSBALANCELEVEL3": 36,
        "BREMSBALANCELEVEL3_NICHT_BEDIENBAR": 4,
        "BREMSBALANCELEVEL4": 37,
        "BREMSBALANCELEVEL4_NICHT_BEDIENBAR": 5,
        "BREMSBALANCELEVEL5": 38,
        "BREMSBALANCELEVEL5_NICHT_BEDIENBAR": 6,
        "BREMSBALANCELEVEL6": 39,
        "BREMSBALANCELEVEL6_NICHT_BEDIENBAR": 7,
        "BREMSBALANCELEVEL7": 40,
        "BREMSBALANCELEVEL7_NICHT_BEDIENBAR": 8,
        "BREMSBALANCELEVEL8": 41,
        "BREMSBALANCELEVEL8_NICHT_BEDIENBAR": 9,
        "BREMSBALANCELEVEL9": 42,
        "BREMSBALANCELEVEL9_NICHT_BEDIENBAR": 10,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG": 62,
        "SIGNAL_UNBEFUELLT": 63,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsBBLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsAWMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AWDSAND": 3,
        "AWDSAND_NICHT_BEDIENBAR": 11,
        "AWDSPORT": 2,
        "AWDSPORT_NICHT_BEDIENBAR": 10,
        "AWDSTANDARD": 1,
        "AWDSTANDARD_NICHT_BEDIENBAR": 9,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG": 14,
        "RWD": 4,
        "RWD_NICHT_BEDIENBAR": 12,
        "SIGNAL_UNBEFUELLT": 15,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsAWMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsBRPDMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER_DUNKELSCHALTUNG": 14,
        "KENNLINIE1": 1,
        "KENNLINIE1_NICHT_BEDIENBAR": 9,
        "KENNLINIE2": 2,
        "KENNLINIE2_NICHT_BEDIENBAR": 10,
        "KENNLINIE3": 4,
        "KENNLINIE3_NICHT_BEDIENBAR": 12,
        "SIGNAL_UNBEFUELLT": 15,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsBRPDMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsRECUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "STUFE1": 1,
        "STUFE1_NICHT_BEDIENBAR": 9,
        "STUFE2": 2,
        "STUFE2_NICHT_BEDIENBAR": 10,
        "STUFE3": 4,
        "STUFE3_NICHT_BEDIENBAR": 12,
        "VERFUEGBAR_NICHT_BEDIENBAR": 0
      },
      "name": "ControlDisplayMSystemsRECUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsFahrmodusMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRMODUS1": 1,
        "FAHRMODUS2": 2,
        "FAHRMODUS3": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEIN_FAHRMODUS": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsFahrmodusMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsSOUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AVAILABLE_NOT_INTERACTIVE": 0,
        "CONDITION1": 1,
        "CONDITION2": 2,
        "CONDITION3": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsSOUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsDLMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AVAILABLE_NOT_INTERACTIVE": 0,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "PROGRAM1": 1,
        "PROGRAM1_NOT_INTERACTIVE": 9,
        "PROGRAM2": 2,
        "PROGRAM2_NOT_INTERACTIVE": 10,
        "PROGRAM3": 4,
        "PROGRAM3_NOT_INTERACTIVE": 12,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsDLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINFOMDrive": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 61,
        "FUNKTION_MELDET_FEHLER": 62,
        "KEINE_ANZEIGE": 0,
        "M1_NICHT_AKTIVIERBARMDRIVE": 16,
        "M1_NICHT_AKTIVIERBAR_E1": 17,
        "M1_NICHT_AKTIVIERBAR_E2": 18,
        "M1_NICHT_AKTIVIERBAR_E3": 19,
        "M1_NICHT_AKTIVIERBAR_V1": 21,
        "M1_NICHT_AKTIVIERBAR_V2": 22,
        "M1_NICHT_AKTIVIERBAR_V3": 23,
        "M2_NICHT_AKTIVIERBARMDRIVE": 32,
        "M2_NICHT_AKTIVIERBAR_E1": 33,
        "M2_NICHT_AKTIVIERBAR_E2": 34,
        "M2_NICHT_AKTIVIERBAR_E3": 35,
        "M2_NICHT_AKTIVIERBAR_V1": 37,
        "M2_NICHT_AKTIVIERBAR_V2": 38,
        "M2_NICHT_AKTIVIERBAR_V3": 39,
        "SIGNAL_UNBEFUELLT": 63
      },
      "name": "ControlDisplayMSystemsPOPUPINFOMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsPOPUPINQYMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEIN_POPUP": 0,
        "M1_MIT_DSC_MDM": 2,
        "M1_MIT_DSC_OFF": 4,
        "M1_MIT_DSC_ON": 1,
        "M2_MIT_DSC_MDM": 10,
        "M2_MIT_DSC_OFF": 12,
        "M2_MIT_DSC_ON": 9,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsPOPUPINQYMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsMSymbolMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEIN_SYMBOL": 0,
        "M1_SYMBOL": 1,
        "M2_SYMBOL": 2,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayMSystemsMSymbolMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMSystemsWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayASRMode",
          "defaultValue": 3,
          "name": "controlDisplayASRMode"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayDrivingMode",
          "defaultValue": 15,
          "name": "controlDisplayDrivingMode"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayListDrivingMode",
          "defaultValue": 15,
          "name": "controlDisplayListDrivingMode"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "controlDisplayPopUpInstrumentPackInquiry"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayPopUpInstrumentPackInformation",
          "defaultValue": 15,
          "name": "controlDisplayPopUpInstrumentPackInformation"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayCID",
          "defaultValue": 15,
          "name": "controlDisplayCID"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode",
          "defaultValue": 7,
          "name": "controlDisplayEPASMode"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode",
          "defaultValue": 7,
          "name": "controlDisplayElectronicDamperControlMode"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode",
          "defaultValue": 7,
          "name": "controlDisplayEngineMode"
        }
      ],
      "name": "ControlDisplayMSystemsWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayASRMode": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AN": 1,
        "AUS": 0,
        "DUNKELSCHALTUNG": 2,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDisplayASRMode",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayDrivingMode": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRMODUS_1_DEFAULT": 1,
        "FAHRMODUS_1_INDIVIDUAL": 2,
        "FAHRMODUS_2_DEFAULT": 3,
        "FAHRMODUS_2_INDIVIDUAL": 4,
        "FAHRMODUS_3_DEFAULT": 5,
        "FAHRMODUS_3_INDIVIDUAL": 6,
        "FAHRMODUS_4_DEFAULT": 7,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayDrivingMode",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayListDrivingMode": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FML_2_3DSC_FM1_AKTIV": 7,
        "FML_2_3DSC_FM2_AKTIV": 8,
        "FML_2_3DSC_FM3_AKTIV": 9,
        "FML_3DSC_FM1_AKTIV": 4,
        "FML_3DSC_FM2_AKTIV": 5,
        "FML_3DSC_FM3_AKTIV": 6,
        "FML_FM1_AKTIV": 1,
        "FML_FM2_AKTIV": 2,
        "FML_FM3_AKTIV": 3,
        "LISTE_NICHT_ANZEIGEN": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayListDrivingMode",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayPopUpInstrumentPackInformation": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTION_IM_TRACK_NICHT_AKTIVIERBAR": 9,
        "KEIN_INFO_ANZEIGEN": 0,
        "M1_AKTIVIERT": 3,
        "M1_DEAKTIVIERT": 5,
        "M1_NICHT_AKTIVIERBAR": 7,
        "M1_TRACK_NUR_IM_STAND_AKTIVIERBAR": 1,
        "M2_AKTIVIERT": 4,
        "M2_DEAKTIVIERT": 6,
        "M2_NICHT_AKTIVIERBAR": 8,
        "M2_TRACK_NUR_IM_STAND_AKTIVIERBAR": 2,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayPopUpInstrumentPackInformation",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayCID": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_TAFEL_ANZEIGEN": 0,
        "M1_AKTIV": 5,
        "M1_NICHT_AKTIV": 6,
        "M2_AKTIV": 7,
        "M2_NICHT_AKTIV": 8,
        "MODE1_INFO": 1,
        "MODE2_INFO": 2,
        "MODE3_INFO": 3,
        "MODE3_VERLASSEN": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlDisplayCID",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDisplayMode": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "DUNKELSCHALTUNG": 4,
        "FREI": 0,
        "KOMFORT": 1,
        "SIGNAL_UNGUELTIG": 7,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "ControlDisplayMode",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.DataDisplayGearboxWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.DisplayProgramGearbox",
          "defaultValue": 7,
          "name": "displayProgramGearbox"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.DisplayDriveLogicGearbox",
          "defaultValue": 15,
          "name": "displayDriveLogicGearbox"
        }
      ],
      "name": "DataDisplayGearboxWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.DisplayProgramGearbox": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "B_PROGRAMM": 5,
        "C_MINUS_PROGRAMM": 4,
        "DUNKELSCHALTUNG": 0,
        "L_MINUS_PROGRAMM": 3,
        "M_MINUS_PROGRAMM": 2,
        "SIGNAL_UNGUELTIG": 7,
        "S_MINUS_PROGRAMM": 1
      },
      "name": "DisplayProgramGearbox",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.DisplayDriveLogicGearbox": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DUENENMODUS": 10,
        "DUNKELSCHALTUNG": 0,
        "SIGNAL_UNGUELTIG": 15,
        "_1": 1,
        "_2": 2,
        "_3": 3
      },
      "name": "DisplayDriveLogicGearbox",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlMSystemWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlAllWheelSetup",
          "defaultValue": 7,
          "name": "controlAllWheelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlEPSSetup",
          "defaultValue": 15,
          "name": "controlEPSSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlVDCSetup",
          "defaultValue": 15,
          "name": "controlVDCSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlEngineSetup",
          "defaultValue": 15,
          "name": "controlEngineSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlASRSetup",
          "defaultValue": 3,
          "name": "controlASRSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDrivingModeInquiry",
          "defaultValue": 3,
          "name": "controlDrivingModeInquiry"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlBrakePedalSetup",
          "defaultValue": 15,
          "name": "controlBrakePedalSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusDriftLevel",
          "defaultValue": 15,
          "name": "controlDriftSupportLevelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusTractionLevel",
          "defaultValue": 15,
          "name": "controlDriftMControlPlusTractionLevelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusBalanceLevel",
          "defaultValue": 15,
          "name": "controlDriftMControlPlusBrakeBalanceLevelSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftSetup",
          "defaultValue": 3,
          "name": "controlDriftSetup"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftReset",
          "defaultValue": 3,
          "name": "controlDriftReset"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftRecording",
          "defaultValue": 3,
          "name": "controlDriftRecording"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.ControlMModeSetup",
          "defaultValue": 15,
          "name": "controlMModeSetup"
        }
      ],
      "name": "ControlMSystemWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlAllWheelSetup": {
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 3,
        "SIGNAL_UNBEFUELLT": 7,
        "_2WD": 2,
        "_4WD_ALTERNATIV": 1,
        "_4WD_DSC_ON": 4,
        "_4WD_SPORT_MDM": 5,
        "_4WD_STANDARD": 0
      },
      "name": "ControlAllWheelSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlEPSSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KOMFORT": 1,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "ControlEPSSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlVDCSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KOMFORT": 1,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "ControlVDCSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlEngineSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KOMFORT": 1,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORT_PLUS": 3
      },
      "name": "ControlEngineSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlASRSetup": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AN": 2,
        "AUS": 1,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlASRSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDrivingModeInquiry": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "BESTAETIGT": 2,
        "KEINE_AENDERUNG": 0,
        "NICHT_BESTAETIGT": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDrivingModeInquiry",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlBrakePedalSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "KENNLINIE_1": 1,
        "KENNLINIE_2": 2,
        "KENNLINIE_3": 3,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlBrakePedalSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftSetup": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_AENDERUNG": 0,
        "M_DRIFT_BESTAETIGT": 2,
        "M_DRIFT_NICHT_BESTAETIGT": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDriftSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftReset": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_BEDIENUNG": 0,
        "RESET_LAST_BEST_DRIFT": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlDriftReset",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlDriftRecording": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_BEDIENUNG": 0,
        "SIGNAL_UNBEFUELLT": 3,
        "START_RECORDING": 1,
        "STOPP_RECORDING": 2
      },
      "name": "ControlDriftRecording",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.ControlMModeSetup": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "MMODE1": 1,
        "MMODE2": 2,
        "MMODE3": 4,
        "NO_CHANGE": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "ControlMModeSetup",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsMDriveWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftAufzeichnungMDrive",
          "defaultValue": 3,
          "name": "operationMSystemsDriftAufzeichnungMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftResetMDrive",
          "defaultValue": 3,
          "name": "operationMSystemsDriftResetMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusDriftMDrive",
          "defaultValue": 3,
          "name": "operationMSystemsFahrmodusDriftMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusINQYMDrive",
          "defaultValue": 3,
          "name": "operationMSystemsFahrmodusINQYMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsTRCLMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsTRCLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsBBLMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsBBLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsAWMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsAWMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationBRPDMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsBRPDMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsENGMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsVDCMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsEPSMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsADRMDrive",
          "defaultValue": 3,
          "name": "operationMSystemsADRMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsRECUMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsRECUMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsFahrmodusMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDLMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsDLMDrive"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsSOUMDrive",
          "defaultValue": 15,
          "name": "operationMSystemsSOUMDrive"
        }
      ],
      "name": "OperationMSystemsMDriveWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftAufzeichnungMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AUFZEICHNUNG_STARTEN": 1,
        "AUFZEICHNUNG_STOPPEN": 2,
        "KEINE_BEDIENUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "OperationMSystemsDriftAufzeichnungMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDriftResetMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_BEDIENUNG": 0,
        "RESET_LAST_BEST_DRIFT": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "OperationMSystemsDriftResetMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusDriftMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "DRIFT_AKTIVIERT": 2,
        "DRIFT_DEAKTIVIERT": 1,
        "KEINE_BEDIENUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "OperationMSystemsFahrmodusDriftMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusINQYMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ABFRAGE_BESTAETIGT": 2,
        "ABFRAGE_NICHT_BESTAETIGT": 1,
        "KEINE_BEDIENUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "OperationMSystemsFahrmodusINQYMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsTRCLMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 15,
        "TRAKTIONLEVEL0": 1,
        "TRAKTIONLEVEL1": 2,
        "TRAKTIONLEVEL10": 11,
        "TRAKTIONLEVEL2": 3,
        "TRAKTIONLEVEL3": 4,
        "TRAKTIONLEVEL4": 5,
        "TRAKTIONLEVEL5": 6,
        "TRAKTIONLEVEL6": 7,
        "TRAKTIONLEVEL7": 8,
        "TRAKTIONLEVEL8": 9,
        "TRAKTIONLEVEL9": 10
      },
      "name": "OperationMSystemsTRCLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsBBLMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "BREMSBALANCELEVEL0": 1,
        "BREMSBALANCELEVEL1": 2,
        "BREMSBALANCELEVEL10": 11,
        "BREMSBALANCELEVEL2": 3,
        "BREMSBALANCELEVEL3": 4,
        "BREMSBALANCELEVEL4": 5,
        "BREMSBALANCELEVEL5": 6,
        "BREMSBALANCELEVEL6": 7,
        "BREMSBALANCELEVEL7": 8,
        "BREMSBALANCELEVEL8": 9,
        "BREMSBALANCELEVEL9": 10,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMSystemsBBLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsAWMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AWDALTERNATIV": 2,
        "AWDSAND": 8,
        "AWDSTANDARD": 1,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "RWD": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMSystemsAWMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationBRPDMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "KENNLINIE1": 1,
        "KENNLINIE2": 2,
        "KENNLINIE3": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMConfigurationBRPDMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMConfigurationENGMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "COMFORT": 1,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 2,
        "SPORTPLUS": 4
      },
      "name": "OperationMConfigurationENGMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsADRMDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ADR_OFF": 2,
        "ADR_ON": 1,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "OperationMSystemsADRMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsRECUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE_AENDERUNG": 0,
        "SIGNAL_UNBEFUELLT": 15,
        "STUFE1": 1,
        "STUFE2": 2,
        "STUFE3": 4
      },
      "name": "OperationMSystemsRECUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsFahrmodusMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRMODUS1": 1,
        "FAHRMODUS2": 2,
        "FAHRMODUS3": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEIN_FAHRMODUS": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMSystemsFahrmodusMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsDLMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NO_CHANGE": 0,
        "PROGRAM1": 1,
        "PROGRAM2": 2,
        "PROGRAM3": 4,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMSystemsDLMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsSOUMDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "CONDITION1": 1,
        "CONDITION2": 2,
        "CONDITION3": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "NO_CHANGE": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OperationMSystemsSOUMDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESVehicleDynamicSwitchHMIWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueModeDrivingExperience2",
          "defaultValue": 63,
          "name": "actualValueModeDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceMMIDisplay",
          "defaultValue": 3,
          "name": "requestSwitchDrivingExperienceMMIDisplay"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceInstrumentPackDisplay",
          "defaultValue": 3,
          "name": "requestSwitchDrivingExperienceInstrumentPackDisplay"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupStartUpModusDrivingExperience",
          "defaultValue": 3,
          "name": "statusSetupStartUpModusDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayAvailibilityModeDrivingExperience",
          "defaultValue": 63,
          "name": "displayAvailibilityModeDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience",
          "defaultValue": 63,
          "name": "displayModeDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience",
          "defaultValue": 63,
          "name": "displayModeDrivingExperience2"
        }
      ],
      "name": "StatusFESVehicleDynamicSwitchHMIWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueModeDrivingExperience2": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "ADAPTIVE": 10,
        "BOOST": 28,
        "COMFORT": 4,
        "COMFORT_INDIVIDUAL": 6,
        "COMFORT_PLUS": 5,
        "EASE_MODUS": 24,
        "ECO_PRO_EFFICIENT": 7,
        "ECO_PRO_INDIVIDUAL": 9,
        "ECO_PRO_PLUS": 8,
        "INITIALISIERUNG": 0,
        "OFFROAD_GRIP": 13,
        "OFFROAD_ICE": 11,
        "OFFROAD_ROUGH": 14,
        "OFFROAD_SMOOTH": 12,
        "PHEV_BATTERYCONTROL": 22,
        "PHEV_ELECTRIC_INDIVIDUAL": 21,
        "PHEV_ELECTRIC_STANDARD": 20,
        "PHEV_HYBRID_COMFORT": 19,
        "PHEV_HYBRID_ECO": 18,
        "PHEV_HYBRID_STANDARD": 17,
        "PHEV_SPORT_INDIVIDUAL": 16,
        "PHEV_SPORT_PLUS": 23,
        "PHEV_SPORT_STANDARD": 15,
        "RESERVIERT": 25,
        "RESERVIERT_1": 26,
        "RESERVIERT_FEHLER": 62,
        "RESERVIERT_NICHT_VERFUEGBAR": 61,
        "SIGNAL_UNBEFUELLT": 63,
        "SPORT_DYNAMIC": 1,
        "SPORT_EXPERT": 2,
        "SPORT_INDIVIDUAL": 3,
        "TRACTION_ASSIST": 27
      },
      "name": "ActualValueModeDrivingExperience2",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceMMIDisplay": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "INITIALISIERUNG": 2,
        "MMI_MINUS_TAFEL_ANZEIGEN": 1,
        "MMI_MINUS_TAFEL_NICHT_ANZEIGEN": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "RequestSwitchDrivingExperienceMMIDisplay",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.RequestSwitchDrivingExperienceInstrumentPackDisplay": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "INITIALISIERUNG": 2,
        "KOMBI_LISTE_ANZEIGEN": 1,
        "KOMBI_LISTE_NICHT_ANZEIGEN": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "RequestSwitchDrivingExperienceInstrumentPackDisplay",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupStartUpModusDrivingExperience": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ELECTRIC_INDIVIDUAL_ALS_AUFSTARTMODUS_GEWAEHLT": 1,
        "ELECTRIC_INDIVIDUAL_NICHT_ALS_AUFSTARTMODUS_GEWAEHLT": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusSetupStartUpModusDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayAvailibilityModeDrivingExperience": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "KEIN_VERHINDERER_VORHANDEN": 0,
        "MODUS_NICHT_VERFUEGBAR_BATTERIE_HEISS": 10,
        "MODUS_NICHT_VERFUEGBAR_BATTERIE_KALT": 9,
        "MODUS_NICHT_VERFUEGBAR_GESCHWINDIGKEIT_ZU_HOCH": 7,
        "MODUS_NICHT_VERFUEGBAR_GETRIEBEPROGRAMM_M_S_AKTIV": 5,
        "MODUS_NICHT_VERFUEGBAR_HAF_VAF_BETRIEB": 11,
        "MODUS_NICHT_VERFUEGBAR_LEISTUNGSWUNSCH_ZU_HOCH": 6,
        "MODUS_NICHT_VERFUEGBAR_MANUELLES_SCHALTPROGRAMM_AKTIV": 8,
        "MODUS_NICHT_VERFUEGBAR_SOC_ZU_GERING": 3,
        "MODUS_NICHT_VERFUEGBAR_TANK_LEER": 4,
        "MODUS_ZWANGSWEISE_AKTIVIERT": 1,
        "SIGNAL_UNBEFUELLT": 63,
        "STABILISIERUNGSFUNKTIONEN_DEGRADIERT": 12,
        "STABILISIERUNGSFUNKTIONEN_DURCH_KUNDENWUNSCH_ABGESCHALTET": 14,
        "STABILISIERUNGSFUNKTIONEN_DURCH_KUNDENWUNSCH_EINGESCHRAENKT": 13,
        "SYSTEMBEDINGT_NICHT_VERFUEGBAR": 2
      },
      "name": "DisplayAvailibilityModeDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayModeDrivingExperience": {
      "defaultValue": 63,
      "enumWidth": 1,
      "items": {
        "ADAPTIVE": 10,
        "BOOST": 28,
        "COMFORT": 4,
        "COMFORT_INDIVIDUAL": 6,
        "COMFORT_PLUS": 5,
        "EASE_MODUS": 24,
        "ECO_PRO_EFFICIENT": 7,
        "ECO_PRO_INDIVIDUAL": 9,
        "ECO_PRO_PLUS": 8,
        "INITIALISIERUNG": 0,
        "OFFROAD_GRIP": 13,
        "OFFROAD_ICE": 11,
        "OFFROAD_ROUGH": 14,
        "OFFROAD_SMOOTH": 12,
        "PHEV_BATTERYCONTROL": 22,
        "PHEV_ELECTRIC_INDIVIDUAL": 21,
        "PHEV_ELECTRIC_STANDARD": 20,
        "PHEV_HYBRID_COMFORT": 19,
        "PHEV_HYBRID_ECO": 18,
        "PHEV_HYBRID_STANDARD": 17,
        "PHEV_SPORT_INDIVIDUAL": 16,
        "PHEV_SPORT_PLUS": 23,
        "PHEV_SPORT_STANDARD": 15,
        "RESERVIERT": 25,
        "RESERVIERT_1": 26,
        "SIGNAL_UNBEFUELLT": 63,
        "SPORT_DYNAMIC": 1,
        "SPORT_EXPERT": 2,
        "SPORT_INDIVIDUAL": 3,
        "TRACTION_ASSIST": 27
      },
      "name": "DisplayModeDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DSCSwitchHMIWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayStatusDSC2",
          "defaultValue": 15,
          "name": "displayStatusDSC2"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.CounterControlDisplayStatusDSC",
          "defaultValue": 15,
          "name": "counterControlDisplayStatusDSC"
        }
      ],
      "name": "DSCSwitchHMIWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.DisplayStatusDSC2": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ANFAHRHILFE_AKTIV": 2,
        "DSC_AUS": 1,
        "DSC_EIN": 0,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SIGNAL_UNGUELTIG": 15,
        "TRAKTIONSMODUS_EIN": 4
      },
      "name": "DisplayStatusDSC2",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.CounterControlDisplayStatusDSC": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "INIT__S__TAFEL_NICHT_ANZEIGEN": 0,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SIGNAL_UNBEFUELLT": 15,
        "ZAEHLERSTAND__BEI_GEAENDERTEM_ZAEHLERSTAND_TAFEL_ANZEIGEN_UND_TIMER_STARTEN": 1,
        "ZAEHLERSTAND__BEI_GEAENDERTEM_ZAEHLERSTAND_TAFEL_ANZEIGEN_UND_TIMER_STARTEN_1": 2
      },
      "name": "CounterControlDisplayStatusDSC",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ModeDSCAvailabilityWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ModeDSCAvailability",
          "defaultValue": 15,
          "name": "modeDSCAvailability"
        }
      ],
      "name": "ModeDSCAvailabilityWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ModeDSCAvailability": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KEINE": 9,
        "MID": 8,
        "SIGNAL_UNBEFUELLT": 15,
        "TRAKTION": 4,
        "TRAKTIONSOPTIMIERT_STUFE_1": 5,
        "TRAKTIONSOPTIMIERT_STUFE_2": 6,
        "TRAKTIONSOPTIMIERT_STUFE_3": 7,
        "VOLL": 2,
        "VOLL_SPORT": 3,
        "VOLL_UND_FAILSAFE_PARAMETER": 1
      },
      "name": "ModeDSCAvailability",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESDriveDynamicsWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupVerticalDynamicsDrivingExperience",
          "defaultValue": 15,
          "name": "statusSportClusterGroupVerticalDynamicsDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupHandlingDrivingExperience",
          "defaultValue": 15,
          "name": "statusSportClusterGroupHandlingDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupVerticalDynamicsDrivingExperience",
          "defaultValue": 15,
          "name": "statusECOClusterGroupVerticalDynamicsDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupHandlingDrivingExperience",
          "defaultValue": 15,
          "name": "statusECOClusterGroupHandlingDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupHandlingDrivingExperience",
          "defaultValue": 15,
          "name": "statusComfortClustergroupHandlingDrivingexperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupVerticalDynamicsDrivingExperience",
          "defaultValue": 15,
          "name": "statusComfortClustergroupVerticalDynamicsDrivingexperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSFnBrkPdDxp",
          "defaultValue": 15,
          "name": "statusSportFunctionBrakePedalDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSClugDrvDynDxp",
          "defaultValue": 15,
          "name": "statusSportClusterGroupDrivingDynamicsDrivingExperience"
        }
      ],
      "name": "StatusFESDriveDynamicsWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupVerticalDynamicsDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "NORMAL": 1,
        "RACE": 3,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SIGNAL_UNGUELTIG": 15,
        "STRAFF": 2
      },
      "name": "SportClusterGroupVerticalDynamicsDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterGroupHandlingDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DIREKT": 2,
        "NORMAL": 1,
        "RACE": 3,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "SportClusterGroupHandlingDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupVerticalDynamicsDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "NORMAL": 1,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SIGNAL_UNGUELTIG": 15,
        "STRAFF": 2,
        "WEICH": 3
      },
      "name": "ECOClusterGroupVerticalDynamicsDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOClusterGroupHandlingDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "DIREKT": 2,
        "NORMAL": 1,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SANFT": 3,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "ECOClusterGroupHandlingDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSFnBrkPdDxp": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "KURZ": 2,
        "LANG": 3,
        "NORMAL": 1,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "OpSFnBrkPdDxp",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.OpSClugDrvDynDxp": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "RACE": 3,
        "SIGNAL_UNBEFUELLT": 15,
        "SPORT": 1,
        "SPORT_PLUS": 2
      },
      "name": "OpSClugDrvDynDxp",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFESDriveStrategyWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionSailingDrivingExperience",
          "defaultValue": 3,
          "name": "statusECOFunctionSailingDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionMSADrivingExperience",
          "defaultValue": 3,
          "name": "statusECOFunctionMSADrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportFunctionShiftAssistantDrivingExperience",
          "defaultValue": 15,
          "name": "statusSportFunctionShiftAssistantDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterDrivingExperience",
          "defaultValue": 15,
          "name": "statusSportClusterRPMPathDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterDrivingExperience",
          "defaultValue": 15,
          "name": "statusSportClusterGroupEngineDrivingExperience"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustSailingVehicle",
          "defaultValue": 3,
          "name": "statusAdjustSailingVehicle"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustEngineSoundVehicle",
          "defaultValue": 15,
          "name": "statusAdjustEngineSoundVehicle"
        },
        {
          "dataRef": "UInt8",
          "name": "driverConfigurationIntelligentRangeDisplay"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupPreferenceElectricDriveDriving",
          "defaultValue": 15,
          "name": "statusSetupPreferenceElectricDriveDriving"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupBatteryControl",
          "defaultValue": 3,
          "name": "statusSetupBatteryControl"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupElectricMode",
          "defaultValue": 3,
          "name": "statusSetupElectricMode"
        }
      ],
      "name": "StatusFESDriveStrategyWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionSailingDrivingExperience": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "SEGELN_AN": 1,
        "SEGELN_AUS": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "ECOFunctionSailingDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ECOFunctionMSADrivingExperience": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "SIGNAL_UNGUELTIG": 3,
        "ZWANGSAKTIVIERUNG_MSA_BEI_WECHSEL_IN_ECO_PRO_INDIVIDUAL_AN": 1,
        "ZWANGSAKTIVIERUNG_MSA_BEI_WECHSEL_IN_ECO_PRO_INDIVIDUAL_AUS": 0
      },
      "name": "ECOFunctionMSADrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportFunctionShiftAssistantDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "SCHALTASSISTENT_AKTIV": 1,
        "SCHALTASSISTENT_NICHT_AKTIV": 0,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "SportFunctionShiftAssistantDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SportClusterDrivingExperience": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "NORMAL__B": 1,
        "RACE__SE": 3,
        "SIGNAL_UNGUELTIG": 15,
        "SPORT__S": 2
      },
      "name": "SportClusterDrivingExperience",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustSailingVehicle": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "SEGELN_ERLAUBT": 1,
        "SEGELN_NICHT_ERLAUBT": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "AdjustSailingVehicle",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AdjustEngineSoundVehicle": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AUSGEWOGEN": 7,
        "KEINE_AENDERUNG": 4,
        "MAXIMAL": 10,
        "MINIMAL": 6,
        "MOTORSOUND_FES_ABHAENGIG": 0,
        "MOTORSOUND_KOMFORTABEL": 2,
        "MOTORSOUND_SPORTLICH": 1,
        "MOTORSOUND_ZURUECKHALTEND": 3,
        "PROMINENT": 8,
        "RESERVIERT_FEHLER": 14,
        "RESERVIERT_NICHT_VERFUEGBAR": 13,
        "SEHR_PROMINENT": 9,
        "SIGNAL_UNBEFUELLT": 15,
        "SILENT": 5
      },
      "name": "AdjustEngineSoundVehicle",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupPreferenceElectricDriveDriving": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "AN": 1,
        "AUS": 0,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "SetupPreferenceElectricDriveDriving",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SetupBatteryControl": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "SIGNAL_UNBEFUELLT": 3,
        "SOC_HOLD_AKTIV": 1,
        "SOC_HOLD_NICHT_AKTIV": 0
      },
      "name": "SetupBatteryControl",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusSetupElectricMode": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ELECTRIC_MODE_AKTIV": 1,
        "HYBRID_AKTIV": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusSetupElectricMode",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.ActualValueTorque2Wrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "actualValueTorqueCrankshaft"
        }
      ],
      "name": "ActualValueTorque2Wrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.BasicDataSetWrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "lateralAccelerationCentreOfGravity"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierLateralAccelerationCentreOfGravity",
          "defaultValue": 15,
          "name": "qualifierLateralAccelerationCentreOfGravity"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "longitudinalAccelerationCentreOfGravity"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierLongitudinalAccelerationSchwerpunkt2",
          "defaultValue": 15,
          "name": "qualifierLongitudinalAccelerationCentreOfGravity"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "verticalAccelerationCenterOfGravity"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierVerticalAccelerationCentreOfGravity",
          "defaultValue": 15,
          "name": "qualifierVerticalAccelerationCenterOfGravity"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "groundUnevenessRightBackend"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationPushButtonHorn",
          "defaultValue": 3,
          "name": "operationHornButton"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "rpmEmETractSys1ActualValue"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "torquerpmEmETractSys1ActualValue"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue",
          "defaultValue": 15,
          "name": "qualifierRpmEmETractSys1ActualValue"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "rpmEmETractSys2ActualValue"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "torqueEmETractSys2ActualValue"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue",
          "defaultValue": 15,
          "name": "qualifierRpmEmETractSys2ActualValue"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "mueEstimatedTyresStreet"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "mueEstimatedTyresStreetErrorAmplitude"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "valueAirPressureMotor"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "valueTemperatureTransmissionOil"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "valueTemperatureDcDcConverter"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.OperationGearSelectionSwitch",
          "defaultValue": 15,
          "name": "operationGearSelectorSwitch"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRepartitionLongitudinalTorqueFrontAxleBackAxle",
          "defaultValue": 15,
          "name": "qualifierValueDistributionLongitudinalTorqueRearAxisFrontAxis"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "valueDistributionLongitudinalTorqueRearAxisFrontAxis"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "fillingLevelScrActiveTank"
        },
        {
          "dataRef": "UInt8",
          "name": "statusAutonomousDriving"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "valueTemperatureScrCatalyticConverter"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "valueTemperatureFuel"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "statusEngineSpeed"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRPMMotorCrankshaft",
          "defaultValue": 15,
          "name": "qualifierStatusEngineSpeed"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "statusVoltageIntelligentBoardnetSensor"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "valueFuelTankRelativePressure"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusCombustionEngineDrive",
          "defaultValue": 15,
          "name": "statusCombustionEngine"
        },
        {
          "dataRef": "de.bmw.infotainment.misctypes.MiscTypes.StatusAnnouncementMSAEngineStop",
          "defaultValue": 3,
          "name": "statusAnnouncementMSAEngine"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "dataFogUpWindowFront"
        }
      ],
      "name": "BasicDataSetWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierLateralAccelerationCentreOfGravity": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 4,
        "RESERVED_1": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierLateralAccelerationCentreOfGravity",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierLongitudinalAccelerationSchwerpunkt2": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 1,
        "RESERVED_1": 4,
        "RESERVED_2": 7,
        "RESERVED_3": 9,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierLongitudinalAccelerationSchwerpunkt2",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierVerticalAccelerationCentreOfGravity": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 1,
        "RESERVED_1": 4,
        "RESERVED_2": 9,
        "SENSOR_NICHT_VORHANDEN": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_NICHT_VERTRAUENSWUERDIG": 3,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUETLIG": 15
      },
      "name": "QualifierVerticalAccelerationCentreOfGravity",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationPushButtonHorn": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "HORN_MINUS_TASTER_GEDRUECKT": 1,
        "KEINE_AKTION": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "OperationPushButtonHorn",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierEMMotorActualValue": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "SIGNAL_UNBEFUELLT": 15,
        "WERT_GUELTIG_EINFACHE_QUALITAET": 2,
        "WERT_GUELTIG_EINGESCHRAENKT": 3,
        "WERT_GUELTIG_ERSATZWERT": 4,
        "WERT_GUELTIG_HOECHSTE_QUALITAET": 1,
        "WERT_GUELTIG_MITTLERE_QUALITAET": 9,
        "WERT_NICHT_VERFUEGBAR": 14,
        "WERT_NICHT_VERFUEGBAR_FEHLER": 6
      },
      "name": "QualifierEMMotorActualValue",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.OperationGearSelectionSwitch": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "D": 3,
        "INIT": 14,
        "L": 8,
        "M": 7,
        "M_MINUS": 4,
        "M_PLUS": 5,
        "M_S": 6,
        "N": 2,
        "NA": 0,
        "R": 1,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "OperationGearSelectionSwitch",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRepartitionLongitudinalTorqueFrontAxleBackAxle": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG__REKALIBRIERUNGSBEDARF": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueRepartitionLongitudinalTorqueFrontAxleBackAxle",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.QualifierActualValueRPMMotorCrankshaft": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FEHLER": 6,
        "INITIALISIERUNG": 8,
        "RESERVIERT": 14,
        "SIGNALWERT_IST_GUELTIG_NOCKENWELLENNOTLAUF": 2,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "QualifierActualValueRPMMotorCrankshaft",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusCombustionEngineDrive": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "MOTOR_IM_AUSLAUF": 3,
        "MOTOR_LAEUFT": 2,
        "MOTOR_STARTET": 1,
        "MOTOR_STEHT": 0,
        "RESERVIERT": 14,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusCombustionEngineDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.misctypes.MiscTypes.StatusAnnouncementMSAEngineStop": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ANKUENDIGUNG_MSA_MINUS_MOTORSTOPP": 1,
        "KEIN_ANKUENDIGUNG": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusAnnouncementMSAEngineStop",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.ActualValueRPMWheelWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "CRCActualValueRPMWheel"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveActualValueRPMWheel"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusRPMSource",
          "defaultValue": 15,
          "name": "dummy"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMWheelRLH"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMWheelRRH"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMWheelFLH"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMwheelFRH"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel",
          "defaultValue": 15,
          "name": "qualifierActualValueRPMWheelRLH"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel",
          "defaultValue": 15,
          "name": "qualifierActualValueRPMWheelRRH"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel",
          "defaultValue": 15,
          "name": "qualifierActualValueRPMWheelFLH"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel",
          "defaultValue": 15,
          "name": "qualifierActualValueRPMWheelFRH"
        }
      ],
      "name": "ActualValueRPMWheelWrapper",
      "type": "struct"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusRPMSource": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "RADDREHZAHLFUEHLER_NORMALEBENE": 0,
        "RADDREHZAHLFUEHLER_RUECKFALLEBENE": 1,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusRPMSource",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMWheel": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT": 4,
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT_ZUSTAND__S__STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 2,
        "RESERVED_1": 3,
        "RESERVED_2": 7,
        "RESERVED_3": 9,
        "RESERVED_4": 10,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNAL_UNGUELTIG": 15,
        "WERT_NICHT_VERFUEGBAR_FEHLER_ELEKTRISCH": 6,
        "WERT_NICHT_VERFUEGBAR_PLAUSIBILITAETSFEHLER": 14
      },
      "name": "QualifierActualValueRPMWheel",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.WheelMomentDrive4Wrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCWheelMomentDrive4"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveWheelMomentDrive4"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystemTargetLimit",
          "defaultValue": 15,
          "name": "statusInterfaceDriverAssistenceSystemTargetLimit"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusDrivingDirectionDriver_sChoice",
          "defaultValue": 15,
          "name": "statusDrivingDirectionDriversChoice"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMBackAxleRedundant",
          "defaultValue": 15,
          "name": "qualifierActualValueRPMBackAxleRedundant"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMBackAxleRedundant"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusPositiveEngagementPowerTrain",
          "defaultValue": 15,
          "name": "statusPositiveEngagementPowerTrain"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusAvailibilityInterventionPowerTrainDRS",
          "defaultValue": 3,
          "name": "statusAvailibilityInterventionPowerTrainDRS"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.ControlActivationPowerHop",
          "defaultValue": 3,
          "name": "dummy1"
        }
      ],
      "name": "WheelMomentDrive4Wrapper",
      "type": "struct"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystemTargetLimit": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRPEDAL_GETRETEN__FAHRERANFORDERUNG_GROESSER_FAS_MINUS_SOLLMOMENT_MINUS_LIM": 7,
        "FAHRPEDAL_GETRETEN__FAHRERANFORDERUNG_KLEINER_FAS_MINUS_SOLLMOMENT_MINUS_TAR": 5,
        "FAHRPEDAL_GETRETEN__FAHRERANF_P__GROESSER_FAS_MINUS_SOLLMOM_P__MINUS_TAR_U_P__S_OD_P__FAHRERANF_P__KL_P__FAS_MINUS_SOLLMOM_P__MINUS_LIM": 6,
        "FAHRPEDAL_GETRETEN__KEINE_FAS_MINUS_ANFORDERUNG": 4,
        "FAHRPEDAL_NICHT_GETRETEN__FAHRERANFORDERUNG_GROESSER_FAS_MINUS_SOLLMOMENT_MINUS_LIM": 3,
        "FAHRPEDAL_NICHT_GETRETEN__FAHRERANFORDERUNG_KLEINER_FAS_MINUS_SOLLMOMENT_MINUS_TAR": 1,
        "FAHRPEDAL_NICHT_GETRETEN__FAHRERANF_P__GR_P__FAS_MINUS_SOLLMOM_P__MINUS_TAR_U_P__S_OD_P__FAHRERANF_P__KL_P__FAS_MINUS_SOLLMOM_P__MINUS_LIM": 2,
        "FAHRPEDAL_NICHT_GETRETEN__KEINE_FAS_MINUS_ANFORDERUNG": 0,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusInterfaceDriverAssistenceSystemTargetLimit",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusDrivingDirectionDriver_sChoice": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRTRICHTUNGSWUNSCH_RUECKWAERTS": 5,
        "FAHRTRICHTUNGSWUNSCH_VORWAERTS": 4,
        "INITIALISIERUNG": 0,
        "KEIN_FAHRTRICHTUNGSWUNSCH_VORHANDEN": 2,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "StatusDrivingDirectionDriver_sChoice",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueRPMBackAxleRedundant": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "INITIALISIERUNG": 8,
        "SENSOR_NICHT_VORHANDEN": 7,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueRPMBackAxleRedundant",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusPositiveEngagementPowerTrain": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "INITIALISIERUNG": 0,
        "KEINE_KRAFTSCHLUSSINFO_ERMITTELBAR": 1,
        "KEIN_KRAFTSCHLUSS_ANTRIEB_RAD__AUSGEKUPPELT": 12,
        "KEIN_KRAFTSCHLUSS_ANTRIEB_RAD__KRAFTSCHLUSS_RAD__MINUS__KAROSSERIE": 14,
        "KEIN_KRAFTSCHLUSS_ANTRIEB_RAD__MANUELLER_SCHALTVORGANG_AKTIV": 13,
        "SIGNAL_UNGUELTIG": 15,
        "TEILWEISER_KRAFTSCHLUSS_ANTRIEB_RAD__AUTOMATISCHER_SCHALTVORGANG_AKTIV": 8,
        "TEILWEISER_KRAFTSCHLUSS_ANTRIEB_RAD__MANUELLER_SCHALTVORGANG_AKTIV": 9,
        "VOLLER_KRAFTSCHLUSS_ANTRIEB_RAD": 4
      },
      "name": "StatusPositiveEngagementPowerTrain",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusAvailibilityInterventionPowerTrainDRS": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "EINGRIFF_ERLAUBT": 1,
        "EINGRIFF_NICHT_ERLAUBT": 2,
        "EINGRIFF_NICHT_ERLAUBT_WEGEN_GWS_MINUS_BETAETIGUNG": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusAvailibilityInterventionPowerTrainDRS",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.ControlActivationPowerHop": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "POWER_HOP_AKTIV__MINUS__ANFORDERUNG_BREMSUNTERSTUETZUNG_SCHWELLE_1": 1,
        "POWER_HOP_AKTIV__MINUS__ANFORDERUNG_BREMSUNTERSTUETZUNG_SCHWELLE_2": 2,
        "POWER_HOP__MINUS__KEINE_BREMSUNTERSTUETZUNG_ANGEFORDERT": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "ControlActivationPowerHop",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.WheelMomentDrive1Wrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCWheelMomentDrive1"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveWheelMomentDrive1"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.DriverAvailibilityFast",
          "defaultValue": 15,
          "name": "driverAvailibilityFast"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "dummy1"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueWheelMomentPowerTrainSum",
          "defaultValue": 15,
          "name": "dummy2"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "dummy3"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "dummy4"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierReinforcementPowerTrain",
          "defaultValue": 15,
          "name": "dummy5"
        }
      ],
      "name": "WheelMomentDrive1Wrapper",
      "type": "struct"
    },
    "de.bmw.powertraintypes.PowertrainTypes.DriverAvailibilityFast": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRERANWESENHEIT_UNBEKANNT": 1,
        "FAHRER_ABWESEND": 2,
        "FAHRER_ANWESEND": 0,
        "FAHRER_VIRTUELL_ANWESEND": 5,
        "FUNKTION_MELDET_FEHLER": 14,
        "INIT": 4,
        "RANGIEREN_OHNE_GURT": 8,
        "RESERVIERT": 13,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "DriverAvailibilityFast",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueWheelMomentPowerTrainSum": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVIERT": 1,
        "RESERVIERT_1": 4,
        "RESERVIERT_2": 7,
        "RESERVIERT_3": 9,
        "RESERVIERT_4": 11,
        "RESERVIERT_5": 14,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueWheelMomentPowerTrainSum",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.QualifierReinforcementPowerTrain": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT": 4,
        "INITIALISIERUNG": 8,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierReinforcementPowerTrain",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.AnzeigeFahrdynamikWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "displayFLHWheelMoment"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "displayFRHWheelMoment"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "displayRLHWheelMoment"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "displayRRHWheelMoment"
        },
        {
          "dataRef": "UInt8",
          "name": "controlWheelMomentDisplay"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "displayLongitudinalGradientRoadway"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "displayLongitudinalGradientRoadwayPercent"
        }
      ],
      "name": "AnzeigeFahrdynamikWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.SteeringAngleDriverWrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueSteeringAngleDriver"
        },
        {
          "dataRef": "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.QualifierActualValueSteeringAngleDriver1",
          "defaultValue": 15,
          "name": "qualifierActualValueSteeringAngleDriver"
        }
      ],
      "name": "SteeringAngleDriverWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.QualifierActualValueSteeringAngleDriver1": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_PERMANENT": 4,
        "INITIALISIERUNG": 8,
        "SENSOR_NICHT_VORHANDEN": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_PERMANENT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT__ZUSTAND_S_STATUS_PERMANENT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_PERMANENT": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_PERMANENT": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueSteeringAngleDriver1",
      "type": "enum"
    },
    "de.bmw.infotainment.drivingexcitementtypes.DrivingExcitementTypes.StatusFrontAxleSteeringAngleWrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "steeringAngleFrontAxleEffective"
        }
      ],
      "name": "StatusFrontAxleSteeringAngleWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.VehicleSpeedWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveSpeedVehicle"
        },
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusSpeedVehicleNearStandstill",
          "defaultValue": 15,
          "name": "statusSpeedVehicleNearStandstill"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "speedVehicleCentreOfGravity"
        },
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierSpeedVehicleCentreOfGravity",
          "defaultValue": 15,
          "name": "qualifierSpeedVehicleCentreOfGravity"
        }
      ],
      "name": "VehicleSpeedWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusSpeedVehicleNearStandstill": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRZEUG_IM_STILLSTANDSNAHEN_BEREICH": 12,
        "FAHRZEUG_NICHT_IM_STILLSTANDSNAHEN_BEREICH": 13,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "StatusSpeedVehicleNearStandstill",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierSpeedVehicleCentreOfGravity": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "INITIALISIERUNG": 8,
        "RESERVED": 2,
        "RESERVED_1": 3,
        "RESERVED_2": 4,
        "RESERVED_3": 6,
        "RESERVED_4": 7,
        "RESERVED_5": 9,
        "RESERVED_6": 12,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierSpeedVehicleCentreOfGravity",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.CharacteristicSpeedWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "characteristicSpeed"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "characteristicSpeedErrorAmplitude"
        },
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierCharacteristicSpeed",
          "defaultValue": 15,
          "name": "qualifierCharacteristicSpeed"
        }
      ],
      "name": "CharacteristicSpeedWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierCharacteristicSpeed": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT": 4,
        "INITIALISIERUNG": 8,
        "RESERVED": 1,
        "RESERVED_1": 6,
        "RESERVED_2": 9,
        "RESERVED_3": 10,
        "RESERVED_4": 11,
        "RESERVED_5": 12,
        "RESERVED_6": 14,
        "SENSOR_NICHT_VORHANDEN": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierCharacteristicSpeed",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.LateralAccelerationCenterOfGravityWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCLongitudinalAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveLongitudinalAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "name": "dummy"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "lateralAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "lateralAccelerationCentreOfGravityErrorAmplitude"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierLateralAccelerationCentreOfGravity",
          "defaultValue": 15,
          "name": "qualifierLateralAccelerationCentreOfGravity"
        }
      ],
      "name": "LateralAccelerationCenterOfGravityWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierLateralAccelerationCentreOfGravity": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 4,
        "RESERVED_1": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierLateralAccelerationCentreOfGravity",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.LongitudinalAccelerationCentreOfGravityWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCLongitudinalAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveLongitudinalAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "name": "dummy"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "longitudinalAccelerationCentreOfGravity"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "longitudinalAccelerationCentreOfGravityErrorAmplitude"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierLongitudinalAccelerationSchwerpunkt2",
          "defaultValue": 15,
          "name": "qualifierLongitudinalAccelerationCentreOfGravity"
        }
      ],
      "name": "LongitudinalAccelerationCentreOfGravityWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierLongitudinalAccelerationSchwerpunkt2": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 1,
        "RESERVED_1": 4,
        "RESERVED_2": 7,
        "RESERVED_3": 9,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierLongitudinalAccelerationSchwerpunkt2",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.YawSpeedVehicleWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCYawVelocityVehicle"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveYawVelocityVehicle"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "name": "dummy"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "yawVelocityVehicle"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "yawVelocityVehicleErrorAmplitude"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierYawVelocityVehicle",
          "defaultValue": 15,
          "name": "qualifierYawVelocityVehicle"
        }
      ],
      "name": "YawSpeedVehicleWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierYawVelocityVehicle": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT__ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 4,
        "RESERVED_1": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG": 2,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierYawVelocityVehicle",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.DrivingDirectionWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleConfirmed",
          "defaultValue": 15,
          "name": "drivingDirectionConfirmed"
        },
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleUnconfirmed",
          "defaultValue": 15,
          "name": "drivingDirectionUnconfirmed"
        },
        {
          "dataRef": "UInt8",
          "name": "dummy"
        }
      ],
      "name": "DrivingDirectionWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleConfirmed": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRZEUG_FAEHRT": 3,
        "FAHRZEUG_FAEHRT_RUECKWAERTS": 2,
        "FAHRZEUG_FAEHRT_VORWAERTS": 1,
        "FAHRZEUG_STEHT": 0,
        "FUNKTION_MELDET_FEHLER": 14,
        "RESERVIERT": 13,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "DrivingDirectionVehicleConfirmed",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.DrivingDirectionVehicleUnconfirmed": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRZEUG_FAEHRT": 3,
        "FAHRZEUG_FAEHRT_RUECKWAERTS": 2,
        "FAHRZEUG_FAEHRT_VORWAERTS": 1,
        "FAHRZEUG_STEHT": 0,
        "FUNKTION_MELDET_FEHLER": 14,
        "RESERVIERT": 13,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "DrivingDirectionVehicleUnconfirmed",
      "type": "enum"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.CarSpeed2Wrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "speedVehicleCentreOfGravity"
        }
      ],
      "name": "CarSpeed2Wrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusDisplayedCCMessageWrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "statusNumberCheckControlMessageDisplay"
        }
      ],
      "name": "StatusDisplayedCCMessageWrapper",
      "type": "struct"
    },
    "de.bmw.infrastructuretypes.InfrastructureTypes.StatusGearboxDriveWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCStatusGearboxDrive"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "alivStatusGearboxDrive"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "cHLStatusGearboxDrive"
        },
        {
          "bitWidth": 3,
          "dataRef": "de.bmw.infrastructuretypes.InfrastructureTypes.StatusStageDrive",
          "defaultValue": 7,
          "name": "statusActualStageDrive"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.infrastructuretypes.InfrastructureTypes.StatusActualGearDrive",
          "defaultValue": 15,
          "name": "statusActualGearDrive"
        },
        {
          "bitWidth": 1,
          "dataRef": "UInt8",
          "name": "dummy1"
        },
        {
          "bitWidth": 3,
          "dataRef": "de.bmw.infrastructuretypes.InfrastructureTypes.StatusStageDrive",
          "defaultValue": 7,
          "name": "statusTargetStageDrive"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "dummy2"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "qualifierStatusActualStageDrive"
        },
        {
          "bitWidth": 1,
          "dataRef": "UInt8",
          "name": "dummy3"
        }
      ],
      "name": "StatusGearboxDriveWrapper",
      "type": "struct"
    },
    "de.bmw.infrastructuretypes.InfrastructureTypes.StatusStageDrive": {
      "bitWidth": 3,
      "defaultValue": 7,
      "enumWidth": 1,
      "items": {
        "D": 4,
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 5,
        "FUNKTION_MELDET_FEHLER": 6,
        "INITIALISIERUNG": 0,
        "N": 3,
        "P": 1,
        "R": 2,
        "SIGNAL_UNBEFUELLT": 7
      },
      "name": "StatusStageDrive",
      "type": "enum"
    },
    "de.bmw.infrastructuretypes.InfrastructureTypes.StatusActualGearDrive": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "G1": 3,
        "G10": 12,
        "G2": 4,
        "G3": 5,
        "G4": 6,
        "G5": 7,
        "G6": 8,
        "G7": 9,
        "G8": 10,
        "G9": 11,
        "INITIALISIERUNG": 0,
        "N_OR_P": 2,
        "R": 1,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusActualGearDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusEngineSpeed2Wrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueRPMEngineCrankshaft"
        }
      ],
      "name": "StatusEngineSpeed2Wrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.EngineStatusWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusEngineRunDrive",
          "defaultValue": 3,
          "name": "statusEngineRunDrive"
        }
      ],
      "name": "EngineStatusWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusEngineRunDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "MOTOR_AUS": 0,
        "MOTOR_LAEUFT": 2,
        "MOTOR_STARTET": 1,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusEngineRunDrive",
      "type": "enum"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.EngineTemperatureWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "temperatureEngineDrive"
        },
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "temperatureEngineOilDrive"
        }
      ],
      "name": "EngineTemperatureWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusBattery2Wrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "defaultValue": 255,
          "name": "conditionBatteryChargingCondition"
        }
      ],
      "name": "StatusBattery2Wrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusHandBrakeWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusContactHandBrake",
          "defaultValue": 3,
          "name": "statusContactHandBrake"
        }
      ],
      "name": "StatusHandBrakeWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusContactHandBrake": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "HANDBREMSE_ANGEZOGEN": 2,
        "HANDBREMSE_GELOEST": 1,
        "NICHT_CODIERT": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusContactHandBrake",
      "type": "enum"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.StatusGearIndicatorWrapper": {
      "members": [
        {
          "dataRef": "de.bmw.infotainment.vehicletypes.VehicleTypes.DisplayGearShiftIndicatorDrive",
          "defaultValue": 3,
          "name": "displayGearShiftIndicatorDrive"
        }
      ],
      "name": "StatusGearIndicatorWrapper",
      "type": "struct"
    },
    "de.bmw.infotainment.vehicletypes.VehicleTypes.DisplayGearShiftIndicatorDrive": {
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ANZEIGE_AUS": 0,
        "HOCHSCHALTHINWEIS": 2,
        "RUNTERSCHALTHINWEIS": 1,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "DisplayGearShiftIndicatorDrive",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.AngleAcceleratorPedalWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCAngleAcceleratorPedal"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveAngleAcceleratorPedal"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusECU",
          "defaultValue": 15,
          "name": "dummy"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "actualValueAngleAcceleratorPedal"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueAngleAcceleratorPedal",
          "defaultValue": 15,
          "name": "qualifierActualValueAngleAcceleratorPedal"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "actualValueAngleAcceleratorPedalVirtual"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "gradientActualValueAngleAcceleratorPedal"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystem",
          "defaultValue": 15,
          "name": "dummy2"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.powertraintypes.PowertrainTypes.ECOAngleAcceleratorPedal",
          "defaultValue": 3,
          "name": "dummy3"
        },
        {
          "bitWidth": 2,
          "dataRef": "UInt8",
          "name": "dummy4"
        }
      ],
      "name": "AngleAcceleratorPedalWrapper",
      "type": "struct"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusECU": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "SIGNAL_UNGUELTIG": 15,
        "ZUSTAND_DIAGNOSE": 4,
        "ZUSTAND_DIAGNOSE_S_UEBERSPANNUNG_SENSIERT": 5,
        "ZUSTAND_DIAGNOSE_S_UNTERSPANNUNG_SENSIERT": 6,
        "ZUSTAND_INITIALISIERUNG": 0,
        "ZUSTAND_NICHT_VERFUEGBAR": 9,
        "ZUSTAND_NORMALBETRIEB": 1,
        "ZUSTAND_NORMALBETRIEB_S_UEBERSPANNUNG_SENSIERT": 2,
        "ZUSTAND_NORMALBETRIEB_S_UNTERSPANNUNG_SENSIERT": 3,
        "ZUSTAND_POWERDOWN": 7,
        "ZUSTAND_POWERSAVE": 8,
        "ZUSTAND_RESERVIERT_11": 11,
        "ZUSTAND_RESERVIERT_12": 12,
        "ZUSTAND_RESERVIERT_13": 13,
        "ZUSTAND_RESERVIERT_14": 14,
        "ZUSTAND_RESET": 10
      },
      "name": "StatusECU",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.QualifierActualValueAngleAcceleratorPedal": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVIERT": 2,
        "RESERVIERT_1": 3,
        "RESERVIERT_2": 4,
        "RESERVIERT_3": 7,
        "RESERVIERT_4": 9,
        "RESERVIERT_5": 10,
        "RESERVIERT_6": 11,
        "RESERVIERT_7": 14,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueAngleAcceleratorPedal",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.StatusInterfaceDriverAssistenceSystem": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FAHRPEDAL_MINUS__FAHRER_MINUS___ANFORDERUNG_GROESSER_FAS_MINUS_ANFORDERUNG": 3,
        "FAHRPEDAL_MINUS__FAHRER_MINUS___ANFORDERUNG_KLEINER_FAS_MINUS_ANFORDERUNG": 7,
        "FAHRPEDAL_MINUS__FAHRER_MINUS___ANFORDERUNG__KEINE_FAS_MINUS_ANFORDERUNG": 1,
        "INITIALISIERUNG": 8,
        "KEINE_FAHRPEDAL_MINUS__FAHRER_MINUS___ANFORDERUNG__FAS_MINUS_ANFORDERUNG": 2,
        "KEINE_FAHRPEDAL_MINUS__FAHRER_MINUS___ANFORDERUNG__KEINE_FAS_MINUS_ANFORDERUNG": 0,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "StatusInterfaceDriverAssistenceSystem",
      "type": "enum"
    },
    "de.bmw.powertraintypes.PowertrainTypes.ECOAngleAcceleratorPedal": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "LASTANFORDERUNG_AUSSERHALB_DES_EFFIZIENTEN_ANTRIEBSBEREICHS": 1,
        "LASTANFORDERUNG_IM_EFFIZIENTEN_ANTRIEBSBEREICH": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "ECOAngleAcceleratorPedal",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StabilizationManagementWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCStatusStabilisationDSC"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveStatusStabilisationDSC"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusECUReserved",
          "defaultValue": 15,
          "name": "dummy"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "qualifierFunctionFDR"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "qualifierFunctionABS"
        },
        {
          "bitWidth": 12,
          "dataRef": "UInt16",
          "defaultValue": 4095,
          "name": "qualifierFunctionASC"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "statusBrakingMSA"
        },
        {
          "bitWidth": 6,
          "dataRef": "UInt8",
          "defaultValue": 63,
          "name": "statusBrakingDriver"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusUnitRunDSC",
          "defaultValue": 3,
          "name": "statusUnitRunDSC"
        }
      ],
      "name": "StabilizationManagementWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusECUReserved": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "RESERVIERT": 0,
        "RESERVIERT_1": 1,
        "RESERVIERT_10": 10,
        "RESERVIERT_11": 11,
        "RESERVIERT_12": 12,
        "RESERVIERT_13": 13,
        "RESERVIERT_14": 14,
        "RESERVIERT_2": 2,
        "RESERVIERT_3": 3,
        "RESERVIERT_4": 4,
        "RESERVIERT_5": 5,
        "RESERVIERT_6": 6,
        "RESERVIERT_7": 7,
        "RESERVIERT_8": 8,
        "RESERVIERT_9": 9,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "StatusECUReserved",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusUnitRunDSC": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "DSC_MINUS_AGGREGAT_IM_HARTANLAUF_ODER_IM_STATIONAEREN_BETRIEB_MIT_HOHER_DYNAMIK": 1,
        "DSC_MINUS_AGGREGAT_IM_SOFTANLAUF_ODER_IM_STATIONAEREN_BETRIEB_MIT_NIEDRIGER_DYNAMIK": 2,
        "DSC_MINUS_AGGREGAT_IM_STANDBY": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "StatusUnitRunDSC",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StandStillFunctionWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCStatusStandstillFunctionDSC"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveStatusStandstillFunctionDSC"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "cHLStatusStandstillFunctionDSC"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusRollbackRisk",
          "defaultValue": 3,
          "name": "statusRollbackRisk"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusHillholdAssistant",
          "defaultValue": 3,
          "name": "statusHillholdAssistant"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusAutoH",
          "defaultValue": 3,
          "name": "statusAutoH"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusHydraulicDynamicBrakingFunction",
          "defaultValue": 3,
          "name": "statusHydraulicDynamicBrakingFunction"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusParkingBrake",
          "defaultValue": 15,
          "name": "statusParkingBrake"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.RequestDriveTorqueReductionStandstillFunction",
          "defaultValue": 3,
          "name": "requestDriveTorqueReductionStandstillFunction"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.ControlLedAutoHold",
          "defaultValue": 3,
          "name": "dummy1"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.OperationPushButtonEPB",
          "defaultValue": 15,
          "name": "operationPushButtonEPB"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierFunctionPostcrashIBrake",
          "defaultValue": 15,
          "name": "qualifierFunctionPostcrashIBrake"
        },
        {
          "bitWidth": 24,
          "dataRef": "UInt32",
          "name": "dummy2"
        }
      ],
      "name": "StandStillFunctionWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusRollbackRisk": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "KEINE_RUECKROLLGEFAHR_ENTGEGEN_FAHRTRICHTUNG_FAHRERWUNSCH_BEIM_LOESEN_DER_BREMSE": 0,
        "RUECKROLLGEFAHR_ENTGEGEN_DER_FAHRTRICHTUNG_FAHRERWUNSCH_BEIM_LOESEN_DER_BREMSE": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusRollbackRisk",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusHillholdAssistant": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ANFAHRASSISTENT_HAELT_FAHRZEUG": 1,
        "ANFAHRASSISTENT_HAELT_FAHRZEUG_NICHT": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusHillholdAssistant",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusAutoH": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AUTOH_AKTIVIERT_UND_HAELT_FAHRZEUG": 2,
        "AUTOH_AKTIVIERT_UND_HAELT_FAHRZEUG_NICHT": 1,
        "AUTOH_NICHT_AKTIVIERT": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusAutoH",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusHydraulicDynamicBrakingFunction": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "HYDRAULISCHES_DYNAMISCHES_ABBREMSEN_AKTIV": 1,
        "HYDRAULISCHES_DYNAMISCHES_ABBREMSEN_NICHT_AKTIV": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "StatusHydraulicDynamicBrakingFunction",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusParkingBrake": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "PARKBREMSE_IM_STELLVORGANG_FESTSTELLEN": 4,
        "PARKBREMSE_IM_STELLVORGANG_LOESEN": 2,
        "PARKBREMSE_MECHANISCH_FESTGESTELLT": 1,
        "PARKBREMSE_MECHANISCH_NICHT_FESTGESTELLT": 0,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "StatusParkingBrake",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.RequestDriveTorqueReductionStandstillFunction": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "ANFORDERUNG_ANTRIEBSMOMENTENREDUZIERUNG": 1,
        "KEINE_ANFORDERUNG_ANTRIEBSMOMENTENREDUZIERUNG": 0,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "RequestDriveTorqueReductionStandstillFunction",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.ControlLedAutoHold": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "AUTOHOLD_NICHT_VERBAUT": 2,
        "LED_AUS": 0,
        "LED_EIN": 1,
        "SIGNAL_UNBEFUELLT": 3
      },
      "name": "ControlLedAutoHold",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.OperationPushButtonEPB": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 13,
        "FUNKTION_MELDET_FEHLER": 14,
        "SIGNAL_UNBEFUELLT": 15,
        "TASTER_DEFEKT": 4,
        "TASTER_GEDRUECKT": 2,
        "TASTER_GEZOGEN": 1,
        "TASTER_NICHT_BETAETIGT": 0
      },
      "name": "OperationPushButtonEPB",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierFunctionPostcrashIBrake": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "FUNKTIONSSCHNITTSTELLE_IST_NICHT_VERFUEGBAR": 14,
        "FUNKTION_AKTIV": 9,
        "FUNKTION_BEREIT": 1,
        "FUNKTION_MELDET_FEHLER": 6,
        "SIGNAL_UNBEFUELLT": 15
      },
      "name": "QualifierFunctionPostcrashIBrake",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.ActualSteeringAngleDriverWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCActualValueSteeringAngleDriver"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveActualValueSteeringAngleDriver"
        },
        {
          "bitWidth": 2,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.ControlHandsOffRecognition",
          "defaultValue": 3,
          "name": "controlHandsOffRecognitionVehicleGuiding"
        },
        {
          "bitWidth": 2,
          "dataRef": "UInt8",
          "name": "dummy1"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueSteeringAngleDriver"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueSteeringAngleVelocityDriver"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "name": "dummy2"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierActualValueSteeringAngleDriver1",
          "defaultValue": 15,
          "name": "qualifierActualValueSteeringAngleDriver"
        }
      ],
      "name": "ActualSteeringAngleDriverWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.ControlHandsOffRecognition": {
      "bitWidth": 2,
      "defaultValue": 3,
      "enumWidth": 1,
      "items": {
        "HANDS_MINUS_OFF_AUSSCHALTEN": 1,
        "HANDS_MINUS_OFF_EINSCHALTEN": 2,
        "HANDS_MINUS_OFF_SLEEPMODE": 0,
        "SIGNAL_UNGUELTIG": 3
      },
      "name": "ControlHandsOffRecognition",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierActualValueSteeringAngleDriver1": {
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ABGLEICHWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_TEMPORAER": 12,
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT___ZUSTAND_S_STATUS_PERMANENT": 4,
        "INITIALISIERUNG": 8,
        "SENSOR_NICHT_VORHANDEN": 7,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_PERMANENT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT__ZUSTAND_S_STATUS_PERMANENT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_PERMANENT": 2,
        "SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 10,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_PERMANENT": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierActualValueSteeringAngleDriver1",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.ActualSteeringAngleDriverNoCRCWrapper": {
      "members": [
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "actualValueSteeringAngleDriver"
        },
        {
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierActualValueSteeringAngleDriver1",
          "defaultValue": 15,
          "name": "qualifierSteeringAngleDriver"
        }
      ],
      "name": "ActualSteeringAngleDriverNoCRCWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.SteeringAngleFrontAxleEffectiveWrapper": {
      "members": [
        {
          "dataRef": "UInt8",
          "name": "cRCSteeringAngleFrontAxleEffective"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "aliveSteeringAngleFrontAxleEffective"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.StatusECU",
          "defaultValue": 15,
          "name": "dummy"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "steeringAngleFrontAxleEffective"
        },
        {
          "bitWidth": 4,
          "dataRef": "de.bmw.chassistypes.ChassisTypes.QualifierSteeringAngleFrontAxleEffektiv2",
          "defaultValue": 15,
          "name": "qualifierSteeringAngleFrontAxleEffective"
        },
        {
          "bitWidth": 4,
          "dataRef": "UInt8",
          "defaultValue": 15,
          "name": "statusConditionSteeringAngle"
        },
        {
          "dataRef": "UInt16",
          "defaultValue": 65535,
          "name": "steeringAngleFrontAxleEffectiveErrorAmplitude"
        }
      ],
      "name": "SteeringAngleFrontAxleEffectiveWrapper",
      "type": "struct"
    },
    "de.bmw.chassistypes.ChassisTypes.StatusECU": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "SIGNAL_UNGUELTIG": 15,
        "ZUSTAND_DIAGNOSE": 4,
        "ZUSTAND_DIAGNOSE_S_UEBERSPANNUNG_SENSIERT": 5,
        "ZUSTAND_DIAGNOSE_S_UNTERSPANNUNG_SENSIERT": 6,
        "ZUSTAND_INITIALISIERUNG": 0,
        "ZUSTAND_NICHT_VERFUEGBAR": 9,
        "ZUSTAND_NORMALBETRIEB": 1,
        "ZUSTAND_NORMALBETRIEB_S_UEBERSPANNUNG_SENSIERT": 2,
        "ZUSTAND_NORMALBETRIEB_S_UNTERSPANNUNG_SENSIERT": 3,
        "ZUSTAND_POWERDOWN": 7,
        "ZUSTAND_POWERSAVE": 8,
        "ZUSTAND_RESERVIERT_11": 11,
        "ZUSTAND_RESERVIERT_12": 12,
        "ZUSTAND_RESERVIERT_13": 13,
        "ZUSTAND_RESERVIERT_14": 14,
        "ZUSTAND_RESET": 10
      },
      "name": "StatusECU",
      "type": "enum"
    },
    "de.bmw.chassistypes.ChassisTypes.QualifierSteeringAngleFrontAxleEffektiv2": {
      "bitWidth": 4,
      "defaultValue": 15,
      "enumWidth": 1,
      "items": {
        "ERSATZWERT_IST_IM_NUTZSIGNAL_GESETZT__ZUSTAND_S_STATUS_TEMPORAER": 12,
        "INITIALISIERUNG": 8,
        "RESERVED": 2,
        "RESERVED_1": 4,
        "RESERVED_2": 7,
        "RESERVED_3": 10,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT": 3,
        "SIGNALQUALITAET_BZW_P__UEBERWACHUNG_EINGESCHRAENKT__ZUSTAND_S_STATUS_TEMPORAER": 11,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT": 1,
        "SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER": 9,
        "SIGNALWERT_IST_UNGUELTIG": 6,
        "SIGNALWERT_IST_UNGUELTIG__ZUSTAND_S_STATUS_TEMPORAER": 14,
        "SIGNAL_UNGUELTIG": 15
      },
      "name": "QualifierSteeringAngleFrontAxleEffektiv2",
      "type": "enum"
    },
    "com.harman.infotainment.systemfunctions.tasu.TasuTypes.TasuExclusiveMode": {
      "items": {
        "EXCLUSIVE_MODE": 1,
        "NO_RESTRICTION": 0
      },
      "name": "TasuExclusiveMode",
      "type": "enum"
    }
  },
  "writeTypes": {
    "mSystem": "de.bmw.infotainment.misctypes.MiscTypes.ControlMSystemWrapper",
    "operationMSystemsMDrive": "de.bmw.infotainment.misctypes.MiscTypes.OperationMSystemsMDriveWrapper"
  }
};
