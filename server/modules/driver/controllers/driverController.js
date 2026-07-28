// modules/driver/controllers/driverController.js
const Driver = require('../../../models/settings/Driver');
const Reservation = require('../../../models/Reservation');
const Vehicle = require('../../../models/Vehicle');

// ============ AUTH ============
const driverLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find driver by email (using User model or separate Driver model)
    // For now, assuming drivers are Users with role 'driver'
    const user = await User.findOne({ email, role: 'driver' });
    
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
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PROFILE ============
const getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ 
      operatorId: req.user._id 
    }).select('firstName lastName phone profilePicture isAvailable');
    
    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TRIPS ============
const getDriverTrips = async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = {
      driver: req.user._id,
      isDeleted: false
    };
    
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.pickupDateTime = { $gte: start, $lte: end };
    }
    
    const trips = await Reservation.find(query)
      .populate('bookingContact', 'firstName lastName phone')
      .populate('vehicle', 'name type images')
      .sort({ pickupDateTime: 1 })
      .lean();
    
    return res.status(200).json({ success: true, data: trips });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDriverTripById = async (req, res) => {
  try {
    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: req.user._id,
      isDeleted: false
    })
      .populate('bookingContact', 'firstName lastName phone email')
      .populate('vehicle', 'name type images')
      .lean();
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const startTrip = async (req, res) => {
  try {
    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: req.user._id,
      isDeleted: false
    });
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    if (trip.status !== 'dispatched' && trip.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot start trip with status: ${trip.status}`
      });
    }
    
    trip.status = 'started';
    trip.startedAt = new Date();
    await trip.save();
    
    return res.status(200).json({
      success: true,
      message: 'Trip started successfully',
      data: trip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const completeTrip = async (req, res) => {
  try {
    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: req.user._id,
      isDeleted: false
    });
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    if (trip.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete trip with status: ${trip.status}`
      });
    }
    
    trip.status = 'completed';
    trip.completedAt = new Date();
    await trip.save();
    
    return res.status(200).json({
      success: true,
      message: 'Trip completed successfully',
      data: trip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ AVAILABILITY ============
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      { isAvailable },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: `Driver ${isAvailable ? 'available' : 'unavailable'}`,
      data: driver
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ LOCATION TRACKING ============
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, speed, heading } = req.body;
    
    // Store in Redis or a location collection
    // Broadcast to dispatch via WebSocket
    
    return res.status(200).json({
      success: true,
      message: 'Location updated',
      data: { lat, lng, speed, heading }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ EARNINGS ============
const getEarnings = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate = new Date();
    if (period === 'today') startDate.setHours(0, 0, 0, 0);
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    
    const trips = await Reservation.find({
      driver: req.user._id,
      status: 'completed',
      completedAt: { $gte: startDate }
    });
    
    const totalEarnings = trips.reduce((sum, t) => sum + (t.pricing?.total || 0), 0);
    const count = trips.length;
    
    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        tripCount: count,
        period,
        trips
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ STATS ============
const getDriverStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayTrips, pendingTrips, totalEarnings] = await Promise.all([
      Reservation.countDocuments({
        driver: req.user._id,
        pickupDateTime: { $gte: today }
      }),
      Reservation.countDocuments({
        driver: req.user._id,
        status: { $in: ['confirmed', 'dispatched'] }
      }),
      Reservation.aggregate([
        { $match: { driver: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ])
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        todayTrips,
        pendingTrips,
        totalEarnings: totalEarnings[0]?.total || 0,
        isAvailable: req.user.isAvailable
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  driverLogin,
  getDriverProfile,
  getDriverTrips,
  getDriverTripById,
  startTrip,
  completeTrip,
  updateAvailability,
  updateLocation,
  getEarnings,
  getDriverStats
};