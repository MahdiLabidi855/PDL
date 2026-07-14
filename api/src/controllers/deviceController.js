const Device = require("../models/Device");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const { logAudit } = require("../utils/auditLogger");

// ============ CRUD ============

exports.getDevices = async (req, res) => {
    try {
        const devices = await Device.find().sort({ createdAt: -1 });
        res.json({ success: true, count: devices.length, data: devices });
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
            io.emit("dashboard:update", { type: "device-created", device: device._id });
        }

        await logAudit({
            action: "Create",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { cardName: device.cardName, room: device.room },
            req
        });

        res.status(201).json({ success: true, data: device });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            req.body,
            {  returnDocument: "after", runValidators: true }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("dashboard:update", { type: "device-updated", device: device._id });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: req.body,
            req
        });

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:offline", { deviceId: device._id, room: device.room });
            io.emit("dashboard:update", { type: "device-deleted", device: device._id });
        }

        await logAudit({
            action: "Delete",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { cardName: device.cardName, room: device.room },
            req
        });

        res.json({ success: true, message: "Device deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============ HEARTBEAT ============

exports.heartbeat = async (req, res) => {
    try {
        const { deviceId, battery, wifiSignal, firmware } = req.body;

        const device = await Device.findOneAndUpdate(
            { deviceId },
            {
                status: "online",
                lastSeen: new Date(),
                battery: battery ?? device?.battery,
                wifiSignal: wifiSignal ?? device?.wifiSignal,
                firmware: firmware ?? device?.firmware
            },
            { upsert: true,  returnDocument: "after" }
        );

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("device:online", device);
            io.emit("dashboard:update", { type: "heartbeat", device: device._id });
        }

        // Auto-generate low battery alert
        if (battery !== undefined && battery < 20) {
            const existingAlert = await Alert.findOne({
                device: device._id,
                type: "low_battery",
                status: "active"
            });

            if (!existingAlert) {
                const alert = await Alert.create({
                    type: "low_battery",
                    device: device._id,
                    room: device.room,
                    severity: "critical",
                    status: "active",
                    message: `Low battery on ${device.cardName}: ${battery}%`
                });

                if (io) {
                    io.emit("alert:new", alert);
                    io.emit("maintenance:warning", alert);
                }
            }
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
            {  returnDocument: "after" }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:led-update", {
                deviceId: device._id,
                ledStatus: device.ledStatus
            });
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
            {  returnDocument: "after" }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:config-updated", {
                deviceId: device._id,
                config: {
                    channelId: thingSpeakChannelId,
                    fieldMapping: thingSpeakFieldMapping
                }
            });
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