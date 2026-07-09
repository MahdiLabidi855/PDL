const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/predictionController");

router.get("/", auth, controller.getPrediction);

module.exports = router;