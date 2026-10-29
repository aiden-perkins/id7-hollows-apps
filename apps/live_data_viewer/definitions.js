'use strict';

const IF = {
    engine: 'de.bmw.infotainment.vehicle.CDS', speed: 'de.bmw.infotainment.vehicle.Vehicle2',
    mode: 'de.bmw.infotainment.drivingexcitement.FES', thermal: 'de.bmw.infrastructure.analytics.BasicDataSet',
    air: 'de.bmw.infrastructure.EnvironmentalInformation', accel: 'de.bmw.infotainment.vehicle.CDS2',
    gps: 'de.bmw.infotainment.navigation.positioning.Positioning', gear: 'de.bmw.infrastructure.VehicleInformation',
    diagnostic: 'com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu', steering: 'de.bmw.infotainment.drivingexcitement.XView',
    tpms: 'de.bmw.infotainment.vehicle.TPMS',
    sensors: 'de.bmw.infotainment.vehicle.TPMSInternalData',
};
const definitions = [];
// BMW M Laptimer scalings reused by kit/runtime/car.js; values are stored in US display units.
// BMW SDK TypeConverters also establish the engine/speed/acceleration/ambient ranges and driver steering degrees.
// TPMS conversions/ranges follow Car Vitals' scaling table and physical-range checks.
const converters = {
    rpm: { factor: 0.25, offset: 0, unit: 'rpm', maxRaw: 48000 },
    speed: { factor: 1 / 64, offset: 0, multiplier: 1 / 1.609344, unit: 'mph', maxRaw: 22400 },
    engineTemperature: { factor: 1, offset: -48, multiplier: 1.8, displayOffset: 32, unit: 'F' },
    ambient: { factor: 0.5, offset: -40, multiplier: 1.8, displayOffset: 32, unit: 'F', maxRaw: 251 },
    acceleration: { factor: 0.002, offset: -65, multiplier: 1 / 9.80665, unit: 'g', maxRaw: 65000 },
    torque: { factor: 0.5, offset: -1023.5, multiplier: 0.7375621492772656, unit: 'lb-ft' },
    tyreTemperature: { factor: 1, offset: -40, multiplier: 1.8, displayOffset: 32, unit: 'F', maxRaw: 190 },
    tyrePressure: { factor: 0.1, offset: 0, multiplier: 14.503773773020923, unit: 'psi', maxRaw: 60 },
    unscaled: { factor: 1, offset: 0, unit: 'raw' },
    steeringAngle: { factor: 0.04395, offset: -1440.11, unit: 'deg', minRaw: 3, maxRaw: 65532 },
    diagnosticVoltage: { factor: 0.02, offset: 0, unit: 'V', minRaw: 0, maxRaw: 32767 },
    diagnosticPedal: { factor: 0.01220703, offset: 0, unit: '%', minRaw: 0, maxRaw: 8192 },
    diagnosticFuel: { factor: 1 / 128, offset: 0, unit: 'L', maxRaw: 65535 },
    diagnosticBrake: { factor: 0.1, offset: 0, unit: 'bar', minRaw: -32768, maxRaw: 32767 },
};
const qualifierEnums = {
    steering: {
        1: 'SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT_UND_PLAUSIBILISIERT__ZUSTAND_S_STATUS_PERMANENT',
        2: 'SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_PERMANENT',
        9: 'SIGNALWERT_IST_GUELTIG_UND_ABGESICHERT__ZUSTAND_S_STATUS_TEMPORAER',
        10: 'SIGNALWERT_IST_GUELTIG__ZUSTAND_S_STATUS_TEMPORAER',
    },
};
function add(id, name, page, group, options) {
    definitions.push(Object.assign({ id, name, page, group, kind: 'reported', staleMs: 10000,
        notes: 'No validated source on this vehicle; additional diagnostic interface work is deferred.' }, options || {}));
}
function candidate(id, name, page, group, source, field, member, invalidFrom, notes, extra) {
    const options = Object.assign({ source, field, member, read: true, invalidFrom,
        notes, decoder: 'unconfirmed' }, extra || {});
    const converter = converters[options.decoder];
    if (converter) Object.assign(options, { numeric: true, unit: converter.unit });
    add(id, name, page, group, options);
}
const thermalNote = 'BMW M Laptimer engine-temperature conversion: raw minus 48 degrees C, displayed in degrees F. Raw 255 is unavailable.';
candidate('coolant', 'Coolant / engine water', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineDrive', 255, thermalNote, { decoder: 'engineTemperature' });
candidate('oil', 'Engine oil', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineOilDrive', 255, thermalNote, { decoder: 'engineTemperature' });
candidate('transmission1', 'Transmission temperature 1', 'temperatures', 'Transmission', 'thermal', 'basicDataSet',
    'valueTemperatureTransmissionOil', 255, 'Upstream BasicDataSet transmission oil lead; sensor identity and scale are unconfirmed on this car.', { read: false });
add('transmission2', 'Transmission temperature 2 (EGS)', 'temperatures', 'Transmission', {
    lead: 'EGS ECU 0x18 / UDS DID 0xDA12', notes: 'Second upstream transmission lead: ECU 0x18, DID 0xDA12, proposed byte minus 48 degrees C. Unconfirmed forum-derived mapping; no diagnostic requests are issued.' });
add('converter', 'Torque converter temperature', 'temperatures', 'Transmission', { notes: 'No separately identified torque-converter sensor. Do not equate either transmission lead with this component.' });
add('iat', 'Intake air temperature (IAT)', 'temperatures', 'Air', { notes: 'Upstream has OBD/UDS candidates, but this car has no validated intake-air source or sensor location in the saved Lab results.' });
candidate('outside', 'Outside air', 'temperatures', 'Air', 'air', 'ExteriorTemperature', 'temperatureExterior', 255,
    'BMW M Laptimer outside-air conversion: raw times 0.5 minus 40 degrees C, displayed in degrees F.', { read: false, decoder: 'ambient' });
add('chargeAir', 'Charge-air temperature', 'temperatures', 'Air');
add('cabin', 'Cabin air temperature', 'temperatures', 'Air');

candidate('brakePressure', 'Brake system pressure', 'driving', 'Driver inputs', 'diagnostic', 'brakeSystemPressure', 'value', null,
    'ISTA IB_G05 / IB_G2X DRUCKSENSOR_LESEN: DSC BRS 0x29, UDS 22 DB29; second big-endian signed 16-bit field / 10 bar. Not master-cylinder pressure or pedal percentage.',
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticBrake', diag: { target: 0x29, sid: 0x22, did: 0xDB29, at: 2, bytes: 2, signed: true, minBytes: 4 } });
candidate('steering', 'Steering wheel angle', 'driving', 'Driver inputs', 'steering', 'statusSteeringAngleDriver', 'actualValueSteeringAngleDriver', 65535,
    'BMW SDK steeringAngleConverter: raw * 0.04395 - 1440.11 degrees, valid raw 3-65532. Only explicitly valid catalog qualifiers are accepted.',
    { decoder: 'steeringAngle', qualifier: 'qualifierActualValueSteeringAngleDriver', validQualifiers: qualifierEnums.steering });
candidate('frontAxle', 'Front axle steering angle (raw)', 'driving', 'Driver inputs', 'steering', 'statusFrontAxleSteeringAngle', 'steeringAngleFrontAxleEffective', 65535,
    'Raw front-axle angle field; no supported degree scale, center or sign conversion. This wrapper has no qualifier.', { decoder: 'unscaled' });
candidate('accelerator', 'Accelerator pedal position', 'driving', 'Driver inputs', 'diagnostic', 'acceleratorPosition', 'value', null,
    'ISTA DME8FF_R for DME-88T0 N63TU3: IFPWG, UDS 22 480B, normalized pedal position; big-endian signed 16-bit * 0.01220703 percent. Only the physical 0-100 percent range is displayed.',
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticPedal', diag: { target: 0x12, sid: 0x22, did: 0x480B, at: 0, bytes: 2, signed: true, minBytes: 2 } });
candidate('gear', 'Gear / selector state', 'driving', 'Drivetrain', 'gear', 'DataPowerTrain2', 'statusGearSelectionDrive', 15,
    'Catalog enum identifies P/R/N/NP and gears 1-9; this source is not established by saved Lab captures. Only recognized enums are displayed when received.', { read: false, decoder: 'gear', kind: 'reported' });
add('gearProgram', 'Transmission D / S / M program', 'driving', 'Drivetrain', { notes: 'No independently validated transmission program source. Driving mode is a different signal.' });
add('driveMode', 'Driving mode', 'driving', 'Drivetrain', { source: 'mode', field: 'statusFESVehicleDynamicSwitchHMI',
    member: 'actualValueModeDrivingExperience', read: true, decoder: 'mode', notes: 'Numeric and named wire enums are accepted. Seven variants were observed; invalid/reserved/initializing modes are rejected.' });
add('traction', 'Traction / DSC mode', 'driving', 'Drivetrain', { source: 'mode', field: 'statusDSCSwitchHMI',
    member: 'displayStatusDSC2', read: true, decoder: 'traction',
    notes: 'Catalog-defined DSC display state. Provider availability on this car is unconfirmed. Independent of driving mode; invalid/reserved codes are rejected.' });
candidate('speed', 'Vehicle speed', 'driving', 'Motion', 'speed', 'statusCarSpeed2', 'speedVehicleCentreOfGravity', 65535,
    'BMW M Laptimer vehicle speed: raw / 64 km/h, converted to mph. Valid standstill zero is retained.', { decoder: 'speed' });
candidate('rpm', 'Engine speed', 'driving', 'Drivetrain', 'engine', 'statusEngineSpeed2', 'actualValueRPMEngineCrankshaft', 65535,
    'BMW M Laptimer engine speed: raw / 4 rpm. Valid stopped-engine zero is retained.', { decoder: 'rpm' });
candidate('boost', 'Boost pressure', 'driving', 'Drivetrain', 'mode', 'statusSwitchDriveDynamicSport2', 'displayBoostPressure', 255,
    'Upstream explicitly labels the FES boost scale a best guess. Gauge versus absolute pressure and reference pressure are unconfirmed.');
candidate('torque', 'Actual crankshaft torque', 'driving', 'Drivetrain', 'mode', 'statusActualValueTorque2', 'actualValueTorqueCrankshaft', 4095,
    'BMW M Laptimer crankshaft torque: raw * 0.5 - 1023.5 Nm, converted to lb-ft. Negative engine-braking torque is retained.', { decoder: 'torque' });
add('horsepower', 'Horsepower', 'driving', 'Drivetrain', { kind: 'derived', numeric: true, unit: 'hp', staleMs: 2000,
    dependsOn: ['rpm', 'torque'], maxSkewMs: 1000,
    notes: 'Derived mechanical horsepower from live crankshaft RPM and torque, no more than 1 second apart and each at most 2 seconds old by local delivery time; not synchronized vehicle timestamps. A live stopped crankshaft establishes zero power without torque. Negative power is retained.' });
candidate('gLong', 'Longitudinal acceleration', 'driving', 'Motion', 'accel', 'statusLongitudinalAccelerationMassCenter', 'longitudinalAccelerationCentreOfGravity', 65535,
    'BMW M Laptimer longitudinal acceleration: raw * 0.002 - 65 m/s², divided by standard gravity (9.80665) for g.', { decoder: 'acceleration' });
candidate('gLat', 'Lateral acceleration', 'driving', 'Motion', 'accel', 'statusLateralAccelerationMassCenter', 'lateralAccelerationCentreOfGravity', 65535,
    'BMW M Laptimer lateral acceleration: raw * 0.002 - 65 m/s², divided by standard gravity (9.80665) for g.', { decoder: 'acceleration' });
candidate('voltage', 'Battery voltage (IBS)', 'driving', 'Electrical', 'diagnostic', 'batteryVoltage', 'value', null,
    'ISTA DME8FF_R IUIBS / STAT_UBATT_IBS_WERT: current battery voltage, DME 0x12, UDS 22 586A; big-endian signed 16-bit * 20 mV, displayed in V. Verified on this vehicle; 5853 is unsupported.',
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticVoltage', diag: { target: 0x12, sid: 0x22, did: 0x586A, at: 0, bytes: 2, signed: true, minBytes: 2 } });
add('transmissionPressure', 'Transmission oil pressure', 'driving', 'Drivetrain');
add('altitude', 'GPS altitude', 'driving', 'Motion', { source: 'gps', field: 'rawPositionData', read: true,
    instance: 'Main_Instance', decoder: 'height', unit: 'ft', numeric: true, staleMs: 5000,
    notes: 'Height requires a 3D fix and heightValid. rawLengthMeter is converted to feet. Height reference/geoid and accuracy remain unconfirmed.' });

['FLH', 'FRH', 'RLH', 'RRH'].forEach((wheel, i) => {
    const group = 'Tires / TPMS: ' + ['Front left', 'Front right', 'Rear left', 'Rear right'][i];
    const common = { position: ['Front left', 'Front right', 'Rear left', 'Rear right'][i],
        positionBasis: 'Reported by wheel-specific field; not inferred from a radio slot', staleMs: 20000 };
    candidate('pressure' + wheel, 'Pressure', 'driving', group, 'tpms', 'statusTyrePressure', 'actualValuePressureTyre' + wheel, 65532,
        'Car Vitals / BMW x_call pressure conversion: raw * 0.1 bar, displayed in psi; accepted physical range 0-6 bar. Raw >= 65532 remains invalid.', Object.assign({}, common, { decoder: 'tyrePressure' }));
    candidate('tyreTemp' + wheel, 'Temperature', 'driving', group, 'tpms', 'statusTyreTemperature', 'actualValueTemperatureTyre' + wheel, 65532,
        'Car Vitals temperature conversion: raw - 40 degrees C, displayed in degrees F; accepted range -40 to 150 degrees C. Saved 65534 remains invalid.', Object.assign({}, common, { decoder: 'tyreTemperature' }));
    candidate('target' + wheel, 'Target pressure', 'driving', group, 'tpms', 'statusTargetTyrePressure', 'targetPressureTyre' + wheel, 65532,
        'Target pressure uses the BMW x_call raw * 0.1 bar conversion, displayed in psi; accepted physical range 0-6 bar. Target is not actual pressure; saved 65533 remains invalid.', Object.assign({}, common, { decoder: 'tyrePressure' }));
    add('tyreState' + wheel, 'Reported wheel state', 'driving', group, Object.assign({
        notes: 'Saved aggregate tyre qualifiers do not identify an individual wheel state or sensor identity.' }, common));
});
for (let i = 1; i <= 4; i++) {
    candidate('sensor' + i, 'Sensor slot ' + i + ' serial / ID', 'driving', 'Tires / TPMS: unknown positions',
        'sensors', 'tpmsInternalLastValues', 'tpmsInternalLastSensorSerNoId' + i, 2147483647,
        'No provider/payload captured. Slots are not wheel positions. IDs are preserved as decimal and hexadecimal, never called UUIDs.',
        { decoder: 'serial', position: 'Unknown', positionBasis: 'Radio slot only; no physical wheel position assumed', staleMs: 20000 });
}
[['tankTotal', 'Fuel tank total', 4], ['tankLeft', 'Left fuel tank', 2], ['tankRight', 'Right fuel tank', 0]].forEach((item) =>
    candidate(item[0], item[1], 'driving', 'Fuel tank levels', 'diagnostic', item[0], 'value', null,
        'ISTA KOMBSP18 TANKINHALT: KOMBI 0x60, UDS 22 D11F; right, left, undamped total and damped total are big-endian unsigned 16-bit / 128 litres. Tank phase must be 1 (sensors OK). US gallons are derived from litres.',
        { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticFuel',
            diag: { target: 0x60, sid: 0x22, did: 0xD11F, at: item[2], bytes: 2, minBytes: 9, validAt: 8, validValues: [1] } }));
['oilPressure', 'fuelHighActual', 'fuelHighTarget', 'fuelLowActual', 'fuelLowTarget'].forEach((id, i) =>
    add(id, ['Oil pressure (actual)', 'High-pressure fuel (actual)', 'High-pressure fuel (target)', 'Low-pressure fuel (actual)',
        'Low-pressure fuel (target)'][i], 'health', i === 0 ? 'Oil pressure' : 'Fuel system'));
for (let cylinder = 1; cylinder <= 8; cylinder++) {
    const identity = 'C' + cylinder + ' is a requested cylinder identity, not an established physical/DME mapping. ';
    add('timingCorrection' + cylinder, 'C' + cylinder + ' timing correction', 'health', 'Cylinder timing correction', {
        numeric: true, unit: 'deg', notes: identity +
            'No validated per-cylinder correction source, sign or degree calibration in the SOME/IP catalog or saved Lab evidence. ' +
            'Car Vitals OBD PID 0E / UDS F40E is cylinder-1 timing advance before TDC, not timing correction. ' +
            'Displayed observation peak is max(abs(session minimum), abs(session maximum)); no tuner limit is established.' });
    add('knock' + cylinder, 'C' + cylinder + ' knock', 'health', 'Cylinder knock', {
        numeric: true, notes: identity +
            'No per-cylinder knock source or physical scale identified in the SOME/IP catalog, Car Vitals or saved Lab evidence. ' +
            'Detector quantity versus event-counter semantics, units and counter period are unconfirmed; do not label this as a count. ' +
            'Any future validated maximum is an observation-session peak, not a trip total or diagnostic limit.' });
    add('misfire' + cylinder, 'C' + cylinder + ' misfire count', 'health', 'Cylinder misfires', {
        numeric: true, unit: 'count', notes: identity +
            'No validated count source on this dual-DME V8. Car Vitals probes OBD service 06 / UDS F6xx monitors from MID A2 ' +
            'on one configured ECU; both-DME coverage and C1-C8 mapping are unconfirmed. Requested TID 0C intends this driving cycle, ' +
            'but its fallback to the first returned test does not establish the actual counter period. No diagnostic request is issued here. ' +
            'Count is the intended quantity only; source, count semantics and period require vehicle validation. ' +
            'Displayed peak is the largest observed counter value since Reset, never a sum or inferred trip count.' });
}
const modeNames = { 1: 'SPORT_DYNAMIC', 2: 'SPORT_EXPERT', 3: 'SPORT_INDIVIDUAL', 4: 'COMFORT', 5: 'COMFORT_PLUS',
    6: 'COMFORT_INDIVIDUAL', 7: 'ECO_PRO_EFFICIENT', 8: 'ECO_PRO_PLUS', 9: 'ECO_PRO_INDIVIDUAL', 10: 'ADAPTIVE' };
const gearNames = { 1: 'N', 2: 'R', 3: 'P', 4: 'NP', 5: '1', 6: '2', 7: '3', 8: '4', 9: '5', 10: '6', 11: '7', 12: '8', 13: '9' };
const tractionNames = { 0: 'DSC_EIN', 1: 'DSC_AUS', 2: 'ANFAHRHILFE_AKTIV', 4: 'TRAKTIONSMODUS_EIN' };
const tractionLabels = { DSC_EIN: 'DSC ON', DSC_AUS: 'DSC OFF', ANFAHRHILFE_AKTIV: 'START ASSIST', TRAKTIONSMODUS_EIN: 'TRACTION' };
function decode(d, raw) {
    if (!raw || typeof raw !== 'object') return { state: 'invalid', note: 'Missing or malformed payload' };
    if (d.decoder === 'height') {
        const p = raw.position || {}, h = p.height || {};
        if ((raw.fixType !== 'FIX_3D' && raw.fixType !== 3) || p.heightValid !== true || !Number.isFinite(h.rawLengthMeter)) {
            return { state: 'invalid', note: 'No valid 3D height' };
        }
        return { state: 'live', value: h.rawLengthMeter * 3.280839895013123, unit: 'ft', quality: '3D fix; heightValid' };
    }
    const value = raw[d.member], qualifier = d.qualifier ? raw[d.qualifier] : undefined;
    if (d.qualifier && !(typeof qualifier === 'number' ? Number.isInteger(qualifier) &&
        Object.prototype.hasOwnProperty.call(d.validQualifiers || {}, qualifier) :
        typeof qualifier === 'string' && Object.values(d.validQualifiers || {}).includes(qualifier))) {
        return { state: 'invalid', note: 'Quality qualifier is not recognized as valid', quality: String(qualifier) };
    }
    if (d.decoder === 'mode' || d.decoder === 'gear' || d.decoder === 'traction') {
        const names = d.decoder === 'mode' ? modeNames : d.decoder === 'traction' ? tractionNames : gearNames;
        let text = typeof value === 'number' ? names[value] : null;
        if (typeof value === 'string') {
            if (d.decoder !== 'gear' && Object.values(names).includes(value)) text = value;
            if (d.decoder === 'gear' && /^(N|R|P|NP|_[1-9])$/.test(value)) text = value.replace('_', '');
        }
        return text ? { state: 'live', value: d.decoder === 'traction' ? tractionLabels[text] : text.replace(/_/g, ' '), quality: 'Recognized reported enum' } :
            { state: 'invalid', note: 'Invalid, initializing, reserved or unsupported enum' };
    }
    if (!Number.isFinite(value) || (value < 0 && d.decoder !== 'diagnosticBrake') || (d.decoder === 'serial' ? value === d.invalidFrom || value > 4294967295 : d.invalidFrom != null && value >= d.invalidFrom)) {
        return { state: 'invalid', note: 'Missing, invalid or unfilled field', quality: qualifier === undefined ? 'Sentinel / range check failed' : String(qualifier) };
    }
    if (d.decoder === 'serial') {
        return Number.isInteger(value) ? { state: 'live', value: String(value) + ' / 0x' + value.toString(16).toUpperCase(),
            quality: 'Reported serial; physical wheel position unknown' } : { state: 'invalid', note: 'Invalid sensor ID' };
    }
    const converter = converters[d.decoder];
    if (converter) {
        if (!Number.isInteger(value) || (converter.minRaw !== undefined && value < converter.minRaw) ||
            (converter.maxRaw !== undefined && value > converter.maxRaw)) {
            return { state: 'invalid', note: 'Raw field is outside the supported physical range' };
        }
        return { state: 'live', value: (value * converter.factor + converter.offset) * (converter.multiplier || 1) + (converter.displayOffset || 0), unit: converter.unit,
            quality: d.decoder === 'unscaled' ? 'Reported raw value; physical conversion unknown' +
                (qualifier === undefined ? '' : '; qualifier ' + String(qualifier)) :
                qualifier === undefined ? (d.diag ? 'Diagnostic response; documented physical conversion' : 'Supported upstream conversion; sentinel / range checks passed') : String(qualifier) };
    }
    return { state: 'unavailable', note: 'Source received; physical meaning or scaling is unconfirmed',
        quality: qualifier === undefined ? 'No validated physical conversion' : String(qualifier) };
}
function sourceKey(d) { return d.source ? IF[d.source] + '@' + (d.instance || '1') : null; }
module.exports = { IF, definitions, decode, sourceKey };
