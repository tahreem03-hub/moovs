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
} = require('../../controller/settings/customerPortalController');
const { isAuthenticated } = require('../../middleware/auth');
const upload = require('../../middleware/multer');

router.use(isAuthenticated);

// Get all settings
router.get('/', getCustomerPortalSettings);

// Payments Tab
router.put('/payments', updatePaymentSettings);

// Settings Tab
router.put('/settings', updateSettingsTab);

// Branding Tab
router.put('/branding', upload.single('logo'), updateBranding);

// Promo Codes Tab
router.put('/promo-codes', updatePromoCodes);

// Get vehicles for dropdown
router.get('/vehicles', getVehiclesForDropdown);

module.exports = router;