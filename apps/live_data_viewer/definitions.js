'use strict';

const IF = {
    engine: 'de.bmw.infotainment.vehicle.CDS', speed: 'de.bmw.infotainment.vehicle.Vehicle2',
    mode: 'de.bmw.infotainment.drivingexcitement.FES', thermal: 'de.bmw.infrastructure.analytics.BasicDataSet',
    air: 'de.bmw.infrastructure.EnvironmentalInformation', accel: 'de.bmw.infotainment.vehicle.CDS2',
    gps: 'de.bmw.infotainment.navigation.positioning.Positioning', gear: 'de.bmw.infrastructure.VehicleInformation',
    pedal: 'de.bmw.powertrain.AcceleratorPedal', steering: 'de.bmw.infotainment.drivingexcitement.XView',
    brake: 'de.bmw.chassis.VehicleStabilizationManagement', tpms: 'de.bmw.infotainment.vehicle.TPMS',
    sensors: 'de.bmw.infotainment.vehicle.TPMSInternalData', fuel: 'de.bmw.infotainment.KombiIF',
};
const definitions = [];
function add(id, name, page, group, options) {
    definitions.push(Object.assign({ id, name, page, group, kind: 'reported', staleMs: 10000,
        notes: 'No validated source on this vehicle; additional diagnostic interface work is deferred.' }, options || {}));
}
function candidate(id, name, page, group, source, field, member, invalidFrom, notes, extra) {
    add(id, name, page, group, Object.assign({ source, field, member, read: true, invalidFrom,
        notes, decoder: 'unconfirmed' }, extra || {}));
}
const thermalNote = 'Payloads received in MGU Lab, but temperature units/scaling need vehicle comparison. Upstream candidate is raw minus 48 degrees C; no physical value is asserted.';
candidate('coolant', 'Coolant / engine water', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineDrive', 255, thermalNote);
candidate('oil', 'Engine oil', 'temperatures', 'Engine', 'engine', 'statusEngineTemperature', 'temperatureEngineOilDrive', 255, thermalNote);
candidate('transmission1', 'Transmission temperature 1', 'temperatures', 'Transmission', 'thermal', 'basicDataSet',
    'valueTemperatureTransmissionOil', 255, 'Upstream BasicDataSet transmission oil lead; sensor identity and scale are unconfirmed on this car.', { read: false });
add('transmission2', 'Transmission temperature 2 (EGS)', 'temperatures', 'Transmission', {
    lead: 'EGS ECU 0x18 / UDS DID 0xDA12', notes: 'Second upstream transmission lead: ECU 0x18, DID 0xDA12, proposed byte minus 48 degrees C. Unconfirmed forum-derived mapping; no diagnostic requests are issued.' });
add('converter', 'Torque converter temperature', 'temperatures', 'Transmission', { notes: 'No separately identified torque-converter sensor. Do not equate either transmission lead with this component.' });
add('iat', 'Intake air temperature (IAT)', 'temperatures', 'Air', { notes: 'Upstream has OBD/UDS candidates, but this car has no validated intake-air source or sensor location in the saved Lab results.' });
candidate('outside', 'Outside air', 'temperatures', 'Air', 'air', 'ExteriorTemperature', 'temperatureExterior', 255,
    'Outside-air candidate; upstream proposes raw times 0.5 minus 40 degrees C. Source and calibration unconfirmed here.', { read: false });
add('chargeAir', 'Charge-air temperature', 'temperatures', 'Air');
add('cabin', 'Cabin air temperature', 'temperatures', 'Air');

add('brakePedal', 'Brake pedal travel / pressure', 'driving', 'Driver inputs', { notes: 'Driver-braking status exists, but does not establish pedal travel or pressure.' });
candidate('braking', 'Driver-braking status', 'driving', 'Driver inputs', 'brake', 'StabilizationManagement', 'statusBrakingDriver', null,
    'Changing status codes were received; their meanings are undecoded. This is not pedal pressure or position.', { read: false });
candidate('steering', 'Steering wheel angle', 'driving', 'Driver inputs', 'steering', 'statusSteeringAngleDriver', 'actualValueSteeringAngleDriver', 65535,
    'Movement observed; center, sign and degree conversion require calibration.', { qualifier: 'qualifierActualValueSteeringAngleDriver' });
candidate('frontAxle', 'Front axle steering angle', 'driving', 'Driver inputs', 'steering', 'statusFrontAxleSteeringAngle', 'steeringAngleFrontAxleEffective', 65535,
    'Front-axle angle lead; field layout and physical conversion remain unconfirmed.');
candidate('accelerator', 'Accelerator pedal', 'driving', 'Driver inputs', 'pedal', 'AngleAcceleratorPedal', 'actualValueAngleAcceleratorPedal', 4095,
    'Valid qualifiers but only zero values retained. Movement and percentage/angle scale unproven.', { read: false, qualifier: 'qualifierActualValueAngleAcceleratorPedal' });
candidate('gear', 'Gear / selector state', 'driving', 'Drivetrain', 'gear', 'DataPowerTrain2', 'statusGearSelectionDrive', 15,
    'Catalog enum identifies P/R/N/NP and gears 1-9; this source is not established by saved Lab captures. Only recognized enums are displayed when received.', { read: false, decoder: 'gear', kind: 'reported' });
add('gearProgram', 'Transmission D / S / M program', 'driving', 'Drivetrain', { notes: 'No independently validated transmission program source. Driving mode is a different signal.' });
add('driveMode', 'Driving mode', 'driving', 'Drivetrain', { source: 'mode', field: 'statusFESVehicleDynamicSwitchHMI',
    member: 'actualValueModeDrivingExperience', read: true, decoder: 'mode', notes: 'Numeric and named wire enums are accepted. Seven variants were observed; invalid/reserved/initializing modes are rejected.' });
candidate('speed', 'Vehicle speed', 'driving', 'Motion', 'speed', 'statusCarSpeed2', 'speedVehicleCentreOfGravity', 65535,
    'Only standstill samples established. Upstream conversion raw / 64 km/h needs moving-vehicle comparison.');
candidate('rpm', 'Engine speed', 'driving', 'Drivetrain', 'engine', 'statusEngineSpeed2', 'actualValueRPMEngineCrankshaft', 65535,
    'Payloads received. Upstream conversion raw / 4 RPM needs comparison with vehicle instruments.');
candidate('boost', 'Boost pressure', 'driving', 'Drivetrain', 'mode', 'statusSwitchDriveDynamicSport2', 'displayBoostPressure', 255,
    'Sport-display candidate. Gauge versus absolute pressure and reference pressure are unconfirmed.');
candidate('torque', 'Actual crankshaft torque', 'driving', 'Drivetrain', 'mode', 'statusActualValueTorque2', 'actualValueTorqueCrankshaft', 4095,
    'Upstream proposes 0.5 Nm/bit minus 1023.5 Nm. Requires validation; negative torque must not silently become zero.');
add('horsepower', 'Horsepower', 'driving', 'Drivetrain', { kind: 'derived', notes: 'No validated compatible torque/RPM pair. Power is not derived from unmatched or unconfirmed inputs.' });
candidate('gLong', 'Longitudinal acceleration', 'driving', 'Motion', 'accel', 'statusLongitudinalAccelerationMassCenter', 'longitudinalAccelerationCentreOfGravity', 65535,
    'Scale, axes, sign and gravity/filtering behavior require validation.');
candidate('gLat', 'Lateral acceleration', 'driving', 'Motion', 'accel', 'statusLateralAccelerationMassCenter', 'lateralAccelerationCentreOfGravity', 65535,
    'Scale, axes, sign and gravity/filtering behavior require validation.');
candidate('voltage', 'Battery voltage', 'driving', 'Electrical', 'thermal', 'basicDataSet', 'statusVoltageIntelligentBoardnetSensor', 65535,
    'Boardnet-voltage candidate; electrical system, units and scale unconfirmed.', { read: false });
candidate('battery', 'Battery charging condition', 'driving', 'Electrical', 'engine', 'statusBattery2', 'conditionBatteryChargingCondition', 255,
    'A changing battery condition field is available; it is not established as voltage or percent.');
add('transmissionPressure', 'Transmission oil pressure', 'driving', 'Drivetrain');
add('altitude', 'GPS altitude', 'driving', 'Motion', { source: 'gps', field: 'rawPositionData', read: true,
    instance: 'Main_Instance', decoder: 'height', unit: 'ft', numeric: true, staleMs: 5000,
    notes: 'Height requires a 3D fix and heightValid. rawLengthMeter is converted to feet. Height reference/geoid and accuracy remain unconfirmed.' });

['FLH', 'FRH', 'RLH', 'RRH'].forEach((wheel, i) => {
    const group = 'Tires / TPMS: ' + ['Front left', 'Front right', 'Rear left', 'Rear right'][i];
    const common = { position: ['Front left', 'Front right', 'Rear left', 'Rear right'][i],
        positionBasis: 'Reported by wheel-specific field; not inferred from a radio slot', staleMs: 20000 };
    candidate('pressure' + wheel, 'Pressure', 'driving', group, 'tpms', 'statusTyrePressure', 'actualValuePressureTyre' + wheel, 65532,
        'Captured 65534 is invalid, not pressure. Other values still need scale confirmation on this car; proposed upstream unit is 0.1 bar per bit.', common);
    candidate('tyreTemp' + wheel, 'Temperature', 'driving', group, 'tpms', 'statusTyreTemperature', 'actualValueTemperatureTyre' + wheel, 65532,
        'Captured 65534 is invalid. Upstream proposes degrees C minus 40; no valid physical sample established.', common);
    candidate('target' + wheel, 'Target pressure', 'driving', group, 'tpms', 'statusTargetTyrePressure', 'targetPressureTyre' + wheel, 65532,
        'Captured 65533 is invalid. Target pressure is separate from actual pressure; conversion unconfirmed.', common);
    add('tyreState' + wheel, 'Reported wheel state', 'driving', group, Object.assign({
        notes: 'Saved aggregate tyre qualifiers do not identify an individual wheel state or sensor identity.' }, common));
});
for (let i = 1; i <= 4; i++) {
    candidate('sensor' + i, 'Sensor slot ' + i + ' serial / ID', 'driving', 'Tires / TPMS: unknown positions',
        'sensors', 'tpmsInternalLastValues', 'tpmsInternalLastSensorSerNoId' + i, 2147483647,
        'No provider/payload captured. Slots are not wheel positions. IDs are preserved as decimal and hexadecimal, never called UUIDs.',
        { decoder: 'serial', position: 'Unknown', positionBasis: 'Radio slot only; no physical wheel position assumed', staleMs: 20000 });
}
[['tankTotal', 'Fuel tank total', 'fluidLevelFuelTank'], ['tankLeft', 'Left fuel tank', 'fluidLevelFuelTankLeftHand'],
    ['tankRight', 'Right fuel tank', 'fluidLevelFuelTankRightHand']].forEach((item) =>
    candidate(item[0], item[1], 'health', 'Fuel tank levels', 'fuel', 'statusRangeTankStatus', item[2], 255,
        'Changing separate tank fields were captured, but their units need calibration. Left plus right does not equal reported total; no gallons are inferred.'));
['oilPressure', 'fuelHighActual', 'fuelHighTarget', 'fuelLowActual', 'fuelLowTarget', 'timing', 'knock', 'misfire'].forEach((id, i) =>
    add(id, ['Oil pressure (actual)', 'High-pressure fuel (actual)', 'High-pressure fuel (target)', 'Low-pressure fuel (actual)',
        'Low-pressure fuel (target)', 'Ignition timing', 'Knock information', 'Misfires'][i], 'health',
        i === 0 ? 'Oil pressure' : i < 5 ? 'Fuel system' : i < 7 ? 'Ignition / knock' : 'Misfires'));
const modeNames = { 1: 'SPORT_DYNAMIC', 2: 'SPORT_EXPERT', 3: 'SPORT_INDIVIDUAL', 4: 'COMFORT', 5: 'COMFORT_PLUS',
    6: 'COMFORT_INDIVIDUAL', 7: 'ECO_PRO_EFFICIENT', 8: 'ECO_PRO_PLUS', 9: 'ECO_PRO_INDIVIDUAL', 10: 'ADAPTIVE' };
const gearNames = { 1: 'N', 2: 'R', 3: 'P', 4: 'NP', 5: '1', 6: '2', 7: '3', 8: '4', 9: '5', 10: '6', 11: '7', 12: '8', 13: '9' };
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
    if (qualifier !== undefined && (typeof qualifier !== 'string' || !/^SIGNALWERT_IST_GUELTIG/.test(qualifier))) {
        return { state: 'invalid', note: 'Quality qualifier is not recognized as valid', quality: String(qualifier) };
    }
    if (d.decoder === 'mode' || d.decoder === 'gear') {
        const names = d.decoder === 'mode' ? modeNames : gearNames;
        let text = typeof value === 'number' ? names[value] : null;
        if (typeof value === 'string') {
            if (d.decoder === 'mode' && Object.values(names).includes(value)) text = value;
            if (d.decoder === 'gear' && /^(N|R|P|NP|_[1-9])$/.test(value)) text = value.replace('_', '');
        }
        return text ? { state: 'live', value: text.replace(/_/g, ' '), quality: 'Recognized reported enum' } :
            { state: 'invalid', note: 'Invalid, initializing, reserved or unsupported enum' };
    }
    if (!Number.isFinite(value) || value < 0 || (d.decoder === 'serial' ? value === d.invalidFrom || value > 4294967295 : d.invalidFrom !== null && value >= d.invalidFrom)) {
        return { state: 'invalid', note: 'Missing, invalid or unfilled field', quality: qualifier === undefined ? 'Sentinel / range check failed' : String(qualifier) };
    }
    if (d.decoder === 'serial') {
        return Number.isInteger(value) ? { state: 'live', value: String(value) + ' / 0x' + value.toString(16).toUpperCase(),
            quality: 'Reported serial; physical wheel position unknown' } : { state: 'invalid', note: 'Invalid sensor ID' };
    }
    return { state: 'unavailable', note: 'Source received; physical meaning or scaling is unconfirmed',
        quality: qualifier === undefined ? 'No validated physical conversion' : String(qualifier) };
}
function sourceKey(d) { return d.source ? IF[d.source] + '@' + (d.instance || '1') : null; }
module.exports = { IF, definitions, decode, sourceKey };
