const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");

function getDateRange(type = "daily", date) {
  const reportDate = date ? new Date(date) : new Date();

  let start;
  let end;

  if (type === "monthly") {
    start = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    start = new Date(reportDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(reportDate);
    end.setHours(23, 59, 59, 999);
  }

  return {
    reportDate,
    start,
    end,
  };
}

exports.getReportPreview = async (req, res) => {
  try {
    const { type = "daily", date } = req.query;
    const { reportDate, start, end } = getDateRange(type, date);

    const sensors = await Sensor.find({
      timestamp: { $gte: start, $lte: end },
    })
      .sort({ timestamp: -1 })
      .limit(50);

    const alerts = await Alert.find({
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const avgTemperature =
      sensors.length > 0
        ? sensors.reduce((sum, s) => sum + (Number(s.temperature) || 0), 0) / sensors.length
        : 0;

    const avgHumidity =
      sensors.length > 0
        ? sensors.reduce((sum, s) => sum + (Number(s.humidity) || 0), 0) / sensors.length
        : 0;

    const avgLight =
      sensors.length > 0
        ? sensors.reduce((sum, s) => sum + (Number(s.light) || 0), 0) / sensors.length
        : 0;

    const occupiedCount = sensors.filter((s) => s.presence).length;
    const occupancyRate =
      sensors.length > 0 ? Math.round((occupiedCount / sensors.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        meta: {
          type,
          date: reportDate.toISOString().split("T")[0],
          generatedAt: new Date().toISOString(),
        },
        summary: {
          sensorCount: sensors.length,
          alertCount: alerts.length,
          avgTemperature: Number(avgTemperature.toFixed(1)),
          avgHumidity: Number(avgHumidity.toFixed(1)),
          avgLight: Number(avgLight.toFixed(1)),
          occupancyRate,
        },
        sensors: sensors.map((s) => ({
          id: s._id,
          room: s.room || "N/A",
          temperature: s.temperature ?? "-",
          humidity: s.humidity ?? "-",
          light: s.light ?? "-",
          presence: !!s.presence,
          timestamp: s.timestamp,
        })),
        alerts: alerts.map((a) => ({
          id: a._id,
          title: a.title || "Alert",
          message: a.message || "",
          severity: a.severity || "N/A",
          status: a.isRead ? "resolved" : "active",
          room: a.room || "N/A",
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate report preview",
    });
  }
};

// On garde cette route pour plus tard si tu veux refaire le PDF
exports.getPdfReport = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "PDF download is temporarily disabled. Use report preview instead.",
  });
};