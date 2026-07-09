const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/energyController");

router.get("/today", auth, controller.getTodayEnergy);
router.get("/month", auth, controller.getMonthEnergy);
router.get("/waste", auth, controller.getWasteEnergy);
router.get("/rooms", auth, controller.getEnergyByRoom);

module.exports = router;