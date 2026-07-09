const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/recommendationController");

router.get("/", auth, controller.getRecommendations);

module.exports = router;