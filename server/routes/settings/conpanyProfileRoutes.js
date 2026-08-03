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
} = require('../../controllers/settings/companyProfileController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');
const upload = require('../../middleware/multer');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

// ============ COMPANY TAB ============
router.get('/profile', getCompanyProfile);
router.patch('/profile', upload.single('logo'), updateCompanyProfile);

// ============ COMMUNICATION TAB ============
router.get('/communication', getCommunicationSettings);
router.patch('/communication', updateCommunicationSettings);
router.post('/verify-domain', verifyDomain);
router.post('/test-email', testEmailConfig);

// ============ PAYMENTS TAB ============
router.get('/payments', getPaymentSettings);
router.patch('/payments', updatePaymentSettings);

// ============ PREFERENCES TAB ============
router.get('/preferences', getPreferenceSettings);
router.patch('/preferences', updatePreferenceSettings);

// ============ CUSTOMER PORTAL - PAYMENTS TAB ============
router.get('/customer-portal/payments', getCustomerPortalPayments);
router.patch('/customer-portal/payments', updateCustomerPortalPayments);

// ============ CUSTOMER PORTAL - SETTINGS TAB ============
router.get('/customer-portal/settings', getCustomerPortalSettings);
router.patch('/customer-portal/settings', updateCustomerPortalSettings);

// ============ CUSTOMER PORTAL - BRANDING TAB ============
router.get('/customer-portal/branding', getCustomerPortalBranding);
router.patch('/customer-portal/branding', upload.single('logo'), updateCustomerPortalBranding);

// ============ CUSTOMER PORTAL - PROMO CODES TAB ============
router.get('/customer-portal/promo-codes', getCustomerPortalPromoCodes);
router.patch('/customer-portal/promo-codes', updateCustomerPortalPromoCodes);

module.exports = router;