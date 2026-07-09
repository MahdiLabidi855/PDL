module.exports = {
    baseUrl: process.env.THINGSPEAK_BASE_URL || "https://api.thingspeak.com",
    syncInterval: process.env.THINGSPEAK_SYNC_INTERVAL || "*/1 * * * *"
};