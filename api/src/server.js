require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const socket = require("./socket/socket");
const { startSyncJob } = require("./jobs/syncThingSpeakJob");
const { startOfflineDeviceCheckJob } = require("./jobs/checkOfflineDevicesJob");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    console.log("✅ MongoDB connected");

    const server = http.createServer(app);
    socket.init(server);
    console.log("✅ Socket.IO initialized");

    startSyncJob();
    console.log("✅ ThingSpeak sync job started");

    startOfflineDeviceCheckJob();
    console.log("✅ Offline device check job started");

    server.listen(PORT, () => {
        console.log(`🚀 Server Running on Port ${PORT}`);
    });
};

startServer();