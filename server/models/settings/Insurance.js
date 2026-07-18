const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: [true, 'Insurance provider is required'],
    trim: true
  },
  policyNumber: {
    type: String,
    required: [true, 'Policy number is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['liability', 'comprehensive', 'collision', 'personal_injury', 'commercial'],
    required: true
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deductible: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  documents: [{
    url: { type: String },
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Insurance', insuranceSchema);