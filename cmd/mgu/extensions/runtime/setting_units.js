'use strict';

/** Format a numeric setting for display; stored values and dropdown row order stay in base units. */
function numberLabel(setting, value, get) {
    const display = setting.displayUnit;
    const conversion = display && display.options[get(display.setting)];
    let unit = setting.unit || '', text = String(value);
    if (conversion) {
        const converted = value * (conversion.factor == null ? 1 : conversion.factor) + (conversion.offset || 0);
        text = conversion.decimals == null ? String(converted) : converted.toFixed(conversion.decimals);
        unit = conversion.unit;
    }
    return text + (unit ? ' ' + unit : '') + (setting.markDefault && value === setting.default ? ' (default)' : '');
}

module.exports = { numberLabel };
