const multer = require('multer');

function multerErrorHandler(defaultMessage) {
    return (error, req, res, next) => {
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'File is too large'
                : defaultMessage;
            const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({ error: message });
        }
        if (error) {
            return res.status(400).json({ error: 'Upload failed' });
        }
        next();
    };
}

module.exports = { multerErrorHandler };
