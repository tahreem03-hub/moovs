// modules/driver/models/DriverDocument.js
const mongoose = require('mongoose');

const driverDocumentSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['license', 'insurance', 'background_check'],
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String, // Store Cloudinary public ID for easy deletion
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'expired', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
driverDocumentSchema.index({ driver: 1, type: 1 });
driverDocumentSchema.index({ status: 1 });
driverDocumentSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('DriverDocument', driverDocumentSchema);