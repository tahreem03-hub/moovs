// routes/cancellationRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  getPolicyDropdown
} = require('../controller/cancellationController');
const { protect } = require('../middleware/auth');

//router.use(protect);

router.post('/create', createPolicy);
router.get('/list', getPolicies);
router.get('/dropdown', getPolicyDropdown);
router.get('/:id', getPolicyById);
router.put('/update/:id', updatePolicy);
router.delete('/delete/:id', deletePolicy);

module.exports = router;