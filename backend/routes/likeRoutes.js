const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { toggleLike, getLikeStatus } = require("../controllers/likeController");

router.post("/:id/like", authenticate, toggleLike);
router.get("/:id/likes", getLikeStatus);

module.exports = router;