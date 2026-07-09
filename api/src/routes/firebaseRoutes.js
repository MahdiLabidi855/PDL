const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/firebaseController");

router.get("/latest", auth, controller.getLatest);
router.get("/status", auth, controller.getStatus);
router.post("/sync", auth, controller.sync);
router.get("/history", auth, controller.getHistory);

module.exports = router;