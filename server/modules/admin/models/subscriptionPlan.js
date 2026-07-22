// modules/admin/models/SubscriptionPlan.js
const mongoose = require('mongoose');

const planFeatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  limit: { type: Number, default: 0 }
}, { _id: false });

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  trialPeriod: {
    type: Number,
    default: 30,
    min: 0
  },
  features: {
    vehicles: {
      limit: { type: Number, default: 0 },
      label: { type: String, default: 'Vehicles' }
    },
    drivers: {
      limit: { type: Number, default: 0 },
      label: { type: String, default: 'Drivers' }
    },
    companies: {
      limit: { type: Number, default: 0 },
      label: { type: String, default: 'Companies' }
    },
    contacts: {
      limit: { type: Number, default: 0 },
      label: { type: String, default: 'Contacts' }
    },
    advancedFeatures: [planFeatureSchema],
    customFeatures: [planFeatureSchema]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

subscriptionPlanSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  //next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);