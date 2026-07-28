// modules/admin/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus,
  getOperatorCompanies,
  getOperatorVehicles,
  getSubscriptionStats
} = require('../controllers/adminController');
const { isAuthenticated, authorizeAdmin } = require('../../../middleware/auth');

// All admin routes require authentication + admin role
router.use(isAuthenticated);
router.use(authorizeAdmin);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/subscription-stats', getSubscriptionStats);

// Operator Management
router.get('/operators', getOperators);
router.get('/operators/:id', getOperatorById);
router.post('/operators', createOperator);
router.put('/operators/:id', updateOperator);
router.delete('/operators/:id', deleteOperator);
router.patch('/operators/:id/toggle', toggleOperatorStatus);

// Operator Details
router.get('/operators/:id/companies', getOperatorCompanies);
router.get('/operators/:id/vehicles', getOperatorVehicles);

module.exports = router;