const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const controller = require("../controllers/deviceController");

router.get("/", auth, controller.getDevices);
router.post("/", auth, controller.createDevice);
router.post("/heartbeat", controller.heartbeat);
router.put("/:id", auth, controller.updateDevice);
router.delete("/:id", auth, controller.deleteDevice);

// LED control
router.put("/:id/led", auth, controller.updateLed);
router.get("/:id/led", controller.getLedStatus);

// Card config
router.put("/:id/config", auth, controller.updateConfig);
router.get("/:id/config", auth, controller.getConfig);

module.exports = router;