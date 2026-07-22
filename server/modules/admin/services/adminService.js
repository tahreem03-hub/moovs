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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSignups = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: sevenDaysAgo }
  });

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const trialExpiring = await User.countDocuments({
    role: 'user',
    subscriptionStatus: 'trial',
    subscriptionExpiry: { $lte: sevenDaysFromNow }
  });

  return {
    totalOperators,
    activeOperators,
    pendingOperators: totalOperators - activeOperators,
    totalCompanies,
    totalVehicles,
    totalContacts,
    recentSignups,
    trialExpiring
  };
};

const getOperators = async (search = '', page = 1, limit = 10) => {
  const query = { role: 'user' };
  
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { Fname: regex },
      { Lname: regex },
      { email: regex },
      { CompanyName: regex }
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
    Company.find({ createdBy: id }).select('name email phone createdAt').lean(),
    Vehicle.find({ createdBy: id }).select('name type passengerCapacity createdAt').lean(),
    Contact.find({ createdBy: id }).select('firstName lastName email phone createdAt').lean()
  ]);

  return {
    ...operator,
    companies,
    vehicles,
    contacts
  };
};

const createOperator = async (data, adminId) => {
  const { Fname, Lname, email, CompanyName, password, phone, subscriptionPlan, subscriptionStatus } = data;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    Fname,
    Lname,
    email: email.toLowerCase().trim(),
    password,
    CompanyName,
    phone: phone || '',
    role: 'user',
    isActive: true,
    createdBy: adminId,
    subscriptionPlan: subscriptionPlan || 'free',
    subscriptionStatus: subscriptionStatus || 'trial',
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  return user;
};

const updateOperator = async (id, data) => {
  const { Fname, Lname, email, CompanyName, phone, isActive, subscriptionPlan, subscriptionStatus } = data;

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

  if (Fname) operator.Fname = Fname;
  if (Lname) operator.Lname = Lname;
  if (CompanyName !== undefined) operator.CompanyName = CompanyName;
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

  if (operator.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

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

module.exports = {
  getDashboardStats,
  getOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus
};