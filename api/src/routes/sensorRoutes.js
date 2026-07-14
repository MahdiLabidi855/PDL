const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");
const validateSensor = require("../middleware/validateSensor");
const controller = require("../controllers/sensorController");

/**
 * @openapi
 * /api/sensors:
 *   get:
 *     summary: List sensors
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensor list
 */
router.get("/", auth, controller.getAllSensors);
router.post("/", auth, validateSensor, controller.createSensor);
router.post("/import", auth, admin, upload.single("file"), controller.importExcel);
router.get("/active", auth, controller.getActiveSensors);
router.get("/export", auth, controller.exportExcel);
// Bulk routes BEFORE /:id to avoid shadowing
router.put("/bulk", auth, admin, controller.bulkUpdate);
router.delete("/bulk", auth, admin, controller.bulkDelete);
router.get("/:id", auth, controller.getSensor);
router.put("/:id", auth, validateSensor, controller.updateSensor);
router.delete("/:id", auth, controller.deleteSensor);

module.exports = router;