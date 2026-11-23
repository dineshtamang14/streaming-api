// Public endpoint mapping for search, streaming, uploads, and file viewers.
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');
const {
    searchVideos,
    listLibrary,
    listRecordings
} = require('../controllers/searchController');
const { streamMedia } = require('../controllers/mediaController');
const { downloadDocument } = require('../controllers/documentController');
const { serveImage } = require('../controllers/imageController');
const { streamAudio } = require('../controllers/audioController');
const {
    uploadMedia,
    uploadAudio,
    uploadDocuments,
    uploadImages
} = require('../controllers/uploadController');
const {
    mediaUpload,
    audioUpload,
    documentUpload,
    imageUpload
} = require('../middleware/uploads');
const { multerErrorHandler } = require('../middleware/uploadErrors');

router.get('/example', exampleController.exampleMethod);
router.get('/search', searchVideos);
router.get('/library', listLibrary);
router.get('/audio', listRecordings);
router.get('/audio/file/:filename', streamAudio);
router.get('/stream/:id', streamMedia);
router.get('/documents/:filename', downloadDocument);
router.get('/images/:filename', serveImage);

router.post(
    '/upload',
    mediaUpload.array('files', 20),
    multerErrorHandler('Only audio and video media files are allowed'),
    uploadMedia
);

router.post(
    '/upload/audio',
    audioUpload.array('audio', 30),
    multerErrorHandler('Only supported audio files are allowed'),
    uploadAudio
);

router.post(
    '/upload/document',
    documentUpload.array('documents', 30),
    multerErrorHandler('Only supported document files are allowed'),
    uploadDocuments
);

router.post(
    '/upload/images',
    imageUpload.array('images', 30),
    multerErrorHandler('Only supported image files are allowed'),
    uploadImages
);

module.exports = router;