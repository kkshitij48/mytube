const pool = require("../config/db");

async function getRecommendations(req, res) {
    try {
        const userId = req.user.id;

        const categoryResult = await pool.query(
            `SELECT videos.category, COUNT(*) as watch_count
             FROM watch_history
             JOIN videos ON watch_history.video_id = videos.id
             WHERE watch_history.user_id = $1
             GROUP BY videos.category`,
            [userId]
        );

        const categoryScores = {};
        categoryResult.rows.forEach(row => {
            categoryScores[row.category] = Number(row.watch_count);
        });

        const subsResult = await pool.query(
            `SELECT creator_id FROM subscriptions WHERE subscriber_id = $1`,
            [userId]
        );
        const subscribedCreatorIds = subsResult.rows.map(r => r.creator_id);

        const watchedResult = await pool.query(
            `SELECT DISTINCT video_id FROM watch_history WHERE user_id = $1`,
            [userId]
        );
        const watchedVideoIds = watchedResult.rows.map(r => r.video_id);

        const videosResult = await pool.query(
            `SELECT videos.*, users.username AS creator,
                    UPPER(LEFT(users.username, 2)) AS avatar,
                    videos.thumbnail_url AS thumbnail
             FROM videos
             JOIN users ON videos.creator_id = users.id`
        );

        const scored = videosResult.rows.map(video => {
            let score = 0;
            score += (categoryScores[video.category] || 0) * 10;

            if (subscribedCreatorIds.includes(video.creator_id)) {
                score += 15;
            }

            score += Math.log10(Number(video.views) + 1) * 2;

            const daysOld = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 10 - daysOld);

            if (watchedVideoIds.includes(video.id)) {
                score -= 5;
            }

            return { ...video, score };
        });

        scored.sort((a, b) => b.score - a.score);
        res.json(scored);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { getRecommendations };