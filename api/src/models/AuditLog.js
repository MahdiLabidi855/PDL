const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ["Create", "Login", "Delete", "Import", "Update", "Export"],
    },
    entityType: {
        type: String,
        default: ""
    },
    entityId: {
        type: String,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
