// controllers/tripRuleController.js
const mongoose = require('mongoose');
const TripRule = require('../models/settings/TripRule');

// Create Trip Rule
const createTripRule = async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate based on rule type
    if (ruleData.ruleType === 'specific_date' && !ruleData.specificDate) {
      return res.status(400).json({
        success: false,
        message: 'Specific date is required for this rule type'
      });
    }
    
    if (ruleData.ruleType === 'date_range' && (!ruleData.dateRange?.start || !ruleData.dateRange?.end)) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required for this rule type'
      });
    }
    
    if (ruleData.ruleType === 'time_of_day' && (!ruleData.timeOfDay?.start || !ruleData.timeOfDay?.end)) {
      return res.status(400).json({
        success: false,
        message: 'Time range is required for this rule type'
      });
    }

    const rule = await TripRule.create({
      ...ruleData,
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Trip rule created successfully',
      data: rule
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Create trip rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create trip rule'
    });
  }
};

// Get All Trip Rules
const getTripRules = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const rules = await TripRule.find(query)
      .populate('vehicles', 'name type')
      .select('name ruleType pricingAction adjustmentType adjustmentAmount applyToAllVehicles isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get trip rules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trip rules'
    });
  }
};

// Get Trip Rule by ID
const getTripRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rule ID'
      });
    }

    const rule = await TripRule.findById(id)
      .populate('vehicles', 'name type passengerCapacity')
      .lean();

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Trip rule not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Get trip rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trip rule'
    });
  }
};

// Update Trip Rule
const updateTripRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rule ID'
      });
    }

    const rule = await TripRule.findById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Trip rule not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        rule[key] = updates[key];
      }
    });

    await rule.save();

    return res.status(200).json({
      success: true,
      message: 'Trip rule updated successfully',
      data: rule
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update trip rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update trip rule'
    });
  }
};

// Delete Trip Rule
const deleteTripRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rule ID'
      });
    }

    const rule = await TripRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Trip rule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete trip rule'
    });
  }
};

// Toggle Active Status
const toggleTripRuleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rule ID'
      });
    }

    const rule = await TripRule.findById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Trip rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    return res.status(200).json({
      success: true,
      message: `Trip rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
      data: rule
    });
  } catch (error) {
    console.error('Toggle trip rule status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle trip rule status'
    });
  }
};

// Get Trip Rule Dropdown
const getTripRuleDropdown = async (req, res) => {
  try {
    const rules = await TripRule.find({ isActive: true })
      .select('name ruleType _id')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get trip rule dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trip rules for dropdown'
    });
  }
};

module.exports = {
  createTripRule,
  getTripRules,
  getTripRuleById,
  updateTripRule,
  deleteTripRule,
  toggleTripRuleStatus,
  getTripRuleDropdown
};