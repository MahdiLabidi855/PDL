const fs = require("fs");
const path = require("path");
const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");

exports.getPdfReport = async (req, res) => {
    try {
        const sensors = await Sensor.find().sort({ timestamp: -1 }).limit(20);
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);

        const html = `
            <html>
              <body>
                <h1>Smart Campus Report</h1>
                <p>Generated from the current backend data.</p>
                <h2>Recent Sensors</h2>
                <ul>${sensors.map((sensor) => `<li>${sensor.room} - Temp: ${sensor.temperature}°C, Humidity: ${sensor.humidity}%, Light: ${sensor.light}</li>`).join("")}</ul>
                <h2>Recent Alerts</h2>
                <ul>${alerts.map((alert) => `<li>${alert.title} - ${alert.severity}</li>`).join("")}</ul>
              </body>
            </html>
        `;

        const filePath = path.join(__dirname, "../../uploads", "smart-campus-report.html");
        fs.writeFileSync(filePath, html);

        res.download(filePath, "smart-campus-report.html");
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
