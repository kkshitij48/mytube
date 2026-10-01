const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
    getAllVideos, getVideoById, updateVideo, deleteVideo, uploadVideo, getMyVideos
} = require("../controllers/videoController");

router.get("/", getAllVideos);
router.get("/my-videos", authenticate, getMyVideos);
router.get("/:id", getVideoById);
router.put("/:id", authenticate, updateVideo);
router.delete("/:id", authenticate, deleteVideo);
router.post(
    "/upload",
    authenticate,
    upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
    uploadVideo
);

module.exports = router;