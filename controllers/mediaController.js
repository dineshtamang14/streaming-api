// Media file access, range validation, and audio/video streaming responses.
const fs = require('fs');
const path = require('path');
const { uploadsDirectory } = require('../config/paths');
const { mediaContentTypes } = require('../config/fileTypes');
const { parseRangeHeader } = require('../utils/streamRange');

async function streamMedia(req, res) {
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
    const contentType = mediaContentTypes[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream';

    if (range) {
        const byteRange = parseRangeHeader(range, fileSize);
        if (!byteRange) {
            return res.status(416)
                .set('Content-Range', `bytes */${fileSize}`)
                .json({ error: 'Invalid byte range' });
        }

        res.status(206).set({
            'Content-Range': `bytes ${byteRange.start}-${byteRange.end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': byteRange.end - byteRange.start + 1,
            'Content-Type': contentType
        });
        return fs.createReadStream(filePath, byteRange).pipe(res);
    }

    res.status(200).set({
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize,
        'Content-Type': contentType
    });
    return fs.createReadStream(filePath).pipe(res);
}

module.exports = { streamMedia };
