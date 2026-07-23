// controllers/payableController.js
const Payable = require('../models/Payable');
const Driver = require('../models/settings/Driver');

// Create payable
const createPayable = async (req, res) => {
  try {
    const { driverId, type, description, amount, dueDate } = req.body;

    let driverName = '';
    if (driverId) {
      const driver = await Driver.findOne({ _id: driverId, operatorId: req.user._id });
      if (driver) driverName = `${driver.firstName} ${driver.lastName}`;
    }

    const payable = await Payable.create({
      operatorId: req.user._id,
      driverId: driverId || null,
      driverName,
      type,
      description,
      amount,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: req.user._id
    });

    return res.status(201).json({ success: true, message: 'Payable created', data: payable });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create payable' });
  }
};

// Get payables
const getPayables = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = { operatorId: req.user._id, isDeleted: false };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Payable.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Payable.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: { total, page, limit } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payables' });
  }
};

// Update payable status
const updatePayableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payable = await Payable.findOne({ _id: id, operatorId: req.user._id });
    if (!payable) return res.status(404).json({ success: false, message: 'Payable not found' });

    payable.status = status;
    if (status === 'approved') { payable.approvedBy = req.user._id; payable.approvedAt = new Date(); }
    if (status === 'paid') payable.paidAt = new Date();
    await payable.save();

    return res.status(200).json({ success: true, message: `Payable ${status}`, data: payable });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update payable' });
  }
};

const deletePayable = async (req, res) => {
  try {
    await Payable.findOneAndUpdate(
      { _id: req.params.id, operatorId: req.user._id },
      { isDeleted: true }
    );
    return res.status(200).json({ success: true, message: 'Payable deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete payable' });
  }
};

module.exports = { createPayable, getPayables, updatePayableStatus, deletePayable };