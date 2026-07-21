import axios from 'axios';


const API_URL = import.meta.env.VITE_URL;

/**
 * Dedicated axios instance for admin calls.
 * - withCredentials: true  -> supports cookie/session auth (isAuthenticated middleware)
 * - Authorization header   -> supports JWT stored in localStorage (adjust key if different)
 */
/*const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // adjust key to match your auth setup
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});
// delete the api.interceptors.request.use(...) block entirely


export const adminService = {
  // Dashboard
  getStats: () => api.get('/admin/stats'),

  // Operators
  getOperators: (page = 1, limit = 10, search = '') =>
    api.get('/admin/operators', { params: { page, limit, search } }),

  getOperatorById: (id) => api.get(`/admin/operators/${id}`),

  updateOperator: (id, data) => api.put(`/admin/operators/${id}`, data),

  deleteOperator: (id) => api.delete(`/admin/operators/${id}`),

  toggleOperatorStatus: (id) => api.patch(`/admin/operators/${id}/toggle`),

  getOperatorCompanies: (id) => api.get(`/admin/operators/${id}/companies`),

  getOperatorVehicles: (id) => api.get(`/admin/operators/${id}/vehicles`),

  getSubscriptionStats: () => api.get('/admin/subscriptions/stats'),
};

/** Extract a readable error message from an axios error for toasts. */
export const getErrorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

export default adminService;
