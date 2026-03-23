const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/stream', require('./routes/streamRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Home endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Streaming API', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🎬 Streaming API running on http://localhost:${PORT}`);
  console.log(`📂 Upload movies to: POST /api/upload/movie`);
  console.log(`🎵 Upload songs to: POST /api/upload/song`);
  console.log(`▶️  Stream movies from: GET /api/stream/movie/:id`);
  console.log(`🎧 Stream songs from: GET /api/stream/song/:id`);
});
