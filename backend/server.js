require("dotenv").config();
const express = require("express");
const cors = require("cors");

const videoRoutes = require("./routes/videoRoutes");
const authRoutes = require("./routes/authRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const historyRoutes = require("./routes/historyRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500" }));
console.log("FRONTEND_URL =", process.env.FRONTEND_URL);
app.use(express.json());

app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/videos", likeRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", subscriptionRoutes);
app.use("/api", historyRoutes);
app.use("/api/recommendations", recommendationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});