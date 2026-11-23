// Category-specific Multer storage and file validation for all uploads.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    uploadsDirectory,
    documentsDirectory,
    imagesDirectory,
    audioDirectory,
    videoDirectory,
    moviesDirectory,
    recordingsDirectory
} = require('../config/paths');
const {
    mediaExtensions,
    imageExtensions,
    documentTypes,
    audioExtensions,
    movieExtensions
} = require('../config/fileTypes');

fs.mkdirSync(uploadsDirectory, { recursive: true });
fs.mkdirSync(documentsDirectory, { recursive: true });
fs.mkdirSync(imagesDirectory, { recursive: true });
fs.mkdirSync(audioDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });
fs.mkdirSync(recordingsDirectory, { recursive: true });
fs.mkdirSync(moviesDirectory, { recursive: true });

function createDiskStorage(directory) {
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, directory),
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
        }
    });
}

const mediaUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();
            const directory = audioExtensions.has(extension) ? audioDirectory : videoDirectory;
            cb(null, directory);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
        }
    }),
    limits: { fileSize: 500 * 1024 * 1024, files: 20 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!mediaExtensions.has(extension) || !/^(audio|video)\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'files'));
        }
        cb(null, true);
    }
});

const audioUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const directory = req.body.isRecording === 'true'
                ? recordingsDirectory
                : audioDirectory;
            cb(null, directory);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
        }
    }),
    limits: { fileSize: 250 * 1024 * 1024, files: 30 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!audioExtensions.has(extension) || !/^audio\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'audio'));
        }
        cb(null, true);
    }
});

const movieUpload = multer({
    storage: createDiskStorage(moviesDirectory),
    limits: { fileSize: 4 * 1024 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!movieExtensions.has(extension) || !/^video\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'movies'));
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

module.exports = { mediaUpload, audioUpload, movieUpload, documentUpload, imageUpload };
