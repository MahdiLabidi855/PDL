const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        room: {
            type: String,
            required: true,
            trim: true
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
            max: 100
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
