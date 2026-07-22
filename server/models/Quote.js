const mongoose = require('mongoose');
const { Schema } = mongoose;
const commentSchema = require('./schemas/comment.schema');
const addressSchema = require('./schemas/address.schema');

/* ---------- Sub-schemas ---------- */

const stopSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pickup', 'stop', 'dropoff'],
      required: true,
    },
    locationType: {
      type: String,
      enum: ['address', 'airport'],
      default: 'address',
    },
    address: {
      type: addressSchema,
      required: function () {
        return this.locationType === "address";
      }
    },
    airport: {
      code: {
        type: String,
        required: function () {
          return this.locationType === "airport";
        },
      },
      name: {
        type: String,
        required: function () {
          return this.locationType === "airport";
        },
      },
      airline: String,
      flightNumber: String,
      terminal: String,
    },
    duration: { type: Number, default: 0 }, // ✅ Added
    arriveBy: { type: Boolean, default: false }, // ✅ Added
    order: { type: Number, default: 0 },
    notes: String,
  },
  { _id: true }
);

const pricingItemSchema = new Schema(
  {
    label: { type: String, default: 'Base Rate', trim: true },
    rateType: {
      type: String,
      enum: ['flat', 'hourly'],
      default: 'flat',
    },
    amount: { type: Number, required: true, min: 0 },
    hours: { type: Number, min: 0 },
    isAutoCalculated: { type: Boolean, default: false },
    taxable: { type: Boolean, default: false },
    description: { type: String, trim: true }, // ✅ Added
  },
  { _id: true }
);

/* ---------- Main Quote schema ---------- */

const quoteSchema = new Schema(
  {
    // ============ TENANT ISOLATION ============
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // ============ QUOTE NUMBER ============
    quoteNumber: { type: String, unique: true, index: true },

    // ============ ORDER DETAILS ============
    bookingContact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,  // ✅ Not required at schema level
    },
    orderType: {
      type: String,
      required: true,
    },
    assignedMember: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,  // ✅ Not required at schema level
    },

    // ============ TRIP TYPE ============
    tripType: {
      type: String,
      enum: ['hourly', 'one_way', 'round_trip'],
      default: 'hourly',
      required: true,
    },

    // ============ TRIP DETAILS ============
    passenger: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },

    // ============ DATE & TIME ============
    pickupDateTime: { type: Date, required: true },
    dropoffDateTime: {
      type: Date,
      required: function () {
        return this.tripType !== 'one_way';
      },
    },

    // ============ STOPS ============
    stops: {
      type: [stopSchema],
      validate: {
        validator(v) {
          const hasPickup = v.some((s) => s.type === 'pickup');
          const hasDropoff = v.some((s) => s.type === 'dropoff');
          return hasPickup && hasDropoff;
        },
        required: true,
        message: 'A quote must have at least a pick-up and a drop-off stop.',
      },
    },

    // ============ ADDITIONAL INFO ============
    passengerCount: { type: Number, min: 0, default: null },
    driverNote: { type: String, trim: true },
    tripNotes: { type: String, trim: true },

    // ============ VEHICLE ============
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },

    // ============ PRICING ============
    pricing: {
      items: [pricingItemSchema],
      subtotal: { type: Number, default: 0, min: 0 },
      taxRate: { type: Number, default: 0, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      gratuity: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD' },
    },

    // ============ INTERNAL COMMENTS ============
    internalComments: [commentSchema],

    // ============ STATUS ============
    status: {
      type: String,
      enum: ['new', 'sent', 'draft', 'archived'],
      default: 'draft',
      index: true,
    },

    // ============ ACTIVE / SOFT DELETE ============
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // ============ AUDIT ============
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  { timestamps: true }
);

/* ---------- Hooks & helpers ---------- */

quoteSchema.pre("save", function (next) {
  // Set operatorId if not set
  if (this.isNew && !this.operatorId && this.createdBy) {
    this.operatorId = this.createdBy;
  }

  if (this.isNew && !this.quoteNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.quoteNumber = `Q-${year}-${random}`;
  }

  //next();
});

// Recalculate totals
quoteSchema.pre('save', function (next) {
  if (this.isModified('pricing')) {
    const subtotal = (this.pricing.items || []).reduce((sum, item) => {
      const line = item.rateType === 'hourly'
        ? item.amount * (item.hours || 0)
        : item.amount;
      return sum + line;
    }, 0);

    this.pricing.subtotal = subtotal;
    this.pricing.taxAmount = +(subtotal * (this.pricing.taxRate / 100)).toFixed(2);
    this.pricing.total = +(
      subtotal +
      this.pricing.taxAmount +
      (this.pricing.gratuity || 0) -
      (this.pricing.discount || 0)
    ).toFixed(2);
  }
  //next();
});

/* ---------- Indexes ---------- */
quoteSchema.index({ bookingContact: 1, createdAt: -1 });
quoteSchema.index({ assignedMember: 1, status: 1 });
quoteSchema.index({ pickupDateTime: 1 });
quoteSchema.index({ operatorId: 1, isDeleted: 1 });
quoteSchema.index({ operatorId: 1, status: 1 });

module.exports = mongoose.model('Quote', quoteSchema);