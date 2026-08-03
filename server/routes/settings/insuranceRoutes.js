// routes/insuranceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createInsurance,
  getInsurances,
  getInsuranceById,
  updateInsurance,
  deleteInsurance,
  getInsuranceDropdown
} = require('../../controllers/settings/insuranceController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', createInsurance);
router.get('/list', getInsurances);
router.get('/dropdown', getInsuranceDropdown);
router.get('/:id', getInsuranceById);
router.patch('/update/:id', updateInsurance);
router.delete('/delete/:id', deleteInsurance);

module.exports = router;