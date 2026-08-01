// modules/payments/models/Payout.js
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  payeeType: {
    type: String,
    enum: ['driver', 'vendor', 'other'],
    required: true
  },
  payeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'payeeType'
  },
  tripIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  }],
  amountCents: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['manual', 'stripe', 'bank_transfer', 'check'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  note: String,
  reference: String,
  stripeTransferId: String, // For Stage B
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for querying by payee
payoutSchema.index({ payeeId: 1, payeeType: 1 });

module.exports = mongoose.model('Payout', payoutSchema);


// for stage A