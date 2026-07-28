// routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const {
  getMyBilling,
  requestUpgrade,
  getAvailablePlans
} = require('../../controllers/settings/billingController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');
const upload = require('../../middleware/multer');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

// Get billing details
router.get('/my-billing', getMyBilling);

// Get available plans
router.get('/plans', getAvailablePlans);

// Request upgrade with screenshot
router.post('/upgrade', upload.single('screenshot'), requestUpgrade);

module.exports = router;