// controllers/dispatchController.js
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/settings/Driver');

// Get dispatch board data
const getDispatchBoard = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Get today's reservations
    const reservations = await Reservation.find({
      operatorId: req.user._id,
      isDeleted: false,
      pickupDateTime: { $gte: start, $lte: end }
    })
      .populate('vehicle', 'name type')
      .populate('driver', 'firstName lastName')
      .populate('bookingContact', 'firstName lastName')
      .sort({ pickupDateTime: 1 })
      .lean();

    // Get all vehicles
    const vehicles = await Vehicle.find({
      operatorId: req.user._id,
      isActive: true
    }).select('name type').lean();

    // Get available drivers
    const drivers = await Driver.find({
      operatorId: req.user._id,
      isActive: true,
      isAvailable: true
    }).select('firstName lastName').lean();

    // Group by status for Kanban
    const kanban = {
      pending: [],
      confirmed: [],
      dispatched: [],
      started: [],
      completed: []
    };

    reservations.forEach(r => {
      if (kanban[r.status]) kanban[r.status].push(r);
    });

    return res.status(200).json({
      success: true,
      data: { date: targetDate, vehicles, drivers, kanban, reservations }
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dispatch' });
  }
};

// Assign driver to reservation
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    const driver = await Driver.findOne({
      _id: driverId,
      operatorId: req.user._id,
      isActive: true
    });

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    reservation.driver = driverId;
    reservation.status = 'dispatched';
    reservation.dispatchedAt = new Date();
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Driver ${driver.firstName} assigned`,
      data: reservation
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign driver' });
  }
};

// Update reservation status (drag & drop)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    reservation.status = status;
    if (status === 'started') reservation.startedAt = new Date();
    if (status === 'completed') reservation.completedAt = new Date();
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: reservation
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

module.exports = { getDispatchBoard, assignDriver, updateStatus };