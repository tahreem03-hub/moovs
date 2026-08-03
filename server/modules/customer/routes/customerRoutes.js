// modules/customer/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const {
  customerRegister,
  customerLogin,
  getCustomerProfile,
  requestQuote,
  getCustomerQuotes,
  createReservation,
  getCustomerReservations,
  cancelReservation,
  getAvailableVehicles,
  trackRide,
  makePayment,
  getCustomerInvoices
} = require('../controllers/customerController');
const { isAuthenticated, authorizeCustomer } = require('../../../middleware/auth');

// ============ PUBLIC ROUTES ============
router.post('/auth/register', customerRegister);
router.post('/auth/login', customerLogin);
router.get('/vehicles', getAvailableVehicles);
router.get('/track/:reservationNumber', trackRide);

// ============ PROTECTED ROUTES (Customer only) ============
router.use(isAuthenticated);
router.use(authorizeCustomer);

// Profile
router.get('/profile', getCustomerProfile);

// Quotes
router.post('/quotes', requestQuote);
router.get('/quotes', getCustomerQuotes);

// Reservations
router.post('/reservations', createReservation);
router.get('/reservations', getCustomerReservations);
router.patch('/reservations/:id/cancel', cancelReservation);

// Payments
router.post('/reservations/:id/pay', makePayment);

// Invoices
router.get('/invoices', getCustomerInvoices);

module.exports = router;