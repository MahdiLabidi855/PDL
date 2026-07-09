const cron = require("node-cron");
const thingSpeakService = require("../services/thingSpeakService");

const startSyncJob = () => {
    const schedule = process.env.SYNC_INTERVAL || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            await thingSpeakService.syncLatestData();
        } catch (error) {
            console.error("ThingSpeak sync failed:", error.message);
        }
    });
};

module.exports = { startSyncJob };