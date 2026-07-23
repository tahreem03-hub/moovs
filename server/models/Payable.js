// models/Payable.js
const mongoose = require('mongoose');

const payableSchema = new mongoose.Schema({
  payableNumber: { type: String, unique: true, index: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Related
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driverName: { type: String },
  
  // Payable Details
  type: { type: String, enum: ['driver_payment', 'vendor_payment', 'affiliate_commission'], required: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Status
  status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending' },
  dueDate: { type: Date },
  paidAt: { type: Date },
  paymentMethod: { type: String },
  
  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

payableSchema.pre('save', async function(next) {
  if (!this.payableNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.payableNumber = `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payable', payableSchema);