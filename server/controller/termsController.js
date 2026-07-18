// controllers/termsController.js
const mongoose = require('mongoose');
const TermsAndConditions = require('../models/settings/TermsAndConditions');

// Create Terms
const createTerms = async (req, res) => {
  try {
    const {
      title,
      content,
      sections,
      waitingCharges,
      extraStops,
      carSeats,
      alcoholPolicy
    } = req.body;

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await TermsAndConditions.updateMany({}, { isDefault: false });
    }

    const terms = await TermsAndConditions.create({
      title,
      content,
      sections,
      waitingCharges,
      extraStops,
      carSeats,
      alcoholPolicy,
      isDefault: req.body.isDefault || false,
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Terms & Conditions created successfully',
      data: terms
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Create terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Terms & Conditions'
    });
  }
};

// Get All Terms
const getTerms = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const terms = await TermsAndConditions.find(query)
      .select('title isDefault createdAt')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Terms & Conditions'
    });
  }
};

// Get Default Terms
const getDefaultTerms = async (req, res) => {
  try {
    const terms = await TermsAndConditions.findOne({ isDefault: true, isActive: true }).lean();

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'No default Terms & Conditions found'
      });
    }

    return res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get default terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch default Terms & Conditions'
    });
  }
};

// Get Terms by ID
const getTermsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid terms ID'
      });
    }

    const terms = await TermsAndConditions.findById(id).lean();

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Terms & Conditions'
    });
  }
};

// Update Terms
const updateTerms = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      sections,
      waitingCharges,
      extraStops,
      carSeats,
      alcoholPolicy,
      isDefault,
      isActive
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid terms ID'
      });
    }

    const terms = await TermsAndConditions.findById(id);

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await TermsAndConditions.updateMany(
        { _id: { $ne: id } },
        { isDefault: false }
      );
    }

    if (title) terms.title = title;
    if (content) terms.content = content;
    if (sections) terms.sections = sections;
    if (waitingCharges !== undefined) terms.waitingCharges = waitingCharges;
    if (extraStops !== undefined) terms.extraStops = extraStops;
    if (carSeats !== undefined) terms.carSeats = carSeats;
    if (alcoholPolicy !== undefined) terms.alcoholPolicy = alcoholPolicy;
    if (isDefault !== undefined) terms.isDefault = isDefault;
    if (isActive !== undefined) terms.isActive = isActive;

    await terms.save();

    return res.status(200).json({
      success: true,
      message: 'Terms & Conditions updated successfully',
      data: terms
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update Terms & Conditions'
    });
  }
};

// Delete Terms
const deleteTerms = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid terms ID'
      });
    }

    const terms = await TermsAndConditions.findById(id);

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    // Cannot delete default terms
    if (terms.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default Terms & Conditions'
      });
    }

    await TermsAndConditions.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Terms & Conditions deleted successfully'
    });
  } catch (error) {
    console.error('Delete terms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete Terms & Conditions'
    });
  }
};

module.exports = {
  createTerms,
  getTerms,
  getDefaultTerms,
  getTermsById,
  updateTerms,
  deleteTerms
};