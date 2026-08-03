// routes/tripRuleRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTripRule,
  getTripRules,
  getTripRuleById,
  updateTripRule,
  deleteTripRule,
  toggleTripRuleStatus,
  getTripRuleDropdown
} = require('../../controllers/settings/tripRuleController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', createTripRule);
router.get('/list', getTripRules);
router.get('/dropdown', getTripRuleDropdown);
router.get('/:id', getTripRuleById);
router.patch('/update/:id', updateTripRule);
router.patch('/toggle/:id', toggleTripRuleStatus);  
router.delete('/delete/:id', deleteTripRule);

module.exports = router;