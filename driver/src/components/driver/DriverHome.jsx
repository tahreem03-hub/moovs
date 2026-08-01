// driver-app/src/components/driver/DriverHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Calendar, Clock, DollarSign, CheckCircle,
  Navigation, Play, XCircle, Loader2, ChevronRight,
  Users, MapPin, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/api';

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  dispatched: Navigation,
  started: Play,
  completed: CheckCircle,
  cancelled: XCircle,
  billed: DollarSign,
};

const statusColors = {
  pending: 'bg-[#B8860B]/10 text-[#B8860B]',
  confirmed: 'bg-[#2563EB]/10 text-[#2563EB]',
  dispatched: 'bg-[#4F46E5]/10 text-[#4F46E5]',
  started: 'bg-[#7C3AED]/10 text-[#7C3AED]',
  completed: 'bg-[#0B5C48]/10 text-[#0B5C48]',
  cancelled: 'bg-[#B42318]/10 text-[#B42318]',
  billed: 'bg-[#6B7280]/10 text-[#6B7280]',
};

const DriverHome = ({ stats }) => {
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentTrips();
  }, []);

  const loadRecentTrips = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getTrips({
        status: 'confirmed,dispatched,started,completed',
        limit: 5
      });
      setRecentTrips((response.data.data || []).slice(0, 5));
    } catch (error) {
      toast.error('Couldn\'t load trips');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (trip) => {
    if (trip.bookingContact?.firstName && trip.bookingContact?.lastName) {
      return `${trip.bookingContact.firstName} ${trip.bookingContact.lastName}`;
    }
    return trip.bookingContact?.name || 'Unknown passenger';
  };

  const getPickupAddress = (trip) => {
    const stop = trip.stops?.find((s) => s.type === 'pickup');
    if (!stop) return '—';

    if (stop.locationType === 'airport' && stop.airport) {
      return [stop.airport.code, stop.airport.name].filter(Boolean).join(' · ') || 'Airport';
    }

    const addr = stop.address;
    if (addr) {
      const parts = [
        addr.street || addr.address || addr.formattedAddress,
        addr.city,
        addr.state
      ].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    return '—';
  };

  const getPrice = (trip) => {
    const total = trip.pricing?.total ?? trip.totalPrice ?? 0;
    return typeof total === 'number' ? total.toFixed(2) : '0.00';
  };

  const getTime = (date) => {
    return date ? new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '—';
  };

  return (
    <div className="max-w-7xl text-[#14181F]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold leading-none tracking-[-0.02em]">Dashboard</h1>
        <p className="mt-2 text-sm text-[#8A909C]">
          Welcome back, {stats.driverName || 'Driver'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Today's trips"
          value={stats.todayTrips || 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats.pendingTrips || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Earnings"
          value={`$${(stats.totalEarnings || 0).toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Status"
          value={stats.isAvailable ? 'Online' : 'Offline'}
          icon={Car}
          color={stats.isAvailable ? 'green' : 'red'}
        />
      </div>

      {/* Recent Trips */}
      <div className="rounded-2xl border border-[#E8E9ED] bg-white overflow-hidden">
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#F0F1F3] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14181F]">Recent trips</h2>
            <p className="text-sm text-[#8A909C] mt-0.5">Your latest assigned trips</p>
          </div>
          <button
            onClick={() => navigate('/rides')}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0B5C48] hover:text-[#0A4D3B] transition"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-12">
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[88px] rounded-xl border border-[#EEEFF2] bg-white animate-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>
        ) : recentTrips.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Car className="mx-auto h-12 w-12 text-[#D6D9DF]" />
            <p className="mt-3 text-[15px] font-medium text-[#14181F]">No trips assigned</p>
            <p className="mt-1 text-sm text-[#8A909C]">
              Trips will appear here once dispatch assigns them
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F1F3]">
            {recentTrips.map((trip) => {
              const StatusIcon = statusIcons[trip.status] || Car;
              return (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  StatusIcon={StatusIcon}
                  customerName={getCustomerName(trip)}
                  address={getPickupAddress(trip)}
                  price={getPrice(trip)}
                  time={getTime(trip.pickupDateTime)}
                  onClick={() => navigate(`/trips/${trip._id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: { bg: 'bg-[#2563EB]/10', text: 'text-[#2563EB]' },
    green: { bg: 'bg-[#0B5C48]/10', text: 'text-[#0B5C48]' },
    amber: { bg: 'bg-[#B8860B]/10', text: 'text-[#B8860B]' },
    red: { bg: 'bg-[#B42318]/10', text: 'text-[#B42318]' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="rounded-2xl border border-[#E8E9ED] bg-white p-4 sm:p-5 transition hover:border-[#D2D5DC] hover:shadow-[0_8px_24px_-12px_rgba(20,24,31,0.18)]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-[#8A909C]">{title}</p>
          <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#14181F] truncate">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 sm:p-3 ${colors.bg} shrink-0 ml-3`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

// Trip Card Component
const TripCard = ({ trip, StatusIcon, customerName, address, price, time, onClick }) => {
  const statusColor = statusColors[trip.status] || statusColors.pending;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      role="button"
      tabIndex={0}
      className="group px-5 py-4 sm:px-6 sm:py-5 hover:bg-[#FAFAFA] transition cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Left: Status + Customer */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusColor} shrink-0`}>
            <StatusIcon className="h-3 w-3" />
            {trip.status}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#14181F] truncate">{customerName}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          </div>
        </div>

        {/* Right: Price + Time */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-0 sm:pl-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#14181F]">${price}</p>
            <p className="text-xs text-[#8A909C]">{time}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#D6D9DF] group-hover:text-[#8A909C] transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};

export default DriverHome;