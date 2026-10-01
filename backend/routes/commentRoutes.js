const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { getComments, postComment, deleteComment } = require("../controllers/commentController");

router.get("/videos/:id/comments", getComments);
router.post("/videos/:id/comments", authenticate, postComment);
router.delete("/comments/:id", authenticate, deleteComment);

module.exports = router;