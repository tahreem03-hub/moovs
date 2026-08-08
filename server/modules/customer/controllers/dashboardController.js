// modules/customer/controllers/dashboardController.js
const Contact = require('../../../models/Contact');
const Reservation = require('../../../models/Reservation');
const Invoice = require('../../../models/Invoice');
const CashbackTransaction = require('../../../models/cashbackTransactions');

// ============================================
// GET HOME DASHBOARD
// ============================================
const getHome = async (req, res) => {
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

        // 1. Active Ride (in progress or upcoming soon)
        const activeRide = await Reservation.findOne({
            bookingContact: contact._id,
            status: { 
                $in: ['confirmed', 'started', 'en_route', 'arrived', 'on_board'] 
            },
            isDeleted: false  // ✅ Added
        })
        .populate('vehicle', 'name type images licensePlate')
        .populate('driver', 'firstName lastName phone')
        .sort({ pickupDateTime: 1 });

        // 2. Upcoming rides count (next 24 hours)
        const upcomingCount = await Reservation.countDocuments({
            bookingContact: contact._id,
            status: 'confirmed',
            pickupDateTime: { 
                $gte: new Date(),
                $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            isDeleted: false  // ✅ Added
        });

        // 3. Total rides taken
        const totalRides = await Reservation.countDocuments({
            bookingContact: contact._id,
            status: 'completed',
            isDeleted: false  // ✅ Added
        });

        // 4. Cashback balance
        const cashbackBalance = await getCashbackBalance(contact._id);

        // 5. Outstanding balance (unpaid invoices)
        const outstandingBalance = await getOutstandingBalance(contact._id);

        // 6. Recent trips (last 5)
        const recentTrips = await Reservation.find({
            bookingContact: contact._id,
            isDeleted: false  // ✅ Added
        })
        .populate('vehicle', 'name type')
        .sort({ pickupDateTime: -1 })
        .limit(5);

        // 7. Quick stats
        const stats = {
            totalSpent: await getTotalSpent(contact._id),
            totalTrips: totalRides,
            upcomingTrips: upcomingCount,
            cashbackBalance,
            outstandingBalance
        };

        return res.status(200).json({
            success: true,
            data: {
                activeRide,
                stats,
                recentTrips,
                contact: {
                    _id: contact._id,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    photo: contact.photo
                }
            }
        });

    } catch (error) {
        console.error('Get home error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// GET DASHBOARD STATS
// ============================================
const getStats = async (req, res) => {
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

        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate;

        switch(period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        // Completed trips in period
        const completedTrips = await Reservation.find({
            bookingContact: contact._id,
            status: 'completed',
            completedAt: { $gte: startDate },
            isDeleted: false  // ✅ Added
        });

        const totalTrips = completedTrips.length;
        const totalSpent = completedTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const avgRating = completedTrips.reduce((sum, t) => sum + (t.rating || 0), 0) / (totalTrips || 1);

        // Trips by status
        const statusCounts = await Reservation.aggregate([
            { $match: { 
                bookingContact: contact._id,
                isDeleted: false  // ✅ Added
            }},
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);

        // Monthly trends (last 6 months)
        const monthlyTrends = await Reservation.aggregate([
            { $match: { 
                bookingContact: contact._id,
                status: 'completed',
                completedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
                isDeleted: false  // ✅ Added
            }},
            { $group: {
                _id: { 
                    month: { $month: '$completedAt' },
                    year: { $year: '$completedAt' }
                },
                count: { $sum: 1 },
                total: { $sum: '$totalAmount' }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                period,
                totalTrips,
                totalSpent,
                avgRating: avgRating || 0,
                statusCounts: statusCounts.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                monthlyTrends
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCashbackBalance = async (contactId) => {
    const result = await CashbackTransaction.aggregate([
        { $match: { 
            contactId: contactId,
            isDeleted: false  // ✅ Added
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

const getOutstandingBalance = async (contactId) => {
    const result = await Invoice.aggregate([
        { $match: { 
            customerId: contactId,  // ✅ Fixed: contactId → customerId (matches Invoice schema)
            status: { $ne: 'paid' },
            isDeleted: false  // ✅ Added
        }},
        { $group: {
            _id: null,
            total: { $sum: '$total' }  // ✅ Fixed: amountCents → total (matches Invoice schema)
        }}
    ]);
    return result.length > 0 ? result[0].total : 0;
};

const getTotalSpent = async (contactId) => {
    const result = await Reservation.aggregate([
        { $match: { 
            bookingContact: contactId,
            status: 'completed',
            paymentStatus: 'paid',
            isDeleted: false  // ✅ Added
        }},
        { $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
        }}
    ]);
    return result.length > 0 ? result[0].total : 0;
};

module.exports = {
    getHome,
    getStats
};