const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/maintenanceController");

router.get("/", auth, controller.getMaintenance);

module.exports = router;