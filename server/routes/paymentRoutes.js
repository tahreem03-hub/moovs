// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  collectPayment,
  generatePaymentLink,
  validatePaymentLink,
  processPaymentLink,
  getPaymentHistory,
  closeReservation
} = require('../controller/paymentController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/validate/:token', validatePaymentLink);
router.post('/pay/:token', processPaymentLink);

// Protected routes
router.use(isAuthenticated);
router.post('/:id/collect', collectPayment);
router.post('/:id/payment-link', generatePaymentLink);
router.get('/:id/payments', getPaymentHistory);
router.post('/:id/close', closeReservation);

module.exports = router;