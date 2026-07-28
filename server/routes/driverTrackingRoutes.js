// routes/driverTrackingRoutes.js
const express = require('express');
const router = express.Router();
const { getDrivers, getDriverDetails, updateAvailability } = require('../controllers/driverTrackingController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.get('/drivers', getDrivers);
router.get('/drivers/:id', getDriverDetails);
router.put('/drivers/:id/availability', updateAvailability);  

module.exports = router;