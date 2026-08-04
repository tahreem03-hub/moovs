// modules/customer/controllers/trackingController.js
const Contact = require('../../../models/Contact');
const Reservation = require('../../../models/Reservation');

// ============================================
// 1. GET ACTIVE RIDE
// ============================================
const getActiveRide = async (req, res) => {
    try {
        const contact = await Contact.findOne({ 
            userId: req.user._id,
            isDeleted: false 
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const activeRide = await Reservation.findOne({
            bookingContact: contact._id,
            status: { 
                $in: ['confirmed', 'started', 'en_route', 'arrived', 'on_board'] 
            },
            isDeleted: false
        })
        .populate('vehicle', 'name type images licensePlate color')
        .populate('driver', 'firstName lastName phone photo')
        .sort({ pickupDateTime: 1 });

        if (!activeRide) {
            return res.status(404).json({
                success: false,
                message: 'No active ride found'
            });
        }

        return res.status(200).json({
            success: true,
            data: activeRide
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. TRACK SPECIFIC RIDE
// ============================================
const trackRide = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
            isDeleted: false 
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const reservation = await Reservation.findOne({
            _id: id,
            bookingContact: contact._id,
            isDeleted: false
        })
        .populate('vehicle', 'name type images licensePlate color')
        .populate('driver', 'firstName lastName phone photo');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Get driver location from Redis or WebSocket
        // For now, return mock data
        const driverLocation = {
            lat: 40.7128,
            lng: -74.0060,
            heading: 45,
            speed: 30,
            updatedAt: new Date()
        };

        return res.status(200).json({
            success: true,
            data: {
                reservation,
                driverLocation,
                eta: 5 // minutes
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
// 3. GET DRIVER LOCATION (WebSocket endpoint)
// ============================================
const getDriverLocation = async (req, res) => {
    try {
        const { reservationId } = req.params;

        // Get driver location from Redis
        // const location = await redisClient.get(`driver_location:${driverId}`);
        
        // Mock data for now
        return res.status(200).json({
            success: true,
            data: {
                lat: 40.7128,
                lng: -74.0060,
                heading: 45,
                speed: 30,
                eta: 5
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    getActiveRide,
    trackRide,
    getDriverLocation
};