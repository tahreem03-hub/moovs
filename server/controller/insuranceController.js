// controllers/insuranceController.js
const mongoose = require('mongoose');
const Insurance = require('../models/settings/Insurance');

// Create Insurance
const createInsurance = async (req, res) => {
  try {
    const {
      provider,
      policyNumber,
      type,
      coverageAmount,
      deductible,
      startDate,
      endDate,
      notes
    } = req.body;

    // Check if policy number already exists
    const existing = await Insurance.findOne({ policyNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Insurance policy with this number already exists'
      });
    }

    const insurance = await Insurance.create({
      provider,
      policyNumber,
      type,
      coverageAmount,
      deductible: deductible || 0,
      startDate,
      endDate,
      notes,
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Insurance policy created successfully',
      data: insurance
    });
  } catch (error) {
    /*if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }*/
    console.error('Create insurance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create insurance policy'
    });
  }
};

// Get All Insurances
const getInsurances = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.$or = [
        { provider: { $regex: search.trim(), $options: 'i' } },
        { policyNumber: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const insurances = await Insurance.find(query)
      .select('provider policyNumber type coverageAmount startDate endDate createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: insurances
    });
  } catch (error) {
    console.error('Get insurances error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policies'
    });
  }
};

// Get Insurance by ID
const getInsuranceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid insurance ID'
      });
    }

    const insurance = await Insurance.findById(id).lean();

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Get insurance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policy'
    });
  }
};

// Update Insurance
const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      provider,
      policyNumber,
      type,
      coverageAmount,
      deductible,
      startDate,
      endDate,
      notes,
      isActive
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid insurance ID'
      });
    }

    const insurance = await Insurance.findById(id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    // Check duplicate policy number if changed
    if (policyNumber && policyNumber !== insurance.policyNumber) {
      const existing = await Insurance.findOne({ 
        policyNumber, 
        _id: { $ne: id } 
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Insurance policy with this number already exists'
        });
      }
    }

    if (provider) insurance.provider = provider;
    if (policyNumber) insurance.policyNumber = policyNumber;
    if (type) insurance.type = type;
    if (coverageAmount !== undefined) insurance.coverageAmount = coverageAmount;
    if (deductible !== undefined) insurance.deductible = deductible;
    if (startDate) insurance.startDate = startDate;
    if (endDate) insurance.endDate = endDate;
    if (notes !== undefined) insurance.notes = notes;
    if (isActive !== undefined) insurance.isActive = isActive;

    await insurance.save();

    return res.status(200).json({
      success: true,
      message: 'Insurance policy updated successfully',
      data: insurance
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update insurance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update insurance policy'
    });
  }
};

// Delete Insurance
const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid insurance ID'
      });
    }

    const insurance = await Insurance.findByIdAndDelete(id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Insurance policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete insurance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete insurance policy'
    });
  }
};

// Get Insurance Dropdown
const getInsuranceDropdown = async (req, res) => {
  try {
    const insurances = await Insurance.find({ isActive: true })
      .select('provider policyNumber _id')
      .sort({ provider: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: insurances
    });
  } catch (error) {
    console.error('Get insurance dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policies for dropdown'
    });
  }
};

module.exports = {
  createInsurance,
  getInsurances,
  getInsuranceById,
  updateInsurance,
  deleteInsurance,
  getInsuranceDropdown
};