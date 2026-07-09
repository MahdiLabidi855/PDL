require("dotenv").config();

process.env.FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || "https://your-project.firebaseio.com";
process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "your_api_key";
process.env.FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "your-project-id";
process.env.SYNC_INTERVAL = process.env.SYNC_INTERVAL || "*/1 * * * *";

const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const socket = require("./socket/socket");
const { startSyncJob } = require("./jobs/syncFirebaseJob");
const { startOfflineDeviceCheckJob } = require("./jobs/checkOfflineDevicesJob");
const firebaseService = require("./services/firebaseService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);
    socket.init(server);
    firebaseService.subscribeToChanges();
    startSyncJob();
    startOfflineDeviceCheckJob();

    server.listen(PORT, () => {
        console.log(`Server Running on Port ${PORT}`);
    });
};

startServer();