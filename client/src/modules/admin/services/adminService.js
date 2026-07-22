// src/modules/admin/services/adminService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============ DASHBOARD ============
export const getStats = () => api.get('/admin/stats');

// ============ SUBSCRIPTION STATS ============
export const getSubscriptionStats = () => api.get('/admin/subscription-stats');

// ============ OPERATOR MANAGEMENT ============
export const getOperators = (page = 1, limit = 10, search = '') => 
  api.get(`/admin/operators?page=${page}&limit=${limit}&search=${search}`);

export const getOperatorById = (id) => 
  api.get(`/admin/operators/${id}`);

export const createOperator = (data) => 
  api.post('/admin/operators', data);

export const updateOperator = (id, data) => 
  api.put(`/admin/operators/${id}`, data);

export const deleteOperator = (id) => 
  api.delete(`/admin/operators/${id}`);

export const toggleOperatorStatus = (id) => 
  api.patch(`/admin/operators/${id}/toggle`);

// ============ OPERATOR DETAILS ============
export const getOperatorCompanies = (id) => 
  api.get(`/admin/operators/${id}/companies`);

export const getOperatorVehicles = (id) => 
  api.get(`/admin/operators/${id}/vehicles`);

// ============ ERROR HANDLER ============
export const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || 'Something went wrong';
};

const adminService = {
  getStats,
  getSubscriptionStats,
  getOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  deleteOperator,
  toggleOperatorStatus,
  getOperatorCompanies,
  getOperatorVehicles,
  getErrorMessage
};

export default adminService;