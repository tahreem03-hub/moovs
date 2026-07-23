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

module.exports = { createInvoice, getInvoices, updateInvoiceStatus, deleteInvoice };