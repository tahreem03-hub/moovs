const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = require('./schemas/comment.schema');

/*
 * ALIGNMENT CHANGE:
 * The form collects addresses as single-line text inputs (Home Address,
 * Work Address, Billing Address), so addresses are stored as plain trimmed
 * Strings instead of the structured addressSchema. If you later switch the UI
 * to a structured / autocomplete address picker, swap these back.
 */

/*
 * PCI COMPLIANCE — IMPORTANT:
 * Never store raw card numbers, CVV, or full track data in your database.
 * Tokenize the card with your payment gateway (Stripe, Square, Authorize.net...)
 * and store ONLY the token plus safe display metadata (brand, last4, expiry).
 */
const paymentMethodSchema = new Schema(
  {
    gateway: {
      type: String,
      enum: ['stripe', 'square', 'authorize_net', 'other'],
      default: 'stripe',
    },
    gatewayCustomerId: String, // e.g. Stripe customer ID
    gatewayPaymentMethodId: String, // e.g. Stripe payment method / card token

    // Safe-to-store display metadata only
    brand: String, // 'visa', 'mastercard', ...
    last4: {
      type: String,
      match: /^\d{4}$/,
    },
    expMonth: { type: Number, min: 1, max: 12 },
    expYear: Number,

    // "Billing Information" section of the form
    billing: {
      fullName: { type: String, trim: true },
      country: { type: String, default: 'US' },
      address: { type: String, trim: true }, // single-line input in the form
      cardholderEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      additionalNotes: { type: String, trim: true },
    },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const contactSchema = new Schema(
  {
    /* BASIC INFO */
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      countryCode: { type: String, default: '+1' },
      // react-phone-number-input returns E.164 (e.g. "+13105551234"),
      // which already includes the country code
      number: { type: String, required: [true, 'Phone number is required'], trim: true },
    },

    /* OPTIONAL INFO */
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    companyPosition: { type: String, trim: true },
    homeAddress: { type: String, trim: true }, // aligned with form's text input
    workAddress: { type: String, trim: true }, // aligned with form's text input

    /* BILLING — tokenized payment methods, supports multiple cards */
    paymentMethods: [paymentMethodSchema],

    /* LINKED PASSENGERS — other contacts this person books for */
    linkedPassengers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
      },
    ],

    /* PREFERENCES tab — internal notes, not visible to the customer */
    preferences: { type: String, trim: true },

    /* INTERNAL COMMENTS */
    internalComments: [commentSchema],

    /* Classification & audit */
    type: {
      type: String,
      enum: ['individual', 'corporate'],
      default: 'individual',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ---------- Virtuals ---------- */

contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/* ---------- Indexes ---------- */

contactSchema.index(
  { firstName: 'text', lastName: 'text', email: 'text' },
  { name: 'contact_search' }
);
contactSchema.index({ email: 1 }, { unique: true });
contactSchema.index({ company: 1 });
contactSchema.index({ 'phone.number': 1 });

module.exports = mongoose.model('Contact', contactSchema);