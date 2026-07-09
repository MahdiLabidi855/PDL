const mongoose = require("mongoose");

const energyReadingSchema = new mongoose.Schema(
    {
        room: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        power: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        },

        isWaste: {
            type: Boolean,
            default: false
        },
        wasteReason: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

energyReadingSchema.index({ room: 1, timestamp: -1 });
energyReadingSchema.index({ isWaste: 1, timestamp: -1 });
energyReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("EnergyReading", energyReadingSchema);
