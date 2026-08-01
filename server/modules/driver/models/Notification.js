// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType',
    required: true,
    index: true
  },
  recipientType: {
    type: String,
    enum: ['User', 'Driver', 'Contact'],
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['driver', 'customer', 'admin', 'operator'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_trip',
      'trip_update',
      'trip_cancelled',
      'message',
      'payment_received',
      'document_expiring',
      'document_approved',
      'document_rejected',
      'rating_received',
      'system_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);