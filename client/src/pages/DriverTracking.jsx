// src/pages/DriverTracking.jsx
import React, { useState, useEffect } from 'react';
import { User, Car, MapPin, Clock, CheckCircle, XCircle, Phone, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DriverTracking = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_URL}/driver-tracking/drivers`, {
        withCredentials: true
      });
      setDrivers(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  };

  const toggleAvailability = async (driverId, currentStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_URL}/driver-tracking/drivers/${driverId}/availability`,
        { isAvailable: !currentStatus },
        { withCredentials: true }
      );
      toast.success(`Driver ${!currentStatus ? 'available' : 'unavailable'}`);
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to update availability');
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
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Tracking</h1>
          <p className="text-sm text-gray-500">Real-time driver location and status</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
          <p className="text-sm text-gray-500">Total Drivers</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-green-600">
            {drivers.filter(d => d.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-red-600">
            {drivers.filter(d => !d.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">On Trip</p>
        </div>
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] overflow-y-auto">
        {drivers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg">No drivers found</p>
            <p className="text-sm">Add drivers in Settings → Drivers</p>
          </div>
        ) : (
          drivers.map((driver) => (
            <div key={driver._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {/* Driver Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {driver.firstName?.[0]}{driver.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {driver.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    driver.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {driver.isAvailable ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {driver.isAvailable ? 'Available' : 'On Trip'}
                  </span>
                  <button
                    onClick={() => toggleAvailability(driver._id, driver.isAvailable)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {driver.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                </div>
              </div>

              {/* Location */}
              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>Last updated: {new Date(driver.lastUpdated).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Lat: {driver.location?.lat.toFixed(6)}, Lng: {driver.location?.lng.toFixed(6)}
                </div>
              </div>

              {/* Current Trip */}
              {driver.currentTrip ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700">Current Trip</p>
                  <p className="text-sm font-semibold">{driver.currentTrip.reservationNumber}</p>
                  <p className="text-xs text-gray-600">
                    {driver.currentTrip.bookingContact?.firstName} {driver.currentTrip.bookingContact?.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Car className="w-3 h-3" />
                    <span>{driver.currentTrip.vehicle?.name}</span>
                    <Clock className="w-3 h-3 ml-2" />
                    <span>{formatTime(driver.currentTrip.pickupDateTime)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    driver.currentTrip.status === 'dispatched' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {driver.currentTrip.status}
                  </span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-400 text-center py-2">
                  No active trip
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DriverTracking;