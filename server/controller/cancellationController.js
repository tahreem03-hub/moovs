// controllers/cancellationController.js
const mongoose = require('mongoose');
const CancellationPolicy = require('../models/settings/CancellationPolicy')

const createPolicy = async (req, res) => {
  try {
    const { name, level, description, refundConditions, vehicleType } = req.body;

    const policy = await CancellationPolicy.create({
      name,
      level,
      description,
      refundConditions,
      vehicleType,
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Cancellation policy created successfully',
      data: policy
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Create policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create cancellation policy'
    });
  }
};

const getPolicies = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const policies = await CancellationPolicy.find(query)
      .select('name level refundConditions vehicleType createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Get policies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cancellation policies'
    });
  }
};

const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy ID'
      });
    }

    const policy = await CancellationPolicy.findById(id).lean();

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation policy not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Get policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cancellation policy'
    });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, description, refundConditions, vehicleType, isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy ID'
      });
    }

    const policy = await CancellationPolicy.findById(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation policy not found'
      });
    }

    if (name) policy.name = name;
    if (level) policy.level = level;
    if (description !== undefined) policy.description = description;
    if (refundConditions) policy.refundConditions = refundConditions;
    if (vehicleType) policy.vehicleType = vehicleType;
    if (isActive !== undefined) policy.isActive = isActive;

    await policy.save();

    return res.status(200).json({
      success: true,
      message: 'Cancellation policy updated successfully',
      data: policy
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cancellation policy'
    });
  }
};

const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy ID'
      });
    }

    const policy = await CancellationPolicy.findByIdAndDelete(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation policy not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cancellation policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete cancellation policy'
    });
  }
};

const getPolicyDropdown = async (req, res) => {
  try {
    const policies = await CancellationPolicy.find({ isActive: true })
      .select('name level _id')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Get policy dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch policies for dropdown'
    });
  }
};

module.exports = {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  getPolicyDropdown
};