const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamingAPI';

function connectDatabase() {
    return mongoose.connect(mongoUri);
}

module.exports = {
    db: mongoose.connection,
    connectDatabase,
    mongoUri
};
