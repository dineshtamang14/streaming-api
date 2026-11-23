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

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'index.html'));
});

app.get('/watch/:filename', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'watch.html'));
});

app.use('/', routes);
app.use('/frontend', express.static(frontendDirectory));
app.use(express.static(uploadsDirectory));

if (require.main === module) {
    connectDatabase().catch((error) => {
        console.error('MongoDB connection failed:', error);
    });

    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use.`);
            process.exitCode = 1;
            return;
        }
        console.error('Server startup failed:', error);
        process.exitCode = 1;
    });
}

module.exports = app;
