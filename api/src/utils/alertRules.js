const alertRules = {
    TEMPERATURE_HIGH: {
        value: 30,
        unit: "°C",
        severity: "warning",
        message: "Temperature too high"
    },
    HUMIDITY_HIGH: {
        value: 80,
        unit: "%",
        severity: "warning",
        message: "Humidity too high"
    },
    BATTERY_LOW: {
        value: 20,
        unit: "%",
        severity: "critical",
        message: "Battery low"
    },
    ENERGY_WASTE: {
        condition: "presence === false && light > 500",
        severity: "warning",
        message: "Energy waste detected"
    },
    DEVICE_OFFLINE: {
        thresholdMinutes: 5,
        severity: "critical",
        message: "Device offline"
    }
};

function evaluateAlerts(sensorReading) {
    const alerts = [];
    const reading = sensorReading || {};

    if (typeof reading.temperature === "number" && reading.temperature > alertRules.TEMPERATURE_HIGH.value) {
        alerts.push({
            type: "temperature",
            severity: alertRules.TEMPERATURE_HIGH.severity,
            title: "High Temperature",
            message: `${alertRules.TEMPERATURE_HIGH.message} (${reading.temperature}${alertRules.TEMPERATURE_HIGH.unit})`,
            room: reading.room
        });
    }

    if (typeof reading.humidity === "number" && reading.humidity > alertRules.HUMIDITY_HIGH.value) {
        alerts.push({
            type: "humidity",
            severity: alertRules.HUMIDITY_HIGH.severity,
            title: "High Humidity",
            message: `${alertRules.HUMIDITY_HIGH.message} (${reading.humidity}${alertRules.HUMIDITY_HIGH.unit})`,
            room: reading.room
        });
    }

    if (typeof reading.battery === "number" && reading.battery < alertRules.BATTERY_LOW.value) {
        alerts.push({
            type: "battery",
            severity: alertRules.BATTERY_LOW.severity,
            title: "Low Battery",
            message: `${alertRules.BATTERY_LOW.message} (${reading.battery}${alertRules.BATTERY_LOW.unit})`,
            room: reading.room
        });
    }

    if (reading.presence === false && reading.light > 500) {
        alerts.push({
            type: "energy",
            severity: alertRules.ENERGY_WASTE.severity,
            title: "Energy Waste",
            message: alertRules.ENERGY_WASTE.message,
            room: reading.room
        });
    }

    return alerts;
}

module.exports = { alertRules, evaluateAlerts };