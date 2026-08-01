// modules/driver/models/DriverPayoutMethod.js
const mongoose = require('mongoose');

const driverPayoutMethodSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true
  },
  stripeAccountId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['not_setup', 'pending', 'verified', 'error'],
    default: 'not_setup'
  },
  displayInfo: {
    type: String, // e.g., "Visa 4242" or "Bank 6789"
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: true
  },
  lastSetupAttempt: Date,
  errorMessage: String
}, {
  timestamps: true
});

module.exports = mongoose.model('DriverPayoutMethod', driverPayoutMethodSchema);

// for stage B prep