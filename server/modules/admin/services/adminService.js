// modules/admin/services/adminService.js
const User = require('../../../models/User');
const Company = require('../../../models/Company');
const Vehicle = require('../../../models/Vehicle');
const Contact = require('../../../models/Contact');

const getDashboardStats = async () => {
  const [totalOperators, activeOperators, totalCompanies, totalVehicles, totalContacts] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', isActive: true }),
    Company.countDocuments(),
    Vehicle.countDocuments(),
    Contact.countDocuments()
  ]);

  return {
    totalOperators,
    activeOperators,
    totalCompanies,
    totalVehicles,
    totalContacts,
    pendingOperators: totalOperators - activeOperators
  };
};

const getOperators = async (search = '', page = 1, limit = 10) => {
  const query = { role: 'user' };
  
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { companyName: regex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [operators, total] = await Promise.all([
    User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get stats for each operator
  const operatorsWithStats = await Promise.all(operators.map(async (op) => {
    const [companies, vehicles, contacts] = await Promise.all([
      Company.countDocuments({ createdBy: op._id }),
      Vehicle.countDocuments({ createdBy: op._id }),
      Contact.countDocuments({ createdBy: op._id })
    ]);
    return {
      ...op,
      stats: { companies, vehicles, contacts }
    };
  }));

  return {
    data: operatorsWithStats,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum
    }
  };
};

const getOperatorById = async (id) => {
  const operator = await User.findById(id)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .lean();

  if (!operator) {
    throw new Error('Operator not found');
  }

  const [companies, vehicles, contacts] = await Promise.all([
    Company.countDocuments({ createdBy: id }),
    Vehicle.countDocuments({ createdBy: id }),
    Contact.countDocuments({ createdBy: id })
  ]);

  return {
    ...operator,
    stats: { companies, vehicles, contacts }
  };
};

const createOperator = async (data) => {
  const { firstName, lastName, email, password, companyName, phone } = data;

  // Check if email already exists
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    password,
    companyName,
    phone,
    role: 'user',
    isActive: true
  });

  return user;
};

const updateOperator = async (id, data) => {
  const { firstName, lastName, email, companyName, phone, isActive, subscriptionPlan, subscriptionStatus } = data;

  const operator = await User.findById(id);
  if (!operator) {
    throw new Error('Operator not found');
  }

  if (email && email !== operator.email) {
    const existing = await User.findOne({ 
      email: email.toLowerCase().trim(),
      _id: { $ne: id }
    });
    if (existing) {
      throw new Error('A user with this email already exists');
    }
    operator.email = email.toLowerCase().trim();
  }

  if (firstName) operator.firstName = firstName;
  if (lastName) operator.lastName = lastName;
  if (companyName !== undefined) operator.companyName = companyName;
  if (phone !== undefined) operator.phone = phone;
  if (isActive !== undefined) operator.isActive = isActive;
  if (subscriptionPlan !== undefined) operator.subscriptionPlan = subscriptionPlan;
  if (subscriptionStatus !== undefined) operator.subscriptionStatus = subscriptionStatus;

  await operator.save();
  return operator;
};

const deleteOperator = async (id) => {
  const operator = await User.findById(id);
  if (!operator) {
    throw new Error('Operator not found');
  }

  // Prevent deleting the last admin
  if (operator.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

  // Delete all associated data
  await Promise.all([
    Company.deleteMany({ createdBy: id }),
    Vehicle.deleteMany({ createdBy: id }),
    Contact.deleteMany({ createdBy: id })
  ]);

  await User.findByIdAndDelete(id);
};

const toggleOperatorStatus = async (id) => {
  const operator = await User.findById(id);
  if (!operator) {
    throw new Error('Operator not found');
  }

  operator.isActive = !operator.isActive;
  await operator.save();
  return operator;
};

const getSubscriptionStats = async () => {
  const [byPlan, byStatus] = await Promise.all([
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } },
    ]),
  ]);
  const toMap = (arr) => arr.reduce((m, r) => { m[r._id || 'unknown'] = r.count; return m; }, {});
  return { byPlan: toMap(byPlan), byStatus: toMap(byStatus) };
};

module.exports = {
  getDashboardStats,
  getOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus,
  getSubscriptionStats
};