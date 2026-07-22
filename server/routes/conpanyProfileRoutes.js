const express = require('express');
const router = express.Router();
const {
  getCompanyProfile,
  updateCompanyProfile,
  getCommunicationSettings,
  updateCommunicationSettings,
  verifyDomain,
  testEmailConfig,
  getPaymentSettings,
  updatePaymentSettings,
  getPreferenceSettings,
  updatePreferenceSettings,
  getCustomerPortalPayments,
  updateCustomerPortalPayments,
  getCustomerPortalSettings,
  updateCustomerPortalSettings,
  getCustomerPortalBranding,
  updateCustomerPortalBranding,
  getCustomerPortalPromoCodes,
  updateCustomerPortalPromoCodes
} = require('../controller/companyProfileController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/multer');

// All routes require authentication
router.use(isAuthenticated);

// ============ COMPANY TAB ============
router.get('/profile', getCompanyProfile);
router.put('/profile', upload.single('logo'), updateCompanyProfile);

// ============ COMMUNICATION TAB ============
router.get('/communication', getCommunicationSettings);
router.put('/communication', updateCommunicationSettings);
router.post('/verify-domain', verifyDomain);
router.post('/test-email', testEmailConfig);

// ============ PAYMENTS TAB ============
router.get('/payments', getPaymentSettings);
router.put('/payments', updatePaymentSettings);

// ============ PREFERENCES TAB ============
router.get('/preferences', getPreferenceSettings);
router.put('/preferences', updatePreferenceSettings);

// ============ CUSTOMER PORTAL - PAYMENTS TAB ============
router.get('/customer-portal/payments', getCustomerPortalPayments);
router.put('/customer-portal/payments', updateCustomerPortalPayments);

// ============ CUSTOMER PORTAL - SETTINGS TAB ============
router.get('/customer-portal/settings', getCustomerPortalSettings);
router.put('/customer-portal/settings', updateCustomerPortalSettings);

// ============ CUSTOMER PORTAL - BRANDING TAB ============
router.get('/customer-portal/branding', getCustomerPortalBranding);
router.put('/customer-portal/branding', upload.single('logo'), updateCustomerPortalBranding);

// ============ CUSTOMER PORTAL - PROMO CODES TAB ============
router.get('/customer-portal/promo-codes', getCustomerPortalPromoCodes);
router.put('/customer-portal/promo-codes', updateCustomerPortalPromoCodes);

module.exports = router;