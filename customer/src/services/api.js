import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/customer';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});


api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const onLoginPage = window.location.pathname === '/login';

    if ((status === 401 || status === 403) && !url.includes('/profile') && !onLoginPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;