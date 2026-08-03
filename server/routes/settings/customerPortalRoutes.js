// routes/customerPortalRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCustomerPortalSettings,
  updatePaymentSettings,
  updateSettingsTab,
  updateBranding,
  updatePromoCodes,
  getVehiclesForDropdown
} = require('../../controllers/settings/customerPortalController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');
const upload = require('../../middleware/multer');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

// Get all settings
router.get('/', getCustomerPortalSettings);

// Payments Tab
router.patch('/payments', updatePaymentSettings);

// Settings Tab
router.patch('/settings', updateSettingsTab);

// Branding Tab
router.patch('/branding', upload.single('logo'), updateBranding);

// Promo Codes Tab
router.patch('/promo-codes', updatePromoCodes);

// Get vehicles for dropdown
router.get('/vehicles', getVehiclesForDropdown);

module.exports = router;