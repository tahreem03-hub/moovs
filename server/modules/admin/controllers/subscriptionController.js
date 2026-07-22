// modules/admin/controllers/subscriptionController.js
const subscriptionService = require('../services/subscriptionService');

// ============ PLAN MANAGEMENT ============

const createPlan = async (req, res) => {
  try {
    const plan = await subscriptionService.createPlan(req.body, req.user._id);
    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A plan with this name already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subscription plan'
    });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans();
    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
};

const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.getPlanById(id);
    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription plan'
    });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.updatePlan(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A plan with this name already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update subscription plan'
    });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await subscriptionService.deletePlan(id);
    return res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete subscription plan'
    });
  }
};

const setDefaultPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.setDefaultPlan(id);
    return res.status(200).json({
      success: true,
      message: 'Default plan set successfully',
      data: plan
    });
  } catch (error) {
    console.error('Set default plan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to set default plan'
    });
  }
};

// ============ ASSIGN PLAN TO OPERATOR ============

const assignPlanToOperator = async (req, res) => {
  try {
    const { operatorId, planId, customPrice, customFeatures } = req.body;
    const result = await subscriptionService.assignPlanToOperator(
      operatorId,
      planId,
      customPrice,
      customFeatures
    );
    return res.status(200).json({
      success: true,
      message: `Plan "${result.plan.name}" assigned to ${result.operator.CompanyName}`,
      data: result
    });
  } catch (error) {
    console.error('Assign plan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign plan to operator'
    });
  }
};

const getOperatorPlan = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const result = await subscriptionService.getOperatorPlan(operatorId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get operator plan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get operator plan'
    });
  }
};

// ============ SUBSCRIPTION STATS ============

const getSubscriptionStats = async (req, res) => {
  try {
    const stats = await subscriptionService.getSubscriptionStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription stats'
    });
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  setDefaultPlan,
  assignPlanToOperator,
  getOperatorPlan,
  getSubscriptionStats
};