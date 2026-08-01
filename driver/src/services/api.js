// driver-app/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, send the user to the MAIN app's login (a different origin).
    // Redirecting to '/login' here would hit the driver origin, which has no such route.
    if (error.response?.status === 401) {
      const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
      window.location.href = `${mainAppUrl}/login`;
    }
    return Promise.reject(error);
  }
);

export const driverApi = {
  // Profile - to check if user is driver
  getProfile: () => api.get('/user/me'), // Uses common /user/me endpoint

  // Driver specific endpoints
  getTrips: (params) => api.get('/driver/trips', { params }),
  getTripById: (id) => api.get(`/driver/trips/${id}`),
  startTrip: (id) => api.put(`/driver/trips/${id}/start`),
  completeTrip: (id) => api.put(`/driver/trips/${id}/complete`),
  updateAvailability: (isAvailable) => api.put('/driver/availability', { isAvailable }),
  updateLocation: (location) => api.post('/driver/location', location),
  getEarnings: (params) => api.get('/driver/earnings', { params }),
  getStats: () => api.get('/driver/stats'),
  logout: () => api.get('/user/logout'),
  changePassword: (currentPassword, newPassword) => api.put('/driver/change-password', { currentPassword, newPassword }),
};

export default api;