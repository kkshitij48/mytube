const pool = require("../config/db");
const jwt = require("jsonwebtoken");

async function toggleLike(req, res) {
    try {
        const videoId = Number(req.params.id);
        const userId = req.user.id;

        const existing = await pool.query(
            "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
            [videoId, userId]
        );

        if (existing.rows.length > 0) {
            await pool.query("DELETE FROM likes WHERE video_id = $1 AND user_id = $2", [videoId, userId]);
            const count = await pool.query("SELECT COUNT(*) FROM likes WHERE video_id = $1", [videoId]);
            return res.json({ liked: false, count: Number(count.rows[0].count) });
        }

        await pool.query("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, userId]);
        const count = await pool.query("SELECT COUNT(*) FROM likes WHERE video_id = $1", [videoId]);
        res.json({ liked: true, count: Number(count.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function getLikeStatus(req, res) {
    try {
        const videoId = Number(req.params.id);
        const count = await pool.query("SELECT COUNT(*) FROM likes WHERE video_id = $1", [videoId]);

        let liked = false;
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            try {
                const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
                const check = await pool.query(
                    "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
                    [videoId, decoded.id]
                );
                liked = check.rows.length > 0;
            } catch (e) { /* not logged in or expired - ignore */ }
        }

        res.json({ liked, count: Number(count.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { toggleLike, getLikeStatus };