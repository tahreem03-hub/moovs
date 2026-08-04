// models/CashbackTransaction.js
const mongoose = require('mongoose');

const cashbackTransactionSchema = new mongoose.Schema({
    // Who this belongs to
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
        index: true
    },
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },

    // Transaction type
    type: {
        type: String,
        enum: ['earn', 'redeem', 'adjustment', 'expiry'],
        required: true
    },

    // Amount in cents
    amountCents: {
        type: Number,
        required: true,
        min: 0
    },

    // Balance after this transaction
    balanceAfterCents: {
        type: Number,
        required: true,
        min: 0
    },

    // Reason for transaction
    reason: {
        type: String,
        enum: [
            'ride_completion',
            'referral',
            'promo_code',
            'bonus',
            'invoice_payment',
            'expiry',
            'adjustment'
        ],
        required: true
    },

    // Reference to related entity
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    referenceType: {
        type: String,
        enum: ['reservation', 'invoice', 'promo'],
        default: null
    },

    // Metadata
    metadata: {
        rate: { type: Number, min: 0, max: 100 },    // Cashback rate applied (percentage)
        source: { type: String },                     // Where it came from
        expiresAt: { type: Date },                    // When it expires
        description: { type: String },                // Human readable description
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who processed it
    },

    // Status
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for performance
cashbackTransactionSchema.index({ contactId: 1, createdAt: -1 });
cashbackTransactionSchema.index({ contactId: 1, type: 1 });
cashbackTransactionSchema.index({ contactId: 1, isDeleted: 1 });
cashbackTransactionSchema.index({ referenceId: 1, referenceType: 1 });
cashbackTransactionSchema.index({ operatorId: 1, createdAt: -1 });
cashbackTransactionSchema.index({ 'metadata.expiresAt': 1 });

// Virtual for formatted amount
cashbackTransactionSchema.virtual('amountFormatted').get(function() {
    return (this.amountCents / 100).toFixed(2);
});

// Virtual for balance formatted
cashbackTransactionSchema.virtual('balanceFormatted').get(function() {
    return (this.balanceAfterCents / 100).toFixed(2);
});

// Method to check if expired
cashbackTransactionSchema.methods.isExpired = function() {
    if (!this.metadata?.expiresAt) return false;
    return new Date() > this.metadata.expiresAt;
};

// Static method to get balance for a contact
cashbackTransactionSchema.statics.getBalance = async function(contactId) {
    const result = await this.aggregate([
        { $match: { 
            contactId: contactId, 
            isDeleted: false,
            'metadata.expiresAt': { $or: [null, { $gt: new Date() }] }
        }},
        { $group: {
            _id: null,
            balance: {
                $sum: {
                    $cond: [
                        { $eq: ['$type', 'earn'] },
                        '$amountCents',
                        { $multiply: ['$amountCents', -1] }
                    ]
                }
            }
        }}
    ]);
    return result.length > 0 ? result[0].balance : 0;
};

// Static method to get summary
cashbackTransactionSchema.statics.getSummary = async function(contactId) {
    const result = await this.aggregate([
        { $match: { contactId: contactId, isDeleted: false } },
        { $group: {
            _id: '$type',
            total: { $sum: '$amountCents' },
            count: { $sum: 1 }
        }}
    ]);
    
    const summary = { earned: 0, redeemed: 0, adjustments: 0, expired: 0 };
    result.forEach(item => {
        if (item._id === 'earn') summary.earned = item.total;
        if (item._id === 'redeem') summary.redeemed = item.total;
        if (item._id === 'adjustment') summary.adjustments = item.total;
        if (item._id === 'expiry') summary.expired = item.total;
    });
    return summary;
};

module.exports = mongoose.model('CashbackTransaction', cashbackTransactionSchema);