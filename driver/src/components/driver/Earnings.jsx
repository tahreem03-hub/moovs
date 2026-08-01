// driver-app/src/components/driver/Earnings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Calendar, Download, Clock, CheckCircle, ArrowUpRight, Wallet, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/api';

const PAGE_SIZE = 5;

const Earnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    tripCount: 0,
    unpaidBalance: 0,
    paidBalance: 0,
    trips: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getEarnings({ period });
      setEarnings(response.data.data);
      setPage(1);
    } catch (error) {
      console.error('Failed to load earnings:', error);
      toast.error('Couldn\'t load earnings. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((earnings.trips || []).length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageTrips = (earnings.trips || []).slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getPayoutStatus = (status) => {
    const configs = {
      paid: { icon: CheckCircle, class: 'text-[#0B5C48]', label: 'Paid' },
      unpaid: { icon: Clock, class: 'text-[#B8860B]', label: 'Unpaid' },
      pending: { icon: Clock, class: 'text-[#B8860B]', label: 'Pending' }
    };
    return configs[status] || configs.unpaid;
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const handleTripClick = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[140px] rounded-2xl border border-[#EEEFF2] bg-white animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-[#14181F]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-none tracking-[-0.02em]">Earnings</h1>
          <p className="mt-2 text-sm text-[#8A909C]">
            {earnings.tripCount || 0} trips · {formatCurrency(earnings.totalEarnings)} total
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-full border border-[#E8E9ED] bg-white px-4 py-2.5 text-sm font-medium text-[#14181F] outline-none transition
                       focus-visible:border-[#0B5C48] focus-visible:ring-2 focus-visible:ring-[#0B5C48]/15"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => toast.success('Export feature coming soon')}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E9ED] bg-white px-4 text-sm font-medium text-[#14181F]
                       transition hover:border-[#14181F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total"
          value={formatCurrency(earnings.totalEarnings)}
        />
        <StatCard
          icon={CheckCircle}
          label="Paid"
          value={formatCurrency(earnings.paidBalance)}
          color="paid"
        />
        <StatCard
          icon={Clock}
          label="Unpaid"
          value={formatCurrency(earnings.unpaidBalance)}
          color="unpaid"
        />
        <StatCard
          icon={TrendingUp}
          label="Trips"
          value={earnings.tripCount || 0}
          color="neutral"
        />
      </div>

      {/* Recent Trips */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#3A414D]">Recent trips</h2>
          <div className="flex items-center gap-3 text-xs text-[#8A909C]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0B5C48]" />
              Paid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8860B]" />
              Unpaid
            </span>
          </div>
        </div>

        {pageTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1E3E8] bg-white/60 px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-[#14181F]">No trips recorded</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#8A909C]">
              Complete trips to start tracking your earnings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pageTrips.map((trip) => (
              <TripCard 
                key={trip._id} 
                trip={trip} 
                getPayoutStatus={getPayoutStatus} 
                formatCurrency={formatCurrency}
                onClick={() => handleTripClick(trip._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm tabular-nums text-[#8A909C]">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, earnings.trips?.length || 0)} of{' '}
              {earnings.trips?.length || 0}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-full border border-[#E8E9ED] bg-white p-2 transition hover:border-[#14181F]
                           disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E8E9ED]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-full border border-[#E8E9ED] bg-white p-2 transition hover:border-[#14181F]
                           disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E8E9ED]"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-8 rounded-2xl border border-[#0B5C48]/20 bg-[#0B5C48]/5 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-[#0B5C48]" />
            <div>
              <h4 className="text-sm font-medium text-[#14181F]">In-app payments coming soon</h4>
              <p className="text-sm text-[#6B7280]">
                Add your bank account to receive payments directly
              </p>
            </div>
          </div>
          <button
            disabled
            className="rounded-full bg-[#E8E9ED] px-4 py-1.5 text-sm font-medium text-[#8A909C] cursor-not-allowed"
          >
            Set up payment
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = 'default' }) => {
  const colors = {
    default: 'text-[#14181F]',
    paid: 'text-[#0B5C48]',
    unpaid: 'text-[#B8860B]',
    neutral: 'text-[#3A414D]'
  };

  const backgrounds = {
    default: 'bg-[#F5F5F3]',
    paid: 'bg-[#0B5C48]/10',
    unpaid: 'bg-[#B8860B]/10',
    neutral: 'bg-[#E8E9ED]'
  };

  return (
    <div className="rounded-2xl border border-[#E8E9ED] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#8A909C]">{label}</p>
          <p className={`mt-1 text-lg font-semibold tracking-tight ${colors[color]}`}>{value}</p>
        </div>
        <div className={`rounded-full p-2 ${backgrounds[color]}`}>
          <Icon className={`h-4 w-4 ${colors[color]}`} />
        </div>
      </div>
    </div>
  );
};

// Trip Card Component - Enhanced with more details and clickable
const TripCard = ({ trip, getPayoutStatus, formatCurrency, onClick }) => {
  const getAddress = (stops, type) => {
    const stop = stops?.find(s => s.type === type);
    if (!stop) return null;
    
    if (stop.locationType === 'airport' && stop.airport) {
      return `${stop.airport.code} · ${stop.airport.name}`;
    }
    
    const address = stop.address;
    if (address) {
      const parts = [];
      if (address.street || address.address || address.formattedAddress) {
        parts.push(address.street || address.address || address.formattedAddress);
      }
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      return parts.join(', ') || '—';
    }
    return null;
  };

  const pickupAddress = getAddress(trip.stops, 'pickup') || trip.pickupLocation?.address || '—';
  const dropoffAddress = getAddress(trip.stops, 'dropoff') || trip.dropoffLocation?.address || '—';
  
  const date = trip.pickupDateTime ? new Date(trip.pickupDateTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '—';
  
  const time = trip.pickupDateTime ? new Date(trip.pickupDateTime).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  const amount = trip.pricing?.total || trip.totalPrice || 0;
  const status = getPayoutStatus(trip.paymentStatus || 'unpaid');
  const StatusIcon = status.icon;

  // Get passenger name
  const passengerName = (() => {
    const contact = trip.bookingContact;
    if (contact?.firstName && contact?.lastName) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    return contact?.name || 'Unknown passenger';
  })();

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-2xl border border-[#E8E9ED] bg-white p-5 transition
                 hover:-translate-y-0.5 hover:border-[#D2D5DC] hover:shadow-[0_8px_24px_-12px_rgba(20,24,31,0.18)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25"
    >
      {/* Top row: Status, Reservation #, Amount */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${status.class}`}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </span>
          <span className="text-[#D6D9DF]">·</span>
          <span className="text-sm text-[#8A909C] font-mono">
            #{trip.reservationNumber || trip._id?.slice(-6)}
          </span>
          <span className="text-[#D6D9DF]">·</span>
          <span className="text-sm text-[#6B7280]">{passengerName}</span>
        </div>
        <span className="text-lg font-semibold text-[#14181F]">{formatCurrency(amount)}</span>
      </div>

      {/* Route: Pickup → Dropoff with addresses */}
      <div className="mt-3 flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="h-2.5 w-2.5 rounded-full border-2 border-[#14181F] bg-white" />
          <div className="w-px h-6 bg-[#D6D9DF]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#0B5C48]" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-xs uppercase tracking-[0.06em] text-[#9AA0AC]">Pickup</p>
            <p className="text-sm font-medium text-[#14181F] truncate">{pickupAddress}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.06em] text-[#9AA0AC]">Dropoff</p>
            <p className="text-sm font-medium text-[#14181F] truncate">{dropoffAddress}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm text-[#6B7280]">{date}</p>
          <p className="text-sm text-[#8A909C]">{time}</p>
        </div>
      </div>

      {/* Trip type and distance (if available) */}
      {(trip.orderType || trip.tripType || trip.distance) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-[#8A909C] border-t border-[#F0F1F3] pt-3">
          {trip.orderType && (
            <span className="capitalize">{trip.orderType}</span>
          )}
          {trip.tripType && trip.orderType !== trip.tripType && (
            <span className="capitalize">{trip.tripType}</span>
          )}
          {trip.distance && (
            <>
              <span className="text-[#D6D9DF]">·</span>
              <span>{trip.distance} mi</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Earnings;