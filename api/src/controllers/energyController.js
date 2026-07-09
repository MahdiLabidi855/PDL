const EnergyReading = require("../models/EnergyReading");

exports.getTodayEnergy = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const readings = await EnergyReading.find({ timestamp: { $gte: today } });
        const totalEnergy = readings.reduce((sum, item) => sum + (item.power || 0), 0);

        res.json({ success: true, data: { date: today.toISOString(), totalEnergy } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMonthEnergy = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const readings = await EnergyReading.find({ timestamp: { $gte: startOfMonth } });
        const totalEnergy = readings.reduce((sum, item) => sum + (item.power || 0), 0);

        res.json({ success: true, data: { month: now.toISOString(), totalEnergy } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getWasteEnergy = async (req, res) => {
    try {
        const wasteReadings = await EnergyReading.find({ isWaste: true });
        const wastedEnergy = wasteReadings.reduce((sum, item) => sum + (item.power || 0), 0);

        res.json({ success: true, data: { wastedEnergy, count: wasteReadings.length } });
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
                    totalEnergy: { $sum: "$power" }
                }
            },
            { $project: { room: "$_id", totalEnergy: 1, _id: 0 } },
            { $sort: { totalEnergy: -1 } }
        ]);

        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
