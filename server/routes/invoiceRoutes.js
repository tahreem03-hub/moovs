// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus, deleteInvoice } = require('../controller/invoiceController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

module.exports = router;