const Room = require("../models/Room");
const Sensor = require("../models/Sensor");

/**
 * @openapi
 * /api/map:
 *   get:
 *     summary: Get campus map data
 *     tags: [Map]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Map data
 */
exports.getMap = async (req, res) => {
    try {
        const rooms = await Room.find().lean();
        const results = [];

        for (const room of rooms) {
            const latest = await Sensor.findOne({ room: room.name }).sort({ timestamp: -1 });
            const occupancy = latest?.presence ? 85 : 20;
            const temperature = latest?.temperature ?? 24;
            const humidity = latest?.humidity ?? 45;
            const sensorStatus = latest ? "online" : "offline";

            results.push({
                room: room.name,
                floor: room.floor,
                x: room.position?.x || 0,
                y: room.position?.y || 0,
                capacity: room.capacity,
                occupancy,
                temperature,
                humidity,
                sensor: sensorStatus
            });
        }

        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRoom = async (req, res) => {
    try {
        const roomName = req.params.room;
        const room = await Room.findOne({ name: roomName });
        const latest = await Sensor.findOne({ room: roomName }).sort({ timestamp: -1 });

        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        res.json({
            success: true,
            data: {
                room: room.name,
                temperature: latest?.temperature ?? 24,
                humidity: latest?.humidity ?? 52,
                occupancy: latest?.presence ? 70 : 20,
                sensor: latest ? "online" : "offline"
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
