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
} = require('../controller/insuranceController');
const { protect } = require('../middleware/auth');

//router.use(protect);

router.post('/create', createInsurance);
router.get('/list', getInsurances);
router.get('/dropdown', getInsuranceDropdown);
router.get('/:id', getInsuranceById);
router.put('/update/:id', updateInsurance);
router.delete('/delete/:id', deleteInsurance);

module.exports = router;