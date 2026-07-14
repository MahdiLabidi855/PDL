const thingSpeakService = require("../services/thingSpeakService");
const Device = require("../models/Device");
const socket = require("../socket/socket");

// Use read key if available, fall back to write key
const getReadKey = (device) => device.thingSpeakReadKey || device.thingSpeakApiKey;

exports.getLatest = async (req, res) => {
    try {
        const { deviceId } = req.query;
        let data;

        if (deviceId) {
            const device = await Device.findById(deviceId);
            if (!device) return res.status(404).json({ success: false, message: "Device not found" });
            data = await thingSpeakService.getLatestReading(
                device.thingSpeakChannelId,
                getReadKey(device)
            );
        } else {
            const devices = await Device.find({ thingSpeakChannelId: { $exists: true, $ne: "" } });
            data = [];
            for (const device of devices) {
                const reading = await thingSpeakService.getLatestReading(
                    device.thingSpeakChannelId,
                    getReadKey(device)
                );
                data.push({ device: device.cardName, room: device.room, reading });
            }
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const status = await thingSpeakService.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sync = async (req, res) => {
    try {
        const results = await thingSpeakService.syncAllChannels();
        const io = socket.getIO();
        if (io) {
            io.emit("dashboard:update", { type: "thingspeak-sync", count: results.length });
        }
        res.json({ success: true, imported: results.length, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { deviceId, from, to } = req.query;
        if (!deviceId) return res.status(400).json({ success: false, message: "deviceId is required" });

        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ success: false, message: "Device not found" });

        const history = await thingSpeakService.getChannelHistory(
            device.thingSpeakChannelId,
            getReadKey(device),
            from,
            to
        );
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};