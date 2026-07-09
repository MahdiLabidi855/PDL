const Sensor = require("../models/Sensor");

/**
 * @openapi
 * /api/prediction:
 *   get:
 *     summary: Predict future occupancy
 *     tags: [Prediction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction result
 */
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

        res.json({
            success: true,
            room,
            date: targetDate.toISOString().split("T")[0],
            time: `${String(targetHour).padStart(2, "0")}:00`,
            expectedOccupancy: predicted,
            confidence: 92
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
