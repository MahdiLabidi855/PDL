const cron = require("node-cron");
const thingSpeakService = require("../services/thingSpeakService");

const startSyncJob = () => {
    const schedule = process.env.THINGSPEAK_SYNC_INTERVAL || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            const results = await thingSpeakService.syncAllChannels();
            if (results.length > 0) {
                console.log(`🔄 ThingSpeak sync: ${results.length} readings imported`);
            }
        } catch (error) {
            console.error("❌ ThingSpeak sync failed:", error.message);
        }
    });

    console.log(`⏰ ThingSpeak sync job scheduled: ${schedule}`);
};

module.exports = { startSyncJob };