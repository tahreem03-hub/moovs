
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============ PLAN MANAGEMENT ============
export const getPlans = () => api.get('/admin/subscriptions/plans');
export const getPlanById = (id) => api.get(`/admin/subscriptions/plans/${id}`);
export const createPlan = (data) => api.post('/admin/subscriptions/plans', data);
export const updatePlan = (id, data) => api.put(`/admin/subscriptions/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/admin/subscriptions/plans/${id}`);
export const setDefaultPlan = (id) => api.put(`/admin/subscriptions/plans/${id}/default`);

// ============ SUBSCRIPTION STATS ============
export const getSubscriptionStats = () => api.get('/admin/subscriptions/stats');

// ============ ASSIGN PLAN ============
export const assignPlanToOperator = (data) => api.post('/admin/subscriptions/assign', data);
export const getOperatorPlan = (operatorId) => api.get(`/admin/subscriptions/operator/${operatorId}/plan`);

const subscriptionService = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  setDefaultPlan,
  getSubscriptionStats,
  assignPlanToOperator,
  getOperatorPlan
};

export default subscriptionService;