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
} = require('../../controllers/settings/cancellationController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');


// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);



router.post('/create', createPolicy);
router.get('/list', getPolicies);
router.get('/dropdown', getPolicyDropdown);
router.get('/:id', getPolicyById);
router.patch('/update/:id', updatePolicy);
router.delete('/delete/:id', deletePolicy);

module.exports = router;