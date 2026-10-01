const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { recordWatch, getHistory } = require("../controllers/historyController");

router.post("/videos/:id/watch", authenticate, recordWatch);
router.get("/history", authenticate, getHistory);

module.exports = router;