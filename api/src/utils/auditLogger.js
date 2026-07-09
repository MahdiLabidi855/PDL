const AuditLog = require("../models/AuditLog");

const logAudit = async ({ action, entityType, entityId, userId, details = {}, req }) => {
    try {
        await AuditLog.create({
            action,
            entityType,
            entityId,
            userId,
            details,
            ipAddress: req?.ip || req?.socket?.remoteAddress || ""
        });
    } catch (error) {
        console.error("Audit log failed:", error.message);
    }
};

module.exports = { logAudit };