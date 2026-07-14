const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/alertController");

router.get("/", auth, controller.getAlerts);
router.post("/", auth, controller.createAlert);
router.put("/:id/read", auth, controller.markAsRead);
router.put("/:id/resolve", auth, controller.markAsRead);

module.exports = router;