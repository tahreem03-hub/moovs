// routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats,
  addInternalComment,
  calculatePricing
} = require('../controllers/quoteController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

// Stats & Pricing
router.get('/stats', getQuoteStats);
router.post('/calculate-pricing', calculatePricing);

// Quote Management
router.post('/create', createQuote);
router.get('/list', getQuotes);
router.get('/:id', getQuoteById);
router.put('/update/:id', updateQuote);
router.patch('/:id/status', updateQuoteStatus);  // ✅ Changed PUT to PATCH
router.delete('/delete/:id', deleteQuote);

// Internal Comments
router.post('/:id/comments', addInternalComment);

module.exports = router;