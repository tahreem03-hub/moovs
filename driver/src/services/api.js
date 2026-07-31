// driver-app/src/services/driverApi.js
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
    // If unauthorized, redirect to main login
    if (error.response?.status === 401) {
      console.log(error.response)
      window.location.href = '/login';
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
  logout: () => api.post('/driver/logout'),
};

export default api;