// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,        
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoiceFromReservation,
  sendInvoice,
  markInvoicePaid,
  getInvoicePdf
} = require('../controller/invoiceController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Generate from reservation
router.post('/generate/:reservationId', generateInvoiceFromReservation);

// Regular CRUD
router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.get('/:id', getInvoiceById);       
router.put('/:id/status', updateInvoiceStatus);  
router.delete('/:id', deleteInvoice);

// Send & PDF
router.post('/:id/send', sendInvoice);
router.put('/:id/mark-paid', markInvoicePaid); 
router.get('/:id/pdf', getInvoicePdf);

module.exports = router;