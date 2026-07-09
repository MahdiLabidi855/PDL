const Device = require("../models/Device");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const { logAudit } = require("../utils/auditLogger");

exports.getDevices = async (req, res) => {
    try {
        const devices = await Device.find().sort({ lastSeen: -1 });
        res.json({ success: true, data: devices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const device = await Device.create(req.body);

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("device:online", device);
            io.emit("dashboard:update", { type: "device-created" });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { event: "create" },
            req
        });

        res.status(201).json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("dashboard:update", { type: "device-updated" });
        }

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        await Device.findByIdAndDelete(req.params.id);

        const io = socket.getIO();
        if (io) {
            io.emit("device:offline", { id: req.params.id });
            io.emit("dashboard:update", { type: "device-deleted" });
        }

        await logAudit({
            action: "Delete",
            entityType: "Device",
            entityId: req.params.id,
            userId: req.user?.id || null,
            details: { event: "delete" },
            req
        });

        res.json({ success: true, message: "Device deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.heartbeat = async (req, res) => {
    try {
        const { deviceId, battery, status } = req.body;
        const device = await Device.findOneAndUpdate(
            { deviceId },
            {
                lastSeen: new Date(),
                status: status || "online",
                battery: battery || undefined
            },
            { new: true, upsert: true }
        );

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("device:online", device);
            io.emit("dashboard:update", { type: "device-heartbeat" });
        }

        if (device.battery !== undefined && device.battery < 20) {
            await Alert.create({
                title: "Low Battery",
                message: `Device ${device.deviceId} has low battery (${device.battery}%)`,
                severity: "high",
                type: "offline",
                room: device.room
            });
            if (io) io.emit("alert:new", { type: "battery" });
            if (io) io.emit("maintenance:warning", { deviceId: device.deviceId, battery: device.battery });
        }

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============ LED CONTROL ============

exports.updateLed = async (req, res) => {
    try {
        const { on, color, brightness } = req.body;

        const device = await Device.findByIdAndUpdate(
            req.params.id,
            {
                "ledStatus.on": on,
                "ledStatus.color": color,
                "ledStatus.brightness": brightness,
                "ledStatus.lastUpdated": new Date()
            },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:led-update", { deviceId: device._id, ledStatus: device.ledStatus });
            io.emit("dashboard:update", { type: "led-update", device: device._id });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { event: "led-update", ledStatus: device.ledStatus },
            req
        });

        res.json({ success: true, data: device.ledStatus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLedStatus = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id).select("ledStatus");
        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }
        res.json({ success: true, data: device.ledStatus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============ CARD CONFIG ============

exports.updateConfig = async (req, res) => {
    try {
        const { thingSpeakChannelId, thingSpeakApiKey, thingSpeakFieldMapping } = req.body;

        const device = await Device.findByIdAndUpdate(
            req.params.id,
            {
                thingSpeakChannelId,
                thingSpeakApiKey,
                thingSpeakFieldMapping
            },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:config-updated", { deviceId: device._id, config: device.thingSpeakChannelId });
            io.emit("dashboard:update", { type: "config-updated", device: device._id });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { event: "config-update", channelId: thingSpeakChannelId },
            req
        });

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getConfig = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id).select(
            "cardName thingSpeakChannelId thingSpeakApiKey thingSpeakFieldMapping"
        );
        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }
        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};