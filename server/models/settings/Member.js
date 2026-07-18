const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'dispatcher', 'manager', 'viewer'],
    default: 'dispatcher'
  },
  permissions: [{
    type: String,
    enum: ['view_reservations', 'create_reservations', 'edit_reservations', 
           'delete_reservations', 'manage_drivers', 'manage_vehicles', 
           'manage_settings', 'manage_members', 'view_reports']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Member', memberSchema);