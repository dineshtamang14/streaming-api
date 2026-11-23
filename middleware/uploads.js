// Category-specific Multer storage and file validation for all uploads.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    uploadsDirectory,
    documentsDirectory,
    imagesDirectory
} = require('../config/paths');
const {
    mediaExtensions,
    imageExtensions,
    documentTypes
} = require('../config/fileTypes');

fs.mkdirSync(uploadsDirectory, { recursive: true });
fs.mkdirSync(documentsDirectory, { recursive: true });
fs.mkdirSync(imagesDirectory, { recursive: true });

function createDiskStorage(directory) {
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, directory),
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
        }
    });
}

const mediaUpload = multer({
    storage: createDiskStorage(uploadsDirectory),
    limits: { fileSize: 500 * 1024 * 1024, files: 20 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!mediaExtensions.has(extension) || !/^(audio|video)\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'files'));
        }
        cb(null, true);
    }
});

const documentUpload = multer({
    storage: createDiskStorage(documentsDirectory),
    limits: { fileSize: 100 * 1024 * 1024, files: 30 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!documentTypes.has(extension)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'documents'));
        }
        cb(null, true);
    }
});

const imageUpload = multer({
    storage: createDiskStorage(imagesDirectory),
    limits: { fileSize: 25 * 1024 * 1024, files: 30 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!imageExtensions.has(extension) || !/^image\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'images'));
        }
        cb(null, true);
    }
});

module.exports = { mediaUpload, documentUpload, imageUpload };
