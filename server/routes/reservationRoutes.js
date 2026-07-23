// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  updateReservationStatus,
  assignDriver,
  farmOutReservation,
  getReservationStats,
  deleteReservation,
  convertQuoteToReservation
} = require('../controller/reservationController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Stats
router.get('/stats', getReservationStats);

// Create
router.post('/create', createReservation);

// Convert quote to reservation
router.post('/convert/:quoteId', convertQuoteToReservation);

// List
router.get('/list', getReservations);

// Single
router.get('/:id', getReservationById);

// Update
router.put('/update/:id', updateReservation);

// Status
router.put('/:id/status', updateReservationStatus);

// Driver assignment
router.put('/:id/assign-driver', assignDriver);

// Farm out
router.put('/:id/farm-out', farmOutReservation);

// Delete
router.delete('/delete/:id', deleteReservation);

module.exports = router;