// modules/admin/services/subscriptionService.js
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../../../models/User');

// ============ PLAN MANAGEMENT ============

const createPlan = async (planData, adminId) => {
  const existing = await SubscriptionPlan.findOne({ tier: planData.tier });
  if (existing) {
    throw new Error(`A plan with tier "${planData.tier}" already exists`);
  }

  const plan = await SubscriptionPlan.create({
    ...planData,
    createdBy: adminId
  });

  return plan;
};

const getPlans = async () => {
  return await SubscriptionPlan.find()
    .sort({ sortOrder: 1, price: 1 })
    .lean();
};

const getPlanById = async (id) => {
  const plan = await SubscriptionPlan.findById(id).lean();
  if (!plan) {
    throw new Error('Subscription plan not found');
  }
  return plan;
};

const updatePlan = async (id, updates) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (updates.tier && updates.tier !== plan.tier) {
    const existing = await SubscriptionPlan.findOne({
      tier: updates.tier,
      _id: { $ne: id }
    });
    if (existing) {
      throw new Error(`A plan with tier "${updates.tier}" already exists`);
    }
  }

  Object.assign(plan, updates);
  await plan.save();
  return plan;
};

const deletePlan = async (id) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (plan.isDefault) {
    throw new Error('Cannot delete the default plan. Set another plan as default first.');
  }

  await SubscriptionPlan.findByIdAndDelete(id);
  return plan;
};

const setDefaultPlan = async (id) => {
  await SubscriptionPlan.updateMany({}, { isDefault: false });
  const plan = await SubscriptionPlan.findByIdAndUpdate(
    id,
    { isDefault: true },
    { new: true }
  );

  if (!plan) {
    throw new Error('Subscription plan not found');
  }
  return plan;
};

// ============ ASSIGN PLAN TO OPERATOR ============

const assignPlanToOperator = async (operatorId, planId, customPrice = null, customFeatures = null) => {
  const operator = await User.findById(operatorId);
  if (!operator) {
    throw new Error('Operator not found');
  }

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  operator.subscriptionPlan = plan.tier;
  operator.subscriptionStatus = 'active';
  operator.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (customPrice) {
    operator.customSubscriptionPrice = customPrice;
  }
  if (customFeatures) {
    operator.customSubscriptionFeatures = customFeatures;
  }

  await operator.save();

  return {
    operator,
    plan
  };
};

const getOperatorPlan = async (operatorId) => {
  const operator = await User.findById(operatorId)
    .select('subscriptionPlan subscriptionStatus subscriptionExpiry customSubscriptionPrice customSubscriptionFeatures')
    .lean();

  if (!operator) {
    throw new Error('Operator not found');
  }

  const plan = await SubscriptionPlan.findOne({ tier: operator.subscriptionPlan }).lean();

  return {
    operator,
    plan
  };
};

// ============ SUBSCRIPTION STATS ============

const getSubscriptionStats = async () => {
  const [plans, subscriptionDistribution] = await Promise.all([
    SubscriptionPlan.find().lean(),
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: {
        _id: '$subscriptionPlan',
        count: { $sum: 1 },
        statuses: {
          $push: {
            status: '$subscriptionStatus',
            expiry: '$subscriptionExpiry'
          }
        }
      }}
    ])
  ]);

  // ✅ Format 1: Distribution (for detailed view)
  const distribution = {};
  subscriptionDistribution.forEach(item => {
    distribution[item._id || 'free'] = {
      count: item.count,
      active: item.statuses.filter(s => s.status === 'active').length,
      trial: item.statuses.filter(s => s.status === 'trial').length,
      expired: item.statuses.filter(s => s.status === 'expired').length
    };
  });

  // ✅ Format 2: byPlan (for frontend Subscriptions page)
  const byPlan = {};
  const byStatus = { active: 0, trial: 0, inactive: 0, expired: 0 };
  
  subscriptionDistribution.forEach(item => {
    const plan = item._id || 'free';
    byPlan[plan] = item.count;
    
    item.statuses.forEach(s => {
      if (byStatus[s.status] !== undefined) {
        byStatus[s.status] += 1;
      }
    });
  });

  // Ensure all plans exist
  ['free', 'basic', 'pro', 'enterprise'].forEach(plan => {
    if (!byPlan[plan]) byPlan[plan] = 0;
  });

  return {
    plans,
    distribution,
    byPlan,    // ✅ For your Subscriptions page
    byStatus   // ✅ For your Subscriptions page
  };
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