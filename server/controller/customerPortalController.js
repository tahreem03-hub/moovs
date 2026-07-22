// controllers/customerPortalController.js
const mongoose = require('mongoose');
const CompanyProfile = require('../models/settings/CompanyProfile');
const TermsAndConditions = require('../models/settings/TermsAndConditions');
const Vehicle = require('../models/Vehicle');
const fs = require('fs');
const path = require('path');

// Helper to delete logo file
const deleteLogoFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '../uploads/branding', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting branding logo:', err);
    }
  });
};

// ============ GET ALL CUSTOMER PORTAL SETTINGS ============
const getCustomerPortalSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: profile.customerPortal || {}
    });
  } catch (error) {
    console.error('Get customer portal settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer portal settings'
    });
  }
};

// ============ UPDATE PAYMENTS TAB ============
const updatePaymentSettings = async (req, res) => {
  try {
    const { creditCardEnabled, paymentPreference, depositAmount, depositType } = req.body;
    
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }

    if (!profile.customerPortal) profile.customerPortal = {};
    if (!profile.customerPortal.payments) profile.customerPortal.payments = {};

    if (creditCardEnabled !== undefined) {
      profile.customerPortal.payments.creditCardEnabled = creditCardEnabled;
    }
    if (paymentPreference) {
      profile.customerPortal.payments.paymentPreference = paymentPreference;
    }
    if (depositAmount !== undefined) {
      profile.customerPortal.payments.depositAmount = depositAmount;
    }
    if (depositType) {
      profile.customerPortal.payments.depositType = depositType;
    }

    await profile.save();
    return res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully',
      data: profile.customerPortal.payments
    });
  } catch (error) {
    console.error('Update payment settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment settings'
    });
  }
};

// ============ UPDATE SETTINGS TAB ============
const updateSettingsTab = async (req, res) => {
  try {
    const {
      tripTypes,
      gratuity,
      customerSignature,
      reservationCutoff,
      requestChanges,
      locationRestriction,
      skipVehicleSelection,
      vehicleOrder,
      vehicleOrderDirection
    } = req.body;

    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }

    if (!profile.customerPortal) profile.customerPortal = {};
    if (!profile.customerPortal.settings) profile.customerPortal.settings = {};

    // Validate Terms & Conditions for customer signature
    if (customerSignature?.enabled) {
      const termsCount = await TermsAndConditions.countDocuments({ isActive: true });
      if (termsCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Must have at least one active Terms & Conditions to turn consent setting on'
        });
      }
    }

    // Trip Types
    if (tripTypes) {
      profile.customerPortal.settings.tripTypes = {
        ...profile.customerPortal.settings.tripTypes,
        ...tripTypes
      };
    }

    // Gratuity
    if (gratuity) {
      if (gratuity.minPercentage && gratuity.minPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum percentage cannot exceed 100%'
        });
      }
      profile.customerPortal.settings.gratuity = {
        ...profile.customerPortal.settings.gratuity,
        ...gratuity
      };
    }

    // Customer Signature
    if (customerSignature) {
      profile.customerPortal.settings.customerSignature = customerSignature;
    }

    // Reservation Cutoff
    if (reservationCutoff) {
      profile.customerPortal.settings.reservationCutoff = reservationCutoff;
    }

    // Request Changes
    if (requestChanges) {
      profile.customerPortal.settings.requestChanges = requestChanges;
    }

    // Location Restriction
    if (locationRestriction) {
      profile.customerPortal.settings.locationRestriction = locationRestriction;
    }

    // Skip Vehicle Selection
    if (skipVehicleSelection) {
      if (skipVehicleSelection.enabled && skipVehicleSelection.defaultVehicleId) {
        const vehicleExists = await Vehicle.findById(skipVehicleSelection.defaultVehicleId);
        if (!vehicleExists) {
          return res.status(400).json({
            success: false,
            message: 'Selected default vehicle not found'
          });
        }
      }
      profile.customerPortal.settings.skipVehicleSelection = skipVehicleSelection;
    }

    // Vehicle Order
    if (vehicleOrder) {
      profile.customerPortal.settings.vehicleOrder = vehicleOrder;
    }
    if (vehicleOrderDirection) {
      profile.customerPortal.settings.vehicleOrderDirection = vehicleOrderDirection;
    }

    await profile.save();
    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: profile.customerPortal.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

// ============ UPDATE BRANDING TAB ============
const updateBranding = async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, fontFamily, buttonStyle } = req.body;
    
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }

    if (!profile.customerPortal) profile.customerPortal = {};
    if (!profile.customerPortal.branding) profile.customerPortal.branding = {};

    if (req.file) {
      if (profile.customerPortal.branding.logo?.filename) {
        deleteLogoFile(profile.customerPortal.branding.logo.filename);
      }
      profile.customerPortal.branding.logo = {
        url: `/uploads/branding/${req.file.filename}`,
        filename: req.file.filename
      };
    }

    if (primaryColor) profile.customerPortal.branding.primaryColor = primaryColor;
    if (secondaryColor) profile.customerPortal.branding.secondaryColor = secondaryColor;
    if (accentColor) profile.customerPortal.branding.accentColor = accentColor;
    if (fontFamily) profile.customerPortal.branding.fontFamily = fontFamily;
    if (buttonStyle) profile.customerPortal.branding.buttonStyle = buttonStyle;

    await profile.save();
    return res.status(200).json({
      success: true,
      message: 'Branding updated successfully',
      data: profile.customerPortal.branding
    });
  } catch (error) {
    if (req.file) deleteLogoFile(req.file.filename);
    console.error('Update branding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update branding'
    });
  }
};

// ============ UPDATE PROMO CODES ============
const updatePromoCodes = async (req, res) => {
  try {
    const { enabled, autoApply, codes } = req.body;
    
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }

    if (!profile.customerPortal) profile.customerPortal = {};
    if (!profile.customerPortal.promoCode) profile.customerPortal.promoCode = {};

    if (enabled !== undefined) profile.customerPortal.promoCode.enabled = enabled;
    if (autoApply !== undefined) profile.customerPortal.promoCode.autoApply = autoApply;
    if (codes) profile.customerPortal.promoCode.codes = codes;

    await profile.save();
    return res.status(200).json({
      success: true,
      message: 'Promo codes updated successfully',
      data: profile.customerPortal.promoCode
    });
  } catch (error) {
    console.error('Update promo codes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update promo codes'
    });
  }
};

// ============ GET VEHICLES FOR DROPDOWN ============
const getVehiclesForDropdown = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ 
      operatorId: req.user._id,
      isActive: true 
    })
      .select('name type passengerCapacity _id')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Get vehicles dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
};

module.exports = {
  getCustomerPortalSettings,
  updatePaymentSettings,
  updateSettingsTab,
  updateBranding,
  updatePromoCodes,
  getVehiclesForDropdown
};