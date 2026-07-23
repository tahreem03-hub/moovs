// controllers/billingController.js
const mongoose = require('mongoose');
const Billing = require('../../models/settings/Billing');
const SubscriptionPlan = require('../../modules/admin/models/SubscriptionPlan');
const User = require('../../models/User');

// ============================================
// HELPERS
// ============================================

const getOrCreateBilling = async (operatorId) => {
    let billing = await Billing.findOne({ operatorId });

    if (!billing) {
        const user = await User.findById(operatorId);
        billing = await Billing.create({
            operatorId,
            currentPlan: user?.subscriptionPlan || 'free',
            status: user?.subscriptionStatus || 'trial',
            subscriptionExpiry: user?.subscriptionExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    }
    return billing;
};

// ============================================
// OPERATOR FUNCTIONS
// ============================================

// Get my billing details
const getMyBilling = async (req, res) => {
    try {
        const billing = await getOrCreateBilling(req.user._id);

        // Get plan details from SubscriptionPlan model
        const plan = await SubscriptionPlan.findOne({ tier: billing.currentPlan }).lean();

        // Get user for trial end date
        const user = await User.findById(req.user._id);
        const trialEnds = new Date(user?.createdAt || Date.now());
        trialEnds.setDate(trialEnds.getDate() + 30);

        return res.status(200).json({
            success: true,
            data: {
                // the fallback plan
                plan: plan || {
                    name: 'Free',
                    tier: 'free',
                    description: 'Basic free plan with limited features',
                    price: 0,
                    billingCycle: 'monthly',
                    features: {
                        vehicles: { limit: 5, label: 'Vehicles' },      // ← 5 vehicles
                        drivers: { limit: 5, label: 'Drivers' },        // ← 5 drivers
                        companies: { limit: 10, label: 'Companies' },   // ← 10 companies
                        contacts: { limit: 50, label: 'Contacts' },     // ← 50 contacts
                        advancedFeatures: []
                    }
                },
                status: billing.status || user?.subscriptionStatus || 'trial',
                renewalDate: billing.subscriptionExpiry || user?.subscriptionExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                trialEnds: trialEnds,
                paymentRequests: billing.paymentRequests || [],
                paymentHistory: billing.paymentHistory || []
            }
        });
    } catch (error) {
        console.error('Get billing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch billing details'
        });
    }
};

// Get available plans
const getAvailablePlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true })
            .sort({ sortOrder: 1, price: 1 })
            .lean();
        return res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch available plans'
        });
    }
};

// Request upgrade with manual payment
const requestUpgrade = async (req, res) => {
    try {
        const { planId, notes } = req.body;
        const screenshot = req.file?.path || req.file?.filename || '';

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        const billing = await getOrCreateBilling(req.user._id);

        billing.paymentRequests.push({
            planId: plan._id,
            planName: plan.name,
            amount: plan.price,
            screenshot: screenshot || '',
            notes: notes || '',
            status: 'pending'
        });

        await billing.save();

        return res.status(200).json({
            success: true,
            message: 'Upgrade request submitted. Admin will review and approve.',
            data: billing
        });
    } catch (error) {
        console.error('Request upgrade error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit upgrade request'
        });
    }
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get pending payment requests
const getPendingRequests = async (req, res) => {
    try {
        const billings = await Billing.find({
            'paymentRequests.status': 'pending'
        }).populate('operatorId', 'Fname Lname email CompanyName');

        const requests = [];
        billings.forEach(billing => {
            billing.paymentRequests.forEach(req => {
                if (req.status === 'pending') {
                    requests.push({
                        _id: req._id,
                        operator: billing.operatorId,
                        planName: req.planName,
                        amount: req.amount,
                        screenshot: req.screenshot,
                        notes: req.notes,
                        requestedAt: req.requestedAt
                    });
                }
            });
        });

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending requests'
        });
    }
};

// Approve payment request
const approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const billing = await Billing.findOne({
            'paymentRequests._id': requestId
        });

        if (!billing) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        const request = billing.paymentRequests.id(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        request.status = 'approved';
        request.reviewedAt = new Date();
        request.reviewedBy = req.user._id;

        const plan = await SubscriptionPlan.findById(request.planId);
        if (plan) {
            billing.currentPlan = plan.tier;
            billing.status = 'active';
            billing.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            // Update User model with new plan
            await User.findByIdAndUpdate(billing.operatorId, {
                subscriptionPlan: plan.tier,
                subscriptionStatus: 'active',
                subscriptionExpiry: billing.subscriptionExpiry
            });

            billing.paymentHistory.push({
                amount: request.amount,
                date: new Date(),
                method: 'manual',
                status: 'completed',
                description: `Payment for ${plan.name} plan`,
                screenshot: request.screenshot
            });
        }

        await billing.save();

        return res.status(200).json({
            success: true,
            message: 'Payment request approved successfully',
            data: billing
        });
    } catch (error) {
        console.error('Approve request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve request'
        });
    }
};

// Reject payment request
const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const billing = await Billing.findOne({
            'paymentRequests._id': requestId
        });

        if (!billing) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        const request = billing.paymentRequests.id(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        request.status = 'rejected';
        request.reviewedAt = new Date();
        request.reviewedBy = req.user._id;

        await billing.save();

        return res.status(200).json({
            success: true,
            message: 'Payment request rejected',
            data: billing
        });
    } catch (error) {
        console.error('Reject request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject request'
        });
    }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
    getMyBilling,
    getAvailablePlans,
    requestUpgrade,
    getPendingRequests,
    approveRequest,
    rejectRequest
};