const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.getPdfReport = async (req, res) => {
    try {
        const { type = "daily", date } = req.query;
        const reportDate = date ? new Date(date) : new Date();

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
        const fileName = `report-${type}-${dateStr}-${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(22).fillColor("#1e3a5f").text("Smart Campus Report", { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor("#666").text(`${type === "daily" ? "Daily" : "Monthly"} Report — ${dateStr}`, { align: "center" });
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor("#999").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(1);

        // Separator line
        doc.strokeColor("#1e3a5f").lineWidth(2).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown(1);

        // Sensors section
        doc.fontSize(16).fillColor("#1e3a5f").text(`Sensor Readings (${sensors.length})`);
        doc.moveDown(0.5);

        if (sensors.length === 0) {
            doc.fontSize(11).fillColor("#999").text("No sensor data for this period.");
        } else {
            sensors.forEach((s, i) => {
                doc.fontSize(10).fillColor("#333")
                    .text(`${i + 1}. ${s.room} — Temp: ${s.temperature}°C | Humidity: ${s.humidity}% | Light: ${s.light} | Presence: ${s.presence ? "Yes" : "No"}`);
            });
        }

        doc.moveDown(1);
        doc.strokeColor("#ccc").lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown(1);

        // Alerts section
        doc.fontSize(16).fillColor("#1e3a5f").text(`Alerts (${alerts.length})`);
        doc.moveDown(0.5);

        if (alerts.length === 0) {
            doc.fontSize(11).fillColor("#999").text("No alerts for this period.");
        } else {
            alerts.forEach((a, i) => {
                const status = a.status || (a.isRead ? "resolved" : "active");
                doc.fontSize(10).fillColor("#333")
                    .text(`${i + 1}. ${a.title} — Severity: ${a.severity} | Status: ${status} | Room: ${a.room || "N/A"}`);
            });
        }

        doc.moveDown(2);
        doc.fontSize(8).fillColor("#999").text("— End of Report —", { align: "center" });

        doc.end();

        stream.on("finish", () => {
            res.download(filePath, `${type}-report-${dateStr}.pdf`, (err) => {
                if (err) console.error("Download error:", err.message);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Cleanup error:", unlinkErr.message);
                });
            });
        });

        stream.on("error", (err) => {
            res.status(500).json({ success: false, message: "PDF generation failed" });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};