// src/services/quoteService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============ QUOTE MANAGEMENT ============
export const getQuotes = (params = {}) => 
  api.get('/quote/list', { params });

export const getQuoteById = (id) => 
  api.get(`/quote/${id}`);

export const createQuote = (data) => 
  api.post('/quote/create', data);

export const updateQuote = (id, data) => 
  api.put(`/quote/update/${id}`, data);

export const updateQuoteStatus = (id, status) => 
  api.put(`/quote/${id}/status`, { status });

export const deleteQuote = (id) => 
  api.delete(`/quote/delete/${id}`);

// ============ QUOTE STATS ============
export const getQuoteStats = () => 
  api.get('/quote/stats');

// ============ PRICING ============
export const calculatePricing = (data) => 
  api.post('/quote/calculate-pricing', data);

// ============ COMMENTS ============
export const addComment = (id, text) => 
  api.post(`/quote/${id}/comments`, { text });

// ============ HELPERS ============
export const getContacts = () => 
  api.get('/contact/list');

export const getVehicles = () => 
  api.get('/vehicle/my-vehicles');

export const getUsers = () => 
  api.get('/user/list');

const quoteService = {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats,
  calculatePricing,
  addComment,
  getContacts,
  getVehicles,
  getUsers
};

export default quoteService;