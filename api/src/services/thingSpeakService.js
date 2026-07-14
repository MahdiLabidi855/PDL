const axios = require("axios");
const { baseUrl } = require("../config/thingspeak");
const Device = require("../models/Device");
const Sensor = require("../models/Sensor");
const socket = require("../socket/socket");

let lastSync = null;
let recordsImported = 0;

// Convert ThingSpeak feed to Sensor format
// ThingSpeak returns { field1: "24", field2: "60", ... }
// Device.fieldMapping maps field keys → sensor names: { field1: "temperature", ... }
// We need the reverse: sensor name → field key
const normalizeFeed = (feed, fieldMapping, room) => {
    // Build reverse lookup: sensor name → field key
    const fieldToSensor = {};
    Object.entries(fieldMapping || {}).forEach(([fieldKey, sensorName]) => {
        fieldToSensor[sensorName] = fieldKey;
    });

    return {
        room: room || "Unknown",
        temperature: Number(feed[fieldToSensor.temperature || "field1"] ?? 0),
        humidity: Number(feed[fieldToSensor.humidity || "field2"] ?? 0),
        light: Number(feed[fieldToSensor.light || "field3"] ?? 0),
        presence: Number(feed[fieldToSensor.presence || "field4"] ?? 0) > 0,
        battery: Number(feed[fieldToSensor.battery || "field5"] ?? 100),
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
        const readKey = device.thingSpeakReadKey || device.thingSpeakApiKey;
        const feed = await exports.getLatestReading(
            device.thingSpeakChannelId,
           readKey
        );

        const normalized = normalizeFeed(
            feed,
            device.thingSpeakFieldMapping,
            device.room
        );

        // Avoid duplicates: check if this reading already exists
        const existing = await Sensor.findOne({
            room: normalized.room,
            timestamp: normalized.timestamp
        });

        if (!existing) {
            const saved = await Sensor.create(normalized);
            recordsImported += 1;

            // Update device status
            await Device.findByIdAndUpdate(device._id, {
                lastSeen: new Date(),
                status: "online",
                battery: normalized.battery
            });

            // Emit real-time events
            const io = socket.getIO();
            if (io) {
                io.emit("sensor:new-reading", saved);
                io.emit("dashboard:update", {
                    type: "thingspeak-sync",
                    room: normalized.room
                });
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
    const devices = await Device.find({
        thingSpeakChannelId: { $exists: true, $ne: "" }
    });

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
        // Ping ThingSpeak with a known public channel
        const response = await axios.get(`${baseUrl}/channels/1/feeds/last.json`, {
            timeout: 5000
        });
        connected = response.status === 200;
    } catch {
        connected = false;
    }

    return {
        connected,
        lastSync,
        recordsImported
    };
};