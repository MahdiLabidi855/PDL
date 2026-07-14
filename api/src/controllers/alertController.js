const Alert = require("../models/Alert");
const socket = require("../socket/socket");

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.json({ success: true, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createAlert = async (req, res) => {
    try {
        const alert = await Alert.create(req.body);

        const io = socket.getIO();
        if (io) {
            io.emit("alert:new", alert);
            io.emit("dashboard:update", { type: "alert-created" });
        }

        res.status(201).json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isRead: true, status: "resolved" },
            { returnDocument: "after" }
        );

        const io = socket.getIO();
        if (io) {
            io.emit("alert:resolved", alert);
        }

        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};