'use strict';

const EventEmitter = require('events');
const Car = require('./kit/car');
const { modeOf, slotOf, MIN_GAP_MS, request: presetRequest } = require('./ambient');

const SPEED_MAX_AGE = 3000;
const LAST_USE_MS = 15 * 60000;
const SWITCH = 'de.bmw.body.drivinglight.LightswitchOperation';
const SWITCH_COMMANDS = [
    { id: 'auto', label: 'Auto', availability: 'pushButtonAUTO', method: 'pushButtonAuto', state: 'AUTO', code: 1 },
    { id: 'drive', label: 'Low beams', availability: 'pushButtonDrivingLight', method: 'pushButtonDrivingLight', state: 'DRIVINGLIGHT', code: 0 },
    { id: 'position', label: 'Position lights', availability: 'pushButtonPositionLight', method: 'pushButtonPositionLight', state: 'POSITIONLIGHT', code: 2 },
    { id: 'off', label: 'Lights off', availability: 'pushButtonOff', method: 'pushButtonLightOff', state: 'LIGHT_OFF', code: 5 },
    { id: 'parkLeft', label: 'Left parking', availability: 'pushButtonParklightLeft', method: 'pushButtonParkinglightLeft', state: 'PARKINGLIGHT_LEFT', code: 3 },
    { id: 'parkRight', label: 'Right parking', availability: 'pushButtonParklightRight', method: 'pushButtonParkinglightRight', state: 'PARKINGLIGHT_RIGHT', code: 4 },
    { id: 'fogFront', label: 'Front fog', availability: 'pushButtonFoglightFront', field: 'foglightFront' },
    { id: 'fogRear', label: 'Rear fog', availability: 'pushButtonFoglightRear', field: 'foglightRear' },
];

const DIRECTION = {
    7: 'left', 9: 'left', 18: 'left', 20: 'left', 22: 'left',
    8: 'right', 10: 'right', 19: 'right', 21: 'right', 23: 'right',
    1: 'both', 6: 'both', 12: 'both', 13: 'both', 16: 'both', 24: 'both', 25: 'both',
};
const HAZARDS = ['WARNBLINKEN_MANUELL', 'CRASH_BLINKEN', 'AUFFAHRWARNBLINKEN', 'WARNBLINKEN_NACH_GEFAHRENBREMSUNG',
    'FAS_WARNBLINKEN_AUSPRAEGUNG_1', 'FAS_WARNBLINKEN_AUSPRAEGUNG_2'];
const DOORS = {
    statusDoorSwitchDRD: 'driver front', statusDoorSwitchPSD: 'passenger front',
    statusDoorSwitchDRDR: 'driver rear', statusDoorSwitchPSDR: 'passenger rear',
};

function directionOf(value) {
    if (typeof value === 'number') return DIRECTION[value] || null;
    if (HAZARDS.indexOf(value) >= 0) return 'both';
    if (/^(DAUERBLINKEN|TIPPBLINKEN|FAS_RICHTUNGSBLINKEN_.*)_LINKS$/.test(value)) return 'left';
    if (/^(DAUERBLINKEN|TIPPBLINKEN|FAS_RICHTUNGSBLINKEN_.*)_RECHTS$/.test(value)) return 'right';
    return null;
}

function ambientMenuOf(value) {
    if (value === 13 || value === 'INDIVIDUALMODUS') return 'INDIVIDUALMODUS';
    if (value === 14 || value === 'KOPPLUNG_AN_FES') return 'KOPPLUNG_AN_FES';
    return slotOf(value);
}

class Vehicle extends EventEmitter {
    constructor(ctx) {
        super();
        this.signals = ctx.signals;
        this.settings = ctx.settings;
        this.log = ctx.log;
        this.condition = null;
        this.mode = null;
        this.speedRaw = null;
        this.speedAt = 0;
        this.brakeAt = 0;
        this.parkingBrake = false;
        this.visible = false;
        this.lastUse = 0;
        this.factoryAmbient = null;
        this.ambientSlot = null;
        this.ambientMenu = null;
        this.ambientRestore = ambientMenuOf(this.settings.get('solFactoryRestore'));
        this.ambientTarget = { menu: null, byMode: false };
        this.ambientAttempt = null;
        this.ambientSentAt = 0;
        this.ambientLastDispatch = 0;
        this.night = false;
        this.turn = null;
        this.doors = [];
        this.lightSwitch = {};
        this.switchNote = '';
        this.switchBusy = false;
        this.watches = [];
    }

    put(key, value) {
        if (this[key] === value) return;
        this[key] = value;
        this.emit('change');
    }

    setVisible(value) {
        this.visible = !!value;
        if (this.visible) this.lastUse = Date.now();
        this.emit('change');
    }

    occupied() {
        return this.condition === null ? this.visible || Date.now() - this.lastUse < LAST_USE_MS : this.condition > 3;
    }

    speed() { return this.speedRaw !== null && Date.now() - this.speedAt < SPEED_MAX_AGE ? this.speedRaw / 64 : null; }

    parkReason() {
        if (!this.occupied()) return 'Waiting for an active vehicle';
        const speed = this.speed();
        if (speed === null) return 'Waiting for a fresh speed reading';
        if (speed !== 0) return 'Stop the vehicle';
        if (!this.parkingBrake || Date.now() - this.brakeAt >= SPEED_MAX_AGE) return 'Apply the parking brake';
        return null;
    }

    watch(iface, handlers, opts) {
        return this.signals.watch(iface, '1', handlers, this.log, opts).then((watch) => {
            if (this.stopped) watch.shutdown();
            else this.watches.push(watch);
            return watch;
        }).catch((e) => { this.log.warn('Sol ' + iface + ': ' + e); return null; });
    }

    start() {
        const condition = (value) => {
            const network = value && value.controlBasePartialNetworks;
            const networkState = typeof network === 'string' ? network.replace(/^KOM_/, '') : network;
            const fallback = network === 'KEINE_KOMMUNIKATION' || network === 0 ? 1 : Car.conditionOf(networkState);
            const state = Car.conditionOf(value && value.statusConditionVehicle) || fallback;
            if (state !== undefined) this.put('condition', state);
        };
        this.watch('de.bmw.infrastructure.VehicleCondition', { VehicleCondition: condition, vehicleConditionNoCrc: condition });
        this.watch('de.bmw.infotainment.vehicle.Vehicle2', {
            statusCarSpeed2: (value) => {
                const raw = value && value.speedVehicleCentreOfGravity;
                const ageExpired = Date.now() - this.speedAt >= SPEED_MAX_AGE;
                this.speedAt = Date.now();
                if (Number.isInteger(raw) && raw > 0 && raw <= 400 * 64) this.lastUse = this.speedAt;
                this.put('speedRaw', Number.isInteger(raw) && raw >= 0 && raw <= 400 * 64 ? raw : null);
                if (ageExpired) this.emit('change');
            },
            statusStandstillFunctions: (value) => {
                const brake = value && value.statusParkingBrake;
                const ageExpired = Date.now() - this.brakeAt >= SPEED_MAX_AGE;
                this.brakeAt = Date.now();
                this.put('parkingBrake', brake === 1 || brake === 'PARKBREMSE_MECHANISCH_FESTGESTELLT');
                if (ageExpired) this.emit('change');
            },
        }, { pollMs: 1000 });
        this.watch('de.bmw.infotainment.misc.ComfortFunctionIuK', {
            statusAmbientLightInteriorColour: (value) => {
                const mode = value && value.statusModeAmbientePanoramicRoofInteriorLighting;
                const slot = value && value.statusMenuAmbientePanoramicRoofInteriorLighting;
                if (mode === 0 || mode === 'AUS' || slot === 0 || slot === 'AMBIENTEBELEUCHTUNG_AUS') this.put('factoryAmbient', false);
                else if (mode === 1 || mode === 'EIN' || (slot >= 1 && slot <= 14) || /^FARBAUSWAHL_/.test(slot)) this.put('factoryAmbient', true);
                this.ambientMenu = ambientMenuOf(slot);
                this.put('ambientSlot', slotOf(slot));
            },
        }, { pollMs: 2000 }).then((watch) => this.put('ambientConnection', watch));
        this.watch('de.bmw.infotainment.drivingexcitement.FES', {
            statusFESVehicleDynamicSwitchHMI: (value) => {
                const mode = modeOf(value && value.actualValueModeDrivingExperience);
                this.put('mode', mode ? mode.mode : null);
            },
        });
        this.watch('de.bmw.infotainment.vehicle.Vehicle', {
            statusDayNightChangeOver: (value) => {
                const code = value && value.dayNightChangeOver;
                if (code === 'TAG' || code === 'NACHT' || code === 1 || code === 2) this.put('night', code === 'NACHT' || code === 2);
            },
        });
        this.watch('de.bmw.body.Light', {
            StatusFunctionsIndicators: (value) => this.put('turn', directionOf(value && value.activeFunctionIndicateDirection)),
        });
        this.watch('de.bmw.body.DoorsWindowsRoofMirrors', {
            CentralLockingSystemAndPanelStatus: (value) => {
                const open = Object.keys(DOORS).filter((key) => value && (value[key] === 1 || /_OFFEN$/.test(value[key]))).map((key) => DOORS[key]);
                if (open.join() !== this.doors.join()) this.put('doors', open);
            },
        });
    }

    ambientAvailable() {
        const watch = this.ambientConnection;
        return !!(watch && watch.available && watch.proxy && typeof watch.proxy.setValue === 'function');
    }

    retryAmbientPreset() {
        this.ambientTarget = Object.assign({}, this.ambientTarget);
        this.ambientSentAt = 0;
        this.ambientError = false;
    }

    rememberAmbientMenu(menu) {
        this.ambientRestore = menu;
        this.settings.set('solFactoryRestore', menu);
    }

    updateAmbientPreset(slot, byMode, paused) {
        this.ambientPaused = paused;
        const menu = slot || this.ambientRestore;
        if (this.ambientTarget.menu !== menu || this.ambientTarget.byMode !== byMode) {
            this.ambientTarget = { menu, byMode };
            this.ambientSentAt = 0;
            this.ambientError = false;
        }
        const target = this.ambientTarget;
        if (!menu) return;
        if (!this.ambientAvailable()) {
            if (this.ambientAttempt === target) this.retryAmbientPreset();
            return;
        }
        if (!byMode && this.ambientRestore && !this.ambientBusy && this.ambientSentAt && this.ambientMenu === menu) {
            this.rememberAmbientMenu(null);
        }
        if (paused || this.ambientBusy || this.ambientAttempt === target || Date.now() - this.ambientLastDispatch < MIN_GAP_MS) return;
        if (byMode && !this.ambientRestore && !this.ambientMenu) return;

        const connection = this.ambientConnection;
        const current = () => !this.stopped && this.ambientTarget === target && this.ambientConnection === connection;
        let sent = false;
        const guarded = { setValue: (field, value, timeout) => {
            if (!current() || this.ambientPaused || !this.ambientAvailable() || !this.occupied() || this.factoryAmbient === false) return;
            if (byMode && !this.ambientRestore) {
                if (!this.ambientMenu) return;
                this.rememberAmbientMenu(this.ambientMenu);
            }
            sent = true;
            this.ambientSentAt = this.ambientLastDispatch = Date.now();
            return connection.proxy.setValue(field, value, timeout);
        } };
        // The original menu may be a reported BMW mode, as well as a numbered preset.
        const payload = typeof menu === 'number' ? presetRequest(menu) :
            Object.assign(presetRequest(1), { controlMenuAmbientePanoramicRoofInteriorLighting: menu });
        this.ambientBusy = true;
        this.ambientAttempt = target;
        Promise.resolve().then(() => this.signals.set(guarded, 'ambientLightInteriorColour', payload, 2000)).catch((error) => {
            if (current() && sent) this.ambientError = true;
            this.log.warn('Sol iDrive preset: ' + error);
        }).then(() => {
            if (!sent && this.ambientAttempt === target) this.ambientAttempt = null;
            this.put('ambientBusy', false);
        });
    }

    watchSwitch() {
        if (this.switchConnection || this.switchConnecting) return;
        const read = (field) => (value) => {
            this.lightSwitch[field] = value;
            this.emit('change');
        };
        this.switchConnecting = true;
        this.watch(SWITCH, {
            mainLightswitchState: read('mode'),
            lightswitchButtonAvailability: read('availability'),
            foglightFront: read('foglightFront'),
            foglightRear: read('foglightRear'),
            showLightswitchOperationFeedback: (value) => {
                if (value && value.successful === false) this.put('switchNote', 'The vehicle declined the switch request');
            },
        }).then((connection) => {
            this.switchConnecting = false;
            this.put('switchConnection', connection);
        });
    }

    switchAvailable() { return !!(this.switchConnection && this.switchConnection.available); }

    switchSelected(command) {
        if (command.field) return this.lightSwitch[command.field] === true;
        return this.lightSwitch.mode === command.state || this.lightSwitch.mode === command.code;
    }

    switchAllowed(command) {
        const availability = this.lightSwitch.availability && this.lightSwitch.availability[command.availability];
        return this.switchAvailable() && !this.switchBusy && (availability === 'OPERABLE' || availability === 2) &&
            (!command.field || typeof this.lightSwitch[command.field] === 'boolean');
    }

    async setSwitch(command) {
        if (!this.switchAllowed(command)) return;
        const proxy = this.switchConnection.proxy;
        this.put('switchBusy', true);
        this.put('switchNote', '');
        try {
            if (command.field) await this.signals.set(proxy, command.field, !this.switchSelected(command), 2000);
            else await this.signals.call(proxy, command.method, {}, 2000);
        } catch (e) {
            this.log.warn('Sol exterior switch: ' + e);
            this.put('switchNote', 'The light switch did not accept the request');
        } finally {
            this.put('switchBusy', false);
        }
    }

    stop() {
        this.stopped = true;
        this.watches.forEach((watch) => watch.shutdown());
    }
}

module.exports = { Vehicle, SWITCH_COMMANDS };
