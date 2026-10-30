'use strict';
module.exports =
{
  "method": "Offline EDIABAS OBJECT tables: header0x84, entries80bytes, XORF7 after0xA0, NUL cp1252 cells. No target code executed.",
  "sources": {
    "dme8ff_r.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\dme8ff_r.prg",
      "sha256": "58a35c5c20314f309ee0e6fc2ea82094ba81e6eda6c7ee87517e035d0387254a",
      "tableDirectoryOffset": 6268912,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 6325956,
          "dataOffset": 5775663,
          "columns": 16,
          "rows": 2556,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "ASW_EL_AGK",
              "0x62FD",
              "STAT_ASW_EAGK_WERT",
              "Ansteuerwert vom Tester zur Ansteuerung elektrische Abgasklappe auslesen",
              "%",
              "tvakr_w_msg",
              "High",
              "signed int",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "-",
              "22",
              "-",
              "-"
            ],
            [
              "ASG_EL_AGK",
              "0x64FD",
              "STAT_ASG_EAGK_WERT",
              "Ausgangsstellgroesse zur Ansteuerung elektrische Abgasklappe auslesen",
              "%",
              "tvakr_w_msg",
              "High",
              "signed int",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "-",
              "22",
              "-",
              "-"
            ],
            [
              "ASW_GER_EL_AGK",
              "0x631E",
              "-",
              "Ansteuerwert geregelte Elektrische Abgasklappe auslesen",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x631E_D"
            ],
            [
              "ASG_GER_EL_AGK",
              "0x651E",
              "-",
              "Ausgangsstellgroesse vom Tester geregelte Elektrische Abgasklappe auslesen",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x651E_D"
            ]
          ]
        },
        {
          "name": "RES_0X631E_D",
          "directoryOffset": 6315316,
          "dataOffset": 5629387,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_ASW_GER_EL_AGK_WERT",
              "%",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "81.92",
              "0.0",
              "Ansteuerwert geregelte elektrische Abgasklapppe"
            ],
            [
              "STAT_ASW_GER_EL_AGK_BANK2_WERT",
              "%",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "81.92",
              "0.0",
              "Ansteuerwert Bank 2 geregelte elektrische Abgasklappe"
            ]
          ]
        },
        {
          "name": "RES_0X651E_D",
          "directoryOffset": 6315396,
          "dataOffset": 5629677,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_ASG_GER_EL_AGK_WERT",
              "%",
              "high",
              "unsigned int",
              "-",
              "-",
              "0.00152588",
              "1.0",
              "0.0",
              "Ausgangsstellgroesse vom Tester zum Ansteuerwert geregelte elektrische Abgasklapppe"
            ],
            [
              "STAT_ASG_GER_EL_AGK_BANK2_WERT",
              "%",
              "high",
              "unsigned int",
              "-",
              "-",
              "0.00152588",
              "1.0",
              "0.0",
              "Ausgangsstellgroesse vom Tester Bank 2 zum Ansteuerwert geregelte elektrische Abgasklappe"
            ]
          ]
        }
      ]
    },
    "dme8ff_l.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\dme8ff_l.prg",
      "sha256": "681a6a0303b241c50ab6bc9f879260f2dfb64dc09b4c880c2cea86c871385537",
      "tableDirectoryOffset": 6094800,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 6144804,
          "dataOffset": 5625248,
          "columns": 16,
          "rows": 2444,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "ASW_EL_AGK",
              "0x62FD",
              "STAT_ASW_EAGK_WERT",
              "Ansteuerwert vom Tester zur Ansteuerung elektrische Abgasklappe auslesen",
              "%",
              "tvakr_w_msg",
              "High",
              "signed int",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "-",
              "22",
              "-",
              "-"
            ],
            [
              "ASG_EL_AGK",
              "0x64FD",
              "STAT_ASG_EAGK_WERT",
              "Ausgangsstellgroesse zur Ansteuerung elektrische Abgasklappe auslesen",
              "%",
              "tvakr_w_msg",
              "High",
              "signed int",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "-",
              "22",
              "-",
              "-"
            ],
            [
              "ASW_GER_EL_AGK",
              "0x631E",
              "-",
              "Ansteuerwert geregelte Elektrische Abgasklappe auslesen",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x631E_D"
            ],
            [
              "ASG_GER_EL_AGK",
              "0x651E",
              "-",
              "Ausgangsstellgroesse vom Tester geregelte Elektrische Abgasklappe auslesen",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x651E_D"
            ]
          ]
        },
        {
          "name": "RES_0X631E_D",
          "directoryOffset": 6134884,
          "dataOffset": 5525142,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_ASW_GER_EL_AGK_WERT",
              "%",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "81.92",
              "0.0",
              "Ansteuerwert geregelte elektrische Abgasklapppe"
            ],
            [
              "STAT_ASW_GER_EL_AGK_BANK2_WERT",
              "%",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "81.92",
              "0.0",
              "Ansteuerwert Bank 2 geregelte elektrische Abgasklappe"
            ]
          ]
        },
        {
          "name": "RES_0X651E_D",
          "directoryOffset": 6134964,
          "dataOffset": 5525432,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_ASG_GER_EL_AGK_WERT",
              "%",
              "high",
              "unsigned int",
              "-",
              "-",
              "0.00152588",
              "1.0",
              "0.0",
              "Ausgangsstellgroesse vom Tester zum Ansteuerwert geregelte elektrische Abgasklapppe"
            ],
            [
              "STAT_ASG_GER_EL_AGK_BANK2_WERT",
              "%",
              "high",
              "unsigned int",
              "-",
              "-",
              "0.00152588",
              "1.0",
              "0.0",
              "Ausgangsstellgroesse vom Tester Bank 2 zum Ansteuerwert geregelte elektrische Abgasklappe"
            ]
          ]
        }
      ]
    },
    "lmv_g11.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\lmv_g11.prg",
      "sha256": "4b29690b6b35af7bef4bdbf6326d400e02204bf4d16b9e02e16479ef0e68769c",
      "tableDirectoryOffset": 984032,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 988356,
          "dataOffset": 979410,
          "columns": 16,
          "rows": 33,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "LMV_MOMENT",
              "0xDB32",
              "-",
              "LMV Drehmomenten Istwert und Qualifier auslesen",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDB32_D"
            ],
            [
              "KUPPLUNGSSTATUS",
              "0xDFEA",
              "-",
              "Service - Qualifier des LMV",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDFEA_D"
            ],
            [
              "STATUS_CC_ECU_DATA",
              "0x4004",
              "-",
              "Interne SG-Daten des CC ausgeben",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x4004_D"
            ],
            [
              "STATUS_NIA",
              "0x4005",
              "-",
              "Status NIA",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0x4005_D"
            ]
          ]
        },
        {
          "name": "RES_0XDB32_D",
          "directoryOffset": 987396,
          "dataOffset": 963308,
          "columns": 10,
          "rows": 4,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_ISTMOMENT_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "4.0",
              "0.0",
              "Istwert des Moments zur Vorderachse - LMV"
            ],
            [
              "STAT_QUALIFIER_ISTMOMENT_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualifier zum Istmoment"
            ],
            [
              "STAT_SOLLMOMENT_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "4.0",
              "0.0",
              "Sollwert des Moments zur Vorderachse - LMV"
            ],
            [
              "STAT_QUALIFIER_SOLLMOMENT_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualifier zum Sollmoment"
            ]
          ]
        },
        {
          "name": "RES_0XDFEA_D",
          "directoryOffset": 987796,
          "dataOffset": 971194,
          "columns": 10,
          "rows": 7,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_QU_SER_BASIS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Service Basis - Qualifier des LMV"
            ],
            [
              "STAT_QU_SER_NOTLAUF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Notlaufregler"
            ],
            [
              "STAT_QU_SER_POSITION_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Position LMV Stellglied"
            ],
            [
              "STAT_QU_SER_SCHUTZ_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "LMV Schutzfunktion"
            ],
            [
              "STAT_QU_LMV_LUEFTSTATUS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Position LMV gelüftet/nicht gelüftet (Normalbetrieb)"
            ],
            [
              "STAT_QU_SER_VV_KUPPLUNG_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Verfügbarkeit Kupplung"
            ],
            [
              "STAT_QU_SER_VV_STELLGLIED_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Verfügbarkeit Stellglied"
            ]
          ]
        },
        {
          "name": "RES_0X4004_D",
          "directoryOffset": 986836,
          "dataOffset": 956119,
          "columns": 10,
          "rows": 31,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_TMPBLADE_WERT",
              "°C",
              "high",
              "signed long",
              "-",
              "-",
              "1.0",
              "4194304.0",
              "0.0",
              "Temperatur der Lamellen"
            ],
            [
              "STAT_CNTMISUSEDETLOW_WERT",
              "count",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "EE_cntMisUseDetLow"
            ],
            [
              "STAT_WORKCHAIN_WERT",
              "kWh",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Work chain lifetime integration value"
            ],
            [
              "STAT_WORKCLUTCH_WERT",
              "kWh",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Kupplungsarbeit Lebenszeit Integratorwert"
            ],
            [
              "STAT_WORKOIL_WERT",
              "kWh",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "Oil work "
            ],
            [
              "STAT_CMDBACKUPFCN_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Backup function request "
            ],
            [
              "STAT_DELTAPHICLUTCH_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "4096.0",
              "0.0",
              "Clutch differential speed in rad per 10 ms "
            ],
            [
              "STAT_PRCTMPSTRESSCLUTCH_WERT",
              "%",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "V_GuardCluC10_prcTmpStressClu "
            ],
            [
              "STAT_IBLDC_WERT",
              "A",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "512.0",
              "0.0",
              "Measured actuator current "
            ],
            [
              "STAT_NATR_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "128.0",
              "0.0",
              "Measured and worm gear ratio corrected actuator rotational speed "
            ],
            [
              "STAT_PHIATR_WERT",
              "°",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "64.0",
              "0.0",
              "Measured actuator angle "
            ],
            [
              "STAT_UBATT_WERT",
              "V",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Measured battery voltage "
            ],
            [
              "STAT_UBLDC_WERT",
              "V",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Measured actuator voltage (currently not in use) "
            ],
            [
              "STAT_DLTNFRAX2RAX_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "Front to rear axle rotational speed difference "
            ],
            [
              "STAT_NENGINE_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "Engine Speed in rpm "
            ],
            [
              "STAT_NENGINE_QF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifier of engine speed "
            ],
            [
              "STAT_NFRAX_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "Front axle rotational speed "
            ],
            [
              "STAT_STPTENGAGED_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "powertrain engaged "
            ],
            [
              "STAT_STPTENGAGED_QF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifier of powertrain engaged "
            ],
            [
              "STAT_TMPBRIDGE_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "64.0",
              "0.0",
              "Measured bridge temperature "
            ],
            [
              "STAT_TRQBRAKEDRIVERREQ_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Torque Brake driver request "
            ],
            [
              "STAT_TRQBRAKEDRIVERREQ_QF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifier of torque Brake driver request "
            ],
            [
              "STAT_TYPEGEARBOX_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Type Gearbox  "
            ],
            [
              "STAT_VFRONTMIN_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "64.0",
              "0.0",
              "Minimum front vehicle speed "
            ],
            [
              "STAT_VFRONTMIN_QF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifier of minimum front vehicle speed "
            ],
            [
              "STAT_STMISUSELOWTEMPACTIVE_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Low temperature conpensation is set (SR-FF) "
            ],
            [
              "STAT_TRQMISUSESETPOINTMAX_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "4.0",
              "0.0",
              "Maximum allowed torque "
            ],
            [
              "STAT_WEAROILGAIN_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "64.0",
              "0.0",
              "W_CharCorr_WearOilGain "
            ],
            [
              "STAT_WEAROILOFFSET_WERT",
              "-",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "2.0",
              "0.0",
              "W_CharCorr_WearOilOffset "
            ],
            [
              "STAT_PHIINT_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "4096.0",
              "0.0",
              "W_MisuseDetC10_phiInt "
            ],
            [
              "STAT_MISUSE_TMPBLADE_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "64.0",
              "0.0",
              "W_MisuseDetC10_tmpBlade "
            ]
          ]
        },
        {
          "name": "RES_0X4005_D",
          "directoryOffset": 986916,
          "dataOffset": 958964,
          "columns": 10,
          "rows": 21,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_BLDC_STROM_WERT",
              "A",
              "high",
              "signed long",
              "-",
              "-",
              "1.0",
              "512.0",
              "0.0",
              "gemessener Strom im Fußpunkt der BLDC Halbbrücke "
            ],
            [
              "STAT_BLDC_RPS_WINKEL_WERT",
              "°",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "intern gemessener Winkel an der Rotorwelle "
            ],
            [
              "STAT_BLDC_BD_STATUS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Status des Brückentreibers (TLE9180) "
            ],
            [
              "STAT_HS_STROM_WERT",
              "A",
              "high",
              "signed long",
              "-",
              "-",
              "1.0",
              "512.0",
              "0.0",
              "High Side Strom "
            ],
            [
              "STAT_UDC_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Zwischenkreisspannung "
            ],
            [
              "STAT_UKL30_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Klemme 30 Spannung "
            ],
            [
              "STAT_TEMP_NTC_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "0.0625",
              "1.0",
              "0.0",
              "temperatur gemessen in der Nähe der Halbbrücke "
            ],
            [
              "STAT_TEMP_CONTROLLER_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "temperatur micro controller  "
            ],
            [
              "STAT_TEMP_RPS_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "temperatur position sensor  "
            ],
            [
              "STAT_TEMP_SBC_WERT",
              "°C",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "temperatur external monitoring unit (SBC)  "
            ],
            [
              "STAT_EXTERNAL_SENSOR_SIGNAL_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Vorhalt (nicht belegt) - external sensor signalspannung "
            ],
            [
              "STAT_EXTERNAL_SENSOR_SUPPLY_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Vorhalt (nicht belegt) - external sensor Versorgungsspannung "
            ],
            [
              "STAT_EXTERNAL_SENSOR_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Vorhalt (nicht belegt) - aktueller Wert des externen Sensors "
            ],
            [
              "STAT_ACTIVE_BF_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "aktive Schutzfunktion in NIA SW "
            ],
            [
              "STAT_ISR_WECT_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "maximal Laufzeit Kommutier Interrupt "
            ],
            [
              "STAT_ISR_WEP_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "maximal Latenzzeit "
            ],
            [
              "STAT_SBC_STATUS_BITS_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "kombinierter Status SBC  "
            ],
            [
              "STAT_BLDC_BD_STATUS_BITS_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "kombinierter Status Brückentreiber  "
            ],
            [
              "STAT_RPS_STATUS_BITS_WERT",
              "-",
              "high",
              "unsigned long",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "kombinierter Status RPS "
            ],
            [
              "STAT_SBC_AUFWACH_GRUND_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aufwachgrund ECU (SBC)   "
            ],
            [
              "STAT_ECU_OVERTEMP_COUNTER_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Übertemperatur Zähler"
            ]
          ]
        }
      ]
    },
    "ib_g05.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\ib_g05.prg",
      "sha256": "7e86a4d5ea48381faf4b8d46920171fc273bf7b663684c35119910f9a06afb18",
      "tableDirectoryOffset": 1337504,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 1349188,
          "dataOffset": 1308964,
          "columns": 16,
          "rows": 83,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "GESCHWINDIGKEIT_RAD",
              "0xDBE4",
              "-",
              "Auslesen Raddrehzahlfühler",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDBE4_D"
            ]
          ]
        },
        {
          "name": "RES_0XDBE4_D",
          "directoryOffset": 1346788,
          "dataOffset": 1250418,
          "columns": 10,
          "rows": 14,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_GESCHWINDIGKEIT_RAD_VL_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Radgeschwindigkeit vorne links"
            ],
            [
              "STAT_GESCHWINDIGKEIT_RAD_VR_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Radgeschwindigkeit vorne rechts"
            ],
            [
              "STAT_GESCHWINDIGKEIT_RAD_HL_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Radgeschwindigkeit hinten links"
            ],
            [
              "STAT_GESCHWINDIGKEIT_RAD_HR_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Radgeschwindigkeit hinten rechts"
            ],
            [
              "STAT_GESCHWINDIGKEIT_FZG_WERT",
              "km/h",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Fahrzeuggeschwindigkeit"
            ],
            [
              "STAT_DREHRICHTUNG_VL",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_DREHRICHTUNG",
              "-",
              "-",
              "-",
              "Raddrehrichtung vorne links Wheel direction of rotation front left"
            ],
            [
              "STAT_DREHRICHTUNG_VR",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_DREHRICHTUNG",
              "-",
              "-",
              "-",
              "Raddrehrichtung vorne rechts Wheel direction of rotation front right"
            ],
            [
              "STAT_DREHRICHTUNG_HL",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_DREHRICHTUNG",
              "-",
              "-",
              "-",
              "Raddrehrichtung hinten links Wheel direction of rotation rear left"
            ],
            [
              "STAT_DREHRICHTUNG_HR",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_DREHRICHTUNG",
              "-",
              "-",
              "-",
              "Raddrehrichtung hinten rechts Wheel direction of rotation rear right"
            ],
            [
              "STAT_DREHRICHTUNG_REF",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_DREHRICHTUNG",
              "-",
              "-",
              "-",
              "Fahrrichtung Direction of travel"
            ],
            [
              "STAT_SIGNALQUALITAET_VL_WERT",
              "%",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualität vorne links x < 10 % = kein Signal;  10 % <= x <= 50 % schwaches Signal;  x > 50 % Signal in Ordnung"
            ],
            [
              "STAT_SIGNALQUALITAET_VR_WERT",
              "%",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualität vorne rechts x < 10 % = kein Signal;  10 % <= x <= 50 % schwaches Signal;  x > 50 % Signal in Ordnung"
            ],
            [
              "STAT_SIGNALQUALITAET_HL_WERT",
              "%",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualität hinten links x < 10 % = kein Signal;  10 % <= x <= 50 % schwaches Signal;  x > 50 % Signal in Ordnung"
            ],
            [
              "STAT_SIGNALQUALITAET_HR_WERT",
              "%",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signalqualität hinten rechts x < 10 % = kein Signal;  10 % <= x <= 50 % schwaches Signal;  x > 50 % Signal in Ordnung"
            ]
          ]
        },
        {
          "name": "TAB_DREHRICHTUNG",
          "directoryOffset": 1350468,
          "dataOffset": 1323439,
          "columns": 3,
          "rows": 4,
          "values": [
            [
              "WERT",
              "TEXT",
              "BEMERKUNG"
            ],
            [
              "0x00",
              "Stand",
              "-"
            ],
            [
              "0x01",
              "Vorwaerts",
              "-"
            ],
            [
              "0x02",
              "Rueckwaerts",
              "-"
            ],
            [
              "0x03",
              "nicht definiert",
              "-"
            ]
          ]
        }
      ]
    },
    "hsr_g11.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\hsr_g11.prg",
      "sha256": "d799f889cd4c9d3706e07a2fc4f3416edfa5dfc7c17703824aabc711d0fb75e6",
      "tableDirectoryOffset": 732400,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 736324,
          "dataOffset": 723691,
          "columns": 16,
          "rows": 29,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "LENKWINKEL_HINTERACHSE",
              "0xDB33",
              "-",
              "Lenkwinkel Hinterachse",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDB33_D"
            ],
            [
              "STATUS_HSR",
              "0xDB35",
              "-",
              "Statusinfo HSR",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDB35_D"
            ],
            [
              "STATUS_QDM",
              "0xDB36",
              "-",
              "Signale von QDM",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xDB36_D"
            ]
          ]
        },
        {
          "name": "RES_0XDB33_D",
          "directoryOffset": 735444,
          "dataOffset": 716102,
          "columns": 10,
          "rows": 6,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_LENKWINKEL_ISTWERT_WERT",
              "°",
              "high",
              "unsigned int",
              "-",
              "-",
              "2.747",
              "1000.0",
              "-90.0",
              "Aktueller Ist-Lenkwinkel Hinterachse (Signal: Ist_Lenkwinkel_Hinterachse_Stellglied)"
            ],
            [
              "STAT_LENKWINKEL_ISTWERT_GUELTIGKEIT_NR",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_LENKWINKEL_ISTWERT_GUELTIGKEIT_NR",
              "-",
              "-",
              "-",
              "Qualifier für den Ist-Lenkwinkel Hinterachse (Signal: Qualifier_Ist_Lenkwinkel_Hinterachse_Stellglied)"
            ],
            [
              "STAT_LENKWINKEL_SOLLWERT_WERT",
              "°",
              "high",
              "unsigned int",
              "-",
              "-",
              "2.747",
              "1000.0",
              "-90.0",
              "Aktueller Soll-Lenkwinkel Hinterachse (QDM-Vorgabe)"
            ],
            [
              "STAT_MOTORWINKEL_NULLLAGE_WERT",
              "°",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "100.0",
              "0.0",
              "Motorlagewinkel-Wert bei Steller-Mittenstellung (Nulllage) (FFFF wenn nicht kalibriert)"
            ],
            [
              "STAT_ANALOGSENSOR_A_NULLLAGE_WERT",
              "HEX",
              "high",
              "unsigned int",
              "-",
              "-",
              "-",
              "-",
              "-",
              "Analogsensor A -Wert bei Steller-Mittenstellung (Nulllage). Wertebereich 0-7FFF"
            ],
            [
              "STAT_ANALOGSENSOR_B_NULLLAGE_WERT",
              "HEX",
              "high",
              "unsigned int",
              "-",
              "-",
              "-",
              "-",
              "-",
              "Analogsensor B -Wert bei Steller-Mittenstellung (Nulllage). Wertebereich 8000-FFFF"
            ]
          ]
        },
        {
          "name": "TAB_LENKWINKEL_ISTWERT_GUELTIGKEIT_NR",
          "directoryOffset": 736884,
          "dataOffset": 729057,
          "columns": 2,
          "rows": 3,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "8",
              "Initialisierung"
            ],
            [
              "1",
              "Gültig"
            ],
            [
              "6",
              "Ungültig"
            ]
          ]
        },
        {
          "name": "RES_0XDB35_D",
          "directoryOffset": 735604,
          "dataOffset": 717538,
          "columns": 10,
          "rows": 5,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_QUALIFIER_HSR",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_QUALIFIER_LENKUNG_HINTERACHSE",
              "-",
              "-",
              "-",
              "(Signal: Qualifier_Service_Steuerung_Lenkung_Hinterachse_Stellglied)"
            ],
            [
              "STAT_FEHLER_AMPLITUDE_WERT",
              "°",
              "high",
              "unsigned int",
              "-",
              "-",
              "2.747",
              "1000.0",
              "0.0",
              "(Signal: Ist_Lenkwinkel_Hinterachse_Stellglied_Fehler_Amplitude)"
            ],
            [
              "STAT_IST_STROM_WERT",
              "A",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Signal: Ist_Strom_Hinterachse_Lenkung"
            ],
            [
              "STAT_MOTOR_ISTMOMENT_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Aktuelles Motormoment (Istwert)"
            ],
            [
              "STAT_MOTOR_SOLLMOMENT_WERT",
              "Nm",
              "high",
              "signed int",
              "-",
              "-",
              "1.0",
              "1024.0",
              "0.0",
              "Aktuelles Motormoment (Sollwert)"
            ]
          ]
        },
        {
          "name": "TAB_QUALIFIER_LENKUNG_HINTERACHSE",
          "directoryOffset": 737044,
          "dataOffset": 729257,
          "columns": 2,
          "rows": 19,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "128",
              "Initialisierung"
            ],
            [
              "33",
              "Service ist verfügbar / Drive Standby"
            ],
            [
              "34",
              "Service ist verfügbar / Drive"
            ],
            [
              "49",
              "Service eingeschränkt verfügbar/ Drive Standby USW1"
            ],
            [
              "53",
              "Service eingeschränkt verfügbar/ Drive Standby USW2"
            ],
            [
              "57",
              "Service eingeschränkt verfügbar/ Drive Standby USW3"
            ],
            [
              "50",
              "Service eingeschränkt verfügbar/ Drive USW1"
            ],
            [
              "54",
              "Service eingeschränkt verfügbar/ Drive USW2"
            ],
            [
              "58",
              "Service eingeschränkt verfügbar/ Drive USW3"
            ],
            [
              "224",
              "Service ist nicht verfügbar, Standby / Postrun"
            ],
            [
              "225",
              "Service ist nicht verfügbar, Standby / Ready for Drive"
            ],
            [
              "227",
              "Service ist nicht verfügbar, Standby / Drive Ramp Zero"
            ],
            [
              "228",
              "Service ist nicht verfügbar, Standby / Wait for RLW set"
            ],
            [
              "229",
              "Service ist nicht verfügbar, Diagnose / Drive Active Diag"
            ],
            [
              "233",
              "Service nicht verfügbar / Unterspannung, Ready for Drive"
            ],
            [
              "235",
              "Service nicht verfügbar / Unterspannung, Drive Ramp Zero"
            ],
            [
              "237",
              "Service nicht verfügbar / Unterspannung, Drive Active Diag"
            ],
            [
              "104",
              "Service ist nicht verfügbar, Fehler"
            ],
            [
              "255",
              "Signal ungültig"
            ]
          ]
        },
        {
          "name": "RES_0XDB36_D",
          "directoryOffset": 735684,
          "dataOffset": 718173,
          "columns": 10,
          "rows": 3,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_FILTER_ZEIT_KONSTANTE_WERT",
              "HEX",
              "high",
              "unsigned int",
              "-",
              "-",
              "-",
              "-",
              "-",
              "Filterzeit für Sollwinkel (Signal: 0Filter_Zeit_Konstante_Lenkwinkel_Hinterachse_Stellglied)"
            ],
            [
              "STAT_SOLL_LENKWINKEL_HINTERACHSE_WERT",
              "°",
              "high",
              "unsigned int",
              "-",
              "-",
              "2.747",
              "1000.0",
              "-90.0",
              "Soll-Lenkwinkel vom QDM"
            ],
            [
              "STAT_QUALIFIER_SOLL_LENKWINKEL_HINTERACHSE",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_SOLLLENKWINKEL_QUALIFIER",
              "-",
              "-",
              "-",
              "Soll-Lenkwinkel Qualifier vom QDM"
            ]
          ]
        },
        {
          "name": "TAB_SOLLLENKWINKEL_QUALIFIER",
          "directoryOffset": 737364,
          "dataOffset": 730851,
          "columns": 2,
          "rows": 5,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "32",
              "Sollwert umsetzen / set active"
            ],
            [
              "36",
              "Sollwert umsetzen, Diagnose / set active"
            ],
            [
              "224",
              "Sollwert nicht umsetzen, Standby / set <no active>"
            ],
            [
              "228",
              "Sollwert nicht umsetzen, Diagnose / set <no active>"
            ],
            [
              "255",
              "Signal ungültig"
            ]
          ]
        }
      ]
    },
    "emars_v1.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\emars_v1.prg",
      "sha256": "7000f1da2ced89c3252db006edcb5ab65d0b114713c255d1e78e9b4ebcabda9d",
      "tableDirectoryOffset": 736240,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 740644,
          "dataOffset": 729015,
          "columns": 16,
          "rows": 37,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "EXTERNE_SPANNUNGEN",
              "0xD499",
              "-",
              "Klemme 30 + Klemme 15",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD499"
            ],
            [
              "SENSOREN",
              "0xD699",
              "-",
              "Status Sensoren: Ist-Moment-Aktuator; Ist-Drehzahl-Motor; Ist-Winkel-Motor",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD699"
            ],
            [
              "MOTORMOMENT",
              "0xD69A",
              "-",
              "Soll-Moment Motor; Ist-Moment-Motor",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69A"
            ],
            [
              "PHASENSTROM",
              "0xD69B",
              "-",
              "eff. Phasenstrom; Strom d-Achse; Strom q-Achse",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69B"
            ],
            [
              "INTERNE_SPANNUNGEN",
              "0xD69C",
              "-",
              "Spannung d-Achse; Spannung q-Achse; U1; U2; U3; U4; U5; U6",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69C"
            ],
            [
              "TEMPERATUREN_SG",
              "0xD69D",
              "-",
              "Temperatur E-Motor; Temperatur Motormagnete; Temperatur Power-Board; Temperatur Logik-Board",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69D"
            ],
            [
              "ARS_AKTUATORSIGNALE",
              "0xD6BB",
              "-",
              "Auslesen von Signalen des Aktuators zu Analysezwecken.",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD6BB"
            ]
          ]
        },
        {
          "name": "RES_0XD499",
          "directoryOffset": 739684,
          "dataOffset": 716850,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_KL30_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung Klemme 30"
            ],
            [
              "STAT_KL15_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung Klemme 15"
            ]
          ]
        },
        {
          "name": "RES_0XD699",
          "directoryOffset": 739764,
          "dataOffset": 717056,
          "columns": 10,
          "rows": 3,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_MOMENT_AKTUATOR_IST_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "26.0",
              "0.0",
              "Ist-Moment-Aktuator"
            ],
            [
              "STAT_DREHZAHL_MOTOR_IST_WERT",
              "1/min",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3.0",
              "0.0",
              "Ist-Drehzahl-Motor"
            ],
            [
              "STAT_WINKEL_MOTOR_IST_WERT",
              "°",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Ist-Winkel-Motor"
            ]
          ]
        },
        {
          "name": "RES_0XD69A",
          "directoryOffset": 739844,
          "dataOffset": 717345,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_SOLL_MOTOR_MOMENT_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3276.0",
              "0.0",
              "Soll-Moment Motor"
            ],
            [
              "STAT_IST_MOTOR_MOMENT_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3276.0",
              "0.0",
              "Ist-Moment Motor"
            ]
          ]
        },
        {
          "name": "RES_0XD69B",
          "directoryOffset": 739924,
          "dataOffset": 717557,
          "columns": 10,
          "rows": 3,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_PHASENSTROM_RMS_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "eff. Phasenstrom"
            ],
            [
              "STAT_STROM_D_ACHSE_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "Strom d-Achse"
            ],
            [
              "STAT_STROM_Q_ACHSE_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "Strom q-Achse"
            ]
          ]
        },
        {
          "name": "RES_0XD69C",
          "directoryOffset": 740004,
          "dataOffset": 717823,
          "columns": 10,
          "rows": 8,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_SPANNUNG_D_ACHSE_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung d-Achse"
            ],
            [
              "STAT_SPANNUNG_Q_ACHSE_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung q-Achse"
            ],
            [
              "STAT_U1_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U1"
            ],
            [
              "STAT_U2_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U2"
            ],
            [
              "STAT_U3_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U3"
            ],
            [
              "STAT_U4_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U4"
            ],
            [
              "STAT_U5_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U5"
            ],
            [
              "STAT_U6_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U6"
            ]
          ]
        },
        {
          "name": "RES_0XD69D",
          "directoryOffset": 740084,
          "dataOffset": 718433,
          "columns": 10,
          "rows": 4,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_TEMPERATUR_E_MOTOR_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur E-Motor"
            ],
            [
              "STAT_TEMPERATUR_MOTORMAGNETE_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Motormagnete"
            ],
            [
              "STAT_TEMPERATUR_POWERBOARD_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Power-Board"
            ],
            [
              "STAT_TEMPERATUR_LOGIKBOARD_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Logik-Board"
            ]
          ]
        },
        {
          "name": "RES_0XD6BB",
          "directoryOffset": 740404,
          "dataOffset": 719906,
          "columns": 10,
          "rows": 15,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_STRG_FKT_XA_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_STRG_FKT_XA_ARS",
              "-",
              "-",
              "-",
              "Ansteuerungsstatus vom VDP an den jeweiligen Aktor (BN-Signal: CTR_FN_FTAX_ARS oder CTR_FN_BAX_ARS).  XA: Vorderachse oder Hinterachse, je nach Steuergerät."
            ],
            [
              "STAT_SOLLMOM_STABI_ARS_WERT",
              "Nm",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Sollmoment (Stabilisatormoment bis +/-900 Nm), das vom VDP an den Aktorregler geschickt wird. Die Umsetzung des Aktormomentes wird erst über das Ansteuerstatus aktiviert (BN-Signal: TAR_TORQ_STAB_FTAX_ARS oder TAR_TORQ_STAB_BAX_ARS)."
            ],
            [
              "STAT_WNKL_VERDRHNG_EXTN_XA_ARS_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Verdrehung des Stabilisators von aussen über die Stabiaugen, auf Motorebene umgerechnet (~ * Übersetzung 158). (BN-Signal: ANG_TN_EXTN_FTAX_ARS oder ANG_TN_EXTN_BAX_ARS). XA: Vorderachse oder Hinterachse, je nach Steuergerät"
            ],
            [
              "STAT_QU_WNKL_VERDRHNG_EXTN_XA_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Flexraysignal der Externen Verdrehung des Aktors. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_ST_FN_XA_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_ST_FN_XAX_ARS",
              "-",
              "-",
              "-",
              "Status des Aktorreglers im emARS-Steuergerät. Der Status ist abhängig von Eingangssignalen des Aktorreglers. Dies sind Soll- und Steuerungssignale des VDPs und Sensorsignale des Aktors. (BN-Signal: ST_FN_FTAX_ARS oder ST_FN_BAX_ARS). XA: Vorderachse oder Hinterachse, je nach Steuergerät."
            ],
            [
              "STAT_KONF_ENA_MOT_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktivierungsbefehl vom Aktorregler an den Motorregler. Bei Aktivbedingung wird das Sollmoment für den Elektromotor vom Motorregler angesteuert. 0: Deaktiviert, 1: Aktiviert"
            ],
            [
              "STAT_SOLL_MOM_MOT_ARS_WERT",
              "Nm",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Sollmoment vom Aktorregler (Stabilisatormoment bis 900 Nm) an den Motorregler (Elektromotormoment bis +/-7,5 Nm). Der Momentenwert wird vom Motorregler am Elektromotor nur eingeregelt, wenn das Aktivierbit aktiv ist."
            ],
            [
              "STAT_EARSARSBS_B_NPR_AKTIV_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktivierungsstatus der Nullpositionsregelung am Aktor. Die Nullposition wird entweder vom VDP angefordert, oder ein Signal- oder Sensorfehler führt selbständig im Aktorregler zu der Ansteuerung."
            ],
            [
              "STAT_EARSARSBS_NULLPOSITION_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Gespeicherte Nullposition (Motorposition mit Multiturnzählung) in diesem Klemmenzyklus, bei der der Aktor kein Moment bewirkt, soweit das Fahrzeug auf einer horizontalen Ebene steht. Dieser Winkel wird bei Aktivierung der Nullpositionsregelung (NPR) eingeregelt. Die Nullposition wird zunächst als die Position beim Aufstarten definiert und bei Geradeausfahrt nachgelernt."
            ],
            [
              "STAT_IST_WNKL_ABS_EMOT_ARS_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktueller Motorwinkel mit Aufsummierung bei Mehrfachumdrehung. Beim Aufstarten wird der Winkel auf den Anfangswert (0 bis 1/2 Umdrehung) festgelegt. Von dieser Position aus wird der Winkel positiv wie negativ bei einer Verdrehung aufsummiert."
            ],
            [
              "STAT_QU_IST_WNKL_ABS_EMOT_ARS_WERT",
              "Nm",
              "high",
              "char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Sensorsignal des Motorwinkels. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_IST_DREHZHL_EMOT_ARS_WERT",
              "rad/s",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktuelle Drehzahl des Elektromotors direkt aus dem Hardwaresensor ermittelt. Sensor kann bis zu +/- 10.000 U/min messen. (FR: "
            ],
            [
              "STAT_QU_IST_DREHZHL_EMOT_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Sensorsignal der Motordrehzahl. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_ISTMOM_STABI_ARS_WERT",
              "Nm",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktuelles Stabilisatormoment (Messbereich +/-1200 Nm), das am entsprechenden Aktor anliegt (BN-Signal: AVL_TORQ_STAB_FTAX_ARS oder AVL_TORQ_STAB_BAX_ARS)"
            ],
            [
              "STAT_QU_ISTMOM_STABI_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_QU_AVL_TORQ_STAB_XAX_ARS",
              "-",
              "-",
              "-",
              "Qualifierstatus vom Sensorsignal des Stabilisatormomentes."
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_STRG_FKT_XA_ARS",
          "directoryOffset": 740884,
          "dataOffset": 733649,
          "columns": 2,
          "rows": 20,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "16",
              "keine Regelung"
            ],
            [
              "39",
              "Sollwert umsetzen - Vollfunktion - Normalfunktion"
            ],
            [
              "35",
              "Sollwert umsetzen- Vollfunktion - nur Drehzahlregelung"
            ],
            [
              "40",
              "Sollwert umsetzen- Vollfunktion - Regelung Ausrampen"
            ],
            [
              "47",
              "Sollwert umsetzen- Vollfunktion - Normalfunktion Fail-Safe-Nullposition initialisieren"
            ],
            [
              "151",
              "Sollwert umsetzen-Degradation - Normalfunktion"
            ],
            [
              "147",
              "Sollwert umsetzen- Degradation - nur Drehzahlregelung"
            ],
            [
              "152",
              "Sollwert umsetzen- Degradation - Regelung Ausrampen"
            ],
            [
              "159",
              "Sollwert umsetzen- Degradation - Normalfunktion Fail-Safe-Nullposition initialisieren"
            ],
            [
              "161",
              "Sondermodus - Motormomentenebene"
            ],
            [
              "162",
              "Sondermodus - Drehzahlebene"
            ],
            [
              "163",
              "Sondermodus - Drehzahlebene mit Motormomentenvorgabe"
            ],
            [
              "164",
              "Sondermodus - Stabilisatormomentenebene"
            ],
            [
              "165",
              "Sondermodus - Stabilisatormomentenebene mit Motormomentenvorgabe"
            ],
            [
              "166",
              "Sondermodus - Stabilisatormomentenebene mit Motordrehzahlvorgabe"
            ],
            [
              "167",
              "Sondermodus - Stabilisatormomentenebene mit Drehzahl- und Motormomentenvorgabe"
            ],
            [
              "224",
              "Sollwert_ist_nicht_verfuegbar"
            ],
            [
              "253",
              "Funktionsschnittstelle_ist_nicht_verfuegbar"
            ],
            [
              "254",
              "Funktion_meldet_Fehler"
            ],
            [
              "0xFF",
              "Signal_unbefuellt"
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_ST_FN_XAX_ARS",
          "directoryOffset": 740964,
          "dataOffset": 734712,
          "columns": 2,
          "rows": 11,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "16",
              "Regelung bereit / alles IO, Regelung nicht angefordert"
            ],
            [
              "32",
              "Regelung ohne Vorsteuerung ? bereit / Signale für Vorsteuerung fehlerhaft, sonst IO, passiv"
            ],
            [
              "48",
              "Nullpositionsregelung - bereit / nur noch NPR möglich, aber nicht angefordert"
            ],
            [
              "96",
              "Fehler / Keine Regelung möglich"
            ],
            [
              "144",
              "Regelung aktiv / alles IO, Regelung angefordert"
            ],
            [
              "160",
              "Regelung ohne Vorsteuerung - aktiv / Signale für Vorsteuerung fehlerhaft, sonst IO, aktiv"
            ],
            [
              "176",
              "Nullpositionsregelung - aktiv / Reserviert"
            ],
            [
              "177",
              "Nullpositionsregelung - aktiv - Fehler Aktor / NPR eigenst¿ndig wegen Fehler"
            ],
            [
              "178",
              "Nullpositionsregelung - aktiv - Vorgabe VDP / NPR wegen Anforderung"
            ],
            [
              "179",
              "Nullpositionsregelung - aktiv - Fehler und Vorgabe / NPR eigenst¿ndig wegen Fehler und Anforderung"
            ],
            [
              "0xFF",
              "Signal_unbefuellt / Sendefunktion nicht in Betrieb"
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_QU_AVL_TORQ_STAB_XAX_ARS",
          "directoryOffset": 740804,
          "dataOffset": 733384,
          "columns": 2,
          "rows": 9,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "1",
              "Wert gültig, höchste Qualität"
            ],
            [
              "2",
              "Wert gültig, einfache Qualität"
            ],
            [
              "3",
              "Wert eingeschränkt gültig, dauerhaft"
            ],
            [
              "4",
              "Fehler temporär"
            ],
            [
              "6",
              "Fehler"
            ],
            [
              "9",
              "Wert gültig, mittlere Signalqualität"
            ],
            [
              "11",
              "Wert eingeschränkt gültig, temporär"
            ],
            [
              "14",
              "Wert nicht verfügbar"
            ],
            [
              "0xFF",
              "Signal unbefüllt"
            ]
          ]
        }
      ]
    },
    "emars_h1.prg": {
      "path": "C:\\Program Files\\BMW\\ISPI\\TRIC\\ISTA\\Ecu\\emars_h1.prg",
      "sha256": "e04ab4905d91f45f666c100615781d3bcff75d1648c96c628d4ff9e8a6d0d873",
      "tableDirectoryOffset": 736256,
      "tables": [
        {
          "name": "SG_FUNKTIONEN",
          "directoryOffset": 740660,
          "dataOffset": 729021,
          "columns": 16,
          "rows": 37,
          "values": [
            [
              "ARG",
              "ID",
              "RESULTNAME",
              "INFO",
              "EINHEIT",
              "LABEL",
              "L/H",
              "DATENTYP",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "SG_ADR",
              "SERVICE",
              "ARG_TABELLE",
              "RES_TABELLE"
            ],
            [
              "EXTERNE_SPANNUNGEN",
              "0xD499",
              "-",
              "Klemme 30 + Klemme 15",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD499"
            ],
            [
              "SENSOREN",
              "0xD699",
              "-",
              "Status Sensoren: Ist-Moment-Aktuator; Ist-Drehzahl-Motor; Ist-Winkel-Motor",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD699"
            ],
            [
              "MOTORMOMENT",
              "0xD69A",
              "-",
              "Soll-Moment Motor; Ist-Moment-Motor",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69A"
            ],
            [
              "PHASENSTROM",
              "0xD69B",
              "-",
              "eff. Phasenstrom; Strom d-Achse; Strom q-Achse",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69B"
            ],
            [
              "INTERNE_SPANNUNGEN",
              "0xD69C",
              "-",
              "Spannung d-Achse; Spannung q-Achse; U1; U2; U3; U4; U5; U6",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69C"
            ],
            [
              "TEMPERATUREN_SG",
              "0xD69D",
              "-",
              "Temperatur E-Motor; Temperatur Motormagnete; Temperatur Power-Board; Temperatur Logik-Board",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD69D"
            ],
            [
              "ARS_AKTUATORSIGNALE",
              "0xD6BB",
              "-",
              "Auslesen von Signalen des Aktuators zu Analysezwecken.",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "22",
              "-",
              "RES_0xD6BB"
            ]
          ]
        },
        {
          "name": "RES_0XD499",
          "directoryOffset": 739700,
          "dataOffset": 716856,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_KL30_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung Klemme 30"
            ],
            [
              "STAT_KL15_WERT",
              "-",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung Klemme 15"
            ]
          ]
        },
        {
          "name": "RES_0XD699",
          "directoryOffset": 739780,
          "dataOffset": 717062,
          "columns": 10,
          "rows": 3,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_MOMENT_AKTUATOR_IST_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "26.0",
              "0.0",
              "Ist-Moment-Aktuator"
            ],
            [
              "STAT_DREHZAHL_MOTOR_IST_WERT",
              "1/min",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3.0",
              "0.0",
              "Ist-Drehzahl-Motor"
            ],
            [
              "STAT_WINKEL_MOTOR_IST_WERT",
              "°",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Ist-Winkel-Motor"
            ]
          ]
        },
        {
          "name": "RES_0XD69A",
          "directoryOffset": 739860,
          "dataOffset": 717351,
          "columns": 10,
          "rows": 2,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_SOLL_MOTOR_MOMENT_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3276.0",
              "0.0",
              "Soll-Moment Motor"
            ],
            [
              "STAT_IST_MOTOR_MOMENT_WERT",
              "Nm",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "3276.0",
              "0.0",
              "Ist-Moment Motor"
            ]
          ]
        },
        {
          "name": "RES_0XD69B",
          "directoryOffset": 739940,
          "dataOffset": 717563,
          "columns": 10,
          "rows": 3,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_PHASENSTROM_RMS_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "eff. Phasenstrom"
            ],
            [
              "STAT_STROM_D_ACHSE_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "Strom d-Achse"
            ],
            [
              "STAT_STROM_Q_ACHSE_WERT",
              "A",
              "high",
              "int",
              "-",
              "-",
              "1.0",
              "150.0",
              "0.0",
              "Strom q-Achse"
            ]
          ]
        },
        {
          "name": "RES_0XD69C",
          "directoryOffset": 740020,
          "dataOffset": 717829,
          "columns": 10,
          "rows": 8,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_SPANNUNG_D_ACHSE_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung d-Achse"
            ],
            [
              "STAT_SPANNUNG_Q_ACHSE_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung q-Achse"
            ],
            [
              "STAT_U1_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U1"
            ],
            [
              "STAT_U2_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U2"
            ],
            [
              "STAT_U3_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U3"
            ],
            [
              "STAT_U4_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U4"
            ],
            [
              "STAT_U5_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U5"
            ],
            [
              "STAT_U6_WERT",
              "V",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1638.0",
              "0.0",
              "Spannung U6"
            ]
          ]
        },
        {
          "name": "RES_0XD69D",
          "directoryOffset": 740100,
          "dataOffset": 718439,
          "columns": 10,
          "rows": 4,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_TEMPERATUR_E_MOTOR_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur E-Motor"
            ],
            [
              "STAT_TEMPERATUR_MOTORMAGNETE_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Motormagnete"
            ],
            [
              "STAT_TEMPERATUR_POWERBOARD_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Power-Board"
            ],
            [
              "STAT_TEMPERATUR_LOGIKBOARD_WERT",
              "°",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "-40.0",
              "Temperatur Logik-Board"
            ]
          ]
        },
        {
          "name": "RES_0XD6BB",
          "directoryOffset": 740420,
          "dataOffset": 719912,
          "columns": 10,
          "rows": 15,
          "values": [
            [
              "RESULTNAME",
              "EINHEIT",
              "L/H",
              "DATENTYP",
              "MASKE",
              "NAME",
              "MUL",
              "DIV",
              "ADD",
              "INFO"
            ],
            [
              "STAT_STRG_FKT_XA_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_STRG_FKT_XA_ARS",
              "-",
              "-",
              "-",
              "Ansteuerungsstatus vom VDP an den jeweiligen Aktor (BN-Signal: CTR_FN_FTAX_ARS oder CTR_FN_BAX_ARS).  XA: Vorderachse oder Hinterachse, je nach Steuergerät."
            ],
            [
              "STAT_SOLLMOM_STABI_ARS_WERT",
              "Nm",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Sollmoment (Stabilisatormoment bis +/-900 Nm), das vom VDP an den Aktorregler geschickt wird. Die Umsetzung des Aktormomentes wird erst über das Ansteuerstatus aktiviert (BN-Signal: TAR_TORQ_STAB_FTAX_ARS oder TAR_TORQ_STAB_BAX_ARS)."
            ],
            [
              "STAT_WNKL_VERDRHNG_EXTN_XA_ARS_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Verdrehung des Stabilisators von aussen über die Stabiaugen, auf Motorebene umgerechnet (~ * Übersetzung 158). (BN-Signal: ANG_TN_EXTN_FTAX_ARS oder ANG_TN_EXTN_BAX_ARS). XA: Vorderachse oder Hinterachse, je nach Steuergerät"
            ],
            [
              "STAT_QU_WNKL_VERDRHNG_EXTN_XA_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Flexraysignal der Externen Verdrehung des Aktors. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_ST_FN_XA_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_ST_FN_XAX_ARS",
              "-",
              "-",
              "-",
              "Status des Aktorreglers im emARS-Steuergerät. Der Status ist abhängig von Eingangssignalen des Aktorreglers. Dies sind Soll- und Steuerungssignale des VDPs und Sensorsignale des Aktors. (BN-Signal: ST_FN_FTAX_ARS oder ST_FN_BAX_ARS). XA: Vorderachse oder Hinterachse, je nach Steuergerät."
            ],
            [
              "STAT_KONF_ENA_MOT_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktivierungsbefehl vom Aktorregler an den Motorregler. Bei Aktivbedingung wird das Sollmoment für den Elektromotor vom Motorregler angesteuert. 0: Deaktiviert, 1: Aktiviert"
            ],
            [
              "STAT_SOLL_MOM_MOT_ARS_WERT",
              "Nm",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Sollmoment vom Aktorregler (Stabilisatormoment bis 900 Nm) an den Motorregler (Elektromotormoment bis +/-7,5 Nm). Der Momentenwert wird vom Motorregler am Elektromotor nur eingeregelt, wenn das Aktivierbit aktiv ist."
            ],
            [
              "STAT_EARSARSBS_B_NPR_AKTIV_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktivierungsstatus der Nullpositionsregelung am Aktor. Die Nullposition wird entweder vom VDP angefordert, oder ein Signal- oder Sensorfehler führt selbständig im Aktorregler zu der Ansteuerung."
            ],
            [
              "STAT_EARSARSBS_NULLPOSITION_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Gespeicherte Nullposition (Motorposition mit Multiturnzählung) in diesem Klemmenzyklus, bei der der Aktor kein Moment bewirkt, soweit das Fahrzeug auf einer horizontalen Ebene steht. Dieser Winkel wird bei Aktivierung der Nullpositionsregelung (NPR) eingeregelt. Die Nullposition wird zunächst als die Position beim Aufstarten definiert und bei Geradeausfahrt nachgelernt."
            ],
            [
              "STAT_IST_WNKL_ABS_EMOT_ARS_WERT",
              "rad",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktueller Motorwinkel mit Aufsummierung bei Mehrfachumdrehung. Beim Aufstarten wird der Winkel auf den Anfangswert (0 bis 1/2 Umdrehung) festgelegt. Von dieser Position aus wird der Winkel positiv wie negativ bei einer Verdrehung aufsummiert."
            ],
            [
              "STAT_QU_IST_WNKL_ABS_EMOT_ARS_WERT",
              "Nm",
              "high",
              "char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Sensorsignal des Motorwinkels. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_IST_DREHZHL_EMOT_ARS_WERT",
              "rad/s",
              "high",
              "motorola float",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktuelle Drehzahl des Elektromotors direkt aus dem Hardwaresensor ermittelt. Sensor kann bis zu +/- 10.000 U/min messen. (FR: "
            ],
            [
              "STAT_QU_IST_DREHZHL_EMOT_ARS_WERT",
              "-",
              "high",
              "unsigned char",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Qualifierstatus vom Sensorsignal der Motordrehzahl. (2: IO, 6: NIO, 255 Com-Fehler)"
            ],
            [
              "STAT_ISTMOM_STABI_ARS_WERT",
              "Nm",
              "high",
              "unsigned int",
              "-",
              "-",
              "1.0",
              "1.0",
              "0.0",
              "Aktuelles Stabilisatormoment (Messbereich +/-1200 Nm), das am entsprechenden Aktor anliegt (BN-Signal: AVL_TORQ_STAB_FTAX_ARS oder AVL_TORQ_STAB_BAX_ARS)"
            ],
            [
              "STAT_QU_ISTMOM_STABI_ARS",
              "0-n",
              "high",
              "unsigned char",
              "-",
              "TAB_EARSAR_QU_AVL_TORQ_STAB_XAX_ARS",
              "-",
              "-",
              "-",
              "Qualifierstatus vom Sensorsignal des Stabilisatormomentes."
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_STRG_FKT_XA_ARS",
          "directoryOffset": 740900,
          "dataOffset": 733657,
          "columns": 2,
          "rows": 20,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "16",
              "keine Regelung"
            ],
            [
              "39",
              "Sollwert umsetzen - Vollfunktion - Normalfunktion"
            ],
            [
              "35",
              "Sollwert umsetzen- Vollfunktion - nur Drehzahlregelung"
            ],
            [
              "40",
              "Sollwert umsetzen- Vollfunktion - Regelung Ausrampen"
            ],
            [
              "47",
              "Sollwert umsetzen- Vollfunktion - Normalfunktion Fail-Safe-Nullposition initialisieren"
            ],
            [
              "151",
              "Sollwert umsetzen-Degradation - Normalfunktion"
            ],
            [
              "147",
              "Sollwert umsetzen- Degradation - nur Drehzahlregelung"
            ],
            [
              "152",
              "Sollwert umsetzen- Degradation - Regelung Ausrampen"
            ],
            [
              "159",
              "Sollwert umsetzen- Degradation - Normalfunktion Fail-Safe-Nullposition initialisieren"
            ],
            [
              "161",
              "Sondermodus - Motormomentenebene"
            ],
            [
              "162",
              "Sondermodus - Drehzahlebene"
            ],
            [
              "163",
              "Sondermodus - Drehzahlebene mit Motormomentenvorgabe"
            ],
            [
              "164",
              "Sondermodus - Stabilisatormomentenebene"
            ],
            [
              "165",
              "Sondermodus - Stabilisatormomentenebene mit Motormomentenvorgabe"
            ],
            [
              "166",
              "Sondermodus - Stabilisatormomentenebene mit Motordrehzahlvorgabe"
            ],
            [
              "167",
              "Sondermodus - Stabilisatormomentenebene mit Drehzahl- und Motormomentenvorgabe"
            ],
            [
              "224",
              "Sollwert_ist_nicht_verfuegbar"
            ],
            [
              "253",
              "Funktionsschnittstelle_ist_nicht_verfuegbar"
            ],
            [
              "254",
              "Funktion_meldet_Fehler"
            ],
            [
              "0xFF",
              "Signal_unbefuellt"
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_ST_FN_XAX_ARS",
          "directoryOffset": 740980,
          "dataOffset": 734720,
          "columns": 2,
          "rows": 11,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "16",
              "Regelung bereit / alles IO, Regelung nicht angefordert"
            ],
            [
              "32",
              "Regelung ohne Vorsteuerung ? bereit / Signale für Vorsteuerung fehlerhaft, sonst IO, passiv"
            ],
            [
              "48",
              "Nullpositionsregelung - bereit / nur noch NPR möglich, aber nicht angefordert"
            ],
            [
              "96",
              "Fehler / Keine Regelung möglich"
            ],
            [
              "144",
              "Regelung aktiv / alles IO, Regelung angefordert"
            ],
            [
              "160",
              "Regelung ohne Vorsteuerung - aktiv / Signale für Vorsteuerung fehlerhaft, sonst IO, aktiv"
            ],
            [
              "176",
              "Nullpositionsregelung - aktiv / Reserviert"
            ],
            [
              "177",
              "Nullpositionsregelung - aktiv - Fehler Aktor / NPR eigenst¿ndig wegen Fehler"
            ],
            [
              "178",
              "Nullpositionsregelung - aktiv - Vorgabe VDP / NPR wegen Anforderung"
            ],
            [
              "179",
              "Nullpositionsregelung - aktiv - Fehler und Vorgabe / NPR eigenst¿ndig wegen Fehler und Anforderung"
            ],
            [
              "0xFF",
              "Signal_unbefuellt / Sendefunktion nicht in Betrieb"
            ]
          ]
        },
        {
          "name": "TAB_EARSAR_QU_AVL_TORQ_STAB_XAX_ARS",
          "directoryOffset": 740820,
          "dataOffset": 733392,
          "columns": 2,
          "rows": 9,
          "values": [
            [
              "WERT",
              "TEXT"
            ],
            [
              "1",
              "Wert gültig, höchste Qualität"
            ],
            [
              "2",
              "Wert gültig, einfache Qualität"
            ],
            [
              "3",
              "Wert eingeschränkt gültig, dauerhaft"
            ],
            [
              "4",
              "Fehler temporär"
            ],
            [
              "6",
              "Fehler"
            ],
            [
              "9",
              "Wert gültig, mittlere Signalqualität"
            ],
            [
              "11",
              "Wert eingeschränkt gültig, temporär"
            ],
            [
              "14",
              "Wert nicht verfügbar"
            ],
            [
              "0xFF",
              "Signal unbefüllt"
            ]
          ]
        }
      ]
    }
  },
  "nativeCatalog": {
    "path": "bmw-extracted\\reference\\someip-interfaces.json",
    "sha256": "645b929b273197df927dd45d958e82c823a3f1f843f71587baaba03c205c74e4"
  },
  "historicalIdentity": "out/downloads/head-unit-5e14f35a4092/files/var/opt/public/oap/oap_12444/data/dtc_scanner.log:173-200",
  "documentation": "../../OTHER_DATA_FINDINGS.md"
}
;
