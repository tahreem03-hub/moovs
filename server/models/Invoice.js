// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, index: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Related Reservation
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  reservationNumber: { type: String },
  
  // Customer
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  
  // Invoice Details
  items: [{
    description: { type: String },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  
  // Payment
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: { type: Date },
  paidAt: { type: Date },
  paymentMethod: { type: String },
  
  // Notes
  notes: { type: String, trim: true },
  internalNotes: { type: String, trim: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  //next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);