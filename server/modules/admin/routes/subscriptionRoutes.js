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
const { isAuthenticated, authorizeAdmin } = require('../../../middleware/auth');

// All admin routes require authentication + admin role
router.use(isAuthenticated);
router.use(authorizeAdmin);

// Plan Management
router.post('/plans', createPlan);
router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.patch('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.patch('/plans/:id/default', setDefaultPlan);

// Subscription Stats
router.get('/stats', getSubscriptionStats);

// Assign Plan to Operator
router.post('/assign', assignPlanToOperator);
router.get('/operator/:operatorId/plan', getOperatorPlan);

module.exports = router;