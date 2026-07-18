const mongoose = require('mongoose');

const termsAndConditionsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  sections: [{
    heading: { type: String, trim: true },
    body: { type: String }
  }],
  waitingCharges: {
    enabled: { type: Boolean, default: false },
    rate: { type: Number, default: 0 },
    gracePeriod: { type: Number, default: 15 } // minutes
  },
  extraStops: {
    enabled: { type: Boolean, default: false },
    charge: { type: Number, default: 0 }
  },
  carSeats: {
    enabled: { type: Boolean, default: false },
    charge: { type: Number, default: 0 }
  },
  alcoholPolicy: {
    allowed: { type: Boolean, default: true },
    notes: { type: String, trim: true }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TermsAndConditions', termsAndConditionsSchema);