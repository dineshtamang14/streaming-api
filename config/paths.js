const path = require('path');

const rootDirectory = path.join(__dirname, '..');
const uploadsDirectory = path.join(rootDirectory, 'uploads');
const documentsDirectory = path.join(uploadsDirectory, 'documents');
const imagesDirectory = path.join(uploadsDirectory, 'images');
const audioDirectory = path.join(uploadsDirectory, 'audio');
const videoDirectory = path.join(uploadsDirectory, 'video');
const recordingsDirectory = path.join(audioDirectory, 'recordings');
const frontendDirectory = path.join(rootDirectory, 'frontend');

module.exports = {
    rootDirectory,
    uploadsDirectory,
    documentsDirectory,
    imagesDirectory,
    audioDirectory,
    videoDirectory,
    recordingsDirectory,
    frontendDirectory
};
