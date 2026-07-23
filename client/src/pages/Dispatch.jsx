// src/pages/Dispatch.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Car, User, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 border-yellow-300',
  confirmed: 'bg-blue-100 border-blue-300',
  dispatched: 'bg-purple-100 border-purple-300',
  started: 'bg-green-100 border-green-300',
  completed: 'bg-gray-100 border-gray-300'
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  started: 'Started',
  completed: 'Completed'
};

const Dispatch = () => {
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState({ vehicles: [], drivers: [], kanban: {}, reservations: [] });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const res = await axios.get(`${import.meta.env.VITE_URL}/dispatch/board?date=${dateStr}`, {
        withCredentials: true
      });
      setBoard(res.data.data);
    } catch (error) {
      toast.error('Failed to load dispatch board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [date]);

  const changeDate = (days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_URL}/dispatch/${reservationId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success(`Status updated`);
      fetchBoard();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/dispatch/${selectedReservation}/assign-driver`,
        { driverId: selectedDriver },
        { withCredentials: true }
      );
      toast.success('Driver assigned');
      setShowAssignModal(false);
      setSelectedDriver('');
      fetchBoard();
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusColumns = ['pending', 'confirmed', 'dispatched', 'started', 'completed'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-sm text-gray-500">Manage today's trips</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">{formatDate(date)}</span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {statusColumns.map(status => (
          <div key={status} className="bg-white rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{board.kanban[status]?.length || 0}</p>
            <p className="text-xs text-gray-500 uppercase">{status}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 h-[calc(100vh-240px)] overflow-x-auto">
        {statusColumns.map(status => (
          <div key={status} className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold uppercase text-gray-600 mb-3">
              {STATUS_LABELS[status]} ({board.kanban[status]?.length || 0})
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-full">
              {(board.kanban[status] || []).map(reservation => (
                <div
                  key={reservation._id}
                  className={`p-3 rounded-lg border-2 ${STATUS_COLORS[status]} bg-white shadow-sm`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold">{reservation.reservationNumber}</span>
                    <span className="text-xs text-gray-500">{formatTime(reservation.pickupDateTime)}</span>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    {reservation.bookingContact?.firstName} {reservation.bookingContact?.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Car className="w-3 h-3" />
                    <span className="truncate">{reservation.vehicle?.name || 'No vehicle'}</span>
                  </div>
                  {reservation.driver && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <User className="w-3 h-3" />
                      <span>{reservation.driver.firstName} {reservation.driver.lastName}</span>
                    </div>
                  )}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {!reservation.driver && status !== 'completed' && (
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation._id);
                          setShowAssignModal(true);
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200"
                      >
                        Assign
                      </button>
                    )}
                    {status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(reservation._id, 'confirmed')}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                      >
                        Confirm
                      </button>
                    )}
                    {status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(reservation._id, 'dispatched')}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200"
                      >
                        Dispatch
                      </button>
                    )}
                    {status === 'dispatched' && (
                      <button
                        onClick={() => handleStatusChange(reservation._id, 'started')}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200"
                      >
                        Start
                      </button>
                    )}
                    {status === 'started' && (
                      <button
                        onClick={() => handleStatusChange(reservation._id, 'completed')}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!board.kanban[status] || board.kanban[status].length === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">No trips</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign Driver Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Assign Driver</h3>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select a driver</option>
              {board.drivers.map(d => (
                <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={handleAssignDriver} className="px-4 py-2 bg-blue-600 text-white rounded">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispatch;