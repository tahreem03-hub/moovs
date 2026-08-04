// modules/customer/controllers/bookingController.js
const Contact = require('../../../models/Contact');
const Quote = require('../../../models/Quote');
const Reservation = require('../../../models/Reservation');
const Vehicle = require('../../../models/Vehicle');
const Invoice = require('../../../models/Invoice');

// ============================================
// 1. REQUEST QUOTE
// ============================================
const requestQuote = async (req, res) => {
    try {
        const { 
            tripType, 
            pickupDateTime, 
            returnDateTime,
            stops, 
            passengerCount, 
            luggageCount,
            vehicleType,
            specialRequirements,
            serviceType
        } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Validate stops
        if (!stops || stops.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least pickup and dropoff stops are required'
            });
        }

        // Create quote
        const quote = await Quote.create({
            operatorId: null, // Will be assigned when operator accepts
            bookingContact: contact._id,
            passenger: contact._id,
            tripType: tripType || 'one_way',
            pickupDateTime: new Date(pickupDateTime),
            dropoffDateTime: returnDateTime ? new Date(returnDateTime) : null,
            stops: stops.map((stop, index) => ({
                type: index === 0 ? 'pickup' : (index === stops.length - 1 ? 'dropoff' : 'stop'),
                locationType: stop.locationType || 'address',
                address: stop.address,
                airport: stop.airport,
                order: index,
                notes: stop.notes
            })),
            passengerCount: passengerCount || 1,
            driverNote: specialRequirements,
            tripNotes: specialRequirements,
            vehicle: vehicleType || null, // Will be assigned later
            status: 'new',
            createdBy: req.user._id
        });

        // Calculate pricing (you can implement your pricing engine here)
        const pricing = await calculatePrice(quote);
        quote.pricing = pricing;
        quote.status = 'sent';
        await quote.save();

        return res.status(201).json({
            success: true,
            message: 'Quote generated successfully',
            data: quote
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. GET QUOTES
// ============================================
const getQuotes = async (req, res) => {
    try {
        const { 
            status, 
            from, 
            to, 
            limit = 20, 
            page = 1 
        } = req.query;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const skip = (page - 1) * limit;
        const filter = {
            bookingContact: contact._id,
            
        };

        if (status) filter.status = status;
        if (from) filter.createdAt = { $gte: new Date(from) };
        if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };

        const quotes = await Quote.find(filter)
            .populate('vehicle', 'name type images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Quote.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: quotes,
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
// 3. CREATE RESERVATION (Book from quote or direct)
// ============================================
const createReservation = async (req, res) => {
    try {
        const { 
            quoteId,
            pickupDateTime,
            returnDateTime,
            stops,
            passengerCount,
            luggageCount,
            vehicleId,
            serviceType,
            specialRequirements,
            paymentMethod
        } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        let quote = null;
        let tripData = {};

        // If quoteId provided, use quote data
        if (quoteId) {
            quote = await Quote.findOne({
                _id: quoteId,
                bookingContact: contact._id,
                status: { $in: ['sent', 'quoted'] },
                
            });

            if (!quote) {
                return res.status(404).json({
                    success: false,
                    message: 'Valid quote not found'
                });
            }

            tripData = {
                stops: quote.stops,
                passengerCount: quote.passengerCount,
                pickupDateTime: quote.pickupDateTime,
                returnDateTime: quote.dropoffDateTime,
                tripType: quote.tripType,
                serviceType: quote.serviceType || 'standard',
                specialRequirements: quote.driverNote || quote.tripNotes
            };
        } else {
            // Direct booking (no quote)
            if (!stops || !pickupDateTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Stops and pickup date/time are required'
                });
            }

            tripData = {
                stops,
                passengerCount: passengerCount || 1,
                pickupDateTime: new Date(pickupDateTime),
                returnDateTime: returnDateTime ? new Date(returnDateTime) : null,
                tripType: req.body.tripType || 'one_way',
                serviceType: serviceType || 'standard',
                specialRequirements
            };
        }

        // Find available vehicle
        let vehicle = null;
        if (vehicleId) {
            vehicle = await Vehicle.findOne({
                _id: vehicleId,
                isActive: true,
                
            });
        } else if (quote && quote.vehicle) {
            vehicle = await Vehicle.findOne({
                _id: quote.vehicle,
                isActive: true,
                
            });
        }

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'No available vehicle found for your request'
            });
        }

        // Create reservation
        const reservation = await Reservation.create({
            bookingContact: contact._id,
            passenger: contact._id,
            tripType: tripData.tripType,
            orderType: 'retail',
            serviceType: tripData.serviceType,
            pickupDateTime: tripData.pickupDateTime,
            dropoffDateTime: tripData.returnDateTime,
            stops: tripData.stops,
            passengerCount: tripData.passengerCount,
            luggageCount: luggageCount || 0,
            driverNote: tripData.specialRequirements,
            tripNotes: tripData.specialRequirements,
            vehicle: vehicle._id,
            quote: quote?._id,
            status: 'confirmed',
            confirmedAt: new Date(),
            source: 'customer_portal',
            createdBy: req.user._id
        });

        // Update quote status if used
        if (quote) {
            quote.status = 'converted';
            await quote.save();
        }

        // Generate invoice
        const invoice = await createInvoice(reservation, contact);

        // Populate for response
        await reservation.populate('vehicle', 'name type images');
        await reservation.populate('driver', 'firstName lastName phone');

        return res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: {
                reservation,
                invoice
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
// 4. GET RESERVATIONS
// ============================================
const getReservations = async (req, res) => {
    try {
        const { 
            status, 
            from, 
            to, 
            limit = 20, 
            page = 1,
            sortBy = 'pickupDateTime',
            sortOrder = 'desc'
        } = req.query;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const skip = (page - 1) * limit;
        const filter = {
            bookingContact: contact._id,
            
        };

        if (status) {
            const statusMap = {
                'upcoming': { status: 'confirmed', pickupDateTime: { $gt: new Date() } },
                'in_progress': { status: { $in: ['started', 'en_route', 'arrived', 'on_board'] } },
                'completed': { status: 'completed' },
                'cancelled': { status: 'cancelled' },
                'no_show': { status: 'no_show' }
            };
            if (statusMap[status]) {
                Object.assign(filter, statusMap[status]);
            } else {
                filter.status = status;
            }
        }

        if (from) filter.pickupDateTime = { $gte: new Date(from) };
        if (to) filter.pickupDateTime = { ...filter.pickupDateTime, $lte: new Date(to) };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const reservations = await Reservation.find(filter)
            .populate('vehicle', 'name type images licensePlate')
            .populate('driver', 'firstName lastName phone photo')
            .populate('invoice')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Reservation.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: reservations,
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
// 5. GET RESERVATION DETAIL
// ============================================
const getReservationDetail = async (req, res) => {
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

        const reservation = await Reservation.findOne({
            _id: id,
            bookingContact: contact._id,
            
        })
        .populate('vehicle', 'name type images licensePlate')
        .populate('driver', 'firstName lastName phone photo')
        .populate('quote')
        .populate('invoice');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Get status timeline
        const statusTimeline = await getStatusTimeline(reservation);

        // Get payment breakdown
        const paymentBreakdown = await getPaymentBreakdown(reservation);

        return res.status(200).json({
            success: true,
            data: {
                reservation,
                statusTimeline,
                paymentBreakdown
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
// 6. CANCEL RESERVATION
// ============================================
const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
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
            
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check if cancellation is allowed
        if (['started', 'completed', 'cancelled'].includes(reservation.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a trip that is ${reservation.status}`
            });
        }

        // Check cancellation policy
        const hoursUntilPickup = (new Date(reservation.pickupDateTime) - new Date()) / (1000 * 60 * 60);
        let cancellationFee = 0;

        if (hoursUntilPickup < 2) {
            cancellationFee = reservation.totalAmount * 0.5; // 50% fee
        } else if (hoursUntilPickup < 12) {
            cancellationFee = reservation.totalAmount * 0.25; // 25% fee
        }

        // Update reservation
        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancellationReason = reason || 'Customer requested cancellation';
        reservation.cancellationFee = cancellationFee;
        await reservation.save();

        // Process refund if payment was made
        if (reservation.paymentStatus === 'paid') {
            await processRefund(reservation);
        }

        return res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: {
                reservation,
                cancellationFee,
                refundAmount: reservation.totalAmount - cancellationFee
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
// 7. REBOOK RESERVATION
// ============================================
const rebookReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { pickupDateTime } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const oldReservation = await Reservation.findOne({
            _id: id,
            bookingContact: contact._id,
            
        });

        if (!oldReservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Find available vehicle
        const vehicle = await Vehicle.findOne({
            _id: oldReservation.vehicle,
            isActive: true,
            
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle no longer available'
            });
        }

        // Create new reservation from old
        const newReservation = await Reservation.create({
            bookingContact: contact._id,
            passenger: contact._id,
            tripType: oldReservation.tripType,
            orderType: oldReservation.orderType || 'retail',
            serviceType: oldReservation.serviceType || 'standard',
            pickupDateTime: new Date(pickupDateTime || Date.now() + 3600000),
            dropoffDateTime: oldReservation.dropoffDateTime,
            stops: oldReservation.stops,
            passengerCount: oldReservation.passengerCount || 1,
            luggageCount: oldReservation.luggageCount || 0,
            driverNote: oldReservation.driverNote,
            tripNotes: oldReservation.tripNotes,
            vehicle: vehicle._id,
            status: 'confirmed',
            confirmedAt: new Date(),
            source: 'customer_portal_rebook',
            createdBy: req.user._id
        });

        await newReservation.populate('vehicle', 'name type images');

        return res.status(201).json({
            success: true,
            message: 'Rebooked successfully',
            data: newReservation
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 8. RATE & TIP
// ============================================
const rateAndTip = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, tipAmountCents, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const contact = await Contact.findOne({ 
            userId: req.user._id,
             
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
            status: 'completed',
            
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Completed reservation not found'
            });
        }

        if (reservation.rated) {
            return res.status(400).json({
                success: false,
                message: 'This trip has already been rated'
            });
        }

        // Update reservation
        reservation.rating = rating;
        reservation.ratingComment = comment || '';
        reservation.tipAmountCents = tipAmountCents || 0;
        reservation.rated = true;
        reservation.ratedAt = new Date();
        await reservation.save();

        // Update driver's average rating
        if (reservation.driver) {
            await updateDriverRating(reservation.driver);
        }

        // Process tip if any
        if (tipAmountCents > 0) {
            await processTip(reservation.driver, tipAmountCents, reservation._id);
        }

        return res.status(200).json({
            success: true,
            message: 'Rating and tip submitted successfully',
            data: {
                rating,
                tipAmountCents,
                comment
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

const calculatePrice = async (quote) => {
    // Implement your pricing engine here
    // This is a basic example
    let baseFare = 1000; // $10.00
    let distanceFare = 500; // $5.00
    let timeFare = 200; // $2.00
    let extras = 0;
    let surcharges = 0;
    let discount = 0;
    let tax = 150; // $1.50
    let total = baseFare + distanceFare + timeFare + extras + surcharges + tax - discount;

    return {
        items: [
            { label: 'Base Fare', rateType: 'flat', amount: baseFare, taxable: true },
            { label: 'Distance Fee', rateType: 'flat', amount: distanceFare, taxable: true },
            { label: 'Time Fee', rateType: 'flat', amount: timeFare, taxable: true }
        ],
        subtotal: baseFare + distanceFare + timeFare + extras + surcharges,
        taxRate: 10,
        taxAmount: tax,
        discount: discount,
        gratuity: 0,
        total: total,
        currency: 'USD'
    };
};

const createInvoice = async (reservation, contact) => {
    // Create invoice for the reservation
    const invoice = await Invoice.create({
        invoiceNumber: `INV-${Date.now()}`,
        contactId: contact._id,
        customerEmail: contact.email,
        customerName: `${contact.firstName} ${contact.lastName}`,
        reservationId: reservation._id,
        amountCents: reservation.totalAmount || 0,
        paidAmountCents: 0,
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
            {
                description: `Transportation service - ${reservation.tripType}`,
                quantity: 1,
                unitPrice: reservation.totalAmount || 0,
                total: reservation.totalAmount || 0
            }
        ],
        createdBy: req.user._id
    });

    return invoice;
};

const getStatusTimeline = async (reservation) => {
    // Get all status events for this reservation
    // You would need a TripStatusEvent model for this
    return [
        { status: 'confirmed', timestamp: reservation.confirmedAt, description: 'Booking confirmed' },
        { status: 'dispatched', timestamp: reservation.dispatchedAt, description: 'Driver dispatched' },
        { status: 'en_route', timestamp: reservation.enRouteAt, description: 'Driver en route to pickup' },
        { status: 'arrived', timestamp: reservation.arrivedAt, description: 'Driver arrived at pickup' },
        { status: 'on_board', timestamp: reservation.onBoardAt, description: 'Passenger on board' },
        { status: 'completed', timestamp: reservation.completedAt, description: 'Trip completed' }
    ].filter(event => event.timestamp);
};

const getPaymentBreakdown = async (reservation) => {
    return {
        baseFare: reservation.baseFare || 0,
        distanceFare: reservation.distanceFare || 0,
        timeFare: reservation.timeFare || 0,
        extras: reservation.extras || 0,
        surcharges: reservation.surcharges || 0,
        tax: reservation.tax || 0,
        discount: reservation.discount || 0,
        tip: reservation.tipAmountCents || 0,
        total: reservation.totalAmount || 0,
        paid: reservation.paymentStatus === 'paid' ? reservation.totalAmount : 0,
        due: reservation.paymentStatus === 'paid' ? 0 : reservation.totalAmount
    };
};

const updateDriverRating = async (driverId) => {
    const result = await Reservation.aggregate([
        { $match: { 
            driver: driverId, 
            rating: { $exists: true, $ne: null },
            
        }},
        { $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
        }}
    ]);

    if (result.length > 0) {
        await Driver.findByIdAndUpdate(driverId, {
            averageRating: result[0].avgRating,
            ratingCount: result[0].count
        });
    }
};

const processTip = async (driverId, amount, reservationId) => {
    // Add tip to driver's earnings
    await DriverEarning.create({
        driverId,
        reservationId,
        amountCents: amount,
        type: 'tip',
        status: 'pending'
    });
};

const processRefund = async (reservation) => {
    // Process refund through payment gateway
    // Implementation depends on your payment provider
    reservation.refundStatus = 'processing';
    await reservation.save();
};

module.exports = {
    requestQuote,
    getQuotes,
    createReservation,
    getReservations,
    getReservationDetail,
    cancelReservation,
    rebookReservation,
    rateAndTip
};