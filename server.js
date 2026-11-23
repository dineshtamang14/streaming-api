const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const uploadsDirectory = path.join(__dirname, 'uploads');
const documentsDirectory = path.join(uploadsDirectory, 'documents');
const mongoUri = 'mongodb://localhost:27017/streamingAPI';
const mediaExtensions = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.mp4', '.webm', '.mov', '.avi', '.mkv']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']);
const documentExtensions = new Map([
    ['.pdf', 'application/pdf'],
    ['.doc', 'application/msword'],
    ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['.txt', 'text/plain'],
    ['.csv', 'text/csv'],
    ['.xls', 'application/vnd.ms-excel'],
    ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['.ppt', 'application/vnd.ms-powerpoint'],
    ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['.rtf', 'application/rtf'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png']
]);

// MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

fs.mkdirSync(uploadsDirectory, { recursive: true });
fs.mkdirSync(documentsDirectory, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!mediaExtensions.has(extension) || !/^(audio|video)\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
        }
        cb(null, true);
    }
});

const batchUpload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024, files: 20 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!mediaExtensions.has(extension) || !/^(audio|video)\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'files'));
        }
        cb(null, true);
    }
});

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, documentsDirectory),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});

const documentUpload = multer({
    storage: documentStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const mimeAllowed = documentExtensions.has(extension);
        if (!mimeAllowed) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'document'));
        }
        cb(null, true);
    }
});

const imageDirectory = path.join(uploadsDirectory, 'images');
fs.mkdirSync(imageDirectory, { recursive: true });

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDirectory),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: { fileSize: 25 * 1024 * 1024, files: 30 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!imageExtensions.has(extension) || !/^image\//.test(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'images'));
        }
        cb(null, true);
    }
});

const batchDocumentUpload = multer({
    storage: documentStorage,
    limits: { fileSize: 100 * 1024 * 1024, files: 30 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!documentExtensions.has(extension)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'documents'));
        }
        cb(null, true);
    }
});

// Middleware
app.use(express.json());
app.use(express.static(uploadsDirectory));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getContentType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.m4a': 'audio/mp4',
        '.wav': 'audio/wav',
        '.webm': 'video/webm',
        '.ogg': 'audio/ogg',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska'
    };

    return contentTypes[extension] || 'application/octet-stream';
}

function parseRangeHeader(range, fileSize) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
        return null;
    }

    let start = match[1] ? Number(match[1]) : Math.max(fileSize - Number(match[2]), 0);
    let end = match[2] ? Number(match[2]) : fileSize - 1;

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start < 0 || end < start || start >= fileSize) {
        return null;
    }

    end = Math.min(end, fileSize - 1);
    return { start, end };
}

// Search functionality
app.get('/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
        return res.status(400).json({ error: 'A search query is required' });
    }

    try {
        const results = await db.collection('videos')
            .find({ title: { $regex: escapeRegex(query), $options: 'i' } })
            .toArray();
        return res.json(results);
    } catch (error) {
        console.error('Search failed:', error);
        return res.status(500).json({ error: 'Search failed' });
    }
});

// File upload endpoint
app.post('/upload', (req, res, next) => {
    batchUpload.array('files', 20)(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'File is too large'
                : 'Only audio and video media files are allowed';
            return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: message });
        }
        if (error) {
            return res.status(400).json({ error: 'Upload failed' });
        }
        next();
    });
}, (req, res) => {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more files are required' });
    }

    res.json({ message: 'Files uploaded successfully', files: req.files });
});

app.post('/upload/document', (req, res, next) => {
    batchDocumentUpload.array('documents', 30)(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Document is too large'
                : 'Only PDF, Office, text, CSV, RTF, JPG, or PNG documents are allowed';
            return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: message });
        }
        if (error) {
            return res.status(400).json({ error: 'Document upload failed' });
        }
        next();
    });
}, (req, res) => {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more documents are required' });
    }

    res.status(200).json({
        message: 'Documents uploaded successfully',
        documents: req.files
    });
});

app.post('/upload/images', (req, res, next) => {
    imageUpload.array('images', 30)(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Image is too large'
                : 'Only supported image files are allowed';
            return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: message });
        }
        if (error) {
            return res.status(400).json({ error: 'Image upload failed' });
        }
        next();
    });
}, (req, res) => {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more images are required' });
    }

    res.status(200).json({
        message: 'Images uploaded successfully',
        images: req.files
    });
});

app.get('/documents/:filename', (req, res) => {
    const fileName = path.basename(req.params.filename);
    if (fileName !== req.params.filename) {
        return res.status(400).json({ error: 'Invalid document name' });
    }

    const filePath = path.join(documentsDirectory, fileName);
    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.set('Content-Type', documentExtensions.get(path.extname(fileName).toLowerCase()) ||
            'application/octet-stream');
        if (req.query.download === '1') {
            res.set('Content-Disposition', `attachment; filename="${fileName}"`);
        } else {
            res.set('Content-Disposition', `inline; filename="${fileName}"`);
        }
        return res.sendFile(filePath);
    });

    app.get('/images/:filename', (req, res) => {
        const fileName = path.basename(req.params.filename);
        if (fileName !== req.params.filename) {
            return res.status(400).json({ error: 'Invalid image name' });
        }

        const filePath = path.join(imageDirectory, fileName);
        fs.stat(filePath, (error, stat) => {
            if (error || !stat.isFile()) {
                return res.status(404).json({ error: 'Image not found' });
            }

            const contentType = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
                '.svg': 'image/svg+xml'
            }[path.extname(fileName).toLowerCase()] || 'application/octet-stream';

            res.set({
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Cache-Control': 'public, max-age=86400'
            });
            return fs.createReadStream(filePath).pipe(res);
        });
    });
});

// Video/Audio streaming endpoint
app.get('/stream/:id', async (req, res) => {
    const fileName = path.basename(req.params.id);
    if (fileName !== req.params.id) {
        return res.status(400).json({ error: 'Invalid file name' });
    }

    const filePath = path.join(uploadsDirectory, fileName);
    let stat;
    try {
        stat = await fs.promises.stat(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'File not found' });
        }
        console.error('Unable to access stream file:', error);
        return res.status(500).json({ error: 'Unable to access file' });
    }

    if (!stat.isFile()) {
        return res.status(404).json({ error: 'File not found' });
    }

    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = getContentType(filePath);

    if (range) {
        const byteRange = parseRangeHeader(range, fileSize);
        if (!byteRange) {
            return res.status(416)
                .set('Content-Range', `bytes */${fileSize}`)
                .json({ error: 'Invalid byte range' });
        }

        const { start, end } = byteRange;
        res.status(206).set({
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': contentType
        });
        return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.status(200).set({
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize,
        'Content-Type': contentType
    });
    return fs.createReadStream(filePath).pipe(res);
});

if (require.main === module) {
    mongoose.connect(mongoUri).catch((error) => {
        console.error('MongoDB connection failed:', error);
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
