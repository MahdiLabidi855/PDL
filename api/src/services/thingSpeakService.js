const axios = require("axios");
const { baseUrl } = require("../config/thingspeak");
const Device = require("../models/Device");
const Sensor = require("../models/Sensor");
const socket = require("../socket/socket");

let lastSync = null;
let recordsImported = 0;

// Convert ThingSpeak feed to Sensor format
const normalizeFeed = (feed, fieldMapping, room) => {
    return {
        room: room || "Unknown",
        temperature: Number(feed[fieldMapping.field1 || "field1"] ?? 0),
        humidity: Number(feed[fieldMapping.field2 || "field2"] ?? 0),
        light: Number(feed[fieldMapping.field3 || "field3"] ?? 0),
        presence: Number(feed[fieldMapping.field4 || "field4"] ?? 0) > 0,
        battery: Number(feed[fieldMapping.field5 || "field5"] ?? 100),
        timestamp: feed.created_at ? new Date(feed.created_at) : new Date(),
        lastSeen: new Date()
    };
};

// Get latest reading from one channel
exports.getLatestReading = async (channelId, apiKey) => {
    const url = `${baseUrl}/channels/${channelId}/feeds/last.json?api_key=${apiKey}`;
    const response = await axios.get(url);
    return response.data;
};

// Get history from one channel
exports.getChannelHistory = async (channelId, apiKey, startDate, endDate) => {
    let url = `${baseUrl}/channels/${channelId}/feeds.json?api_key=${apiKey}`;
    if (startDate) url += `&start=${startDate}`;
    if (endDate) url += `&end=${endDate}`;
    const response = await axios.get(url);
    return response.data.feeds || [];
};

// Sync one channel to MongoDB
exports.syncChannelToMongo = async (device) => {
    try {
        const feed = await exports.getLatestReading(
            device.thingSpeakChannelId,
            device.thingSpeakApiKey
        );

        const normalized = normalizeFeed(feed, device.thingSpeakFieldMapping, device.room);

        const existing = await Sensor.findOne({
            room: normalized.room,
            timestamp: normalized.timestamp
        });

        if (!existing) {
            const saved = await Sensor.create(normalized);
            recordsImported += 1;

            // Update device lastSeen + battery
            await Device.findByIdAndUpdate(device._id, {
                lastSeen: new Date(),
                status: "online",
                battery: normalized.battery
            });

            const io = socket.getIO();
            if (io) {
                io.emit("sensor:new-reading", saved);
                io.emit("dashboard:update", { type: "thingspeak-sync", room: normalized.room });
            }

            return saved;
        }
        return null;
    } catch (error) {
        console.error(`Sync failed for ${device.cardName}:`, error.message);
        return null;
    }
};

// Sync all channels
exports.syncAllChannels = async () => {
    const devices = await Device.find({ thingSpeakChannelId: { $exists: true, $ne: "" } });
    const results = [];

    for (const device of devices) {
        const result = await exports.syncChannelToMongo(device);
        if (result) results.push(result);
    }

    lastSync = new Date();
    return results;
};

// Get sync status
exports.getStatus = async () => {
    let connected = false;
    try {
        const response = await axios.get(`${baseUrl}/status.json`);
        connected = true;
    } catch {
        connected = false;
    }

    return {
        connected,
        lastSync,
        recordsImported
    };
};