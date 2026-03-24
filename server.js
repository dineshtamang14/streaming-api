// server.js

const express = require('express');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis client
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Middleware
app.use(cors());
app.use(express.json());

// Sample API route
app.get('/api/data', async (req, res) => {
    const cacheKey = 'data';

    // Check if data exists in Redis cache
    redisClient.get(cacheKey, async (err, data) => {
        if (err) throw err;

        if (data) {
            // If cache exists, return cached data
            return res.json(JSON.parse(data));
        }

        // If no cache, fetch data (simulate DB fetch)
        const freshData = await fetchDataFromDB(); // Assume this function exists

        // Store data in Redis cache for future requests
        redisClient.setex(cacheKey, 3600, JSON.stringify(freshData));
        res.json(freshData);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function fetchDataFromDB() {
    // Simulated database fetch
    return [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
}