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
  updatePreferenceSettings
} = require('../controller/companyProfileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/multer');

//router.use(protect);

// Company Tab
router.get('/profile', getCompanyProfile);
router.put('/profile', upload.single('logo'), updateCompanyProfile);

// Communication Tab
router.get('/communication', getCommunicationSettings);
router.put('/communication', updateCommunicationSettings);
router.post('/verify-domain', verifyDomain);
router.post('/test-email', testEmailConfig);

// Payments Tab
router.get('/payments', getPaymentSettings);
router.put('/payments', updatePaymentSettings);

// Preferences Tab
router.get('/preferences', getPreferenceSettings);
router.put('/preferences', updatePreferenceSettings);

module.exports = router;