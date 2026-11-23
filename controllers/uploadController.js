function uploadMedia(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more files are required' });
    }
    return res.json({ message: 'Files uploaded successfully', files: req.files });
}

function uploadDocuments(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more documents are required' });
    }
    return res.status(200).json({
        message: 'Documents uploaded successfully',
        documents: req.files
    });
}

function uploadImages(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more images are required' });
    }
    return res.status(200).json({
        message: 'Images uploaded successfully',
        images: req.files
    });
}

module.exports = { uploadMedia, uploadDocuments, uploadImages };
