const TEMPERATURE_HIGH = {
    value: 30,
    unit: "°C",
    severity: "warning",
    message: "Temperature too high"
};

const HUMIDITY_HIGH = {
    value: 80,
    unit: "%",
    severity: "warning",
    message: "Humidity too high"
};

const BATTERY_LOW = {
    value: 20,
    unit: "%",
    severity: "critical",
    message: "Battery low"
};

const ENERGY_WASTE = {
    condition: "presence === false && light > 500",
    severity: "warning",
    message: "Energy waste detected"
};

const DEVICE_OFFLINE = {
    thresholdMinutes: 5,
    severity: "critical",
    message: "Device offline"
};

function evaluateAlerts(sensorReading) {
    const alerts = [];
    const reading = sensorReading || {};

    if (typeof reading.temperature === "number" && reading.temperature > TEMPERATURE_HIGH.value) {
        alerts.push({
            type: "temperature",
            severity: TEMPERATURE_HIGH.severity,
            title: "High Temperature",
            message: `${TEMPERATURE_HIGH.message} (${reading.temperature}${TEMPERATURE_HIGH.unit}) in ${reading.room || "unknown room"}`,
            room: reading.room
        });
    }

    if (typeof reading.humidity === "number" && reading.humidity > HUMIDITY_HIGH.value) {
        alerts.push({
            type: "humidity",
            severity: HUMIDITY_HIGH.severity,
            title: "High Humidity",
            message: `${HUMIDITY_HIGH.message} (${reading.humidity}${HUMIDITY_HIGH.unit}) in ${reading.room || "unknown room"}`,
            room: reading.room
        });
    }

    if (typeof reading.battery === "number" && reading.battery < BATTERY_LOW.value) {
        alerts.push({
            type: "battery",
            severity: BATTERY_LOW.severity,
            title: "Low Battery",
            message: `${BATTERY_LOW.message} (${reading.battery}${BATTERY_LOW.unit}) in ${reading.room || "unknown room"}`,
            room: reading.room
        });
    }

    if (reading.presence === false && reading.light > 500) {
        alerts.push({
            type: "energy",
            severity: ENERGY_WASTE.severity,
            title: "Energy Waste",
            message: `Lights are on while the room is empty in ${reading.room || "unknown room"}`,
            room: reading.room
        });
    }

    return alerts;
}

function mapAlertSeverity(ruleSeverity, alertType) {
    if (ruleSeverity === "critical") {
        return "critical";
    }

    if (alertType === "humidity") {
        return "medium";
    }

    return "high";
}

module.exports = {
    TEMPERATURE_HIGH,
    HUMIDITY_HIGH,
    BATTERY_LOW,
    ENERGY_WASTE,
    DEVICE_OFFLINE,
    evaluateAlerts,
    mapAlertSeverity
};
