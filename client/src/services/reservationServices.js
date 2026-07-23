// src/modules/reservations/services/reservationService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============ RESERVATION CRUD ============
export const getReservations = (params = {}) => 
  api.get('/reservation/list', { params });

export const getReservationById = (id) => 
  api.get(`/reservation/${id}`);

export const createReservation = (data) => 
  api.post('/reservation/create', data);

export const updateReservation = (id, data) => 
  api.put(`/reservation/update/${id}`, data);

export const deleteReservation = (id) => 
  api.delete(`/reservation/delete/${id}`);

// ============ STATUS ============
export const updateReservationStatus = (id, status, reason = '') => 
  api.put(`/reservation/${id}/status`, { status, cancellationReason: reason });

// ============ DRIVER ============
export const assignDriver = (id, driverId) => 
  api.put(`/reservation/${id}/assign-driver`, { driverId });

// ============ FARM OUT ============
export const farmOutReservation = (id, farmedToId) => 
  api.put(`/reservation/${id}/farm-out`, { farmedToId });

// ============ CONVERT ============
export const convertQuoteToReservation = (quoteId) => 
  api.post(`/reservation/convert/${quoteId}`);

// ============ STATS ============
export const getReservationStats = () => 
  api.get('/reservation/stats');

// ============ HELPERS ============
export const getDrivers = () => 
  api.get('/driver/list');

export const getVehicles = () => 
  api.get('/vehicle/my-vehicles');

export const getContacts = () => 
  api.get('/contact/list');

export const getUsers = () => 
  api.get('/member/list');

const reservationService = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
  assignDriver,
  farmOutReservation,
  convertQuoteToReservation,
  getReservationStats,
  getDrivers,
  getVehicles,
  getContacts,
  getUsers
};

export default reservationService;