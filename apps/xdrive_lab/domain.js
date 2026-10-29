'use strict';
const catalog = require('./catalog');

const freshMs = 2000;
const SAFETY_FIELDS = [
    'vehicle.statusCarSpeed2', 'wheels.ActualValueRPMWheel', 'pedal.AngleAcceleratorPedal',
    'gear.statusGearboxDrive', 'engine.statusHandBrake', 'fes.statusDSCSwitchHMI',
    'mdrive.statusMSystem', 'mdrive.controlDisplayMSystemsMDrive', 'rsu.isRsuSessionActive'
];
const SERVICES = catalog.services;
const MODES = [
    { id: 'awd', label: '4WD standard', actual: 0, display: 1, legacy: '_4WD_STANDARD', operation: 'AWDSTANDARD' },
    { id: 'alternative', label: '4WD alternative / Sport candidate', actual: 1, display: 2, legacy: '_4WD_ALTERNATIV', operation: 'AWDALTERNATIV' },
    { id: 'rwd', label: '2WD / RWD candidate', actual: 2, display: 4, legacy: '_2WD', operation: 'RWD' }
];
const CANDIDATES = [
    { id: 'legacy', label: 'MDrive mSystem (setter 4)', field: 'mSystem', member: 'controlAllWheelSetup' },
    { id: 'operation', label: 'MDrive operationMSystemsMDrive (setter 19)', field: 'operationMSystemsMDrive', member: 'operationMSystemsAWMDrive' }
];
const ECUS = [
    { address: 0x19, label: 'Transfer case / LMV', variant: 'LMV_G11' },
    { address: 0x39, label: 'Chassis integration / VIP', variant: 'VIP_G05' },
    { address: 0x29, label: 'Integrated brakes / IB', variant: 'IB_G05' },
    { address: 0x0F, label: 'Rear differential / GSD', variant: 'GSD_F90' }
];
const MARKERS = [
    { id: 'baseline', label: 'Baseline observed / compare complete snapshot' },
    { id: 'stock-fes', label: 'Factory FES mode changed manually' },
    { id: 'stock-dsc', label: 'Factory DSC selection changed manually' },
    { id: 'ista-before', label: 'Technician ISTA procedure: before' },
    { id: 'ista-off-requested', label: 'Technician reports ISTA AWD-off requested' },
    { id: 'warning-observed', label: 'xDrive warning observed by operator' },
    { id: 'ignition-cycle', label: 'Ignition cycle performed manually' },
    { id: 'restored-observed', label: 'Operator reports stock operation restored' },
    { id: 'native-before', label: 'Before a native MDrive trial' },
    { id: 'native-after', label: 'After a native MDrive trial' },
    { id: 'normal-driving', label: 'Normal-driving passenger-operated capture' },
    { id: 'cold', label: 'Cold-condition observation (operator attribution)' },
    { id: 'hot', label: 'Hot-condition observation (operator attribution)' },
    { id: 'unexpected', label: 'Unexpected response / stop experimenting' }
];
const PROTOCOL = [
    { id: 'baseline', title: '1. Read-only provider and vehicle baseline',
        detail: 'Inspect all providers, field errors, raw qualifiers and freshness. Read F150 identities and fault memories without clearing. Capture full LMV DB32 frames; do not infer clutch position from low torque.',
        acceptance: 'Attributable current samples and invalid/missing states are distinguishable; record every unavailable channel rather than assuming unsupported hardware.' },
    { id: 'stock', title: '2. Observe normal BMW controls',
        detail: 'While safely parked, operate factory FES and DSC controls manually. Mark each action and compare actual MDrive status, availability, wheel RPM, pedal and chassis data. App writes remain disarmed.',
        acceptance: 'Fresh feedback correlated with each manual action; FES Sport must not be called 4WD Sport or 2WD.' },
    { id: 'ista', title: '3. Technician-operated ISTA AWD-off reference',
        detail: 'BMW SI B27 02 20 covers G15. ISTA: Vehicle Management > Troubleshooting > Function structure > Drive > Transfer box > Current fault patterns > Temporary deactivation of all-wheel-drive system (ABL-DIT-AW2710_TDEAKAWD11). Follow the actual guided procedure with a qualified specialist. This app only records markers; it does not issue that diagnostic control.',
        acceptance: 'Before/after raw evidence, operator warning observation, fault records, and restoration after the prescribed manual ignition cycle. No burnouts or 2WD dyno as the first experiment.' },
    { id: 'transport', title: '4. Resolve diagnostic access and restoration',
        detail: 'Capture the technician diagnostic exchange externally. Resolve the UDS mapping, applicable variants, sessions, request/response, timing and supported re-enable path for the recovered VIP_G05 STEUERN_LMV_FUNKTION_QDM semantic job. TASU traffic is not a full vehicle-bus sniffer.',
        acceptance: 'No guessed write payload, permission bypass or enable-by-bit-flip. Establish whether restoration needs ignition; transport return is not ECU or physical success.' },
    { id: 'native', title: '5. One explicitly armed native MDrive request',
        detail: 'Choose one declared backend and one target. Capture baseline, inspect all blockers, arm that exact request for at most 30 seconds, review the full wrapper, then send once while parked. RWD requires reported DSC OFF. Unrelated controls use explicit no-change/no-operation symbols or catalog unfilled values.',
        acceptance: 'Durable intent before invocation, distinct transport result, fresh actual MDrive readback and independent operator outcome. No retries; explicitly rearm for restoration; retain every unknown result.' },
    { id: 'lifecycle', title: '6. Restoration, lifecycle and thermal evidence',
        detail: 'Start with parked hide/reopen and ignition-cycle observations, no induced wheel slip. Later low-load controlled validation belongs with a qualified specialist and known recovery. Record cold/hot conditions and differential/VTG faults or documented temperatures; unknown DID semantics remain unknown.',
        acceptance: 'No startup/hide/crash write or automatic AWD re-engagement. Observe restored original state and physical effects separately. Validate independently before any driving-mode switch is used in motion.' },
    { id: 'persistent', title: '7. Persistent mode / firmware feasibility',
        detail: 'Check exact xDelete support privately; G-series ON/OFF configuration is distinct from E/F-series LIVE switching. Match actual HWEL/BTLD/SWFL and obtain recoverable originals before firmware research. Do not cross-flash M8/DSC or treat the downloaded MGU filesystem as a vehicle recovery image.',
        acceptance: 'Supported vehicle-side behavior and recoverability established. An M differential, catalog setter or menu change alone does not establish factory M xDrive equivalence.' }
];

function now() { const time = process.hrtime(); return time[0] * 1000 + time[1] / 1000000; }
function service(key) { return SERVICES.find((item) => item.key === key); }
function field(key, name) { const def = service(key); return def && def.fields.find((item) => item.name === name); }
function rawSummary(value, maxChars) {
    if (value === undefined) return 'No sample';
    const text = JSON.stringify(value);
    const limit = maxChars === undefined ? 180 : maxChars;
    return text.length > limit ? text.slice(0, limit) + ' [open full raw evidence]' : text;
}
function enumCode(typeRef, value) {
    const type = catalog.datatypes[typeRef];
    if (!type || !type.items) return null;
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(type.items, value)) return type.items[value];
    return typeof value === 'number' && Number.isInteger(value) && Object.keys(type.items).some((name) => type.items[name] === value) ? value : null;
}
function memberCode(key, fieldName, memberName, raw) {
    const def = field(key, fieldName), type = def && catalog.datatypes[def.dataRef];
    const member = type && type.members && type.members.find((item) => item.name === memberName);
    return member && raw && typeof raw === 'object' ? enumCode(member.dataRef, raw[memberName]) : null;
}
function currentMode(raw) {
    const code = memberCode('mdrive', 'statusMSystem', 'statusAllWheelSetup', raw);
    const qualifier = memberCode('mdrive', 'statusMSystem', 'qualifierFunctionAllWheel', raw);
    const selected = MODES.find((item) => item.actual === code);
    const valid = !!selected && (qualifier === 2 || qualifier === 10);
    return { valid, mode: valid ? selected.id : null, qualifier,
        detail: valid ? selected.label + ' reported; not physical torque proof' : 'Actual AWD status or its ready/active qualifier is missing, invalid or unavailable' };
}
function nativeRequest(backendId, modeId) {
    const backend = CANDIDATES.find((item) => item.id === backendId), mode = MODES.find((item) => item.id === modeId);
    if (!backend || !mode) throw new Error('Unknown native backend or mode');
    const wrapper = catalog.datatypes[catalog.writeTypes[backend.field]];
    const value = {};
    wrapper.members.forEach((member) => {
        const type = catalog.datatypes[member.dataRef];
        if (!type || !type.items) throw new Error('Unverified non-enum request member: ' + member.name);
        let neutral = ['KEINE_AENDERUNG', 'KEINE_BEDIENUNG', 'NO_CHANGE'].find((name) => Object.prototype.hasOwnProperty.call(type.items, name));
        if (!neutral && type.items.SIGNAL_UNBEFUELLT === member.defaultValue) neutral = 'SIGNAL_UNBEFUELLT';
        if (!neutral) throw new Error('No explicit neutral request value for ' + member.name);
        value[member.name] = neutral;
    });
    value[backend.member] = mode[backendId];
    return { service: 'mdrive', field: backend.field, value, backendId, modeId };
}
function gate(readings, providers, monoMs, modeId) {
    const checks = [], target = MODES.find((item) => item.id === modeId);
    const providerKeys = ['mdrive', 'vehicle', 'wheels', 'pedal', 'gear', 'engine', 'fes', 'rsu'];
    function add(id, label, ok, detail) { checks.push({ id, label, ok: !!ok, detail }); }
    function live(key, name) {
        const reading = readings[key + '.' + name], provider = providers[key];
        if (!provider || provider.available !== true || !reading || typeof reading.monoMs !== 'number' ||
            !Number.isFinite(reading.monoMs) || monoMs < reading.monoMs || monoMs - reading.monoMs > freshMs ||
            !reading.epoch || reading.epoch !== provider.epoch ||
            ['getter', 'notification'].indexOf(reading.source) < 0) return null;
        return reading;
    }
    providerKeys.forEach((key) => add('provider-' + key, service(key).label + ' provider', providers[key] && providers[key].available === true,
        'Provider must be offered in the same live connection epoch; an SDK proxy alone is insufficient.'));
    add('target', 'Known explicit target', !!target, target ? target.label : 'Select one of the three supported experiment candidates');
    const speed = live('vehicle', 'statusCarSpeed2');
    add('speed', 'Fresh exact-zero vehicle speed', speed && speed.value && speed.value.speedVehicleCentreOfGravity === 0,
        'Raw zero, received within 2 seconds; no conversion or cached zero is accepted.');
    const wheels = live('wheels', 'ActualValueRPMWheel'), wheelRaw = wheels && wheels.value;
    const wheelFields = [
        ['actualValueRPMWheelRLH', 'qualifierActualValueRPMWheelRLH'],
        ['actualValueRPMWheelRRH', 'qualifierActualValueRPMWheelRRH'],
        ['actualValueRPMWheelFLH', 'qualifierActualValueRPMWheelFLH'],
        ['actualValueRPMwheelFRH', 'qualifierActualValueRPMWheelFRH']
    ];
    wheelFields.forEach((names) => add(names[0], 'Fresh zero + valid qualifier: ' + names[0],
        wheelRaw && wheelRaw[names[0]] === 0 && memberCode('wheels', 'ActualValueRPMWheel', names[1], wheelRaw) === 1,
        'Each wheel must report exact zero with the catalog valid, secured and plausible qualifier. CRC bytes are retained, not independently verified.'));
    const pedal = live('pedal', 'AngleAcceleratorPedal'), pedalRaw = pedal && pedal.value;
    add('pedal', 'Fresh released actual and virtual accelerator', pedalRaw && pedalRaw.actualValueAngleAcceleratorPedal === 0 &&
        pedalRaw.actualValueAngleAcceleratorPedalVirtual === 0 && memberCode('pedal', 'AngleAcceleratorPedal', 'qualifierActualValueAngleAcceleratorPedal', pedalRaw) === 1,
        'Actual and virtual raw pedal values must both be zero with a valid/plausible qualifier.');
    const gear = live('gear', 'statusGearboxDrive'), gearRaw = gear && gear.value;
    add('park', 'Fresh actual and target selector P', gearRaw &&
        memberCode('gear', 'statusGearboxDrive', 'statusActualStageDrive', gearRaw) === 1 &&
        memberCode('gear', 'statusGearboxDrive', 'statusTargetStageDrive', gearRaw) === 1 &&
        memberCode('gear', 'statusGearboxDrive', 'statusActualGearDrive', gearRaw) === 2,
        'Both selectors must be P and actual gear N_OR_P. This lab never requests a gear or brake change.');
    const brake = live('engine', 'statusHandBrake');
    add('handbrake', 'Fresh parking brake explicitly applied', brake && memberCode('engine', 'statusHandBrake', 'statusContactHandBrake', brake.value) === 2,
        'Missing, not-coded, released or invalid brake status blocks native requests.');
    const dsc = live('fes', 'statusDSCSwitchHMI'), dscCode = dsc && memberCode('fes', 'statusDSCSwitchHMI', 'displayStatusDSC2', dsc.value);
    add('dsc', modeId === 'rwd' ? 'Fresh DSC OFF selection for RWD' : 'Fresh valid DSC selection',
        dsc && (modeId === 'rwd' ? dscCode === 1 : [0, 1, 2, 4].indexOf(dscCode) >= 0),
        'Use the factory DSC control manually. The app never disables DSC and does not treat DSC unit standby as DSC OFF.');
    const actual = live('mdrive', 'statusMSystem'), current = currentMode(actual && actual.value);
    add('actual-awd', 'Fresh actual AWD mode and ready/active qualifier', actual && current.valid, current.detail);
    const display = live('mdrive', 'controlDisplayMSystemsMDrive');
    const displayCode = display && memberCode('mdrive', 'controlDisplayMSystemsMDrive', 'controlDisplayMSystemsAWMDrive', display.value);
    add('operability', 'Fresh MDrive AWD display is operable', display && [1, 2, 4].indexOf(displayCode) >= 0,
        'A current operable display is required; it does not prove that every requested target is supported. Not-operable/unavailable/fault/unfilled states block.');
    const rsu = live('rsu', 'isRsuSessionActive');
    add('rsu', 'Fresh remote software update session inactive', rsu && rsu.value === false,
        'Boolean false required. Missing status is not permission; this is not detection of every external diagnostic tool.');
    const reasons = checks.filter((item) => !item.ok).map((item) => item.label + ': ' + item.detail);
    return { ok: reasons.length === 0, reasons, checks, currentMode: actual && current.valid ? current.mode : null, providerKeys };
}
function ecu(target) {
    const result = ECUS.find((item) => item.address === target);
    if (!result) throw new Error('Diagnostic target is not one of the four researched ECUs');
    return result;
}
function readRequest(target, did) {
    const selected = ecu(target);
    if (!Number.isInteger(did) || did < 0 || did > 65535) throw new Error('DID must be one UInt16 value');
    return { target, sid: 0x22, data: [did >> 8, did & 255], did, label: selected.label + ' DID ' + did.toString(16).toUpperCase().padStart(4, '0') };
}
function faultRequest(target) { return { target: ecu(target).address, sid: 0x19, data: [0x02, 0xFF], label: 'Read DTCs by status mask (no clearing)' }; }
function decodeLmv(bytes) {
    if (!Array.isArray(bytes) || bytes.length < 8 || !bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
        return { layout: 'unconfirmed', detail: 'At least eight complete payload bytes required; no physical interpretation.' };
    }
    const signed = (at) => { const raw = bytes[at] * 256 + bytes[at + 1]; return raw >= 32768 ? raw - 65536 : raw; };
    return { layout: 'LMV_G11 DB32 candidate; vehicle applicability unvalidated', actualRaw: signed(0),
        qualifierRaw: bytes.slice(2, 4), targetRaw: signed(4), trailingRaw: bytes.slice(6),
        actualNmCandidate: signed(0) * 0.25, targetNmCandidate: signed(4) * 0.25,
        detail: 'Candidate raw/4 scaling from existing app configuration, not independently validated. Qualifier meanings are unresolved. No clutch-position or axle-percentage inference.' };
}

module.exports = { catalog, freshMs, SAFETY_FIELDS, SERVICES, MODES, CANDIDATES, ECUS, MARKERS, PROTOCOL,
    now, service, field, rawSummary, enumCode, memberCode, currentMode, nativeRequest, gate, readRequest, faultRequest, decodeLmv };
