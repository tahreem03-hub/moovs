import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

import {
  Car, CheckCircle, Clock, XCircle, Calendar,
  DollarSign, Loader2, LogOut, Navigation, Play, KeyRound,
  Home, List, TrendingUp, User, MessageCircle, Bell,
  Menu, X, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../services/api';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DriverHome from '../components/driver/DriverHome';
import MyRides from '../components/driver/MyRides';
import TripDetails from './TripDetails';
import Earnings from '../components/driver/Earnings';
import Profile from '../components/driver/Profile';
import Notifications from '../components/driver/Notifications';

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [stats, setStats] = useState({
    todayTrips: 0,
    pendingTrips: 0,
    totalEarnings: 0,
    isAvailable: false
  });
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();


  // WebSocket connection
  const driverId = driver?._id;
  const userId = driver?.userId;
  const { isConnected, lastMessage } = useWebSocket(driverId, userId, (notification) => {
    // Update unread count in real-time
    if (!notification.read) {
      setUnreadNotifications(prev => prev + 1);
    }
  });

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === 'dashboard') return 'home';
    if (path.startsWith('/rides') || path.startsWith('/trips')) return 'rides';
    if (path.startsWith('/earnings')) return 'earnings';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/notifications')) return 'notifications';
    return 'home';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        driverApi.getProfile(),
        driverApi.getStats()
      ]);

      setDriver(profileRes.data.user || profileRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Couldn\'t load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      setUpdatingAvailability(true);
      const newStatus = !stats.isAvailable;
      await driverApi.updateAvailability(newStatus);
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
      await driverApi.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
      window.location.href = `${mainAppUrl}/login`;
    }
  };

  const navigateTo = (path) => {
    navigate(`/${path}`);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[#E8E9ED] border-t-[#0B5C48] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-[#0B5C48] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Top Header - Separate from sidebar */}
      <header className="bg-white border-b border-[#E8E9ED] sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Logo + Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[#F5F5F3] transition"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#0B5C48]/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-[#0B5C48]" />
                </div>
                <span className="text-lg font-semibold text-[#14181F]">Driver Portal</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${stats.isAvailable ? 'bg-[#0B5C48]' : 'bg-[#B8860B]'}`} />
                <span className="text-sm font-medium text-[#6B7280]">
                  {stats.isAvailable ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Availability Toggle */}
              <button
                onClick={handleAvailabilityToggle}
                disabled={updatingAvailability}
                className={`hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition
                  ${stats.isAvailable
                    ? 'bg-[#B42318]/10 text-[#B42318] hover:bg-[#B42318]/20'
                    : 'bg-[#0B5C48]/10 text-[#0B5C48] hover:bg-[#0B5C48]/20'
                  } disabled:opacity-50`}
              >
                {updatingAvailability ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.isAvailable ? 'Go offline' : 'Go online'
                )}
              </button>

              {/* Mobile status toggle */}
              <button
                onClick={handleAvailabilityToggle}
                disabled={updatingAvailability}
                className={`sm:hidden p-2 rounded-full transition
                  ${stats.isAvailable
                    ? 'bg-[#B42318]/10 text-[#B42318]'
                    : 'bg-[#0B5C48]/10 text-[#0B5C48]'
                  } disabled:opacity-50`}
              >
                {updatingAvailability ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className={`h-3 w-3 rounded-full ${stats.isAvailable ? 'bg-[#0B5C48]' : 'bg-[#B8860B]'}`} />
                )}
              </button>

              {/* Change Password */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="p-2 rounded-full hover:bg-[#F5F5F3] transition"
                title="Change password"
              >
                <KeyRound className="h-4 w-4 text-[#6B7280]" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-[#F5F5F3] transition"
                title="Log out"
              >
                <LogOut className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Fixed on desktop */}
        <aside
          className={`
            fixed lg:sticky top-16 lg:top-0 left-0 z-40
            w-72 lg:w-64 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
            bg-white border-r border-[#E8E9ED]
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          
          <nav className="h-full px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarItem
              icon={Home}
              label="Home"
              active={activeTab === 'home'}
              onClick={() => navigateTo('')}
            />
            <SidebarItem
              icon={List}
              label="My Rides"
              active={activeTab === 'rides'}
              onClick={() => navigateTo('rides')}
            />
            <SidebarItem
              icon={TrendingUp}
              label="Earnings"
              active={activeTab === 'earnings'}
              onClick={() => navigateTo('earnings')}
            />
            <SidebarItem
              icon={User}
              label="Profile"
              active={activeTab === 'profile'}
              onClick={() => navigateTo('profile')}
            />
            <SidebarItem
              icon={Bell}
              label="Notifications"
              active={activeTab === 'notifications'}
              onClick={() => navigateTo('notifications')}
              badge={unreadNotifications}
            />
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<DriverHome stats={stats} />} />
              <Route path="rides" element={<MyRides />} />
              <Route path="trips/:id" element={<TripDetails />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="notifications"
                element={<Notifications userId={driver?._id} driverId={driver?._id} />}
              />
            </Routes>
          </div>
        </main>
      </div>

      {/* Change-password modal */}
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition
      ${active
        ? 'bg-[#0B5C48]/10 text-[#0B5C48]'
        : 'text-[#6B7280] hover:bg-[#F5F5F3] hover:text-[#14181F]'
      }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${active ? 'text-[#0B5C48]' : 'text-[#8A909C]'}`} />
      <span>{label}</span>
    </div>
    {badge > 0 && (
      <span className="bg-[#B42318] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
        {badge}
      </span>
    )}
  </button>
);

export default DriverDashboard;