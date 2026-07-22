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
} = require('../controller/quoteController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Stats & Pricing
router.get('/stats', getQuoteStats);
router.post('/calculate-pricing', calculatePricing);

// Quote Management
router.post('/create', createQuote);
router.get('/list', getQuotes);
router.get('/:id', getQuoteById);
router.put('/update/:id', updateQuote);
router.put('/:id/status', updateQuoteStatus);
router.delete('/delete/:id', deleteQuote);

// Internal Comments
router.post('/:id/comments', addInternalComment);

module.exports = router;