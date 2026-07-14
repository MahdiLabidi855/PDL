const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

let swaggerUi = null;
let swaggerSpec = null;

try {
    swaggerUi = require("swagger-ui-express");
    swaggerSpec = require("./config/swagger");
} catch (error) {
    console.warn("Swagger docs are unavailable until dependencies are installed:", error.message);
}

const authRoutes = require("./routes/authRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const alertRoutes = require("./routes/alertRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const energyRoutes = require("./routes/energyRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const thingspeakRoutes = require("./routes/thingSpeakRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const mapRoutes = require("./routes/mapRoutes");
const limiter = require("./middleware/rateLimiter");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(mongoSanitize());
app.use("/api/", limiter);
app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/reports", reportRoutes);
app.use("/api/thingspeak", thingspeakRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/map", mapRoutes);
if (swaggerUi && swaggerSpec) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
    app.get("/api-docs", (req, res) => {
        res.status(503).json({
            success: false,
            message: "Swagger docs are unavailable until the swagger packages are installed"
        });
    });
}

app.get("/", (req, res) => {
    const theme = req.cookies?.theme || "light";
    res.status(200).json({
        success: true,
        message: "Smart Campus API Running",
        theme,
        features: {
            compression: true,
            cookieSupport: true,
            swaggerDocs: Boolean(swaggerUi && swaggerSpec)
        }
    });
});

app.post("/theme", (req, res) => {
    const theme = req.body?.theme || "light";
    res.cookie("theme", theme, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        message: "Theme preference saved",
        theme
    });
});

module.exports = app;
