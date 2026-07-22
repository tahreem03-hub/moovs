// modules/admin/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  setDefaultPlan,
  assignPlanToOperator,
  getOperatorPlan,
  getSubscriptionStats
} = require('../controllers/subscriptionController');
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

// Plan Management
router.post('/plans', createPlan);
router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.patch('/plans/:id/default', setDefaultPlan);

// Subscription Stats
router.get('/stats', getSubscriptionStats);

// Assign Plan to Operator
router.post('/assign', assignPlanToOperator);
router.get('/operator/:operatorId/plan', getOperatorPlan);

module.exports = router;