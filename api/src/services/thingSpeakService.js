const https = require("https");
const http = require("http");
const Sensor = require("../models/Sensor");
const socket = require("../socket/socket");

let lastSync = null;
let recordsImported = 0;

const buildUrl = (path) => {
    const baseUrl = process.env.THINGSPEAK_BASE_URL || "https://api.thingspeak.com";
    return `${baseUrl}${path}`;
};

const requestThingSpeak = (path) => {
    return new Promise((resolve, reject) => {
        const url = buildUrl(path);
        const client = url.startsWith("https") ? https : http;

        client.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve(data);
                }
            });
        }).on("error", reject);
    });
};

const normalizeReading = (entry) => {
    const room = entry.room || entry.field1 || "Library";
    const temperature = Number(entry.temperature ?? entry.field2 ?? 0);
    const humidity = Number(entry.humidity ?? entry.field3 ?? 0);
    const light = Number(entry.light ?? entry.field4 ?? 0);
    const power = Number(entry.power ?? entry.field5 ?? 0);
    const presence = entry.presence === true || entry.presence === "true" || entry.occupancy > 0;
    const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

    return {
        room,
        temperature,
        humidity,
        light,
        power,
        presence,
        timestamp,
        lastSeen: timestamp
    };
};

exports.syncLatestData = async () => {
    const channelId = process.env.THINGSPEAK_CHANNEL_ID;
    const readApiKey = process.env.THINGSPEAK_READ_API_KEY;

    if (!channelId || !readApiKey) {
        throw new Error("ThingSpeak configuration is missing");
    }

    const path = `/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=20`;
    const payload = await requestThingSpeak(path);

    const feeds = payload.feeds || [];
    const newReadings = [];

    for (const feed of feeds) {
        const normalized = normalizeReading(feed);
        const existing = await Sensor.findOne({
            room: normalized.room,
            timestamp: normalized.timestamp
        });

        if (!existing) {
            const saved = await Sensor.create(normalized);
            newReadings.push(saved);
        }
    }

    recordsImported += newReadings.length;
    lastSync = new Date();

    const io = socket.getIO();
    if (io && newReadings.length > 0) {
        io.emit("sensor:new-reading", newReadings[0]);
        io.emit("dashboard:update", { type: "thingspeak-sync", count: newReadings.length });
    }

    return {
        latest: newReadings[0] || null,
        imported: newReadings.length,
        totalImported: recordsImported,
        lastSync
    };
};

exports.getLatestReading = async () => {
    const latest = await Sensor.findOne().sort({ timestamp: -1 });
    return latest || null;
};

exports.getSyncStatus = async () => {
    return {
        connected: Boolean(process.env.THINGSPEAK_CHANNEL_ID && process.env.THINGSPEAK_READ_API_KEY),
        lastSync,
        recordsImported
    };
};

exports.getHistoricalData = async (query = {}) => {
    const limit = Math.min(100, Number(query.limit) || 50);
    const room = query.room;
    const filter = {};

    if (room) {
        filter.room = room;
    }

    return Sensor.find(filter).sort({ timestamp: -1 }).limit(limit);
};
