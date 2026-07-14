const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");
const Device = require("../models/Device");

/**
 * @openapi
 * /api/dashboard/statistics:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
exports.getStatistics = async (req, res) => {
    try {
        const totalSensors = await Sensor.countDocuments();
        const activeSensors = await Sensor.countDocuments({
            lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
        });
        const offlineSensors = totalSensors - activeSensors;

        const totalReadings = totalSensors;
        const todayAlerts = await Alert.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        const temperatureValues = await Sensor.find({}, { temperature: 1, _id: 0 });
        const humidityValues = await Sensor.find({}, { humidity: 1, _id: 0 });
        const lightValues = await Sensor.find({}, { light: 1, _id: 0 });

        const averageTemperature = temperatureValues.length
            ? (temperatureValues.reduce((sum, item) => sum + item.temperature, 0) / temperatureValues.length).toFixed(1)
            : 0;
        const averageHumidity = humidityValues.length
            ? (humidityValues.reduce((sum, item) => sum + item.humidity, 0) / humidityValues.length).toFixed(0)
            : 0;
        const averageLight = lightValues.length
            ? (lightValues.reduce((sum, item) => sum + item.light, 0) / lightValues.length).toFixed(0)
            : 0;

        const occupiedRooms = await Sensor.countDocuments({ presence: true });
        const emptyRooms = Math.max(0, totalSensors - occupiedRooms);

        const criticalAlerts = await Alert.countDocuments({ severity: "critical" });
        const maintenanceRequired = await Device.countDocuments({ battery: { $lt: 20 } });
        const batteryWarnings = maintenanceRequired;

        res.json({
            success: true,
            data: {
                totalSensors,
                activeSensors,
                offlineSensors,
                avgTemperature: Number(averageTemperature),  // ← was averageTemperature
                avgHumidity: Number(averageHumidity),      // ← was averageHumidity
                avgLight: Number(averageLight),          // ← was averageLight
                occupancyRate: totalSensors > 0
                    ? Math.round((occupiedRooms / totalSensors) * 100)
                    : 0,                                         // ← was missing
                occupiedRooms,
                emptyRooms,
                criticalAlerts,
                alertsToday: todayAlerts,
                batteryWarnings,
                maintenanceRequired
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getOccupancy = async (req, res) => {
    try {
        const occupied = await Sensor.countDocuments({ presence: true });
        const empty = await Sensor.countDocuments({ presence: false });
        res.json({ success: true, data: { occupied, empty } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.json({ success: true, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getOccupancy = async (req, res) => {
    try {
        const occupancy = await Sensor.aggregate([
            {
                $group: {
                    _id: "$room",
                    occupancy: { $avg: { $cond: [{ $eq: ["$presence", true] }, 1, 0] } }
                }
            },
            {
                $project: {
                    room: "$_id",
                    occupancy: { $multiply: ["$occupancy", 100] },
                    _id: 0
                }
            },
            { $sort: { occupancy: -1 } }
        ]);

        res.json({ success: true, data: occupancy });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPeakHours = async (req, res) => {
    try {
        const peakHours = await Sensor.aggregate([
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({ success: true, data: peakHours });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTopRooms = async (req, res) => {
    try {
        const rooms = await Sensor.aggregate([
            { $group: { _id: "$room", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUnderusedRooms = async (req, res) => {
    try {
        const rooms = await Sensor.aggregate([
            { $group: { _id: "$room", count: { $sum: 1 } } },
            { $sort: { count: 1 } },
            { $limit: 5 }
        ]);

        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEnvironment = async (req, res) => {
    try {
        const latest = await Sensor.findOne().sort({ timestamp: -1 });

        res.json({
            success: true,
            data: {
                latestTemperature: latest ? latest.temperature : 0,
                latestHumidity: latest ? latest.humidity : 0,
                latestLight: latest ? latest.light : 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEnergy = async (req, res) => {
    try {
        const totalEnergy = await Sensor.countDocuments();

        res.json({
            success: true,
            data: {
                energyToday: Number((totalEnergy * 0.6).toFixed(2)),
                energyPerRoom: totalEnergy
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTrends = async (req, res) => {
    try {
        const trends = await Sensor.aggregate([
            {
                $group: {
                    _id: {
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
                    },
                    avgTemperature: { $avg: "$temperature" },
                    avgHumidity: { $avg: "$humidity" },
                    avgLight: { $avg: "$light" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 10 }
        ]);

        res.json({ success: true, data: trends });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @openapi
 * /api/dashboard/live:
 *   get:
 *     summary: Get live dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live dashboard metrics
 */
// controllers/dashboardController.js — replace getLiveDashboard
exports.getLiveDashboard = async (req, res) => {
    try {
        // Get the latest reading per room
        const liveRooms = await Sensor.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$room",
                    temperature: { $first: "$temperature" },
                    humidity: { $first: "$humidity" },
                    light: { $first: "$light" },
                    presence: { $first: "$presence" },
                    battery: { $first: "$battery" },
                    timestamp: { $first: "$timestamp" },
                }
            },
            {
                $project: {
                    _id: 0,
                    room: "$_id",
                    temperature: { $round: ["$temperature", 1] },
                    humidity: { $round: ["$humidity", 1] },
                    light: { $round: ["$light", 0] },
                    presence: 1,
                    battery: 1,
                    timestamp: 1,
                }
            },{ $match: { temperature: { $gt: 0, $lt: 50 }, humidity: { $gt: 5, $lt: 99 } } },

            { $sort: { room: 1 } }
        ]);

        res.json({ success: true, data: liveRooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};