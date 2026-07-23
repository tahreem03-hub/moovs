// routes/crmRoutes.js
const express = require('express');
const router = express.Router();
const { getCustomerInsights, getCustomerDetails, addCustomerNote } = require('../controller/crmController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/insights', getCustomerInsights);
router.get('/customer/:id', getCustomerDetails);
router.post('/customer/:id/note', addCustomerNote);

module.exports = router;