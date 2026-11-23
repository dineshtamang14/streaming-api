const path = require('path');

const rootDirectory = path.join(__dirname, '..');
const uploadsDirectory = path.join(rootDirectory, 'uploads');
const documentsDirectory = path.join(uploadsDirectory, 'documents');
const imagesDirectory = path.join(uploadsDirectory, 'images');
const frontendDirectory = path.join(rootDirectory, 'frontend');

module.exports = {
    rootDirectory,
    uploadsDirectory,
    documentsDirectory,
    imagesDirectory,
    frontendDirectory
};
