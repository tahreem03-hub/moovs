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
} = require('../controller/tripRuleController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.post('/create', createTripRule);
router.get('/list', getTripRules);
router.get('/dropdown', getTripRuleDropdown);
router.get('/:id', getTripRuleById);
router.put('/update/:id', updateTripRule);
router.patch('/toggle/:id', toggleTripRuleStatus);
router.delete('/delete/:id', deleteTripRule);

module.exports = router;