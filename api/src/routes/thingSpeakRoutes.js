const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const controller = require("../controllers/thingspeakController");

router.get("/latest", auth, controller.getLatest);
router.get("/status", auth, controller.getStatus);
router.post("/sync", auth, admin, controller.sync);
router.get("/history", auth, controller.getHistory);

module.exports = router;