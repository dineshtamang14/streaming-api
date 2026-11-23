// MongoDB video-title search behavior.
const { db } = require('../config/database');
const { escapeRegex } = require('../utils/regex');

async function searchVideos(req, res) {
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
}

module.exports = { searchVideos };
