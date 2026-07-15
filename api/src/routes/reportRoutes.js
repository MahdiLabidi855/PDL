const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/reportController");

router.get("/preview", auth, controller.getReportPreview);
router.get("/pdf", auth, controller.getPdfReport);

module.exports = router;