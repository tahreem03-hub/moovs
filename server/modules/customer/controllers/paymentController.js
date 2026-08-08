// modules/customer/controllers/paymentController.js
const Contact = require('../../../models/Contact');
const Reservation = require('../../../models/Reservation');
const Invoice = require('../../../models/Invoice');
const CashbackTransaction = require('../../../models/cashbackTransactions');
const { earnCashback } = require('./cashbackController');

// ============================================
// 1. GET PAYMENT METHODS
// ============================================
const getPaymentMethods = async (req, res) => {
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

        // Payment methods are stored in contact.paymentMethods array
        const paymentMethods = contact.paymentMethods || [];

        return res.status(200).json({
            success: true,
            data: paymentMethods
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. ADD PAYMENT METHOD
// ============================================
const addPaymentMethod = async (req, res) => {
    try {
        const { 
            gateway, 
            gatewayCustomerId,
            gatewayPaymentMethodId,
            brand,
            last4,
            expMonth,
            expYear,
            billing,
            isDefault
        } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Initialize paymentMethods array if it doesn't exist
        if (!contact.paymentMethods) {
            contact.paymentMethods = [];
        }

        // Check if this is the first payment method
        const isFirst = contact.paymentMethods.length === 0;

        // If this is the first or marked as default, unset others
        if (isFirst || isDefault) {
            contact.paymentMethods.forEach(pm => pm.isDefault = false);
        }

        // Add new payment method
        const newPaymentMethod = {
            gateway: gateway || 'stripe',
            gatewayCustomerId,
            gatewayPaymentMethodId,
            brand: brand || 'card',
            last4: last4 || '****',
            expMonth,
            expYear,
            billing: billing || {},
            isDefault: isFirst || isDefault || false
        };

        contact.paymentMethods.push(newPaymentMethod);
        await contact.save();

        // Get the newly added payment method (last in array)
        const addedMethod = contact.paymentMethods[contact.paymentMethods.length - 1];

        return res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            data: addedMethod
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 3. DELETE PAYMENT METHOD
// ============================================
const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        if (!contact.paymentMethods || contact.paymentMethods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payment methods found'
            });
        }

        // Find the payment method by _id
        const methodIndex = contact.paymentMethods.findIndex(
            pm => pm._id.toString() === id
        );

        if (methodIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        const wasDefault = contact.paymentMethods[methodIndex].isDefault;

        // Remove the payment method
        contact.paymentMethods.splice(methodIndex, 1);

        // If deleted the default and there are other methods, set first as default
        if (wasDefault && contact.paymentMethods.length > 0) {
            contact.paymentMethods[0].isDefault = true;
        }

        await contact.save();

        return res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully',
            data: contact.paymentMethods
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 4. SET DEFAULT PAYMENT METHOD
// ============================================
const setDefaultPaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        if (!contact.paymentMethods || contact.paymentMethods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payment methods found'
            });
        }

        // Find the payment method
        const method = contact.paymentMethods.find(
            pm => pm._id.toString() === id
        );

        if (!method) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        // Unset all defaults
        contact.paymentMethods.forEach(pm => pm.isDefault = false);
        method.isDefault = true;

        await contact.save();

        return res.status(200).json({
            success: true,
            message: 'Default payment method updated',
            data: contact.paymentMethods
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 5. GET PAYMENT HISTORY
// ============================================
const getPaymentHistory = async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
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

        // Get all paid reservations
        const payments = await Reservation.find({
            bookingContact: contact._id,
            paymentStatus: 'paid',
            
        })
        .populate('vehicle', 'name type')
        .select('reservationNumber pickupDateTime totalAmount paymentStatus paymentMethod')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Reservation.countDocuments({
            bookingContact: contact._id,
            paymentStatus: 'paid',
            
        });

        return res.status(200).json({
            success: true,
            data: payments,
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
// 6. PAY INVOICE (FIXED)
// ============================================
const payInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethodId, useCashback } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const invoice = await Invoice.findOne({
            _id: id,
            customerId: contact._id,
            isDeleted: false,
            status: { $ne: 'paid' }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found or already paid'
            });
        }

        let amountToPay = invoice.total - (invoice.paidAmount || 0);
        let cashbackApplied = 0;

        // 1. REDEEM CASHBACK (if requested)  by default it is coming true from payload
        if (useCashback) {
            const cashbackBalance = contact.cashbackBalanceCents || 0;
            if (cashbackBalance > 0) {
                cashbackApplied = Math.min(cashbackBalance, amountToPay);
                amountToPay -= cashbackApplied;

                await CashbackTransaction.create({
                    contactId: contact._id,
                    operatorId: invoice.operatorId || null,
                    type: 'redeem',
                    amountCents: cashbackApplied,
                    balanceAfterCents: cashbackBalance - cashbackApplied,
                    reason: 'invoice_payment',
                    referenceId: invoice._id,
                    referenceType: 'invoice',
                    metadata: {
                        description: `Cashback applied to invoice ${invoice.invoiceNumber}`
                    }
                });

                contact.cashbackBalanceCents = cashbackBalance - cashbackApplied;
                await contact.save();
            }
        }
        // 2. PROCESS PAYMENT
        let paymentResult = null;
        if (amountToPay > 0 && paymentMethodId) {
            const paymentMethod = contact.paymentMethods.find(
                pm => pm._id.toString() === paymentMethodId
            );
            
            if (!paymentMethod) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment method not found'
                });
            }

            paymentResult = await processStripePayment({
                amount: amountToPay,
                paymentMethodId: paymentMethod.gatewayPaymentMethodId,
                customerId: contact._id,
                description: `Invoice ${invoice.invoiceNumber}`
            });
        }

        //  3. UPDATE INVOICE
        invoice.paidAmount = (invoice.paidAmount || 0) + (amountToPay || 0);
        invoice.cashbackApplied = (invoice.cashbackApplied || 0) + cashbackApplied;
        
        if (invoice.paidAmount >= invoice.total) {
            invoice.status = 'paid';
            invoice.paidAt = new Date();
        }

        if (paymentResult) {
            invoice.paymentTransactionId = paymentResult.id;
            invoice.paymentMethod = paymentResult.paymentMethod;
        }

        await invoice.save();

        // 4. UPDATE RESERVATION
        if (invoice.reservationId) {
            await Reservation.findByIdAndUpdate(invoice.reservationId, {
                paymentStatus: 'paid',
                isClosed: true,
                closedAt: new Date()
            });
        }

        // 5. EARN NEW CASHBACK (ADD THIS!)
        if (invoice.reservationId && amountToPay > 0) {
            try {
                const reservation = await Reservation.findById(invoice.reservationId);
                if (reservation) {
                   await earnCashback(reservation, contact)
                }
            } catch (error) {
                console.error('Cashback earning error:', error);
                
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Invoice paid successfully',
            data: {
                invoice,
                amountPaid: (amountToPay || 0) + cashbackApplied,
                cashbackApplied,
                cashbackBalance: contact.cashbackBalanceCents || 0,
                paymentResult
            }
        });

    } catch (error) {
        console.error('Pay invoice error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// HELPER: Process Stripe Payment (Placeholder)
// ============================================
const processStripePayment = async ({ amount, paymentMethodId, customerId, description }) => {
    // Implement Stripe payment processing here
    // This is a placeholder - integrate with your Stripe setup
    
    // For now, return a mock response
    return {
        id: `pi_${Date.now()}`,
        amount,
        paymentMethod: paymentMethodId,
        status: 'succeeded',
        currency: 'usd'
    };
};

module.exports = {
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentHistory,
    payInvoice
};