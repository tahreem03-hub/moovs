// modules/customer/controllers/customerController.js
const Contact = require('../../../models/Contact');
const Reservation = require('../../../models/Reservation');
const Quote = require('../../../models/Quote');
const Vehicle = require('../../../models/Vehicle');
const Invoice = require('../../../models/Invoice');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ============ AUTH ============
const customerRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with role 'customer'
    const user = await User.create({
      Fname: firstName,
      Lname: lastName,
      email,
      password: hashedPassword,
      role: 'customer',
      isActive: true
    });
    
    // Create contact record
    await Contact.create({
      firstName,
      lastName,
      email,
      phone: { number: phone },
      createdBy: user._id,
      operatorId: null // Customer is not an operator
    });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES
    });
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        firstName: user.Fname,
        lastName: user.Lname,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = user.getJwtToken();
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.Fname,
        lastName: user.Lname,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PROFILE ============
const getCustomerProfile = async (req, res) => {
  try {
    const contact = await Contact.findOne({ email: req.user.email });
    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ QUOTES ============
const requestQuote = async (req, res) => {
  try {
    const { pickup, dropoff, date, time, passengers, vehicleType } = req.body;
    
    // Find contact for this customer
    const contact = await Contact.findOne({ email: req.user.email });
    
    const quote = await Quote.create({
      bookingContact: contact?._id || null,
      passenger: contact?._id || null,
      tripType: 'one_way',
      pickupDateTime: new Date(`${date}T${time}`),
      stops: [
        { type: 'pickup', address: pickup },
        { type: 'dropoff', address: dropoff }
      ],
      passengerCount: passengers || 0,
      vehicle: vehicleType || null,
      source: 'customer_portal',
      status: 'new',
      createdBy: req.user._id,
      operatorId: null // No operator assigned yet
    });
    
    return res.status(201).json({
      success: true,
      message: 'Quote requested successfully',
      data: quote
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerQuotes = async (req, res) => {
  try {
    const contact = await Contact.findOne({ email: req.user.email });
    const quotes = await Quote.find({
      bookingContact: contact?._id,
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ RESERVATIONS ============
const createReservation = async (req, res) => {
  try {
    const { pickup, dropoff, date, time, passengers, vehicleId, tripType } = req.body;
    
    const contact = await Contact.findOne({ email: req.user.email });
    
    // Find available vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    const reservation = await Reservation.create({
      bookingContact: contact?._id,
      passenger: contact?._id,
      tripType: tripType || 'one_way',
      orderType: 'retail',
      pickupDateTime: new Date(`${date}T${time}`),
      stops: [
        { type: 'pickup', address: pickup },
        { type: 'dropoff', address: dropoff }
      ],
      passengerCount: passengers || 0,
      vehicle: vehicleId,
      status: 'confirmed',
      confirmedAt: new Date(),
      source: 'customer_portal',
      createdBy: req.user._id,
      operatorId: null // Needs operator assignment
    });
    
    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerReservations = async (req, res) => {
  try {
    const contact = await Contact.findOne({ email: req.user.email });
    const reservations = await Reservation.find({
      bookingContact: contact?._id,
      isDeleted: false
    })
      .populate('vehicle', 'name type images')
      .populate('driver', 'firstName lastName phone')
      .sort({ pickupDateTime: 1 })
      .lean();
    
    return res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({ email: req.user.email });
    
    const reservation = await Reservation.findOne({
      _id: id,
      bookingContact: contact?._id,
      isDeleted: false
    });
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    if (reservation.status === 'started' || reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel trip that has already started or completed'
      });
    }
    
    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    await reservation.save();
    
    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: reservation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ VEHICLES ============
const getAvailableVehicles = async (req, res) => {
  try {
    const { passengers, date } = req.query;
    const query = { isActive: true };
    
    if (passengers) {
      query.passengerCapacity = { $gte: parseInt(passengers) };
    }
    
    const vehicles = await Vehicle.find(query)
      .select('name type passengerCapacity images price')
      .lean();
    
    return res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TRACKING ============
const trackRide = async (req, res) => {
  try {
    const { reservationNumber } = req.params;
    
    const reservation = await Reservation.findOne({
      reservationNumber,
      isDeleted: false
    })
      .populate('driver', 'firstName lastName phone')
      .populate('vehicle', 'name type');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Get driver location from Redis (mock for now)
    const driverLocation = null;
    
    return res.status(200).json({
      success: true,
      data: {
        reservation,
        driverLocation
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PAYMENTS ============
const makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const contact = await Contact.findOne({ email: req.user.email });
    const reservation = await Reservation.findOne({
      _id: id,
      bookingContact: contact?._id,
      isDeleted: false
    });
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Process payment (integration with Stripe/PayPal)
    // For now, mark as paid
    reservation.paymentStatus = 'paid';
    reservation.isClosed = true;
    reservation.closedAt = new Date();
    await reservation.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: reservation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ INVOICES ============
const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      customerEmail: req.user.email,
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  customerRegister,
  customerLogin,
  getCustomerProfile,
  requestQuote,
  getCustomerQuotes,
  createReservation,
  getCustomerReservations,
  cancelReservation,
  getAvailableVehicles,
  trackRide,
  makePayment,
  getCustomerInvoices
};