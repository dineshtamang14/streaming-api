const express = require('express');
const router = express.Router();

const apiRouter = require('./api');

router.use('/', apiRouter);
module.exports = router;