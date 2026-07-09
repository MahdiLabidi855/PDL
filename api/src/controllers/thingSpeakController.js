const thingSpeakService = require("../services/thingSpeakService");
const socket = require("../socket/socket");

exports.sync = async (req, res) => {
    try {
        const result = await thingSpeakService.syncLatestData();

        const io = socket.getIO();
        if (io) {
            io.emit("sensor:new-reading", result.latest);
            io.emit("dashboard:update", { type: "thingspeak-sync" });
        }

        res.json({
            success: true,
            message: "ThingSpeak sync completed",
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLatest = async (req, res) => {
    try {
        const latest = await thingSpeakService.getLatestReading();
        res.json({ success: true, data: latest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const status = await thingSpeakService.getSyncStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await thingSpeakService.getHistoricalData(req.query);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
