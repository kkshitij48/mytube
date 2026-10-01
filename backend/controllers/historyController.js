const pool = require("../config/db");

async function recordWatch(req, res) {
    try {
        const videoId = Number(req.params.id);
        const userId = req.user.id;

        // Check if this user has watched this video before
        const existing = await pool.query(
            "SELECT * FROM watch_history WHERE user_id = $1 AND video_id = $2",
            [userId, videoId]
        );

        const isFirstWatch = existing.rows.length === 0;

        await pool.query(
            `INSERT INTO watch_history (user_id, video_id) VALUES ($1, $2)`,
            [userId, videoId]
        );

        if (isFirstWatch) {
            await pool.query(
                `UPDATE videos SET views = views + 1 WHERE id = $1`,
                [videoId]
            );
        }

        res.status(201).json({ recorded: true, countedAsView: isFirstWatch });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function getHistory(req, res) {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (watch_history.video_id)
                    videos.id, videos.title, videos.thumbnail_url AS thumbnail,
                    videos.category, users.username AS creator,
                    watch_history.watched_at
             FROM watch_history
             JOIN videos ON watch_history.video_id = videos.id
             JOIN users ON videos.creator_id = users.id
             WHERE watch_history.user_id = $1
             ORDER BY watch_history.video_id, watch_history.watched_at DESC`,
            [req.user.id]
        );

        result.rows.sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at));
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { recordWatch, getHistory };