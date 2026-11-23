/**
 * Application composition root:
 * shared middleware, frontend/static assets, database lifecycle, route mounting,
 * and HTTP server startup.
 */
require('dotenv').config();

const express = require('express');
const path = require('path');
const { db, connectDatabase } = require('./config/database');
const { frontendDirectory, uploadsDirectory } = require('./config/paths');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.json());
app.use(express.static(uploadsDirectory));
app.use('/frontend', express.static(frontendDirectory));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'index.html'));
});

app.use('/', routes);

if (require.main === module) {
    connectDatabase().catch((error) => {
        console.error('MongoDB connection failed:', error);
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
