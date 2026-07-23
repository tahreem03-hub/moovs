// models/Reservation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const commentSchema = require('./schemas/comment.schema');
const addressSchema = require('./schemas/address.schema');

// Sub-schemas (same as Quote)
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
    duration: { type: Number, default: 0 },
    arriveBy: { type: Boolean, default: false },
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
    description: { type: String, trim: true },
  },
  { _id: true }
);

// ============ MAIN RESERVATION SCHEMA ============
const reservationSchema = new Schema(
  {
    // ============ TENANT ISOLATION ============
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // ============ RESERVATION NUMBER ============
    reservationNumber: {
      type: String,
      unique: true,
      index: true
    },

    // ============ ORDER DETAILS (SAME AS QUOTE) ============
    bookingContact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    orderType: {
      type: String,
      required: true,
    },
    assignedMember: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ============ TRIP TYPE (SAME AS QUOTE) ============
    tripType: {
      type: String,
      enum: ['hourly', 'one_way', 'round_trip'],
      default: 'hourly',
      required: true,
    },

    // ============ TRIP DETAILS (SAME AS QUOTE) ============
    passenger: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },

    // ============ DATE & TIME (SAME AS QUOTE) ============
    pickupDateTime: { type: Date, required: true },
    dropoffDateTime: {
      type: Date,
      required: function () {
        return this.tripType !== 'one_way';
      },
    },

    // ============ STOPS (SAME AS QUOTE) ============
    stops: {
      type: [stopSchema],
      validate: {
        validator(v) {
          const hasPickup = v.some((s) => s.type === 'pickup');
          const hasDropoff = v.some((s) => s.type === 'dropoff');
          return hasPickup && hasDropoff;
        },
        required: true,
        message: 'A reservation must have at least a pick-up and a drop-off stop.',
      },
    },

    // ============ ADDITIONAL INFO (SAME AS QUOTE) ============
    passengerCount: { type: Number, min: 0, default: null },
    driverNote: { type: String, trim: true },
    tripNotes: { type: String, trim: true },

    // ============ VEHICLE (SAME AS QUOTE) ============
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },

    // ============ PRICING (SAME AS QUOTE) ============
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

    // ============ INTERNAL COMMENTS (SAME AS QUOTE) ============
    internalComments: [commentSchema],

    // ============ RESERVATION SPECIFIC FIELDS ============
    // Driver Assignment
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null
    },

    // Status (Reservation specific statuses)
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'dispatched', 'started', 'completed', 'cancelled', 'billed'],
      default: 'pending',
      index: true,
    },

    // Farm Out
    isFarmedOut: { type: Boolean, default: false },
    farmedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    farmedOutAt: { type: Date },

    // Timestamps
    confirmedAt: { type: Date },
    dispatchedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },

    // Reference to Quote (if converted from quote)
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: 'Quote',
      default: null
    },

    // ============ ACTIVE / SOFT DELETE (SAME AS QUOTE) ============
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

    // ============ AUDIT (SAME AS QUOTE) ============
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

/* ---------- Hooks ---------- */

// Auto-generate reservation number
reservationSchema.pre("save", function (next) {
  if (this.isNew && !this.reservationNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.reservationNumber = `R-${year}-${random}`;
  }

  // Set operatorId if not set
  if (this.isNew && !this.operatorId && this.createdBy) {
    this.operatorId = this.createdBy;
  }

  //next();
});

// Recalculate totals
reservationSchema.pre('save', function (next) {
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
reservationSchema.index({ bookingContact: 1, createdAt: -1 });
reservationSchema.index({ assignedMember: 1, status: 1 });
reservationSchema.index({ pickupDateTime: 1 });
reservationSchema.index({ operatorId: 1, isDeleted: 1 });
reservationSchema.index({ operatorId: 1, status: 1 });
reservationSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);