// controllers/driverTrackingController.js
const Driver = require('../models/settings/Driver');
const Reservation = require('../models/Reservation');

// Get all drivers with their current status
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      operatorId: req.user._id,
      isActive: true
    }).select('firstName lastName phone isAvailable').lean();

    // Get current trip for each driver
    const driversWithStatus = await Promise.all(drivers.map(async (driver) => {
      const currentTrip = await Reservation.findOne({
        operatorId: req.user._id,
        driver: driver._id,
        isDeleted: false,
        status: { $in: ['dispatched', 'started'] }
      })
        .populate('bookingContact', 'firstName lastName')
        .populate('vehicle', 'name')
        .select('reservationNumber pickupDateTime status')
        .lean();

      return {
        ...driver,
        currentTrip: currentTrip || null,
        // Mock location - in production would come from GPS
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.05,
          lng: -74.0060 + (Math.random() - 0.5) * 0.05
        },
        lastUpdated: new Date()
      };
    }));

    return res.status(200).json({
      success: true,
      data: driversWithStatus
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch drivers' });
  }
};

// Get single driver with trip details
const getDriverDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOne({
      _id: id,
      operatorId: req.user._id
    }).select('firstName lastName phone isAvailable');

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    // Get current and upcoming trips
    const trips = await Reservation.find({
      operatorId: req.user._id,
      driver: id,
      isDeleted: false,
      status: { $nin: ['completed', 'cancelled'] }
    })
      .populate('bookingContact', 'firstName lastName phone')
      .populate('vehicle', 'name type')
      .sort({ pickupDateTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { driver, trips }
    });
  } catch (error) {
    console.error('Get driver details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch driver details' });
  }
};

// Update driver availability
const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const driver = await Driver.findOneAndUpdate(
      { _id: id, operatorId: req.user._id },
      { isAvailable },
      { new: true }
    );

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    return res.status(200).json({
      success: true,
      message: `Driver ${isAvailable ? 'available' : 'unavailable'}`,
      data: driver
    });
  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

module.exports = { getDrivers, getDriverDetails, updateAvailability };