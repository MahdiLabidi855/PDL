const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/dashboardController");

router.get("/statistics", auth, controller.getStatistics);
router.get("/occupancy", auth, controller.getOccupancy);
router.get("/peak-hours", auth, controller.getPeakHours);
router.get("/top-rooms", auth, controller.getTopRooms);
router.get("/underused-rooms", auth, controller.getUnderusedRooms);
router.get("/environment", auth, controller.getEnvironment);
router.get("/energy", auth, controller.getEnergy);
router.get("/trends", auth, controller.getTrends);
router.get("/alerts", auth, controller.getAlerts);
router.get("/live", auth, controller.getLiveDashboard);

module.exports = router;
