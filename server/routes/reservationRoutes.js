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
} = require('../controllers/reservationController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

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
router.post('/:id/status', updateReservationStatus);

// Driver assignment
router.post('/:id/assign-driver', assignDriver);

// Farm out
router.post('/:id/farm-out', farmOutReservation);

// Delete
router.delete('/delete/:id', deleteReservation);

module.exports = router;