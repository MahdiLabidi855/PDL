const Sensor = require("../models/Sensor");
const Device = require("../models/Device");
const Recommendation = require("../models/Recommendation");

exports.getRecommendations = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Recommendation.find({ status: "active", createdAt: { $gte: today } });
        if (existing.length > 0) {
            return res.json({ success: true, data: existing });
        }

        const recommendations = [];

        const lowUsageRooms = await Sensor.aggregate([
            { $group: { _id: "$room", count: { $sum: 1 } } },
            { $sort: { count: 1 } },
            { $limit: 3 }
        ]);

        if (lowUsageRooms.length > 0) {
            const room = lowUsageRooms[0]._id;
            recommendations.push({
                type: "occupancy",
                room,
                message: "Move afternoon classes here because this room has low recent activity.",
                priority: "medium"
            });
        }

        const energyWasteRoom = await Sensor.findOne({ presence: false, light: { $gt: 500 } });
        if (energyWasteRoom) {
            recommendations.push({
                type: "energy",
                room: energyWasteRoom.room,
                message: "Turn off lights after 18:00 because the room is empty and lights are still on.",
                priority: "high"
            });
        }

        const lowBatteryDevice = await Device.findOne({ battery: { $lt: 20 } });
        if (lowBatteryDevice) {
            recommendations.push({
                type: "maintenance",
                room: lowBatteryDevice.room,
                message: "Replace or recharge the device battery soon to avoid downtime.",
                priority: "high"
            });
        }

        const saved = await Recommendation.insertMany(recommendations);
        res.json({ success: true, data: saved });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
