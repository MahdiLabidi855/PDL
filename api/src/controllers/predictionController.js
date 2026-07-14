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
                room,
                date: targetDate.toISOString().split("T")[0],
                time: `${String(targetHour).padStart(2, "0")}:00`,
                expectedOccupancy: 0,
                confidence: 0
            });
        }

        const occupancyValues = history.map((item) => (item.presence ? 100 : 0));
        const average = occupancyValues.reduce((sum, value) => sum + value, 0) / occupancyValues.length;
        const predicted = Math.max(0, Math.min(100, Math.round(average)));

        // Compute confidence based on sample size and variance
        const sampleSize = history.length;
        const variance = occupancyValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / sampleSize;
        const stdDev = Math.sqrt(variance);
        
        // Confidence: higher with more samples and lower variance
        // Max 95% — never claim 100% certainty for a simple average model
        const sampleFactor = Math.min(sampleSize / 30, 1); // saturates at 30 samples
        const varianceFactor = Math.max(0, 1 - stdDev / 50); // lower variance = higher confidence
        const confidence = Math.round(Math.min(95, (sampleFactor * 0.5 + varianceFactor * 0.5) * 100));

        res.json({
            success: true,
            room,
            date: targetDate.toISOString().split("T")[0],
            time: `${String(targetHour).padStart(2, "0")}:00`,
            expectedOccupancy: predicted,
            confidence
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};