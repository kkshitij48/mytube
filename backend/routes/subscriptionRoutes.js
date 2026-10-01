const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { toggleSubscribe, getSubscribeStatus } = require("../controllers/subscriptionController");

router.post("/:id/subscribe", authenticate, toggleSubscribe);
router.get("/:id/subscribe", authenticate, getSubscribeStatus);

module.exports = router;