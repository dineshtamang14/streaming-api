const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/streamingAPI', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Redis client setup
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static('uploads'));

// Search functionality
app.get('/search', async (req, res) => {
    const query = req.query.q;
    const results = await db.collection('videos').find({ title: { $regex: query, $options: 'i' } }).toArray();
    res.json(results);
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ message: 'File uploaded successfully', file: req.file });
});

// Video/Audio streaming endpoint
app.get('/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    const filePath = path.join(__dirname, 'uploads', videoId);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': (end - start) + 1,
            'Content-Type': 'video/mp4'
        });
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
