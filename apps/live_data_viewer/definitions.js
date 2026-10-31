'use strict';

const IF = {
    engine: 'de.bmw.infotainment.vehicle.CDS', speed: 'de.bmw.infotainment.vehicle.Vehicle2',
    mode: 'de.bmw.infotainment.drivingexcitement.FES', thermal: 'de.bmw.infrastructure.analytics.BasicDataSet',
    air: 'de.bmw.infrastructure.EnvironmentalInformation', accel: 'de.bmw.infotainment.vehicle.CDS2',
    gps: 'de.bmw.infotainment.navigation.positioning.Positioning',
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
function diagnostic(id, name, page, group, target, did, at, bytes, options) {
    const opts = Object.assign({ decoder: 'diagnosticScalar', numeric: true, unit: '',
        scale: 1, offset: 0, pollMs: 1000, staleMs: 5000 }, options);
    const diag = Object.assign({ target, sid: 0x22, did, at, bytes, minBytes: at + bytes }, opts.diag);
    candidate(id, name, page, group, 'diagnostic', id, 'value', null, opts.notes,
        Object.assign(opts, { instance: 'SystemFunctionsInternalTasuInst1', diag }));
}
const thermalNote = 'BMW M Laptimer engine-temperature conversion: raw minus 48 degrees C, displayed in degrees F. Raw 255 is unavailable.';
candidate('coolant', 'Coolant / engine water', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineDrive', 255, thermalNote, { decoder: 'engineTemperature' });
candidate('oil', 'Engine oil', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineOilDrive', 255, thermalNote, { decoder: 'engineTemperature' });
candidate('transmission1', 'Transmission temperature 1', 'temperatures', 'Transmission', 'thermal', 'basicDataSet',
    'valueTemperatureTransmissionOil', 255, 'Upstream BasicDataSet transmission oil lead; sensor identity and scale are unconfirmed on this car.', { read: false });
add('transmission2', 'Transmission temperature 2 (EGS)', 'temperatures', 'Transmission', {
    lead: 'EGS ECU 0x18 / UDS DID 0xDA12', notes: 'Second upstream transmission lead: ECU 0x18, DID 0xDA12, proposed byte minus 48 degrees C. Unconfirmed forum-derived mapping; no diagnostic requests are issued.' });
add('converter', 'Torque converter temperature', 'temperatures', 'Transmission', { notes: 'No separately identified torque-converter sensor. Do not equate either transmission lead with this component.' });
['iatBank1', 'iatBank2'].forEach((id, index) => add(id, 'Intake air / bank ' + (index + 1), 'temperatures', 'Air', {
    notes: 'Requested bank ' + (index + 1) + ' intake-air channel. No validated per-bank sensor identity, diagnostic mapping or conversion on this car. Generic IAT and upstream F477 charge-air leads do not establish both-bank coverage; no guessed requests are issued.' }));
candidate('outside', 'Outside air', 'temperatures', 'Air', 'air', 'ExteriorTemperature', 'temperatureExterior', 255,
    'BMW M Laptimer outside-air conversion: raw times 0.5 minus 40 degrees C, displayed in degrees F.', { read: false, decoder: 'ambient' });
add('chargeAir', 'Charge-air temperature', 'temperatures', 'Air');
add('cabin', 'Cabin air temperature', 'temperatures', 'Air');

candidate('brakePressure', 'Brake system pressure', 'driving', 'Driver inputs', 'diagnostic', 'brakeSystemPressure', 'value', null,
    'ISTA IB_G05 / IB_G2X DRUCKSENSOR_LESEN: DSC BRS 0x29, UDS 22 DB29; second big-endian signed 16-bit field / 10 bar. Not master-cylinder pressure or pedal percentage.',
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticBrake', staleMs: 1500, pollMs: 50,
        diag: { target: 0x29, sid: 0x22, did: 0xDB29, at: 2, bytes: 2, signed: true, minBytes: 4 } });
candidate('steering', 'Steering wheel angle', 'driving', 'Driver inputs', 'steering', 'statusSteeringAngleDriver', 'actualValueSteeringAngleDriver', 65535,
    'BMW SDK steeringAngleConverter: raw * 0.04395 - 1440.11 degrees, valid raw 3-65532. Only explicitly valid catalog qualifiers are accepted.',
    { decoder: 'steeringAngle', qualifier: 'qualifierActualValueSteeringAngleDriver', validQualifiers: qualifierEnums.steering });
diagnostic('frontAxle', 'Front axle effective steering angle', 'driving', 'Driver inputs', 0x12, 0x58C6, 0, 2, {
    unit: 'deg', scale: 0.00274658, offset: -89.99725342, pollMs: 100,
    notes: 'ISTA DME8FF_R SG_FUNKTIONEN STG_STATUS_LENKWV_IST: actual front-axle steering angle, unsigned BE16 * 0.00274658 - 89.99725342 degrees. No qualifier or reserved raw range is documented in this diagnostic row. No assumed steering-wheel ratio or individual wheel toe geometry.' });
diagnostic('rearAxle', 'Rear axle actual steering angle', 'driving', 'Driver inputs', 0x2B, 0xDB33, 0, 2, {
    unit: 'deg', scale: 0.002747, offset: -90, pollMs: 100,
    diag: { minBytes: 11, validAt: 2, validValues: [1] },
    notes: 'ISTA HSR_G11 RES_0XDB33_D: actual rear-actuator angle BE16 * 0.002747 - 90 degrees, qualifier at byte 2 must equal 1 (valid); 8 initializing and 6 invalid are not angles. Not individually measured wheel toe.' });
candidate('accelerator', 'Accelerator pedal position', 'driving', 'Driver inputs', 'diagnostic', 'acceleratorPosition', 'value', null,
    'ISTA DME8FF_R for DME-88T0 N63TU3: IFPWG, UDS 22 480B, normalized pedal position; big-endian signed 16-bit * 0.01220703 percent. Only the physical 0-100 percent range is displayed.',
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticPedal', staleMs: 1500, pollMs: 50,
        diag: { target: 0x12, sid: 0x22, did: 0x480B, at: 0, bytes: 2, signed: true, minBytes: 2 } });
add('driveMode', 'Driving mode', 'driving', 'Drivetrain', { source: 'mode', field: 'statusFESVehicleDynamicSwitchHMI',
    member: 'actualValueModeDrivingExperience', read: true, decoder: 'mode', notes: 'Numeric and named wire enums are accepted. Seven variants were observed; invalid/reserved/initializing modes are rejected.' });
add('traction', 'Traction / DSC mode', 'driving', 'Drivetrain', { source: 'mode', field: 'statusDSCSwitchHMI',
    member: 'displayStatusDSC2', read: true, decoder: 'traction',
    notes: 'Catalog-defined DSC display state. Provider availability on this car is unconfirmed. Independent of driving mode; invalid/reserved codes are rejected.' });
add('parkingBrake', 'Parking brake', 'driving', 'Driver inputs', { source: 'speed', field: 'statusStandstillFunctions',
    member: 'statusParkingBrake', read: true, decoder: 'parkingBrake', staleMs: 2000,
    notes: 'BMW SDK AttributeMapping/TypeConverters uses Vehicle2.statusStandstillFunctions.statusParkingBrake: 0 mechanically released, 1 mechanically locked, 2 releasing, 4 locking. CDS statusHandBrake describes the mechanical handbrake contact, not this electric parking brake.' });
diagnostic('kickdown', 'Accelerator kickdown switch', 'driving', 'Driver inputs', 0x18, 0xDA1F, 0, 2, {
    decoder: 'binary', numeric: false, labels: ['RELEASED', 'ENGAGED'], pollMs: 100, staleMs: 2000,
    notes: 'ISTA GSZF04GD SG_FUNKTIONEN EGS_KICK_DOWN: unsigned BE16 0=off, 1=on. This is the EGS switch state, never inferred from accelerator percentage. Live support depends on the installed EGS variant.' });
diagnostic('brakePedal', 'Brake pedal switch', 'driving', 'Driver inputs', 0x29, 0xD9EF, 0, 1, {
    decoder: 'binary', numeric: false, labels: ['RELEASED', 'PRESSED'], pollMs: 100, staleMs: 2000,
    notes: 'ISTA IB_G05 RES_0XD9EF_D BLS_OUT: byte 0, 0=pedal not pressed, 1=pressed. Brake-system pressure is a separate quantity, never a pedal percentage.' });
candidate('speed', 'Vehicle speed', 'driving', 'Motion', 'speed', 'statusCarSpeed2', 'speedVehicleCentreOfGravity', 65535,
    'BMW M Laptimer vehicle speed: raw / 64 km/h, converted to mph. Valid standstill zero is retained.', { decoder: 'speed' });
candidate('rpm', 'Engine speed', 'driving', 'Drivetrain', 'engine', 'statusEngineSpeed2', 'actualValueRPMEngineCrankshaft', 65535,
    'BMW M Laptimer engine speed: raw / 4 rpm. Valid stopped-engine zero is retained.', { decoder: 'rpm' });
diagnostic('boostAbsolute', 'Pre-throttle absolute pressure', 'driving', 'Drivetrain', 0x12, 0x4205, 0, 2, {
    unit: 'hPa', scale: 20 / 256, pollMs: 100, staleMs: 3000,
    notes: 'ISTA DME8FF_R IPLAD: pressure before throttle, unsigned BE16 * 20 / 256 hPa absolute; range 0-5120 hPa.' });
diagnostic('barometricPressure', 'Ambient absolute pressure', 'driving', 'Drivetrain', 0x12, 0x4201, 0, 2, {
    unit: 'hPa', scale: 10 / 256, pollMs: 1000, staleMs: 5000,
    notes: 'ISTA DME8FF_R IPUMG: ambient pressure unsigned BE16 * 10 / 256 hPa. No fixed sea-level substitute is used.' });
add('boost', 'Boost pressure (gauge)', 'driving', 'Drivetrain', { kind: 'derived', numeric: true, unit: 'psi',
    dependsOn: ['boostAbsolute', 'barometricPressure'], maxSkewMs: 2000, staleMs: 3000,
    notes: 'Upstream Car Vitals gauge-pressure method: actual pre-throttle absolute pressure minus measured ambient pressure, converted hPa to psi. Negative differential retained; inputs must be fresh and within 2 seconds by local arrival time.' });
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
    { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticVoltage', pollMs: 2000,
        diag: { target: 0x12, sid: 0x22, did: 0x586A, at: 0, bytes: 2, signed: true, minBytes: 2 } });
add('transmissionPressure', 'Transmission oil pressure', 'temperatures', 'Pressures');
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
['FLH', 'FRH', 'RLH', 'RRH'].forEach((wheel, index) => {
    const diag = { minBytes: 19, qualityAt: 15 + index };
    diagnostic('wheelSpeed' + wheel, 'Wheel speed ' + wheel, 'driving', 'Motion', 0x29, 0xDBE4, index * 2, 2, {
        unit: 'mph', scale: 0.01 / 1.609344, pollMs: 100, staleMs: 2000,
        diag: Object.assign({ signed: true }, diag),
        notes: 'ISTA IB_G05 RES_0XDBE4_D: wheel-specific signed BE16 / 100 km/h, converted to mph. Own signal quality must be >50% and <=100%. Direction is independently reported, not inferred from gear or speed.' });
    diagnostic('wheelDirection' + wheel, 'Wheel direction ' + wheel, 'driving', 'Motion', 0x29, 0xDBE4, 10 + index, 1, {
        decoder: 'wheelDirection', numeric: false, pollMs: 100, staleMs: 2000, diag,
        notes: 'ISTA IB_G05 TAB_DREHRICHTUNG: 0 standstill, 1 forward, 2 reverse; 3 undefined remains unavailable. Own wheel quality must be >50% and <=100%.' });
});
['frontPower', 'rearPower'].forEach((id, index) => add(id, (index ? 'Rear' : 'Front') + ' axle power', 'driving', 'Drivetrain', {
    numeric: true, unit: 'hp', notes: 'No established axle-specific delivered torque, rotational-speed and gearing mapping. LMV DB32 torque qualifiers 12/27 remain unresolved; Powertrain wheel moment/RPM scales are unconfirmed. Clutch engagement alone cannot determine axle power or power split.' }));
['Right', 'Left'].forEach((side, index) => diagnostic('exhaust' + side, side + ' DME exhaust command', 'driving', 'Exhaust', 0x12 + index, 0x62FD, 0, 2, {
    decoder: 'exhaustCommand', numeric: false, diag: { signed: true }, pollMs: 1000,
    notes: 'ISTA DME8FF_R/L ASW_EL_AGK and upstream live_adjustments: tester command BE16 / 100%. Only 8-12% OPEN and 88-92% CLOSED command bands recognized. This is NOT measured valve position. Saved right=10%, left=90% proves commands can differ.' }));
add('exhaust', 'Exhaust command (both DMEs)', 'driving', 'Exhaust', { kind: 'derived',
    dependsOn: ['exhaustRight', 'exhaustLeft'], staleMs: 5000, maxSkewMs: 2000,
    notes: 'Aggregate only when both fresh DME command bands agree; asymmetric commands remain MIXED. Actual mechanical flap position is unmeasured.' });
add('chargeCoolerCoolant', 'Charge-cooler coolant', 'temperatures', 'Charge cooling', {
    numeric: true, unit: 'F', notes: 'No validated coolant sensor identified. DME 40E7/55DC report electric-pump temperature, not coolant temperature; F477 is charge air, not coolant. These are deliberately not substituted.' });
[[1, 0x5896, 0.1, -273.14, true], [2, 0x5897, 0.0234375, -273.15, false]].forEach((item) =>
    diagnostic('exhaustBank' + item[0], 'Post-catalyst exhaust model / bank ' + item[0], 'temperatures', 'Exhaust', 0x12, item[1], 0, 2, {
        unit: 'F', scale: item[2] * 1.8, offset: item[3] * 1.8 + 32, diag: { signed: item[4] }, pollMs: 2000,
        notes: 'ISTA DME8FF_R SG_FUNKTIONEN ' + (item[0] === 1 ? 'TEMP_NACH_KAT_MODELL' : 'STAT_0X5897_WERT') +
            ': bank-labelled post-main-catalyst exhaust temperature MODEL, not a measured thermocouple. No source-defined sentinel or validity flag is documented in these rows; only temperatures below absolute zero are rejected. Shared PRG does not guarantee fitted software support.' }));
[[1, 0x5079], [2, 0x50D6]].forEach((item) =>
    diagnostic('catalystBank' + item[0], 'Catalyst gas temperature / bank ' + item[0], 'temperatures', 'Exhaust', 0x12, item[1], 0, 2, {
        unit: 'F', scale: 0.18, offset: 32, diag: { signed: true }, pollMs: 2000,
        notes: 'ISTA DME8FF_R ABGAS_TEMP_IM_KAT_ROH1' + (item[0] === 2 ? '_B2' : '') +
            ': raw exhaust-gas temperature in catalyst monolith 1, explicitly bank-labelled, signed BE16 / 10 Celsius. No sentinel/validity flag documented: FFFF decodes to -0.1 C and cannot honestly be declared invalid from this row alone. Not catalyst substrate temperature; runtime support is not presumed.' }));
diagnostic('transferCase', 'Transfer-case clutch lamella model', 'temperatures', 'Drivetrain', 0x19, 0x4004, 0, 4, {
    unit: 'F', scale: 1.8 / 4194304, offset: 32, diag: { signed: true, minBytes: 59 }, pollMs: 5000,
    notes: 'ISTA LMV_G11 RES_0X4004_D STAT_TMPBLADE: signed BE32 / 4194304 Celsius, simulated clutch-lamella temperature, not measured case/oil temperature. Saved real response reports 47.96875 C.' });
add('rearDifferential', 'Rear-differential temperature', 'temperatures', 'Drivetrain', {
    numeric: true, unit: 'F', notes: 'No validated rear-differential oil/case temperature source or fitted sensor mapping in the available vehicle evidence. Transfer-case clutch and ECU temperatures are not substituted.' });
for (let i = 1; i <= 4; i++) {
    candidate('sensor' + i, 'Sensor slot ' + i + ' serial / ID', 'driving', 'Tires / TPMS: unknown positions',
        'sensors', 'tpmsInternalLastValues', 'tpmsInternalLastSensorSerNoId' + i, 2147483647,
        'No provider/payload captured. Slots are not wheel positions. IDs are preserved as decimal and hexadecimal, never called UUIDs.',
        { decoder: 'serial', position: 'Unknown', positionBasis: 'Radio slot only; no physical wheel position assumed', staleMs: 20000 });
}
[['tankTotal', 'Fuel tank total', 4], ['tankLeft', 'Left fuel tank', 2], ['tankRight', 'Right fuel tank', 0]].forEach((item) =>
    candidate(item[0], item[1], 'driving', 'Fuel tank levels', 'diagnostic', item[0], 'value', null,
        'ISTA KOMBSP18 TANKINHALT: KOMBI 0x60, UDS 22 D11F; right, left, undamped total and damped total are big-endian unsigned 16-bit / 128 litres. Tank phase must be 1 (sensors OK). US gallons are derived from litres.',
        { instance: 'SystemFunctionsInternalTasuInst1', decoder: 'diagnosticFuel', pollMs: 5000,
            diag: { target: 0x60, sid: 0x22, did: 0xD11F, at: item[2], bytes: 2, minBytes: 9, validAt: 8, validValues: [1] } }));
['oilPressure', 'fuelHighActual', 'fuelHighTarget', 'fuelLowActual', 'fuelLowTarget'].forEach((id, i) =>
    add(id, ['Oil pressure (actual)', 'High-pressure fuel (actual)', 'High-pressure fuel (target)', 'Low-pressure fuel (actual)',
        'Low-pressure fuel (target)'][i], 'health', i === 0 ? 'Oil pressure' : 'Fuel system', { pages: ['health', 'temperatures'] }));
for (let cylinder = 1; cylinder <= 8; cylinder++) {
    const identity = 'C' + cylinder + ' is a requested cylinder identity, not an established physical/DME mapping. ';
    add('timingCorrection' + cylinder, 'C' + cylinder + ' timing correction', 'health', 'Cylinder timing correction', {
        numeric: true, unit: 'deg', notes: identity +
            'No validated per-cylinder correction source, sign or degree calibration in the SOME/IP catalog or saved Lab evidence. ' +
            'Car Vitals OBD PID 0E / UDS F40E is cylinder-1 timing advance before TDC, not timing correction. ' +
            'Displayed observation peak is max(abs(session minimum), abs(session maximum)); no tuner limit is established.' });
    add('knock' + cylinder, 'C' + cylinder + ' knock', 'health', 'Cylinder knock', {
        numeric: true, unit: 'V*ms', notes: identity +
            'ISTA DME8FF_R/L SPG_KLOPF_ZYL1..6 identifies voltage-time knock signal, unsigned BE32 * 0.05 / 65536 V*ms; fractional values are expected, not fractional event counts. ' +
            'IUKZ1..6 is a different normalized reference level. Both-DME physical C1-C8 mapping is unresolved, so no guessed requests or per-cylinder values are supplied. ' +
            'C5/C1 through C8/C4 is the requested display arrangement, not a proven physical orientation. Peaks are signal maxima, not summed events.' });
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
    if (d.decoder === 'parkingBrake') {
        const states = { 0: 'RELEASED', 1: 'APPLIED', 2: 'RELEASING', 4: 'LOCKING',
            PARKBREMSE_MECHANISCH_NICHT_FESTGESTELLT: 'RELEASED', PARKBREMSE_MECHANISCH_FESTGESTELLT: 'APPLIED',
            PARKBREMSE_IM_STELLVORGANG_LOESEN: 'RELEASING', PARKBREMSE_IM_STELLVORGANG_FESTSTELLEN: 'LOCKING' };
        return Object.prototype.hasOwnProperty.call(states, value) ? { state: 'live', value: states[value], quality: 'Vehicle2 mechanical parking-brake state' } :
            { state: 'unavailable', note: 'Parking-brake interface unavailable, faulted or unfilled' };
    }
    if (d.decoder === 'binary') return value === 0 || value === 1 ?
        { state: 'live', value: d.labels[value], quality: 'Documented diagnostic switch enum' } :
        { state: 'invalid', note: 'Unrecognized switch value' };
    if (d.decoder === 'wheelDirection') return value === 0 || value === 1 || value === 2 ?
        { state: 'live', value: ['STANDSTILL', 'FORWARD', 'REVERSE'][value], quality: 'Independent wheel direction; own signal quality >50%' } :
        { state: 'unavailable', note: 'Wheel direction undefined' };
    if (d.decoder === 'exhaustCommand') {
        const pct = value / 100;
        return pct >= 8 && pct <= 12 || pct >= 88 && pct <= 92 ?
            { state: 'live', value: pct <= 12 ? 'OPEN' : 'CLOSED', quality: 'Command band only; physical position unmeasured' } :
            { state: 'unavailable', note: 'Exhaust command outside documented open/close bands; physical position unmeasured' };
    }
    if (d.decoder === 'diagnosticScalar') {
        if (!Number.isSafeInteger(value) || d.invalidFrom != null && value >= d.invalidFrom) return { state: 'invalid', note: 'Invalid diagnostic scalar' };
        const physical = value * d.scale + d.offset;
        if (!Number.isFinite(physical) || d.unit === 'F' && physical < -459.67) return { state: 'invalid', note: 'Diagnostic temperature below absolute zero' };
        return { state: 'live', value: physical, unit: d.unit, quality: 'Documented ISTA conversion; ' +
            (d.diag.validAt !== undefined || d.diag.qualityAt !== undefined ? 'documented qualifier accepted' :
                'no source-defined validity flag/sentinel established; positive response is not independent physical validation') };
    }
    if (d.decoder === 'mode' || d.decoder === 'traction') {
        const names = d.decoder === 'mode' ? modeNames : tractionNames;
        let text = typeof value === 'number' ? names[value] : null;
        if (typeof value === 'string' && Object.values(names).includes(value)) text = value;
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
