import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, CheckCircle, Clock, XCircle, Calendar, 
  DollarSign, Loader2, LogOut 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api  from '../services/api';

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [stats, setStats] = useState({
    todayTrips: 0,
    pendingTrips: 0,
    totalEarnings: 0,
    isAvailable: false
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, tripsRes] = await Promise.all([
        api.getProfile(),
        api.getStats(),
        api.getTrips({ status: 'confirmed,dispatched,started' })
      ]);

      setDriver(profileRes.data.data);
      setStats(statsRes.data.data);
      setRecentTrips(tripsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      setUpdatingAvailability(true);
      const newStatus = !stats.isAvailable;
      await api.updateAvailability(newStatus);
      setStats(prev => ({ ...prev, isAvailable: newStatus }));
      toast.success(`You are now ${newStatus ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      toast.success('Logged out successfully');
      navigate('/driver/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // ... rest of dashboard code (same as before)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout button */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Car className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">Driver Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {stats.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <button
                onClick={handleAvailabilityToggle}
                disabled={updatingAvailability}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  stats.isAvailable
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {updatingAvailability ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  stats.isAvailable ? 'Go Offline' : 'Go Online'
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Trips</p>
                <p className="text-2xl font-bold text-gray-800">{stats.todayTrips}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Trips</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingTrips}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`text-2xl font-bold ${stats.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.isAvailable ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stats.isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                <Car className={`w-6 h-6 ${stats.isAvailable ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Trips</h2>
          
          {recentTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No trips assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTrips.map((trip) => {
                const StatusIcon = statusIcons[trip.status] || Car;
                return (
                  <div
                    key={trip._id}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(`/driver/trips/${trip._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[trip.status] || 'bg-gray-100 text-gray-800'}`}>
                          <span className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {trip.status}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {trip.bookingContact?.firstName} {trip.bookingContact?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {trip.pickupLocation?.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          ${trip.pricing?.total || 0}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(trip.pickupDateTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
