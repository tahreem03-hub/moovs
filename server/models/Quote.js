const mongoose = require('mongoose');
const { Schema } = mongoose;
const commentSchema = require('./schemas/comment.schema')
const addressSchema = require('./schemas/address.schema')

/* ---------- Sub-schemas ---------- */

// A single stop (pick-up, drop-off, or intermediate stop)
const stopSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pickup', 'stop', 'dropoff'],
      required: true,
    },
    // Toggle in UI: address pin vs airport
    locationType: {
      type: String,
      enum: ['address', 'airport'],
      default: 'address',
    },

    // required true is missing in schema
    address: addressSchema,  

    // Airport-specific fields (only when locationType === 'airport')
    airport: {
      code: String,        // e.g. "JFK"
      name: String,
      airline: String,
      flightNumber: String,
      terminal: String,
    },
    order: { type: Number, default: 0 }, // drag-and-drop ordering
    notes: String,
  },
  { _id: true }
);

// A pricing line item ("Add Pricing" lets you add multiple)
const pricingItemSchema = new Schema(
  {
    label: { type: String, default: 'Base Rate', trim: true },
    // Toggle in UI: flat (per trip / location-based) vs hourly
    rateType: {
      type: String,
      enum: ['flat', 'hourly'],
      default: 'flat',
    },
    amount: { type: Number, required: true, min: 0 }, // "Enter Amount"
    hours: { type: Number, min: 0 },                  // used when rateType === 'hourly'
    // Whether BRA (Base Rate Automation) calculated this
    isAutoCalculated: { type: Boolean, default: false },
    taxable: { type: Boolean, default: false },
  },
  { _id: true }
);


/* ---------- Main Quote schema ---------- */

const quoteSchema = new Schema(
  {
    // Human-friendly quote number, e.g. Q-2026-00042
    quoteNumber: { type: String, unique: true, index: true },

    /* ORDER DETAILS */
    bookingContact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      // check if it is really required???
    },
    orderType: {
      type: String,
      required: true,
      // adjust actual order types
      enum: ['retail', 'corporate', 'affiliate', 'charter'],
    },
    assignedMember: {
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
      // check if it is really required???
    },

    /* TRIP TYPE */
    tripType: {
      type: String,
      enum: ['hourly', 'one_way', 'round_trip'],
      default: 'hourly',
      required: true,
    },

    /* TRIP DETAILS */
    passenger: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      default: null, //No passenger
    },

    /* DATE & TIME */
    pickupDateTime: { type: Date, required: true },
    dropoffDateTime: {
      type: Date,
      // required for hourly/round trip; optional for one-way
      required: function () {
        return this.tripType !== 'one_way';
      },
    },

    /* STOPS: pickup, dropoff — one array, ordered */
    stops: {
      type: [stopSchema],
      validate: {
        validator(v) {
          const hasPickup = v.some((s) => s.type === 'pickup');
          const hasDropoff = v.some((s) => s.type === 'dropoff');
          return hasPickup && hasDropoff;
        },
        message: 'A quote must have at least a pick-up and a drop-off stop.',
      },
    },

    /* ADDITIONAL INFO */
    passengerCount: { type: Number, min: 0, default: null },
    driverNote: { type: String, trim: true },
    tripNotes: { type: String, trim: true },

    /* VEHICLE(S) */
    /*
    vehicles: [
      {
        vehicleType: { type: Schema.Types.ObjectId, ref: 'VehicleType' },
        vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, // specific unit, optional at quote stage
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    */

    vehicle:{
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },

    /* PRICING */
    pricing: {
      items: [pricingItemSchema],
      subtotal: { type: Number, default: 0, min: 0 },
      taxRate: { type: Number, default: 0, min: 0 },   // percent
      taxAmount: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      gratuity: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },     // "Total $0.00"
      currency: { type: String, default: 'USD' },
    },

    /* INTERNAL COMMENTS */
    internalComments: [commentSchema],

    /* STATUS / WORKFLOW (Save quote dropdown: save, save & send, etc.) */
    status: {
      type: String,
      enum: ['new', 'sent', 'draft', 'archived', 'all'],
      default: 'draft',
      index: true,
    },

    /*
    sentAt: Date,
    expiresAt: Date,
    convertedToReservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
    */

    /* Audit */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false }, // soft delete
  },
  { timestamps: true } // adds createdAt / updatedAt
);

/* ---------- Hooks & helpers ---------- */

// Auto-generate quote number
quoteSchema.pre('save', async function (next) {
  if (this.isNew && !this.quoteNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.quoteNumber = `Q-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Recalculate totals whenever pricing items change
quoteSchema.pre('save', function (next) {
  if (this.isModified('pricing')) {
    const subtotal = (this.pricing.items || []).reduce((sum, item) => {
      const line =
        item.rateType === 'hourly'
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
  next();
});

/* Useful indexes */
quoteSchema.index({ bookingContact: 1, createdAt: -1 });
quoteSchema.index({ assignedMember: 1, status: 1 });
quoteSchema.index({ pickupDateTime: 1 });

module.exports = mongoose.model('Quote', quoteSchema);