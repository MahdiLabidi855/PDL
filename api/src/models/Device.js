const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        cardName: {
            type: String,
            required: true,
            trim: true
        },
        cardType: {
            type: String,
            enum: ["esp32", "esp8266", "esp32-cam"],
            default: "esp32"
        },
        room: {
            type: String,
            required: true,
            trim: true
        },
        floor: {
            type: Number,
            default: 1
        },
        type: {
            type: String,
            default: "ESP32"
        },
        status: {
            type: String,
            enum: ["online", "offline", "maintenance"],
            default: "offline"
        },
        battery: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },
        firmware: {
            type: String,
            default: "1.0.0"
        },
        wifiSignal: {
            type: Number,
            default: 0
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        // ThingSpeak Configuration (per card)
        thingSpeakChannelId: {
            type: String,
            default: ""
        },
        thingSpeakApiKey: {
            type: String,
            default: ""
        },  // Write key
thingSpeakReadKey:   { type: String, default: "" },
        thingSpeakFieldMapping: {
            field1: { type: String, default: "temperature" },
            field2: { type: String, default: "humidity" },
            field3: { type: String, default: "light" },
            field4: { type: String, default: "presence" },
            field5: { type: String, default: "battery" }
        },
        // LED Status (controlled from dashboard)
        ledStatus: {
            on: { type: Boolean, default: false },
            color: {
                type: String,
                enum: ["red", "green", "blue", "yellow", "off"],
                default: "off"
            },
            brightness: {
                type: Number,
                min: 0,
                max: 255,
                default: 0
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            }
        }
    },
    {
        timestamps: true
    }
);

deviceSchema.index({ room: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ lastSeen: -1 });

module.exports = mongoose.model("Device", deviceSchema);