const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/deviceController");

router.get("/", auth, controller.getDevices);
router.post("/", auth, controller.createDevice);
router.post("/heartbeat", controller.heartbeat);
router.put("/:id", auth, controller.updateDevice);
router.delete("/:id", auth, controller.deleteDevice);

module.exports = router;
