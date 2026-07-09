const cron = require("node-cron");
const firebaseService = require("../services/firebaseService");

const startSyncJob = () => {
    const schedule = process.env.SYNC_INTERVAL || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            await firebaseService.syncAllFromFirebase();
        } catch (error) {
            console.error("Firebase sync failed:", error.message);
        }
    });
};

module.exports = { startSyncJob };