const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical", "warning"],
            default: "medium"
        },
        type: {
            type: String,
            enum: ["temperature", "humidity", "energy", "battery", "offline", "device_offline", "system"],
            default: "system"
        },
        room: {
            type: String,
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

alertSchema.index({ isRead: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
