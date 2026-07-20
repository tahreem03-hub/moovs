// models/settings/TripRule.js
const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  coordinates: [{
    lat: Number,
    lng: Number
  }]
}, { _id: false });

const tripRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true
  },
  
  // Rule Type
  ruleType: {
    type: String,
    enum: ['anytime', 'specific_date', 'date_range', 'time_of_day'],
    required: true
  },
  
  // When rule applies
  anytime: {
    type: Boolean,
    default: false
  },
  specificDate: {
    type: Date
  },
  dateRange: {
    start: { type: Date },
    end: { type: Date },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  timeOfDay: {
    start: { type: String }, // HH:MM format
    end: { type: String },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  
  // Pricing adjustment
  pricingAction: {
    type: String,
    enum: ['increase', 'decrease', 'skip'],
    default: 'increase'
  },
  adjustmentType: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'flat'
  },
  adjustmentAmount: {
    type: Number,
    default: 0
  },
  
  // Vehicle selection
  applyToAllVehicles: {
    type: Boolean,
    default: false
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  
  // Location
  applyToAllLocations: {
    type: Boolean,
    default: true
  },
  zones: [zoneSchema],
  zoneMatchType: {
    type: String,
    enum: ['pickup', 'dropoff', 'both', 'either'],
    default: 'pickup'
  },
  
  // Notes & Restrictions
  driverNote: {
    type: String,
    trim: true
  },
  tripNote: {
    type: String,
    trim: true
  },
  restrictVehicles: {
    type: Boolean,
    default: false
  },
  
  // Repeat
  repeat: {
    type: Boolean,
    default: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Meta
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
tripRuleSchema.index({ isActive: 1 });
tripRuleSchema.index({ ruleType: 1 });

module.exports = mongoose.model('TripRule', tripRuleSchema);