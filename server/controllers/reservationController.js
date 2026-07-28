// controllers/reservationController.js
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Quote = require('../models/Quote');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/settings/Driver');
const CompanyProfile = require('../models/settings/CompanyProfile');

// ============ CREATE RESERVATION ============
const createReservation = async (req, res) => {
  try {
    const {
      bookingContact,
      orderType,
      assignedMember,
      tripType,
      passenger,
      pickupDateTime,
      dropoffDateTime,
      stops,
      passengerCount,
      driverNote,
      tripNotes,
      vehicle,
      pricing,
      internalComments,
      driver,
      quoteId
    } = req.body;

    // Validate required fields
    if (!vehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is required'
      });
    }
    if (!pickupDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date/time is required'
      });
    }
    if (!stops || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least pickup and dropoff stops are required'
      });
    }

    // Validate stops have pickup and dropoff
    const hasPickup = stops.some(s => s.type === 'pickup');
    const hasDropoff = stops.some(s => s.type === 'dropoff');
    if (!hasPickup || !hasDropoff) {
      return res.status(400).json({
        success: false,
        message: 'Must have both pickup and dropoff stops'
      });
    }

    // If converting from quote, update quote status
    if (quoteId) {
      const quote = await Quote.findOne({
        _id: quoteId,
        operatorId: req.user._id,
        isDeleted: false
      });
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Quote not found'
        });
      }
      quote.status = 'converted';
      await quote.save();
    }

    // Get pricing preferences if no pricing provided
    let pricingData = pricing;
    if (!pricingData || !pricingData.items || pricingData.items.length === 0) {
      const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
      const pricingItems = profile?.preferences?.pricingLayout?.selectedItems || [];
      pricingData = {
        items: pricingItems.map(item => ({
          label: item.name,
          rateType: item.type === 'percentage' ? 'flat' : 'flat',
          amount: item.amount || 0,
          hours: 0,
          isAutoCalculated: false,
          taxable: false
        })),
        taxRate: 0,
        discount: 0,
        gratuity: 0,
        currency: 'USD'
      };
    }

    const reservation = await Reservation.create({
      operatorId: req.user._id,
      bookingContact: bookingContact || null,
      orderType: orderType || 'retail',
      assignedMember: assignedMember || null,
      tripType: tripType || 'hourly',
      passenger: passenger || null,
      pickupDateTime,
      dropoffDateTime: dropoffDateTime || null,
      stops,
      passengerCount: passengerCount || null,
      driverNote: driverNote || '',
      tripNotes: tripNotes || '',
      vehicle,
      pricing: pricingData,
      internalComments: internalComments || [],
      driver: driver || null,
      status: driver ? 'dispatched' : 'confirmed',
      confirmedAt: new Date(),
      quoteId: quoteId || null,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create reservation'
    });
  }
};

// ============ GET ALL RESERVATIONS ============
const getReservations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, date, driver, vehicle } = req.query;

    const query = {
      operatorId: req.user._id,
      isDeleted: false
    };

    if (status) query.status = status;
    if (driver) query.driver = driver;
    if (vehicle) query.vehicle = vehicle;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.pickupDateTime = { $gte: start, $lte: end };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { reservationNumber: regex },
        { orderType: regex }
      ];
      // Search in booking contact separately (populate)
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('bookingContact', 'firstName lastName email phone company')
        .populate('assignedMember', 'Fname Lname email')
        .populate('vehicle', 'name type passengerCapacity images')
        .populate('passenger', 'firstName lastName email')
        .populate('driver', 'firstName lastName phone')
        .populate('farmedTo', 'Fname Lname email CompanyName')
        .sort({ pickupDateTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Reservation.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: reservations,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations'
    });
  }
};

// ============ GET RESERVATION BY ID ============
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    })
      .populate('bookingContact', 'firstName lastName email phone company')
      .populate('assignedMember', 'Fname Lname email')
      .populate('vehicle', 'name type passengerCapacity images')
      .populate('passenger', 'firstName lastName email')
      .populate('driver', 'firstName lastName phone')
      .populate('farmedTo', 'Fname Lname email CompanyName')
      .lean();

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
    console.error('Get reservation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation'
    });
  }
};

// ============ UPDATE RESERVATION ============
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const updates = req.body;
    const allowedFields = [
      'bookingContact', 'orderType', 'assignedMember', 'tripType', 'passenger',
      'pickupDateTime', 'dropoffDateTime', 'stops', 'passengerCount',
      'driverNote', 'tripNotes', 'vehicle', 'pricing', 'internalComments',
      'driver', 'status'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        reservation[field] = updates[field];
      }
    });

    // Update status timestamps if status changed
    if (updates.status && updates.status !== reservation.status) {
      const statusTimestamps = {
        confirmed: 'confirmedAt',
        dispatched: 'dispatchedAt',
        started: 'startedAt',
        completed: 'completedAt',
        cancelled: 'cancelledAt'
      };
      if (statusTimestamps[updates.status]) {
        reservation[statusTimestamps[updates.status]] = new Date();
      }
      if (updates.status === 'cancelled' && updates.cancellationReason) {
        reservation.cancellationReason = updates.cancellationReason;
      }
    }

    reservation.updatedBy = req.user._id;
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reservation'
    });
  }
};

// ============ UPDATE RESERVATION STATUS ============
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['dispatched', 'cancelled'],
      dispatched: ['started', 'cancelled'],
      started: ['completed', 'cancelled'],
      completed: ['billed'],
      cancelled: [],
      billed: []
    };

    if (!validTransitions[reservation.status]?.includes(status) && status !== reservation.status) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${reservation.status} to ${status}`
      });
    }

    reservation.status = status;

    // Set timestamps
    const timestampMap = {
      confirmed: 'confirmedAt',
      dispatched: 'dispatchedAt',
      started: 'startedAt',
      completed: 'completedAt',
      cancelled: 'cancelledAt'
    };

    if (timestampMap[status]) {
      reservation[timestampMap[status]] = new Date();
    }

    if (status === 'cancelled') {
      reservation.cancellationReason = cancellationReason || 'Not specified';
    }

    reservation.updatedBy = req.user._id;
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Reservation ${status} successfully`,
      data: reservation
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// ============ ASSIGN DRIVER ============
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const [driver, reservation] = await Promise.all([
      Driver.findOne({
        _id: driverId,
        operatorId: req.user._id,
        isActive: true
      }),
      Reservation.findOne({
        _id: id,
        operatorId: req.user._id,
        isDeleted: false
      })
    ]);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check driver availability (simplified)
    const existingAssignment = await Reservation.findOne({
      operatorId: req.user._id,
      isDeleted: false,
      driver: driverId,
      status: { $in: ['confirmed', 'dispatched', 'started'] },
      _id: { $ne: id }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already assigned to another trip'
      });
    }

    reservation.driver = driverId;
    if (reservation.status === 'confirmed') {
      reservation.status = 'dispatched';
      reservation.dispatchedAt = new Date();
    }
    reservation.updatedBy = req.user._id;
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Driver ${driver.firstName} ${driver.lastName} assigned successfully`,
      data: reservation
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
};

// ============ FARM OUT RESERVATION ============
const farmOutReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { farmedToId, notes } = req.body;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(farmedToId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if already farmed out
    if (reservation.isFarmedOut) {
      return res.status(400).json({
        success: false,
        message: 'Reservation already farmed out'
      });
    }

    // Verify target operator exists
    const targetOperator = await User.findById(farmedToId);
    if (!targetOperator || targetOperator.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Target operator not found'
      });
    }

    reservation.isFarmedOut = true;
    reservation.farmedTo = farmedToId;
    reservation.farmedOutAt = new Date();
    reservation.status = 'dispatched';
    reservation.updatedBy = req.user._id;
    await reservation.save();

    // In production: Send notification to target operator

    return res.status(200).json({
      success: true,
      message: `Reservation farmed out successfully`,
      data: reservation
    });
  } catch (error) {
    console.error('Farm out error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to farm out reservation'
    });
  }
};

// ============ GET RESERVATION STATS ============
const getReservationStats = async (req, res) => {
  try {
    const [total, byStatus, today, upcoming] = await Promise.all([
      Reservation.countDocuments({
        operatorId: req.user._id,
        isDeleted: false
      }),
      Reservation.aggregate([
        { $match: { operatorId: req.user._id, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Reservation.countDocuments({
        operatorId: req.user._id,
        isDeleted: false,
        pickupDateTime: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lte: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Reservation.countDocuments({
        operatorId: req.user._id,
        isDeleted: false,
        status: { $in: ['confirmed', 'dispatched', 'started'] },
        pickupDateTime: { $gte: new Date() }
      })
    ]);

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      dispatched: 0,
      started: 0,
      completed: 0,
      cancelled: 0,
      billed: 0
    };
    byStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        total,
        statusCounts,
        today,
        upcoming
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

// ============ DELETE RESERVATION ============
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: id, operatorId: req.user._id },
      { isDeleted: true, updatedBy: req.user._id },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete reservation'
    });
  }
};

// ============ CONVERT QUOTE TO RESERVATION ============
const convertQuoteToReservation = async (req, res) => {
  try {
    const { quoteId } = req.params;

    if (!mongoose.isValidObjectId(quoteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    const quote = await Quote.findOne({
      _id: quoteId,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    if (quote.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'Quote already converted'
      });
    }

    // Create reservation from quote data
    const reservation = await Reservation.create({
      operatorId: req.user._id,
      bookingContact: quote.bookingContact,
      orderType: quote.orderType,
      assignedMember: quote.assignedMember,
      tripType: quote.tripType,
      passenger: quote.passenger,
      pickupDateTime: quote.pickupDateTime,
      dropoffDateTime: quote.dropoffDateTime,
      stops: quote.stops,
      passengerCount: quote.passengerCount,
      driverNote: quote.driverNote,
      tripNotes: quote.tripNotes,
      vehicle: quote.vehicle,
      pricing: quote.pricing,
      internalComments: quote.internalComments,
      quoteId: quote._id,
      status: 'confirmed',
      confirmedAt: new Date(),
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    // Update quote status
    quote.status = 'converted';
    await quote.save();

    return res.status(201).json({
      success: true,
      message: 'Quote converted to reservation successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Convert quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert quote to reservation'
    });
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  updateReservationStatus,
  assignDriver,
  farmOutReservation,
  getReservationStats,
  deleteReservation,
  convertQuoteToReservation
};