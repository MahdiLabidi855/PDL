const Sensor = require("../models/Sensor");

exports.getPrediction = async (req, res) => {
    try {
        const { room = "Library", date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const targetHour = targetDate.getHours();

        const history = await Sensor.find({ room }).sort({ timestamp: -1 }).limit(50);

        if (!history.length) {
            return res.json({
                success: true,
                data: {
                    room,
                    date: targetDate.toISOString().split("T")[0],
                    time: `${String(targetHour).padStart(2, "0")}:00`,
                    expectedOccupancy: 0,
                    confidence: 0
                }
            });
        }

        // Group readings by hour to predict based on target hour
        const hourReadings = history.filter((item) => {
            const itemHour = new Date(item.timestamp).getHours();
            return itemHour === targetHour;
        });

        // If no readings for this hour, use all history
        const relevantReadings = hourReadings.length > 0 ? hourReadings : history;

        const occupancyValues = relevantReadings.map((item) => (item.presence ? 100 : 0));
        const average = occupancyValues.reduce((sum, value) => sum + value, 0) / occupancyValues.length;
        const predicted = Math.max(0, Math.min(100, Math.round(average)));

        // Confidence based on sample size and variance
        const sampleSize = relevantReadings.length;
        const variance = occupancyValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / sampleSize;
        const stdDev = Math.sqrt(variance);

        const sampleFactor = Math.min(sampleSize / 30, 1);
        const varianceFactor = Math.max(0, 1 - stdDev / 50);
        const confidence = Math.round(Math.min(95, (sampleFactor * 0.5 + varianceFactor * 0.5) * 100));

        res.json({
            success: true,
            data: {
                room,
                date: targetDate.toISOString().split("T")[0],
                time: `${String(targetHour).padStart(2, "0")}:00`,
                expectedOccupancy: predicted,
                confidence
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};