const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    floor: {
        type: Number,
        default: 1
    },
    capacity: {
        type: Number,
        default: 40
    },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    sensorId: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Room", roomSchema);
