const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/mapController");

router.get("/", auth, controller.getMap);
router.get("/:room", auth, controller.getRoom);

module.exports = router;