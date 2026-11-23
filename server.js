const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const uploadsDirectory = path.join(__dirname, 'uploads');
const mongoUri = 'mongodb://localhost:27017/streamingAPI';

// MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

fs.mkdirSync(uploadsDirectory, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static(uploadsDirectory));

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
        '.webm': 'video/webm'
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
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'A file is required' });
    }

    res.json({ message: 'File uploaded successfully', file: req.file });
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
