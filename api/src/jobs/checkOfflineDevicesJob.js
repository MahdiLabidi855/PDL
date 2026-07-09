const cron = require("node-cron");
const Device = require("../models/Device");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const { DEVICE_OFFLINE } = require("../utils/alertRules");

const startOfflineDeviceCheckJob = () => {
    cron.schedule("*/5 * * * *", async () => {
        try {
            const threshold = new Date(Date.now() - DEVICE_OFFLINE.thresholdMinutes * 60 * 1000);
            const devices = await Device.find({ lastSeen: { $lt: threshold } });

            for (const device of devices) {
                const existingAlert = await Alert.findOne({
                    type: "device_offline",
                    room: device.room,
                    message: { $regex: device.deviceId },
                    createdAt: { $gte: threshold }
                });

                if (existingAlert) {
                    continue;
                }

                const alert = await Alert.create({
                    title: "Device Offline",
                    message: `${DEVICE_OFFLINE.message}: ${device.deviceId} has been offline for more than ${DEVICE_OFFLINE.thresholdMinutes} minutes`,
                    severity: DEVICE_OFFLINE.severity,
                    type: "device_offline",
                    room: device.room
                });

                await Device.findByIdAndUpdate(device._id, { status: "offline" });

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
