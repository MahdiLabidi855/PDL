const cron           = require("node-cron");
const axios          = require("axios");
const thingSpeakService = require("../services/thingSpeakService");
const { baseUrl }    = require("../config/thingspeak");
const Device         = require("../models/Device");

const startSyncJob = () => {
    const schedule = process.env.THINGSPEAK_SYNC_INTERVAL || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            const results = await thingSpeakService.syncAllChannels();

            if (results.length > 0) {
                console.log(`🔄 ThingSpeak sync: ${results.length} readings imported`);

                // Socket events are already emitted by thingSpeakService.syncChannelToMongo
                // Do NOT re-emit here — that causes duplicate dashboard refreshes

                // ── Auto-update LED color based on sensor conditions ───
                for (const reading of results) {
                    const device = await Device.findOne({ room: reading.room });
                    if (!device || !device.ledStatus?.on) continue;

                    let color = 'green', brightness = 200;
                    if      (reading.temperature > 30)  { color = 'red';    brightness = 255; }
                    else if (reading.humidity    > 70)  { color = 'blue';   brightness = 200; }
                    else if (reading.light       < 100) { color = 'yellow'; brightness = 200; }
                    else if (reading.presence)          { color = 'green';  brightness = 180; }

                    const field6 = `1:${color}:${brightness}`;

                    // Write to ThingSpeak field6 using configured baseUrl (HTTPS)
                    try {
                        await axios.get(
                            `${baseUrl}/update?api_key=${device.thingSpeakApiKey}&field6=${field6}`,
                            { timeout: 8000 }
                        );
                    } catch (tsErr) {
                        console.warn(`[LED sync] ThingSpeak write failed for ${device.room}:`, tsErr.message);
                    }

                    await Device.findByIdAndUpdate(device._id, {
                        'ledStatus.color':      color,
                        'ledStatus.brightness': brightness,
                        'ledStatus.lastUpdated': new Date()
                    });

                    console.log(`💡 LED auto-updated for ${device.room}: ${field6}`);
                }
            }
        } catch (error) {
            console.error("❌ ThingSpeak sync failed:", error.message);
        }
    });

    console.log(`⏰ ThingSpeak sync job scheduled: ${schedule}`);
};

module.exports = { startSyncJob };