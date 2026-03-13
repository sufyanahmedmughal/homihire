const multer = require('multer');
const path = require('path');

// Only allow JPEG and PNG — Section 4.4
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error('Only JPEG and PNG files are allowed. Please upload a valid image.'),
            false
        );
    }
};

// Use memory storage — we upload directly to Cloudinary, no local disk storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // Max 1 file per request
    },
});

/**
 * Multer error handler middleware
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.',
            });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

/**
 * Convert multer memory buffer to base64 data URI for Cloudinary upload
 */
const bufferToDataURI = (buffer, mimetype) => {
    const base64 = buffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
};

module.exports = { upload, handleUploadError, bufferToDataURI };
