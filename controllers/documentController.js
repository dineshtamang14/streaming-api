const fs = require('fs');
const path = require('path');
const { documentsDirectory } = require('../config/paths');
const { documentTypes } = require('../config/fileTypes');

function downloadDocument(req, res) {
    const fileName = path.basename(req.params.filename);
    if (fileName !== req.params.filename) {
        return res.status(400).json({ error: 'Invalid document name' });
    }

    const filePath = path.join(documentsDirectory, fileName);
    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.set('Content-Type', documentTypes.get(path.extname(fileName).toLowerCase()) ||
            'application/octet-stream');
        res.set('Content-Disposition', req.query.download === '1'
            ? `attachment; filename="${fileName}"`
            : `inline; filename="${fileName}"`);
        return res.sendFile(filePath);
    });
}

module.exports = { downloadDocument };
