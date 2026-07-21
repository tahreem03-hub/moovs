// modules/admin/controllers/adminController.js
const User = require('../../../models/User');
const Company = require('../../../models/Company');
const Vehicle = require('../../../models/Vehicle');
const Contact = require('../../../models/Contact');
const adminService = require('../services/adminService');

// ============ DASHBOARD STATS ============
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// ============ OPERATOR MANAGEMENT ============
const getOperators = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const result = await adminService.getOperators(search, page, limit);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get operators error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch operators'
    });
  }
};

const getOperatorById = async (req, res) => {
  try {
    const { id } = req.params;
    const operator = await adminService.getOperatorById(id);
    return res.status(200).json({
      success: true,
      data: operator
    });
  } catch (error) {
    console.error('Get operator error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch operator'
    });
  }
};

const updateOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const operator = await adminService.updateOperator(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Operator updated successfully',
      data: operator
    });
  } catch (error) {
    console.error('Update operator error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update operator'
    });
  }
};

const deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteOperator(id);
    return res.status(200).json({
      success: true,
      message: 'Operator deleted successfully'
    });
  } catch (error) {
    console.error('Delete operator error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete operator'
    });
  }
};

const toggleOperatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const operator = await adminService.toggleOperatorStatus(id);
    return res.status(200).json({
      success: true,
      message: `Operator ${operator.isActive ? 'activated' : 'deactivated'} successfully`,
      data: operator
    });
  } catch (error) {
    console.error('Toggle operator status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle operator status'
    });
  }
};

// ============ OPERATOR DETAILS ============
const getOperatorCompanies = async (req, res) => {
  try {
    const { id } = req.params;
    const companies = await Company.find({ createdBy: id }).lean();
    return res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get operator companies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch operator companies'
    });
  }
};

const getOperatorVehicles = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicles = await Vehicle.find({ createdBy: id }).lean();
    return res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Get operator vehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch operator vehicles'
    });
  }
};


const getSubscriptionStats = async (req, res) => {
  try {
    const data = await adminService.getSubscriptionStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Subscription stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription stats' });
  }
};

module.exports = {
  getDashboardStats,
  getOperators,
  getOperatorById,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus,
  getOperatorCompanies,
  getOperatorVehicles,
  getSubscriptionStats 
};