'use strict';
// View sections and action identifiers; rendered by the settings-sheet view.
module.exports = [
    {
        "title": "xDrive Lab",
        "parent": "MAIN",
        "name": "MAIN",
        "items": [
            [
                "text3",
                "HOME_SAFETY",
                "DISARMED: waiting for live evidence"
            ],
            [
                "text3",
                "HOME_NOTICE",
                "Read-only until explicit target-bound arming"
            ],
            [
                "text3",
                "HOME_STATE",
                "Waiting for data"
            ],
            [
                "button",
                "HOME_OVERVIEW",
                "Live gates and reported state"
            ],
            [
                "button",
                "HOME_PROVIDERS",
                "14 providers / 42 raw fields"
            ],
            [
                "button",
                "HOME_DIAGNOSTICS",
                "Read-only ECU diagnostics"
            ],
            [
                "button",
                "HOME_BASELINE",
                "Baseline, snapshots and export"
            ],
            [
                "button",
                "HOME_EXPERIMENT",
                "Native MDrive experiments"
            ],
            [
                "button",
                "HOME_RESTORE",
                "Retained trial / restore review"
            ],
            [
                "button",
                "HOME_DISARM",
                "Disarm now (does not restore)"
            ],
            [
                "button",
                "HOME_PROTOCOL",
                "Guided research protocol"
            ],
            [
                "button",
                "HOME_HISTORY",
                "Markers, outcomes and history"
            ],
            [
                "button",
                "HOME_RETRY",
                "Reconnect offered providers"
            ],
            [
                "button",
                "HOME_HELP",
                "Safety and research help"
            ]
        ]
    },
    {
        "title": "Live gates",
        "parent": "MAIN",
        "name": "OVERVIEW",
        "items": [
            [
                "text3",
                "OVERVIEW_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "OVERVIEW_STATE",
                "Waiting for data"
            ],
            [
                "button",
                "OVERVIEW_CHECKS",
                "Waiting for gate checks"
            ],
            [
                "button",
                "OVERVIEW_REFRESH",
                "Refresh safety getters (read only)"
            ],
            [
                "button",
                "OVERVIEW_RAW",
                "Complete live gate evidence"
            ],
            [
                "button",
                "OVERVIEW_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Providers and raw fields",
        "parent": "MAIN",
        "name": "PROVIDERS",
        "items": [
            [
                "text3",
                "PROVIDERS_NOTICE",
                "Waiting for data"
            ],
            [
                "button",
                "PROVIDERS_LIST",
                "Waiting for providers"
            ],
            [
                "text3",
                "PROVIDERS_STATE",
                "Waiting for data"
            ],
            [
                "button",
                "PROVIDERS_FIELDS",
                "Waiting for fields"
            ],
            [
                "button",
                "PROVIDERS_SCHEMA",
                "Complete provider schema"
            ],
            [
                "button",
                "PROVIDERS_CATALOG",
                "Complete catalog and source identity"
            ],
            [
                "button",
                "PROVIDERS_REFRESH",
                "Refresh offered getters (read only)"
            ],
            [
                "button",
                "PROVIDERS_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Raw field detail",
        "parent": "PROVIDERS",
        "name": "FIELD",
        "items": [
            [
                "text3",
                "FIELD_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "FIELD_TITLE",
                "Waiting for data"
            ],
            [
                "text3",
                "FIELD_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "FIELD_VALUE",
                "Waiting for data"
            ],
            [
                "button",
                "FIELD_RAW",
                "Complete reading / source counts / timing"
            ],
            [
                "button",
                "FIELD_SCHEMA",
                "Field schema and full datatype closure"
            ],
            [
                "button",
                "FIELD_REFRESH",
                "Read getter (only if declared)"
            ],
            [
                "button",
                "FIELD_BACK",
                "Back to providers"
            ]
        ]
    },
    {
        "title": "Read-only diagnostics",
        "parent": "MAIN",
        "name": "DIAGNOSTICS",
        "items": [
            [
                "text3",
                "DIAGNOSTICS_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "DIAGNOSTICS_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "DIAGNOSTICS_HELP",
                "Manual reads only. No sessions, unlocks, clears, resets, writes, sweeps or diagnostic actuation. ECU labels are historical lookup hints, not identities read from this car."
            ],
            [
                "button",
                "DIAGNOSTICS_DB32",
                "Read LMV 0x19 DID DB32 once"
            ],
            [
                "button",
                "DIAGNOSTICS_POLL",
                "Enable opt-in LMV DB32 polling"
            ],
            [
                "button",
                "DIAGNOSTICS_STOP",
                "Stop LMV polling"
            ],
            [
                "button",
                "DIAGNOSTICS_IDENTIFY",
                "Read F150 identifiers: all four ECUs"
            ],
            [
                "button",
                "DIAGNOSTICS_FAULTS",
                "Read faults: all four ECUs (no clearing)"
            ],
            [
                "button",
                "DIAGNOSTICS_CUSTOM",
                "Bounded custom readDataByIdentifier editor"
            ],
            [
                "button",
                "DIAGNOSTICS_FRAMES",
                "Waiting for diagnostic evidence"
            ],
            [
                "button",
                "DIAGNOSTICS_RAW",
                "Complete retained diagnostic history"
            ],
            [
                "button",
                "DIAGNOSTICS_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Custom UInt16 DID read",
        "parent": "DIAGNOSTICS",
        "name": "DID",
        "items": [
            [
                "text3",
                "DID_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "DID_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "DID_HELP",
                "Local hexadecimal editor only: choose one ECU and four nibbles (0000..FFFF). Send performs exactly one UDS 0x22 read, never an arbitrary SID or sweep."
            ],
            [
                "button",
                "DID_TARGETS",
                "Choose ECU"
            ],
            [
                "button",
                "DID_NIBBLES",
                "Choose hexadecimal digit"
            ],
            [
                "button",
                "DID_VALUES",
                "Choose digit value"
            ],
            [
                "button",
                "DID_DB32",
                "Set DID DB32 (local only)"
            ],
            [
                "button",
                "DID_F150",
                "Set DID F150 (local only)"
            ],
            [
                "button",
                "DID_SEND",
                "Send one explicit read"
            ],
            [
                "button",
                "DID_BACK",
                "Back to diagnostics"
            ]
        ]
    },
    {
        "title": "Baseline and evidence",
        "parent": "MAIN",
        "name": "BASELINE",
        "items": [
            [
                "text3",
                "BASELINE_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "BASELINE_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "BASELINE_RETENTION",
                "Waiting for data"
            ],
            [
                "button",
                "BASELINE_CAPTURE",
                "Refresh getters and save baseline"
            ],
            [
                "button",
                "BASELINE_RAW",
                "Complete saved baseline"
            ],
            [
                "button",
                "BASELINE_SNAPSHOT",
                "Save complete current snapshot"
            ],
            [
                "button",
                "BASELINE_EXPORT",
                "Export evidence and retained raw journals"
            ],
            [
                "button",
                "BASELINE_STATS",
                "Complete recorder / retention status"
            ],
            [
                "button",
                "BASELINE_LAST",
                "Open latest saved snapshot / export result"
            ],
            [
                "button",
                "BASELINE_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Native MDrive experiment",
        "parent": "MAIN",
        "name": "EXPERIMENT",
        "items": [
            [
                "text3",
                "EXPERIMENT_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "EXPERIMENT_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "EXPERIMENT_HELP",
                "Two native request backends and three mode candidates only. Alternative is a 4WD Sport candidate, not proven equivalence. Transport acceptance and fresh reported mode are not physical success."
            ],
            [
                "button",
                "EXPERIMENT_BACKENDS",
                "Choose backend"
            ],
            [
                "button",
                "EXPERIMENT_MODES",
                "Choose target"
            ],
            [
                "button",
                "EXPERIMENT_REQUEST",
                "Inspect exact catalog request / no-change members"
            ],
            [
                "button",
                "EXPERIMENT_REFRESH",
                "Refresh safety getters (read only)"
            ],
            [
                "button",
                "EXPERIMENT_ARM",
                "Review target-bound arming"
            ],
            [
                "button",
                "EXPERIMENT_APPLY",
                "Review explicit request confirmation"
            ],
            [
                "button",
                "EXPERIMENT_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Arm one exact request",
        "parent": "EXPERIMENT",
        "name": "ARM",
        "items": [
            [
                "text3",
                "ARM_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "ARM_DETAILS",
                "Waiting for data"
            ],
            [
                "text3",
                "ARM_HELP",
                "Arming authorizes only this backend, target and apply/restore phase for at most 30 seconds. It sends nothing. Hidden app, expired gates, provider epoch change or recording errors block dispatch. No automatic retries."
            ],
            [
                "button",
                "ARM_CONFIRM",
                "Arm this exact target for up to 30 seconds"
            ],
            [
                "button",
                "ARM_DISARM",
                "Disarm without restoring"
            ],
            [
                "button",
                "ARM_BACK",
                "Return without sending"
            ]
        ]
    },
    {
        "title": "Confirm one native request",
        "parent": "EXPERIMENT",
        "name": "APPLY",
        "items": [
            [
                "text3",
                "APPLY_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "APPLY_DETAILS",
                "Waiting for data"
            ],
            [
                "text3",
                "APPLY_HELP",
                "Send invokes only the reviewed native MDrive setter after durable intent storage and a second in-native-tick gate check. It does not change FES or DSC. One unresolved trial remains until explicit restoration/review."
            ],
            [
                "button",
                "APPLY_CONFIRM",
                "Send this one armed native request"
            ],
            [
                "button",
                "APPLY_CANCEL",
                "Cancel / return without sending"
            ]
        ]
    },
    {
        "title": "Retained trial and restoration",
        "parent": "MAIN",
        "name": "RESTORE",
        "items": [
            [
                "text3",
                "RESTORE_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "RESTORE_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "RESTORE_HELP",
                "Restore is a separate explicit native request to the retained original mode, never automatic. Both native and external restoration require fresh original reported mode plus your explicit review before archiving; neither proves clutch position or a physical torque split."
            ],
            [
                "button",
                "RESTORE_RAW",
                "Complete retained / last trial"
            ],
            [
                "button",
                "RESTORE_REFRESH",
                "Refresh safety getters (read only)"
            ],
            [
                "button",
                "RESTORE_ARM",
                "Review arming for original target"
            ],
            [
                "button",
                "RESTORE_CONFIRM",
                "Review explicit native restore confirmation"
            ],
            [
                "button",
                "RESTORE_EXTERNAL",
                "Review restored original (native or external)"
            ],
            [
                "button",
                "RESTORE_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Restored original acknowledgement",
        "parent": "RESTORE",
        "name": "EXTERNAL",
        "items": [
            [
                "text3",
                "EXTERNAL_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "EXTERNAL_STATE",
                "Waiting for data"
            ],
            [
                "text3",
                "EXTERNAL_HELP",
                "Use after native restore reports the original mode, or after manually restoring outside this app. Acknowledge your observation below. Fresh valid original statusMSystem is independently required before the trial can be archived. No vehicle command is sent."
            ],
            [
                "button",
                "EXTERNAL_CONFIRM",
                "I observed restoration; verify original and archive"
            ],
            [
                "button",
                "EXTERNAL_BACK",
                "Back without acknowledgement"
            ]
        ]
    },
    {
        "title": "Guided research stages",
        "parent": "MAIN",
        "name": "PROTOCOL",
        "items": [
            [
                "text3",
                "PROTOCOL_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "PROTOCOL_HELP",
                "Manual workflow tracking, not automatic test completion. Open each stage for procedure, acceptance and operator-attributed outcome. ISTA actions occur outside this app; no pretend actuation buttons."
            ],
            [
                "button",
                "PROTOCOL_STAGES",
                "Choose research stage"
            ],
            [
                "button",
                "PROTOCOL_RESULTS",
                "Complete saved stage outcomes"
            ],
            [
                "button",
                "PROTOCOL_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Protocol stage detail",
        "parent": "PROTOCOL",
        "name": "STAGE",
        "items": [
            [
                "text3",
                "STAGE_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "STAGE_DETAIL",
                "Waiting for data"
            ],
            [
                "text3",
                "STAGE_RESULT",
                "Waiting for data"
            ],
            [
                "button",
                "STAGE_OUTCOMES",
                "Choose manual stage outcome"
            ],
            [
                "button",
                "STAGE_RAW",
                "Complete stage procedure and retained result"
            ],
            [
                "button",
                "STAGE_BACK",
                "Back to protocol"
            ]
        ]
    },
    {
        "title": "Operator markers and history",
        "parent": "MAIN",
        "name": "HISTORY",
        "items": [
            [
                "text3",
                "HISTORY_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "HISTORY_STATE",
                "Waiting for data"
            ],
            [
                "button",
                "HISTORY_MARKERS",
                "Choose timestamped operator marker"
            ],
            [
                "button",
                "HISTORY_OUTCOMES",
                "Choose observed outcome"
            ],
            [
                "button",
                "HISTORY_TRIAL",
                "Complete retained / last trial"
            ],
            [
                "button",
                "HISTORY_EVENTS",
                "Choose recorded event"
            ],
            [
                "button",
                "HISTORY_NOTES",
                "Complete operator notes"
            ],
            [
                "button",
                "HISTORY_RAW",
                "Complete retained event history"
            ],
            [
                "button",
                "HISTORY_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Complete paginated raw evidence",
        "parent": "MAIN",
        "name": "RAW",
        "items": [
            [
                "text3",
                "RAW_NOTICE",
                "Waiting for data"
            ],
            [
                "text3",
                "RAW_TITLE",
                "Waiting for data"
            ],
            [
                "text3",
                "RAW_POSITION",
                "Waiting for data"
            ],
            [
                "button",
                "RAW_BODY",
                "Waiting for data"
            ],
            [
                "button",
                "RAW_PREV",
                "Previous raw page"
            ],
            [
                "button",
                "RAW_NEXT",
                "Next raw page"
            ],
            [
                "button",
                "RAW_BACK",
                "Back to source screen"
            ],
            [
                "button",
                "RAW_HOME",
                "Home"
            ]
        ]
    },
    {
        "title": "Safety, limits and research help",
        "parent": "MAIN",
        "name": "HELP",
        "items": [
            [
                "text3",
                "HELP_NOTICE",
                "Waiting for data"
            ],
            [
                "button",
                "HELP_TOPICS",
                "Choose help topic"
            ],
            [
                "text3",
                "HELP_BODY",
                "Waiting for data"
            ],
            [
                "button",
                "HELP_HOME",
                "Home"
            ]
        ]
    }
];
