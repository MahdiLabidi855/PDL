const fs = require("fs");
const path = require("path");
const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.getPdfReport = async (req, res) => {
    try {
        const { type = "daily", date } = req.query;
        const reportDate = date ? new Date(date) : new Date();

        // Filter sensors by date range
        let sensorQuery = {};
        let alertQuery = {};

        if (type === "daily") {
            const start = new Date(reportDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(reportDate);
            end.setHours(23, 59, 59, 999);
            sensorQuery = { timestamp: { $gte: start, $lte: end } };
            alertQuery = { createdAt: { $gte: start, $lte: end } };
        } else if (type === "monthly") {
            const start = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
            const end = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59);
            sensorQuery = { timestamp: { $gte: start, $lte: end } };
            alertQuery = { createdAt: { $gte: start, $lte: end } };
        }

        const sensors = await Sensor.find(sensorQuery).sort({ timestamp: -1 }).limit(20);
        const alerts = await Alert.find(alertQuery).sort({ createdAt: -1 }).limit(10);

        const dateStr = reportDate.toISOString().split("T")[0];

        const html = `
            <html>
              <head><meta charset="utf-8"></head>
              <body>
                <h1>Smart Campus Report — ${type === "daily" ? "Daily" : "Monthly"}</h1>
                <p>Date: ${dateStr}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
                <h2>Recent Sensors (${sensors.length})</h2>
                <ul>${sensors.map((sensor) => `<li>${sensor.room} - Temp: ${sensor.temperature}°C, Humidity: ${sensor.humidity}%, Light: ${sensor.light}</li>`).join("")}</ul>
                <h2>Recent Alerts (${alerts.length})</h2>
                <ul>${alerts.map((alert) => `<li>${alert.title} - ${alert.severity} - ${alert.status || (alert.isRead ? "resolved" : "active")}</li>`).join("")}</ul>
              </body>
            </html>
        `;

        // Use unique filename to avoid race conditions
        const fileName = `report-${type}-${dateStr}-${Date.now()}.html`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, html);

        res.download(filePath, `${type}-report-${dateStr}.html`, (err) => {
            if (err) console.error("Download error:", err.message);
            // Clean up file after download
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("Cleanup error:", unlinkErr.message);
            });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};