// modules/driver/controllers/driverController.js
const Driver = require('../../../models/settings/Driver');
const Reservation = require('../../../models/Reservation');
const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');   // add near the other requires

const {
  sendTripStatusNotification,
  sendAvailabilityNotification
} = require('./notificationController')

// ============ CHANGE PASSWORD ============
const MIN_PASSWORD_LENGTH = 8;   // keep in sync with the modal

/**
 * req.user is the authenticated User doc (role: 'driver').
 * reservation.driver references the Driver collection (ref: 'Driver'),
 * and Driver links back to User via Driver.userId.
 * So every driver-scoped query must resolve the Driver doc first,
 * then filter reservations by driver._id — NOT req.user._id.
 */
const getDriverDoc = async (userId) => Driver.findOne({ userId });

// ============ PROFILE ============
const getDriverProfile = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    // Return only the display fields the panel needs
    const { firstName, lastName, phone, profilePicture, isAvailable } = driver;
    return res.status(200).json({
      success: true,
      data: { firstName, lastName, phone, profilePicture, isAvailable }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TRIPS ============
// Add to getDriverTrips function
const getDriverTrips = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const { status, date, page = 1, limit = 50 } = req.query;
    const query = {
      driver: driver._id,
      isDeleted: false
    };

    // Accept a single status or comma list
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query.status = statuses[0];
      } else if (statuses.length > 1) {
        query.status = { $in: statuses };
      }
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.pickupDateTime = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [trips, total] = await Promise.all([
      Reservation.find(query)
        .populate('bookingContact', 'firstName lastName phone email')
        .populate('vehicle', 'name type images')
        .sort({ pickupDateTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Reservation.countDocuments(query)
    ]);

    return res.status(200).json({ 
      success: true, 
      data: trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getDriverTripById = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: driver._id,
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

// ============ START TRIP ============
const startTrip = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: driver._id,
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

    // ============ SEND NOTIFICATION ============
    const io = req.app.get('io');
    await sendTripStatusNotification(driver._id, trip._id, 'started', io);

    return res.status(200).json({
      success: true,
      message: 'Trip started successfully',
      data: trip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ COMPLETE TRIP ============
const completeTrip = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const trip = await Reservation.findOne({
      _id: req.params.id,
      driver: driver._id,
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

    // ============ SEND NOTIFICATION ============
    const io = req.app.get('io');
    await sendTripStatusNotification(driver._id, trip._id, 'completed', io);

    return res.status(200).json({
      success: true,
      message: 'Trip completed successfully',
      data: trip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ UPDATE AVAILABILITY ============
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const driver = await Driver.findOneAndUpdate(
      { userId: req.user._id },
      { isAvailable },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    // ============ SEND NOTIFICATION ============
    const io = req.app.get('io');
    await sendAvailabilityNotification(driver._id, isAvailable, io);

    return res.status(200).json({
      success: true,
      message: `Driver ${isAvailable ? 'available' : 'unavailable'}`,
      data: driver
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ LOCATION TRACKING (not completed yet)============
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
// modules/driver/controllers/driverController.js

// ============ EARNINGS ============
const getEarnings = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'all') {
      startDate = new Date(0); // Beginning of time
    }

    const trips = await Reservation.find({
      driver: driver._id,
      status: 'completed',
      completedAt: { $gte: startDate }
    })
    .populate('bookingContact', 'firstName lastName phone')
    .sort({ completedAt: -1 });

    const totalEarnings = trips.reduce((sum, t) => sum + (t.pricing?.total || 0), 0);
    
    // Calculate paid vs unpaid (paymentStatus field)
    const paidTrips = trips.filter(t => t.paymentStatus === 'paid');
    const unpaidTrips = trips.filter(t => t.paymentStatus === 'unpaid' || !t.paymentStatus);
    
    const paidBalance = paidTrips.reduce((sum, t) => sum + (t.pricing?.total || 0), 0);
    const unpaidBalance = unpaidTrips.reduce((sum, t) => sum + (t.pricing?.total || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        tripCount: trips.length,
        paidBalance,
        unpaidBalance,
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
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTrips, pendingTrips, totalEarnings] = await Promise.all([
      Reservation.countDocuments({
        driver: driver._id,
        pickupDateTime: { $gte: today }
      }),
      Reservation.countDocuments({
        driver: driver._id,
        status: { $in: ['confirmed', 'dispatched'] }
      }),
      Reservation.aggregate([
        { $match: { driver: driver._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        todayTrips,
        pendingTrips,
        totalEarnings: totalEarnings[0]?.total || 0,
        isAvailable: driver.isAvailable   // read from Driver doc, not req.user
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from the current one' });
    }

    // req.user is the authenticated User doc (role: 'driver')
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Assign plaintext — the User pre-save hook hashes it. Do NOT bcrypt here (would double-hash).
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDriverProfile,
  getDriverTrips,
  getDriverTripById,
  startTrip,
  completeTrip,
  updateAvailability,
  updateLocation,
  getEarnings,
  getDriverStats,
  changePassword
};