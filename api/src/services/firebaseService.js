const { db } = require("../config/firebase");
const Sensor = require("../models/Sensor");
const socket = require("../socket/socket");

let lastSync = null;
let recordsImported = 0;

const normalizeReading = (reading = {}) => {
    const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();
    const room = reading.room || "Unknown";
    const presence = reading.presence === true || reading.presence === "true" || Number(reading.occupancy || 0) > 0;

    return {
        room,
        temperature: Number(reading.temperature ?? 0),
        humidity: Number(reading.humidity ?? 0),
        light: Number(reading.light ?? 0),
        power: Number(reading.power ?? 0),
        presence,
        timestamp,
        lastSeen: timestamp
    };
};

exports.getLatestReading = async (room) => {
    const ref = room ? db.ref(`/campus/${room}/latest`) : db.ref("/campus");
    const snapshot = await ref.once("value");

    if (!room) {
        const value = snapshot.val() || {};
        return Object.entries(value).map(([roomName, roomValue]) => ({
            room: roomName,
            ...(roomValue.latest || roomValue)
        }));
    }

    return snapshot.val();
};

exports.getAllLatestReadings = async () => {
    return exports.getLatestReading();
};

exports.getHistory = async (room, startDate, endDate) => {
    if (!room) {
        return [];
    }

    const ref = db.ref(`/campus/${room}/history`);
    const snapshot = await ref.once("value");
    const entries = snapshot.val() || {};

    return Object.entries(entries)
        .map(([id, value]) => ({ id, ...value }))
        .filter((entry) => {
            if (!entry.timestamp) {
                return true;
            }
            const ts = new Date(entry.timestamp);
            const from = startDate ? new Date(startDate) : null;
            const to = endDate ? new Date(endDate) : null;
            if (from && ts < from) return false;
            if (to && ts > to) return false;
            return true;
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

exports.subscribeToChanges = (callback) => {
    const ref = db.ref("/campus");
    ref.on("value", async (snapshot) => {
        const value = snapshot.val() || {};
        const rooms = Object.entries(value);

        for (const [roomName, roomValue] of rooms) {
            const latest = roomValue.latest || roomValue;
            if (!latest) continue;

            const normalized = normalizeReading({ ...latest, room: roomName });
            const existing = await Sensor.findOne({ room: normalized.room, timestamp: normalized.timestamp });

            if (!existing) {
                await Sensor.create(normalized);
                recordsImported += 1;
            }

            lastSync = new Date();
            callback?.({ room: roomName, reading: normalized });
        }
    });
};

exports.syncToMongo = async (reading) => {
    const normalized = normalizeReading(reading);
    const existing = await Sensor.findOne({ room: normalized.room, timestamp: normalized.timestamp });

    if (!existing) {
        const saved = await Sensor.create(normalized);
        recordsImported += 1;
        lastSync = new Date();

        const io = socket.getIO();
        if (io) {
            io.emit("sensor:new-reading", saved);
            io.emit("dashboard:update", { type: "firebase-sync", room: normalized.room });
        }

        return saved;
    }

    return existing;
};

exports.getStatus = async () => {
    return {
        connected: Boolean(process.env.FIREBASE_DATABASE_URL),
        lastSync,
        recordsImported
    };
};

exports.syncAllFromFirebase = async () => {
    const snapshot = await db.ref("/campus").once("value");
    const value = snapshot.val() || {};
    const rooms = Object.entries(value);

    const results = [];

    for (const [roomName, roomValue] of rooms) {
        const latest = roomValue.latest || roomValue;
        if (!latest) continue;
        const result = await exports.syncToMongo({ ...latest, room: roomName });
        results.push(result);
    }

    return results;
};
