// routes/crmRoutes.js
const express = require('express');
const router = express.Router();
const { getCustomerInsights, getCustomerDetails, addCustomerNote } = require('../controllers/crmController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.get('/insights', getCustomerInsights);
router.get('/customer/:id', getCustomerDetails);
router.post('/customer/:id/note', addCustomerNote);

module.exports = router;