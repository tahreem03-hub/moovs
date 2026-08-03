// modules/driver/routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDriverProfile,
  getDriverTrips,
  getDriverTripById,
  startTrip,
  completeTrip,
  updateAvailability,
  updateLocation,
  getEarnings,
  getDriverStats,
  changePassword
} = require('../controllers/driverController');
const { isAuthenticated, authorizeDriver } = require('../../../middleware/auth');


// ============ PROTECTED ROUTES (Driver only) ============
router.use(isAuthenticated);
router.use(authorizeDriver);

// Profile
router.get('/profile', getDriverProfile);

// Account
router.patch('/change-password', changePassword);

// Trips
router.get('/trips', getDriverTrips);
router.get('/trips/:id', getDriverTripById);
router.patch('/trips/:id/start', startTrip);
router.patch('/trips/:id/complete', completeTrip);

// Availability
router.patch('/availability', updateAvailability);

// Location
router.post('/location', updateLocation);

// Earnings & Stats
router.get('/earnings', getEarnings);
router.get('/stats', getDriverStats);

module.exports = router;