// modules/driver/index.js
const express = require('express');
const router = express.Router();

const driverRoutes = require('./routes/driverRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount both routes on the same router
router.use(driverRoutes);
router.use(documentRoutes);
router.use(notificationRoutes);

module.exports = router;