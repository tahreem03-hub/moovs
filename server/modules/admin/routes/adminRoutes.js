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
const { isAuthenticated } = require('../../../middleware/auth');

router.use(isAuthenticated);

// Admin role check
router.use(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
});

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