const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["energy", "occupancy", "maintenance"],
            required: true
        },
        room: {
            type: String,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ["active", "dismissed", "applied"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

recommendationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
