// modules/customer/controllers/cashbackController.js
const Contact = require('../../../models/Contact');
const CashbackTransaction = require('../../../models/cashbackTransactions'); // ← From main models
const CompanyProfile = require('../../../models/settings/CompanyProfile');

// ============================================
// GET CASHBACK RATE  => 5 is default rate
// ============================================
const getCashbackRate = async (operatorId) => {
    try {
        const profile = await CompanyProfile.findOne({ operatorId });
        if (profile?.cashback?.enabled !== false) {
            return profile?.cashback?.rate || 5;
        }
        return 0;
    } catch (error) {
        console.error('Error getting cashback rate:', error);
        return 5;
    }
};

// ============================================
// EARN CASHBACK
// ============================================
const earnCashback = async (reservation, contact) => {
    try {
        if (!contact) return 0;

        const rate = await getCashbackRate(reservation.operatorId);
        if (rate <= 0) return 0;

        const rideTotal = reservation.pricing?.total || 0;
        const cashbackEarned = Math.round((rideTotal * rate) / 100);

        if (cashbackEarned <= 0) return 0;

        const currentBalance = contact.cashbackBalanceCents || 0;
        contact.cashbackBalanceCents = currentBalance + cashbackEarned;
        await contact.save();

        await CashbackTransaction.create({
            contactId: contact._id,
            operatorId: reservation.operatorId,
            type: 'earn',
            amountCents: cashbackEarned,
            balanceAfterCents: currentBalance + cashbackEarned,
            reason: 'ride_completion',
            referenceId: reservation._id,
            referenceType: 'reservation',
            metadata: {
                rate: rate,
                description: `Cashback earned from ride ${reservation.reservationNumber}`
            }
        });

        return cashbackEarned;

    } catch (error) {
        console.error('Cashback earning error:', error);
        return 0;
    }
};

// ============================================
// 1. GET CASHBACK SUMMARY
// ============================================
const getCashbackSummary = async (req, res) => {
    try {
        const contact = await Contact.findOne({
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Get balance from contact
        const balance = contact.cashbackBalanceCents || 0;

        // Get recent transactions
        const recentTransactions = await CashbackTransaction.find({
            contactId: contact._id,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get summary
        const summary = await CashbackTransaction.getSummary(contact._id);

        return res.status(200).json({
            success: true,
            data: {
                balance,
                summary,
                recentTransactions
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 2. GET FULL LEDGER (Paginated)
// ============================================
const getCashbackLedger = async (req, res) => {
    try {
        const { limit = 20, page = 1, type, from, to } = req.query;
        const skip = (page - 1) * limit;

        const contact = await Contact.findOne({
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const filter = {
            contactId: contact._id,
            isDeleted: false
        };

        if (type) filter.type = type;
        if (from) filter.createdAt = { $gte: new Date(from) };
        if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };

        const transactions = await CashbackTransaction.find(filter)
            .populate('referenceId', 'reservationNumber invoiceNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CashbackTransaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactions.map(t => ({
                ...t.toObject(),
                description: getTransactionDescription(t)
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTransactionDescription = (transaction) => {
    const descriptions = {
        ride_completion: 'Cashback earned from ride',
        referral: 'Referral bonus',
        promo_code: 'Promo code reward',
        bonus: 'Bonus cashback',
        invoice_payment: 'Redeemed for invoice payment',
        expiry: 'Cashback expired',
        adjustment: 'Manual adjustment'
    };
    return descriptions[transaction.reason] || transaction.reason || 'Transaction';
};

module.exports = {
    getCashbackSummary,
    getCashbackLedger,
    getCashbackRate,
    earnCashback
};