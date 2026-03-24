const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Destination directory for uploaded files

// Enable CORS
router.use(cors());

// Upload a movie
router.post('/upload/movie', upload.single('file'), (req, res) => {
    const { file } = req;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    // Here you can save information about the file to a database if needed
    res.send({ message: 'Movie uploaded successfully!', file: file.filename });
});

// Upload a song
router.post('/upload/song', upload.single('file'), (req, res) => {
    const { file } = req;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    // Here you can save information about the file to a database if needed
    res.send({ message: 'Song uploaded successfully!', file: file.filename });
});

// Stream a movie
router.get('/stream/movie/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    res.sendFile(filePath);
});

// Stream a song
router.get('/stream/song/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    res.sendFile(filePath);
});

// Search for movies and songs (dummy implementation)
router.get('/search', (req, res) => {
    const { query } = req.query;  // Search query
    // Here you could implement actual search logic against a database
    res.send({ message: 'Search result for query: ' + query });
});

module.exports = router;