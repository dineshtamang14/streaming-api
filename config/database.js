const mongoose = require('mongoose');
const dns = require('dns');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamingAPI';

// Atlas uses SRV DNS records. Public resolvers avoid hosts with broken local DNS.
if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}

function connectDatabase() {
    return mongoose.connect(mongoUri);
}

module.exports = {
    db: mongoose.connection,
    connectDatabase,
    mongoUri
};
