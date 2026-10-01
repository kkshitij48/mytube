const pool = require("../config/db");
const supabase = require("../storage");
const { randomUUID } = require("crypto");

async function getAllVideos(req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 20);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT videos.*,
                    users.username AS creator,
                    UPPER(LEFT(users.username, 2)) AS avatar,
                    videos.thumbnail_url AS thumbnail,
                    videos.video_url AS "videoUrl",
                    to_char(videos.created_at, 'Mon DD, YYYY') AS uploaded
             FROM videos
             JOIN users ON videos.creator_id = users.id
             ORDER BY videos.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query("SELECT COUNT(*) FROM videos");
        const totalVideos = Number(countResult.rows[0].count);

        res.json({
            videos: result.rows,
            page,
            totalPages: Math.ceil(totalVideos / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function getVideoById(req, res) {
    try {
        const id = Number(req.params.id);
        const result = await pool.query(
            `SELECT videos.*,
                    users.username AS creator,
                    UPPER(LEFT(users.username, 2)) AS avatar,
                    videos.thumbnail_url AS thumbnail,
                    videos.video_url AS "videoUrl",
                    to_char(videos.created_at, 'Mon DD, YYYY') AS uploaded
             FROM videos
             JOIN users ON videos.creator_id = users.id
             WHERE videos.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Video not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function updateVideo(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await pool.query("SELECT * FROM videos WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Video not found" });
        }
        if (existing.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: "You can only edit your own videos" });
        }

        const { title, description, category, thumbnail_url, duration } = req.body;

        const result = await pool.query(
            `UPDATE videos
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 category = COALESCE($3, category),
                 thumbnail_url = COALESCE($4, thumbnail_url),
                 duration = COALESCE($5, duration)
             WHERE id = $6
             RETURNING *`,
            [title, description, category, thumbnail_url, duration, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function deleteVideo(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await pool.query("SELECT * FROM videos WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Video not found" });
        }
        if (existing.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: "You can only delete your own videos" });
        }

        await pool.query("DELETE FROM videos WHERE id = $1", [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

async function uploadVideo(req, res) {
    try {
        const { title, description, category, duration } = req.body;

        if (!title || !req.files?.video) {
            return res.status(400).json({ error: "Title and video file are required" });
        }

        const videoFile = req.files.video[0];
        const thumbnailFile = req.files.thumbnail?.[0];

        const videoKey = `videos/${randomUUID()}-${videoFile.originalname}`;
        const { error: videoError } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .upload(videoKey, videoFile.buffer, { contentType: videoFile.mimetype });

        if (videoError) throw videoError;

        let thumbnailKey = null;
        if (thumbnailFile) {
            thumbnailKey = `thumbnails/${randomUUID()}-${thumbnailFile.originalname}`;
            const { error: thumbError } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .upload(thumbnailKey, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });

            if (thumbError) throw thumbError;
        }

        const videoUrl = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(videoKey).data.publicUrl;
        const thumbnailUrl = thumbnailKey
            ? supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(thumbnailKey).data.publicUrl
            : null;

        const result = await pool.query(
            `INSERT INTO videos (creator_id, title, description, category, video_url, thumbnail_url, duration)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [req.user.id, title, description, category, videoUrl, thumbnailUrl, duration]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
}

async function getMyVideos(req, res) {
    try {
        const result = await pool.query(
            `SELECT videos.*,
                    videos.thumbnail_url AS thumbnail,
                    to_char(videos.created_at, 'Mon DD, YYYY') AS uploaded
             FROM videos
             WHERE creator_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { getAllVideos, getVideoById, updateVideo, deleteVideo, uploadVideo, getMyVideos };