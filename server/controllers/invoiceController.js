// controllers/invoiceController.js
const Invoice = require('../models/Invoice');
const Reservation = require('../models/Reservation');

// Create invoice from reservation
const createInvoice = async (req, res) => {
  try {
    const { reservationId, items, dueDate, notes } = req.body;

    const reservation = await Reservation.findOne({
      _id: reservationId,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = subtotal * (reservation.pricing?.taxRate || 0) / 100;
    const total = subtotal + taxAmount - (reservation.pricing?.discount || 0);

    const invoice = await Invoice.create({
      operatorId: req.user._id,
      reservationId: reservation._id,
      reservationNumber: reservation.reservationNumber,
      customerId: reservation.bookingContact,
      customerName: `${reservation.bookingContact?.firstName || ''} ${reservation.bookingContact?.lastName || ''}`.trim(),
      customerEmail: reservation.bookingContact?.email,
      customerPhone: reservation.bookingContact?.phone?.number || reservation.bookingContact?.phone,
      items,
      subtotal,
      taxRate: reservation.pricing?.taxRate || 0,
      taxAmount,
      discount: reservation.pricing?.discount || 0,
      total,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes,
      createdBy: req.user._id
    });

    return res.status(201).json({ success: true, message: 'Invoice created', data: invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
};

// Get invoices
const getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = { operatorId: req.user._id, isDeleted: false };
    if (status) query.status = status;
    if (search) query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } }
    ];

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Invoice.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: { total, page, limit } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findOne({ _id: id, operatorId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.status = status;
    if (status === 'paid') invoice.paidAt = new Date();
    await invoice.save();

    return res.status(200).json({ success: true, message: `Invoice ${status}`, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await Invoice.findOneAndUpdate(
      { _id: id, operatorId: req.user._id },
      { isDeleted: true }
    );
    return res.status(200).json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
};
// controllers/invoiceController.js - Add this function

// ============ GENERATE INVOICE FROM RESERVATION ============
const generateInvoiceFromReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    // Find the reservation
    const reservation = await Reservation.findOne({
      _id: reservationId,
      operatorId: req.user._id,
      isDeleted: false
    }).populate('bookingContact', 'firstName lastName email phone');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Check if reservation is closed
    if (!reservation.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'Reservation must be closed before generating invoice'
      });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({
      reservationId: reservation._id,
      isDeleted: false
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this reservation',
        data: existingInvoice
      });
    }

    // Build invoice items from reservation pricing
    const items = reservation.pricing?.items?.map(item => ({
      description: item.name || item.label || 'Service',
      quantity: 1,
      rate: item.amount || 0,
      amount: item.amount || 0
    })) || [];

    // Add base rate if not in items
    if (items.length === 0) {
      items.push({
        description: 'Transportation Service',
        quantity: 1,
        rate: reservation.pricing?.total || 0,
        amount: reservation.pricing?.total || 0
      });
    }

    const subtotal = reservation.pricing?.subtotal || reservation.pricing?.total || 0;
    const taxRate = reservation.pricing?.taxRate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = reservation.pricing?.discount || 0;
    const total = subtotal + taxAmount - discount;

    // Create invoice
    const invoice = await Invoice.create({
      operatorId: req.user._id,
      reservationId: reservation._id,
      reservationNumber: reservation.reservationNumber,
      customerId: reservation.bookingContact?._id,
      customerName: reservation.bookingContact?.firstName && reservation.bookingContact?.lastName
        ? `${reservation.bookingContact.firstName} ${reservation.bookingContact.lastName}`
        : 'Unknown Customer',
      customerEmail: reservation.bookingContact?.email,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: `Invoice for reservation ${reservation.reservationNumber}`,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice'
    });
  }
};

// ============ SEND INVOICE TO CUSTOMER ============
const sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (!invoice.customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Customer email not available'
      });
    }

    // Update invoice status
    invoice.status = 'sent';
    await invoice.save();

    // In production, send email with nodemailer or email service
    // await sendInvoiceEmail(invoice);

    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`,
      data: invoice
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send invoice'
    });
  }
};

// ============ MARK INVOICE AS PAID ============
const markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} marked as paid`,
      data: invoice
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid'
    });
  }
};

// ============ GET INVOICE PDF (HTML for now) ============
const getInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate HTML invoice view
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .invoice-title { font-size: 28px; font-weight: bold; color: #2563eb; }
          .invoice-number { color: #666; }
          .details { margin: 20px 0; display: flex; justify-content: space-between; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #f3f4f6; padding: 10px; text-align: left; }
          .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .total { text-align: right; font-size: 20px; font-weight: bold; color: #2563eb; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="invoice-title">INVOICE</h1>
          <p class="invoice-number">${invoice.invoiceNumber}</p>
        </div>
        <div class="details">
          <div>
            <strong>Bill To:</strong><br>
            ${invoice.customerName}<br>
            ${invoice.customerEmail}
          </div>
          <div>
            <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Rate</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align:right">$${item.rate.toFixed(2)}</td>
                <td style="text-align:right">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          Total: $${invoice.total.toFixed(2)}
        </div>
        <div class="footer">
          Thank you for your business!
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('Get invoice PDF error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
};

// controllers/invoiceController.js

// ============ GET INVOICE BY ID ============
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
};

// Add to module.exports
module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,  
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoiceFromReservation,
  sendInvoice,
  markInvoicePaid,
  getInvoicePdf
};
