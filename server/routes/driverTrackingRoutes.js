// routes/driverTrackingRoutes.js
const express = require('express');
const router = express.Router();
const { getDrivers, getDriverDetails, updateAvailability } = require('../controller/driverTrackingController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/drivers', getDrivers);
router.get('/drivers/:id', getDriverDetails);
router.patch('/drivers/:id/availability', updateAvailability);

module.exports = router;