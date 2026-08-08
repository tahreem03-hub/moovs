// routes/invoiceRoutes.js (operator)
const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoiceFromReservation,
    regenerateInvoice, 
    sendInvoice,
    markInvoicePaid,
    getInvoicePdf
} = require('../controllers/invoiceController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

// Generate from reservation
router.post('/generate/:reservationId', generateInvoiceFromReservation);

//: Regenerate invoice
router.post('/:id/regenerate', regenerateInvoice);

// Regular CRUD
router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

// Send & PDF
router.post('/:id/send', sendInvoice);
router.patch('/:id/mark-paid', markInvoicePaid);
router.get('/:id/pdf', getInvoicePdf);

module.exports = router;