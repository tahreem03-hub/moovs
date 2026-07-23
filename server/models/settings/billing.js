// models/Billing.js
const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  },
  currentPlan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'trial', 'expired', 'cancelled'],
    default: 'trial'
  },
  subscriptionExpiry: { type: Date },
  
  // Payment Requests (for manual payments)
  paymentRequests: [{
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    planName: { type: String },
    amount: { type: Number },
    screenshot: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    notes: { type: String },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Payment History
  paymentHistory: [{
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    method: { type: String, default: 'manual' },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    description: { type: String },
    screenshot: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);