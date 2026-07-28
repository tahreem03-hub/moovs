// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  collectPayment,
  generatePaymentLink,
  validatePaymentLink,
  processPaymentLink,
  getPaymentHistory,
  closeReservation,
  //requestPaymentApproval,      //  added
  //getPendingPaymentRequests,   //  added
  //approvePaymentRequest,       //  added
  //rejectPaymentRequest,        //  added
  //getMyPaymentRequests         //  added
} = require('../controllers/paymentController');
const { isAuthenticated, authorizeOperator, authorizeAdmin } = require('../middleware/auth');
const upload = require('../middleware/multer');

// ============ PUBLIC ROUTES (no auth) ============
router.get('/validate/:token', validatePaymentLink);
router.post('/pay/:token', processPaymentLink);

// ============ OPERATOR ROUTES ============
router.use(isAuthenticated);
router.use(authorizeOperator);

// Payment collection
router.post('/:id/collect', collectPayment);
router.post('/:id/payment-link', generatePaymentLink);
router.get('/:id/payments', getPaymentHistory);
router.post('/:id/close', closeReservation);

// Payment approval requests (Operator)
//router.post('/request-approval', upload.single('screenshot'), requestPaymentApproval);
//router.get('/my-requests', getMyPaymentRequests);

// ============ ADMIN ROUTES ============
router.use(isAuthenticated);
router.use(authorizeAdmin);

//router.get('/pending-requests', getPendingPaymentRequests);
//router.patch('/approve/:requestId', approvePaymentRequest);
//router.patch('/reject/:requestId', rejectPaymentRequest);

module.exports = router;