const firebaseService = require("../services/firebaseService");
const socket = require("../socket/socket");

/**
 * @openapi
 * /api/firebase/latest:
 *   get:
 *     summary: Get latest Firebase readings
 *     tags: [Firebase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest readings
 */
exports.getLatest = async (req, res) => {
    try {
        const room = req.query.room;
        const data = await firebaseService.getLatestReading(room);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const status = await firebaseService.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @openapi
 * /api/firebase/sync:
 *   post:
 *     summary: Sync Firebase readings to MongoDB
 *     tags: [Firebase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed
 */
exports.sync = async (req, res) => {
    try {
        const results = await firebaseService.syncAllFromFirebase();
        const io = socket.getIO();
        if (io) {
            io.emit("dashboard:update", { type: "firebase-sync", count: results.length });
        }
        res.json({ success: true, imported: results.length, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { room, from, to } = req.query;
        const history = await firebaseService.getHistory(room, from, to);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
