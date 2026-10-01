const pool = require("../config/db");

async function getComments(req, res) {
    try {
        const videoId = Number(req.params.id);
        const result = await pool.query(
            `SELECT comments.*, users.username AS author
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.video_id = $1
             ORDER BY comments.created_at DESC`,
            [videoId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function postComment(req, res) {
    try {
        const videoId = Number(req.params.id);
        const { content } = req.body;

        if (!content || content.trim() === "") {
            return res.status(400).json({ error: "Comment content is required" });
        }

        const result = await pool.query(
            `INSERT INTO comments (video_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
            [videoId, req.user.id, content.trim()]
        );

        const withAuthor = await pool.query(
            `SELECT comments.*, users.username AS author
             FROM comments JOIN users ON comments.user_id = users.id
             WHERE comments.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(withAuthor.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function deleteComment(req, res) {
    try {
        const commentId = Number(req.params.id);
        const existing = await pool.query("SELECT * FROM comments WHERE id = $1", [commentId]);

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (existing.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: "You can only delete your own comments" });
        }

        await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { getComments, postComment, deleteComment };