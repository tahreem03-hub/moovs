// controllers/reservationController.js
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Quote = require('../models/Quote');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/settings/Driver');
const CompanyProfile = require('../models/settings/CompanyProfile');
const User = require('../models/User')
const Invoice = require('../models/Invoice');
const Contact = require('../models/Contact');
const { sendTripAssignedNotification, sendTripStatusNotification } = require('../modules/driver/controllers/notificationController');


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
      driver,
      pricing,
      internalComments
    } = req.body;

    // Validate required fields
    if (!bookingContact) {
      return res.status(400).json({
        success: false,
        message: 'Booking contact is required'
      });
    }

    // Get customer details
    const customer = await Contact.findById(bookingContact);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate reservation number
    const reservationNumber = await generateReservationNumber();

    // Create reservation
    const reservation = new Reservation({
      operatorId: req.user._id,
      bookingContact: bookingContact,
      orderType: orderType,
      assignedMember: assignedMember,
      tripType: tripType,
      passenger: passenger,
      pickupDateTime: pickupDateTime,
      dropoffDateTime: dropoffDateTime,
      stops: stops,
      passengerCount: passengerCount,
      driverNote: driverNote,
      tripNotes: tripNotes,
      vehicle: vehicle,
      driver: driver,
      pricing: pricing,
      internalComments: internalComments || [],
      reservationNumber: reservationNumber,
      status: 'pending',
      createdBy: req.user._id,
      isClosed: false
    });

    await reservation.save();

    let invoice = null;
        try {
            invoice = await createInvoiceFromReservation(reservation, req.user._id);
            
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            // Don't fail the reservation
        }

    // Populate the reservation with customer details for response
    await reservation.populate('bookingContact', 'firstName lastName email phone');

    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        reservation: reservation,
        invoice: invoice 
      }
    });

  } catch (error) {
    console.error('Create reservation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create reservation'
    });
  }
};

// ============ UPDATE RESERVATION (with invoice update) ============
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

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

    // Update reservation
    Object.assign(reservation, updateData);
    reservation.updatedAt = new Date();
    await reservation.save();

    // ✅ Check if pricing changed and update invoice
    let updatedInvoice = null;
    if (updateData.pricing) {
      // Find existing invoice
      const existingInvoice = await Invoice.findOne({
        reservationId: reservation._id,
        isDeleted: false
      });

      if (existingInvoice) {
        // Regenerate invoice with updated pricing
        // Mark old invoice as deleted
        existingInvoice.isDeleted = true;
        await existingInvoice.save();

        // Create new invoice
        updatedInvoice = await createInvoiceFromReservation(reservation, req.user._id);
      }
    }

    await reservation.populate('bookingContact', 'firstName lastName email phone');

    return res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: {
        reservation: reservation,
        invoice: updatedInvoice // ✅ Include updated invoice if regenerated
      }
    });

  } catch (error) {
    console.error('Update reservation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update reservation'
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
    }).populate('driver', 'firstName lastName userId');

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

    // Handle status-specific logic
    if (status === 'cancelled') {
      // Set cancellation details
      reservation.cancellationReason = cancellationReason || 'Not specified';
      reservation.cancelledAt = new Date();
      reservation.cancelledBy = req.user._id;

      // If driver is assigned, free them up
      if (reservation.driver) {
        await Driver.findByIdAndUpdate(reservation.driver._id, {
          isAvailable: true,
          currentTrip: null
        });
      }
    }

    // Update status
    reservation.status = status;

    // Set timestamps for other statuses
    const timestampMap = {
      confirmed: 'confirmedAt',
      dispatched: 'dispatchedAt',
      started: 'startedAt',
      completed: 'completedAt'
    };

    if (timestampMap[status]) {
      reservation[timestampMap[status]] = new Date();
    }

    reservation.updatedBy = req.user._id;
    await reservation.save();

    // Send notification based on status change
    try {
      const io = req.app.get('io');

      // For cancellation, notify driver
      if (status === 'cancelled' && reservation.driver) {
        await sendTripStatusNotification(
          reservation.driver._id,
          reservation._id,
          'cancelled',
          io
        );
      }

      // For started and completed, notify operator and customer
      if (status === 'started' || status === 'completed') {
        // If driver exists, send notification
        if (reservation.driver) {
          await sendTripStatusNotification(
            reservation.driver._id,
            reservation._id,
            status,
            io
          );
        }
      }

      // For dispatched, notify driver (if not already handled by assignDriver)
      if (status === 'dispatched' && reservation.driver) {
        await sendTripStatusNotification(
          reservation.driver._id,
          reservation._id,
          'dispatched',
          io
        );
      }

    } catch (notificationError) {
      console.error('Failed to send status notification:', notificationError);
      // Don't fail the request if notification fails
    }

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
        operator: req.user._id,
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
    /*const existingAssignment = await Reservation.findOne({
      operator: req.user._id,
      isDeleted: false,
      driver: driverId,
      status: { $in: ['confirmed', 'dispatched', 'started'] },
      _id: { $ne: id }
    });*/

    /*if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already assigned to another trip'
      });
    }*/

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Reservation must be confirmed before assigning a driver'
      });
    }

    reservation.driver = driverId;
    reservation.status = 'dispatched';
    reservation.dispatchedAt = new Date();
    reservation.updatedBy = req.user._id;
    await reservation.save();

    try {
      const io = req.app.get('io');
      await sendTripAssignedNotification(driver._id, reservation._id, io);
    } catch (e) {
      console.error('Assign notification error:', e);
    }

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



//=====================HELPERS=========================

// ============ HELPER: Generate Reservation Number ============
const generateReservationNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Reservation.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31)
    }
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `RES-${year}-${sequence}`;
};

// ============ HELPER: Create Invoice from Reservation ============
const createInvoiceFromReservation = async (reservation, createdBy) => {
    try {
        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({
            reservationId: reservation._id,
            isDeleted: false
        });

        if (existingInvoice) {
            return existingInvoice;
        }

        // Get customer details
        let customerName = 'Unknown Customer';
        let customerEmail = null;
        let customerPhone = null;
        let customerId = null;

        if (reservation.bookingContact) {
            const customer = await Contact.findById(reservation.bookingContact)
                .select('firstName lastName email phone');
            
            if (customer) {
                customerId = customer._id;
                const firstName = customer.firstName || '';
                const lastName = customer.lastName || '';
                customerName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';
                customerEmail = customer.email || null;
                customerPhone = customer.phone?.number || customer.phone || null;
            }
        }

        // Build invoice items
        let items = [];
        if (reservation.pricing?.items && reservation.pricing.items.length > 0) {
            items = reservation.pricing.items.map(item => ({
                description: item.label || item.name || 'Service',
                quantity: 1,
                rate: item.amount || 0,
                amount: item.amount || 0
            }));
        } else {
            items.push({
                description: 'Transportation Service',
                quantity: 1,
                rate: reservation.pricing?.total || 0,
                amount: reservation.pricing?.total || 0
            });
        }

        const subtotal = reservation.pricing?.subtotal || reservation.pricing?.total || 0;
        const taxRate = reservation.pricing?.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const discount = reservation.pricing?.discount || 0;
        const total = subtotal + taxAmount - discount;

        const invoiceNumber = await generateInvoiceNumber(reservation.operatorId || createdBy);

        const invoice = await Invoice.create({
            operatorId: reservation.operatorId || createdBy,
            reservationId: reservation._id,
            reservationNumber: reservation.reservationNumber,
            customerId: customerId || reservation.bookingContact,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            items: items,
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate: taxRate,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(Math.max(0, total) * 100) / 100,
            currency: 'USD',
            status: 'draft',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: `Invoice for reservation ${reservation.reservationNumber}`,
            createdBy: createdBy,
            invoiceNumber: invoiceNumber
        });

        return invoice;
    } catch (error) {
        console.error('Create invoice from reservation error:', error);
        throw error;
    }
};

// ============ HELPER: Generate Invoice Number ============
const generateInvoiceNumber = async (operatorId) => {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({
        operatorId: operatorId,
        createdAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31)
        }
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}-${sequence}`;
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