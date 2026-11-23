// MongoDB video-title search behavior.
const { db } = require('../config/database');
const { escapeRegex } = require('../utils/regex');
const Media = require('../models/Media');
const AudioRecording = require('../models/AudioRecording');

async function listLibrary(req, res) {
    try {
        const category = typeof req.query.category === 'string'
            ? req.query.category
            : null;
        const filter = category ? { category } : {};
        const items = await Media.find(filter).sort({ uploadedAt: -1 }).limit(100).lean();
        return res.json(items);
    } catch (error) {
        console.error('Library query failed:', error);
        return res.status(500).json({ error: 'Unable to load the library' });
    }
}

async function listRecordings(req, res) {
    try {
        const recordings = await AudioRecording.find({})
            .sort({ recordedAt: -1 })
            .limit(100)
            .lean();
        return res.json(recordings);
    } catch (error) {
        console.error('Recording query failed:', error);
        return res.status(500).json({ error: 'Unable to load recordings' });
    }
}

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

module.exports = { searchVideos, listLibrary, listRecordings };
