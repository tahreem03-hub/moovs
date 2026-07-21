// modules/admin/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getOperators,
  getOperatorById,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus,
  getOperatorCompanies,
  getOperatorVehicles,
  getSubscriptionStats
} = require('../controllers/adminController');
const { isAuthenticated, authorize } = require('../../../middleware/auth');

// All routes require authentication and admin role
router.use(isAuthenticated);
router.use(authorize('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// Operator Management
router.get('/operators', getOperators);
router.get('/subscriptions/stats', getSubscriptionStats);
router.get('/operators/:id', getOperatorById);
router.put('/operators/:id', updateOperator);
router.delete('/operators/:id', deleteOperator);
router.patch('/operators/:id/toggle', toggleOperatorStatus);

// Operator Details
router.get('/operators/:id/companies', getOperatorCompanies);
router.get('/operators/:id/vehicles', getOperatorVehicles);

module.exports = router;