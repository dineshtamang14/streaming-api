const fs = require('fs');
const path = require('path');
const {
    audioDirectory,
    recordingsDirectory
} = require('../config/paths');
const { mediaContentTypes } = require('../config/fileTypes');
const { parseRangeHeader } = require('../utils/streamRange');

async function streamAudio(req, res) {
    const fileName = path.basename(req.params.filename);
    if (fileName !== req.params.filename) {
        return res.status(400).json({ error: 'Invalid audio name' });
    }

    const filePath = fs.existsSync(path.join(recordingsDirectory, fileName))
        ? path.join(recordingsDirectory, fileName)
        : path.join(audioDirectory, fileName);
    let stat;
    try {
        stat = await fs.promises.stat(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'Audio not found' });
        }
        return res.status(500).json({ error: 'Unable to access audio' });
    }

    if (!stat.isFile()) {
        return res.status(404).json({ error: 'Audio not found' });
    }

    const contentType = mediaContentTypes[path.extname(fileName).toLowerCase()] ||
        'application/octet-stream';
    const fileSize = stat.size;
    const range = req.headers.range;

    if (req.query.download === '1') {
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);
    }

    if (!range) {
        res.status(200).set({
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize,
            'Content-Type': contentType
        });
        return fs.createReadStream(filePath).pipe(res);
    }

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

module.exports = { streamAudio };
