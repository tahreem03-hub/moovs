const mongoose = require('mongoose');

const refundConditionSchema = new mongoose.Schema({
  refundPercentage: {
    type: Number,
    enum: [100, 50, 25],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  timeUnit: {
    type: String,
    enum: ['hours', 'days', 'weeks'],
    required: true
  }
}, { _id: false });

const cancellationPolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Policy name is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'flexible'
  },
  description: {
    type: String,
    trim: true
  },
  refundConditions: [refundConditionSchema],
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'luxury', 'minibus', 'bus', 'all'],
    default: 'all'
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

module.exports = mongoose.model('CancellationPolicy', cancellationPolicySchema);