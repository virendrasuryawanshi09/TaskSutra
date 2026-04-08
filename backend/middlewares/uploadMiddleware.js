const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
       cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Allow any document type (images, pdfs, etc.)
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;