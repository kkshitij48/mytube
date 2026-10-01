const multer = require("multer");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files are allowed for the video field"));
    }
    if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for the thumbnail field"));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = upload;