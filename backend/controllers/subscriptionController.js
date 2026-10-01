const pool = require("../config/db");

async function toggleSubscribe(req, res) {
    try {
        const creatorId = Number(req.params.id);
        const subscriberId = req.user.id;

        if (creatorId === subscriberId) {
            return res.status(400).json({ error: "You cannot subscribe to yourself" });
        }

        const existing = await pool.query(
            "SELECT * FROM subscriptions WHERE subscriber_id = $1 AND creator_id = $2",
            [subscriberId, creatorId]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                "DELETE FROM subscriptions WHERE subscriber_id = $1 AND creator_id = $2",
                [subscriberId, creatorId]
            );
            return res.json({ subscribed: false });
        }

        await pool.query(
            "INSERT INTO subscriptions (subscriber_id, creator_id) VALUES ($1, $2)",
            [subscriberId, creatorId]
        );
        res.json({ subscribed: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function getSubscribeStatus(req, res) {
    try {
        const creatorId = Number(req.params.id);
        const result = await pool.query(
            "SELECT * FROM subscriptions WHERE subscriber_id = $1 AND creator_id = $2",
            [req.user.id, creatorId]
        );
        res.json({ subscribed: result.rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { toggleSubscribe, getSubscribeStatus };