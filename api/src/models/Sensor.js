const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
    {
        room: {
            type: String,
            required: true
        },
        temperature: {
            type: Number,
            required: true
        },
        humidity: {
            type: Number,
            required: true
        },
        light: {
            type: Number,
            required: true
        },
        power: {
            type: Number,
            default: 0
        },
        presence: {
            type: Boolean,
            required: true
        },
        timestamp: {
            type: Date,
            required: true
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

sensorSchema.index({ room: 1 });
sensorSchema.index({ timestamp: -1 });
sensorSchema.index({ presence: 1 });

module.exports = mongoose.model("Sensor", sensorSchema);
