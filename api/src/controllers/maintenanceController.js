const Device = require("../models/Device");

exports.getMaintenance = async (req, res) => {
    try {
        const devices = await Device.find().sort({ lastSeen: -1 });

        const maintenance = devices.map((device) => {
            let health = "Healthy";
            let recommendation = "No action required.";

            if (device.battery !== undefined && device.battery < 20) {
                health = "Warning";
                recommendation = "Replace battery.";
            }

            if (device.status === "maintenance") {
                health = "Maintenance";
                recommendation = "Inspect device manually.";
            }

            return {
                deviceId: device.deviceId,
                cardName: device.cardName,
                battery: device.battery,
                firmware: device.firmware,
                health,
                wifiSignal: device.wifiSignal ?? "N/A",
                lastSeen: device.lastSeen,
                recommendation
            };
        });

        res.json({ success: true, data: maintenance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};