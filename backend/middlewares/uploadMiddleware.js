const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Allowed MIME types
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only standard images and documents are allowed."), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB file size limit
    }
});

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const fileBuffer = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${fileBuffer}`;
        cloudinary.uploader.upload(dataURI, { folder: 'tasksutra', resource_type: 'auto' }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = { upload, uploadToCloudinary };