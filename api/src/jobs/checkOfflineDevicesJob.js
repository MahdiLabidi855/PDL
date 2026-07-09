const cron = require("node-cron");
const Device = require("../models/Device");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const { alertRules } = require("../utils/alertRules");

const startOfflineDeviceCheckJob = () => {
    cron.schedule("*/5 * * * *", async () => {
        try {
            const threshold = new Date(Date.now() - alertRules.DEVICE_OFFLINE.thresholdMinutes * 60 * 1000);
            const devices = await Device.find({ lastSeen: { $lt: threshold } });

            for (const device of devices) {
                const alert = await Alert.create({
                    title: "Device Offline",
                    message: `${device.deviceId} has been offline for more than ${alertRules.DEVICE_OFFLINE.thresholdMinutes} minutes`,
                    severity: alertRules.DEVICE_OFFLINE.severity,
                    type: "offline",
                    room: device.room
                });

                const io = socket.getIO();
                if (io) {
                    io.emit("device:offline", device);
                    io.emit("alert:new", alert);
                }
            }
        } catch (error) {
            console.error("Offline device check failed:", error.message);
        }
    });
};

module.exports = { startOfflineDeviceCheckJob };