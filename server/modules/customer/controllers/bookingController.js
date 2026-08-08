// modules/customer/controllers/bookingController.js

const Contact = require('../../../models/Contact');
const Quote = require('../../../models/Quote');
const Reservation = require('../../../models/Reservation');
const Vehicle = require('../../../models/Vehicle');
const Invoice = require('../../../models/Invoice');
const User = require('../../../models/User');
const Driver = require('../../../models/settings/Driver');

// ============================================
// HELPER: Get Operator ID from Multiple Sources
// ============================================
const getOperatorId = async (contact, vehicleType = null) => {
    // Priority 1: From contact.createdBy (operator who created them)
    if (contact.createdBy) {
        return contact.createdBy;
    }

    // Priority 2: From contact.company (if company is linked)
    if (contact.company) {
        try {
            const Company = require('../../../models/Company');
            const company = await Company.findById(contact.company);
            if (company && company.operatorId) {
                return company.operatorId;
            }
        } catch (error) {
            console.log('Company lookup error:', error.message);
        }
    }

    // Priority 3: From vehicle type (try to find any vehicle of this type)
    if (vehicleType) {
        const vehicle = await Vehicle.findOne({
            type: vehicleType,
            display: true,
            isDeleted: false  
        });
        if (vehicle && vehicle.operatorId) {
            return vehicle.operatorId;
        }
    }

    // Priority 4: From any active operator (fallback)
    const anyOperator = await User.findOne({
        role: 'user',
        isActive: true
    });
    if (anyOperator) {
        return anyOperator._id;
    }

    return null;
};

// ============================================
// 3. CREATE RESERVATION
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

        // Get operator ID
        const operatorId = await getOperatorId(contact);

        if (!operatorId) {
            return res.status(400).json({
                success: false,
                message: 'No operator associated with this account'
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
                isDeleted: false  
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

            // Format stops for reservation
            const formattedStops = stops.map((stop, index) => {
                const stopData = {
                    type: index === 0 ? 'pickup' : (index === stops.length - 1 ? 'dropoff' : 'stop'),
                    locationType: 'address',
                    order: index,
                    notes: stop.notes || ''
                };

                if (typeof stop.address === 'string') {
                    stopData.address = {
                        street: stop.address,
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'US',
                        formatted: stop.address
                    };
                } else {
                    stopData.address = stop.address;
                }

                return stopData;
            });

            tripData = {
                stops: formattedStops,
                passengerCount: passengerCount || 1,
                pickupDateTime: new Date(pickupDateTime),
                returnDateTime: returnDateTime ? new Date(returnDateTime) : null,
                tripType: req.body.tripType || 'one_way',
                serviceType: serviceType || 'standard',
                specialRequirements: specialRequirements || ''
            };
        }

        let vehicle = null;
        if (vehicleId) {
            vehicle = await Vehicle.findOne({
                _id: vehicleId,
                operatorId: operatorId,
                display: true,
                isDeleted: false  
            });
        } else if (quote && quote.vehicle) {
            vehicle = await Vehicle.findOne({
                _id: quote.vehicle,
                operatorId: operatorId,
                display: true,
                isDeleted: false  
            });
        }

        // If no vehicle found, try to find any vehicle
        if (!vehicle) {
            vehicle = await Vehicle.findOne({
                operatorId: operatorId,
                display: true,
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
            tripType: tripData.tripType || 'one_way',
            orderType: 'null', // not taken from frontend, to be added
            serviceType: tripData.serviceType || 'standard',
            pickupDateTime: tripData.pickupDateTime,
            dropoffDateTime: tripData.returnDateTime || null,
            stops: tripData.stops,
            passengerCount: tripData.passengerCount || 1,
            luggageCount: luggageCount || 0,
            driverNote: tripData.specialRequirements || '',
            tripNotes: tripData.specialRequirements || '',
            vehicle: vehicle._id,
            quote: quote?._id || null,
            status: 'pending',
            source: 'customer_portal',
            createdBy: req.user._id,
            operatorId: operatorId
        });

        // Update quote status if used
        if (quote) {
            quote.status = 'converted';
            await quote.save();
        }

        const amountCents = quote?.pricing?.total || 0;
        const invoice = await createInvoice(reservation, contact, req, amountCents);

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
        console.error('Reservation error:', error);
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
            isDeleted: false  
        };

        if (status) {
            const statusMap = {
                'upcoming': {
                    status: { $in: ['pending', 'confirmed'] }
                },
                'in_progress': {
                    status: { $in: ['dispatched', 'started'] }
                },
                'completed': {
                    status: 'completed'
                },
                'cancelled': {
                    status: { $in: ['cancelled', 'no_show'] }
                }
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
            isDeleted: false  
        })
            .populate('vehicle', 'name type images licensePlate')
            .populate('driver', 'firstName lastName phone photo')

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: reservation
        });

    } catch (error) {
        console.error('Get reservation detail error:', error);
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
            isDeleted: false  
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

        // Update reservation
        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancellationReason = reason || 'Customer requested cancellation';
        await reservation.save();

        return res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: reservation
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
            isDeleted: false  
        });

        if (!oldReservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Get operator ID
        const operatorId = await getOperatorId(contact);

        // Find available vehicle
        const vehicle = await Vehicle.findOne({
            _id: oldReservation.vehicle,
            display: true,
            isDeleted: false  
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
            createdBy: req.user._id,
            operatorId: operatorId
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
            isDeleted: false  
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
// HELPER: Calculate Price
// ============================================
const calculatePrice = async (quote) => {
    let baseFare = 1000;
    let distanceFare = 500;
    let timeFare = 200;
    let extras = 0;
    let surcharges = 0;
    let discount = 0;
    let tax = 150;
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

// ============================================
// HELPER: Create Invoice
// ============================================
const createInvoice = async (reservation, contact, req, amountCents = 0) => {
    const invoice = await Invoice.create({
        operatorId: reservation.operatorId,
        reservationId: reservation._id,
        customerId: contact._id,
        customerName: `${contact.firstName} ${contact.lastName}`,
        customerEmail: contact.email,
        items: [
            {
                description: `Transportation service - ${reservation.tripType}`,
                quantity: 1,
                rate: amountCents,
                amount: amountCents
            }
        ],
        subtotal: amountCents,
        total: amountCents,
        currency: 'USD',
        status: 'sent',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: req.user._id
    });

    return invoice;
};

module.exports = {
    createReservation,
    getReservations,
    getReservationDetail,
    cancelReservation,
    rebookReservation,
    rateAndTip
};