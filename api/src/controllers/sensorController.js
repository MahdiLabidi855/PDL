const fs = require("fs");
const XLSX = require("xlsx");
const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const { logAudit } = require("../utils/auditLogger");
const { evaluateAlerts } = require("../utils/alertRules");

/**
 * @openapi
 * /api/sensors:
 *   post:
 *     summary: Create a sensor reading
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sensor'
 *     responses:
 *       201:
 *         description: Sensor created
 */
exports.createSensor = async (req, res) => {
    try {
        const sensor = await Sensor.create(req.body);

        const io = socket.getIO();
        if (io) {
            io.emit("sensor:new-reading", sensor);
            io.emit("dashboard:update", { type: "sensor-created" });
        }

        if (sensor.temperature > 30) {
            await Alert.create({
                title: "High Temperature",
                message: `Temperature reached ${sensor.temperature}°C in ${sensor.room}`,
                severity: "high",
                type: "temperature",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "temperature" });
        }

        if (sensor.humidity > 80) {
            await Alert.create({
                title: "High Humidity",
                message: `Humidity reached ${sensor.humidity}% in ${sensor.room}`,
                severity: "medium",
                type: "humidity",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "humidity" });
        }

        if (sensor.presence === false && sensor.light > 500) {
            await Alert.create({
                title: "Energy Waste",
                message: `Lights are on while the room is empty in ${sensor.room}`,
                severity: "high",
                type: "energy",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "energy" });
        }

        await logAudit({
            action: "Update",
            entityType: "Sensor",
            entityId: sensor._id.toString(),
            userId: req.user?.id || null,
            details: { event: "create" },
            req
        });

        res.status(201).json(sensor);
    } catch (err) {
        res.status(500).json(err);
    }
};

/**
 * @openapi
 * /api/sensors:
 *   get:
 *     summary: Get all sensor readings
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensor list
 */
exports.getAllSensors = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.room) {
            filter.room = req.query.room;
        }

        if (req.query.presence) {
            filter.presence = req.query.presence === "true";
        }

        if (req.query.startDate && req.query.endDate) {
            filter.timestamp = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const total = await Sensor.countDocuments(filter);

        const sensors = await Sensor.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            page,
            total,
            pages: Math.ceil(total / limit),
            data: sensors
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findById(req.params.id);

        if (!sensor) {
            return res.status(404).json({
                message: "Not Found"
            });
        }

        res.json(sensor);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getActiveSensors = async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const activeSensors = await Sensor.find({
            lastSeen: { $gte: fiveMinutesAgo }
        });

        res.json({
            success: true,
            total: activeSensors.length,
            data: activeSensors
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.updateSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        const io = socket.getIO();
        if (io) {
            io.emit("sensor:update", sensor);
            io.emit("dashboard:update", { type: "sensor-updated" });
        }

        if (sensor.temperature > 30) {
            await Alert.create({
                title: "High Temperature",
                message: `Temperature reached ${sensor.temperature}°C in ${sensor.room}`,
                severity: "high",
                type: "temperature",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "temperature" });
        }

        if (sensor.humidity > 80) {
            await Alert.create({
                title: "High Humidity",
                message: `Humidity reached ${sensor.humidity}% in ${sensor.room}`,
                severity: "medium",
                type: "humidity",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "humidity" });
        }

        if (sensor.presence === false && sensor.light > 500) {
            await Alert.create({
                title: "Energy Waste",
                message: `Lights are on while the room is empty in ${sensor.room}`,
                severity: "high",
                type: "energy",
                room: sensor.room
            });
            if (io) io.emit("alert:new", { type: "energy" });
        }

        res.json(sensor);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.deleteSensor = async (req, res) => {
    try {
        await Sensor.findByIdAndDelete(req.params.id);

        const io = socket.getIO();
        if (io) {
            io.emit("sensor:delete", { id: req.params.id });
            io.emit("dashboard:update", { type: "sensor-deleted" });
        }

        await logAudit({
            action: "Delete",
            entityType: "Sensor",
            entityId: req.params.id,
            userId: req.user?.id || null,
            details: { event: "delete" },
            req
        });

        res.json({
            success: true,
            message: "Deleted"
        });
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const sensors = await Sensor.find();

        const worksheet = XLSX.utils.json_to_sheet(sensors);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sensors");

        const filename = "SensorData.xlsx";
        XLSX.writeFile(workbook, filename);

        await logAudit({
            action: "Export",
            entityType: "Sensor",
            userId: req.user?.id || null,
            details: { filename },
            req
        });

        res.download(filename);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.bulkDelete = async (req, res) => {
    try {
        const ids = req.body.ids;

        const result = await Sensor.deleteMany({
            _id: { $in: ids }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.bulkUpdate = async (req, res) => {
    try {
        const { ids, data } = req.body;

        const result = await Sensor.updateMany(
            {
                _id: { $in: ids }
            },
            {
                $set: data
            }
        );

        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.importExcel = async (req, res) => {
    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        await Sensor.insertMany(data);

        fs.unlinkSync(req.file.path);

        await logAudit({
            action: "Import",
            entityType: "Sensor",
            userId: req.user?.id || null,
            details: { inserted: data.length },
            req
        });

        res.json({
            success: true,
            inserted: data.length
        });
    } catch (err) {
        res.status(500).json(err);
    }
};
