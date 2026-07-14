const EnergyReading = require("../models/EnergyReading");

exports.getTodayEnergy = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const byRoom = await EnergyReading.aggregate([
            { $match: { timestamp: { $gte: today } } },
            {
                $group: {
                    _id: "$room",
                    totalPower: { $sum: "$power" },
                    totalDuration: { $sum: "$duration" },
                    readingCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    room: "$_id",
                    totalPower: 1,
                    totalDuration: 1,
                    readingCount: 1,
                    _id: 0
                }
            },
            { $sort: { totalPower: -1 } }
        ]);

        const totalEnergy = byRoom.reduce((sum, item) => sum + (item.totalPower || 0), 0);

        res.json({
            success: true,
            data: {
                date: today.toISOString(),
                totalEnergy,
                byRoom
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMonthEnergy = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const byRoom = await EnergyReading.aggregate([
            { $match: { timestamp: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: "$room",
                    totalPower: { $sum: "$power" },
                    totalDuration: { $sum: "$duration" },
                    readingCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    room: "$_id",
                    totalPower: 1,
                    totalDuration: 1,
                    readingCount: 1,
                    _id: 0
                }
            },
            { $sort: { totalPower: -1 } }
        ]);

        const totalEnergy = byRoom.reduce((sum, item) => sum + (item.totalPower || 0), 0);

        res.json({
            success: true,
            data: {
                month: now.toISOString(),
                totalEnergy,
                byRoom
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getWasteEnergy = async (req, res) => {
    try {
        const wasteReadings = await EnergyReading.find({ isWaste: true }).sort({ timestamp: -1 });
        const wastedEnergy = wasteReadings.reduce((sum, item) => sum + (item.power || 0), 0);

        res.json({
            success: true,
            data: {
                wastedEnergy,
                count: wasteReadings.length,
                readings: wasteReadings
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getEnergyByRoom = async (req, res) => {
    try {
        const rooms = await EnergyReading.aggregate([
            {
                $group: {
                    _id: "$room",
                    totalPower: { $sum: "$power" },
                    totalDuration: { $sum: "$duration" },
                    wasteEvents: { $sum: { $cond: ["$isWaste", 1, 0] } }
                }
            },
            {
                $project: {
                    room: "$_id",
                    totalPower: 1,
                    totalDuration: 1,
                    wasteEvents: 1,
                    _id: 0
                }
            },
            { $sort: { totalPower: -1 } }
        ]);

        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};