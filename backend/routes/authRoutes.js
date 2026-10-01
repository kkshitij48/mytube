const express = require("express");
const router = express.Router();
const { register, login, getProfile } = require("../controllers/authController");
const authenticate = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiter");

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/profile", authenticate, getProfile);

module.exports = router;