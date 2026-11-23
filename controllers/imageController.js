const fs = require('fs');
const path = require('path');
const { imagesDirectory } = require('../config/paths');
const { imageContentTypes } = require('../config/fileTypes');

function serveImage(req, res) {
    const fileName = path.basename(req.params.filename);
    if (fileName !== req.params.filename) {
        return res.status(400).json({ error: 'Invalid image name' });
    }

    const filePath = path.join(imagesDirectory, fileName);
    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.set({
            'Content-Type': imageContentTypes[path.extname(fileName).toLowerCase()] ||
                'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=86400'
        });
        return fs.createReadStream(filePath).pipe(res);
    });
}

module.exports = { serveImage };
