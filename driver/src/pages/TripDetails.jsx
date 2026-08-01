// driver-app/src/pages/TripDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Car,
  DollarSign,
  CheckCircle,
  Play,
  Loader2,
  Navigation,
  Calendar,
  ChevronRight,
  CreditCard,
  Package,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../services/api';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getTripById(id);
      setTrip(response.data.data);
    } catch (error) {
      toast.error('Couldn\'t load trip details');
      navigate('/rides');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!confirm('Start this trip?')) return;
    try {
      setActionLoading(true);
      await driverApi.startTrip(id);
      toast.success('Trip started');
      await loadTrip();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!confirm('Complete this trip?')) return;
    try {
      setActionLoading(true);
      await driverApi.completeTrip(id);
      toast.success('Trip completed');
      await loadTrip();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] rounded-2xl border border-[#EEEFF2] bg-white animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E1E3E8] bg-white/60 px-6 py-16 text-center">
        <Navigation className="mx-auto h-12 w-12 text-[#D6D9DF]" />
        <p className="mt-3 text-[15px] font-medium text-[#14181F]">Trip not found</p>
        <p className="mt-1 text-sm text-[#8A909C]">The trip you're looking for doesn't exist</p>
        <button
          onClick={() => navigate('/rides')}
          className="mt-4 rounded-full bg-[#14181F] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#2A2F38]"
        >
          Back to rides
        </button>
      </div>
    );
  }

  const canStart = ['confirmed', 'dispatched'].includes(trip.status);
  const canComplete = trip.status === 'started';

  // Customer name
  const customerName = trip.bookingContact?.firstName && trip.bookingContact?.lastName
    ? `${trip.bookingContact.firstName} ${trip.bookingContact.lastName}`
    : trip.bookingContact?.name || 'Unknown passenger';

  // Format phone
  const formatPhone = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.number) {
      return val.countryCode ? `${val.countryCode} ${val.number}` : val.number;
    }
    return null;
  };
  const customerPhone = formatPhone(trip.bookingContact?.phone) || 
                        formatPhone(trip.bookingContact?.number) || 'N/A';

  // Get stop display
  const getStopDisplay = (type) => {
    const stop = trip.stops?.find((s) => s.type === type);
    if (!stop) return '—';

    if (stop.locationType === 'airport' && stop.airport) {
      const a = stop.airport;
      return [a.code, a.name].filter(Boolean).join(' · ') || 'Airport';
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

  const pickupAddress = getStopDisplay('pickup');
  const dropoffAddress = getStopDisplay('dropoff');

  const pickupDateTime = trip.pickupDateTime
    ? new Date(trip.pickupDateTime)
    : null;
  const dropoffDateTime = trip.dropoffDateTime
    ? new Date(trip.dropoffDateTime)
    : null;

  const totalPrice = trip.pricing?.total ?? trip.totalPrice ?? 0;

  // Vehicle display
  let vehicleDisplay = 'N/A';
  if (trip.vehicle) {
    if (typeof trip.vehicle === 'object') {
      const vehicleName = trip.vehicle.name || trip.vehicle.model || trip.vehicle.make || 'Vehicle';
      const vehicleType = trip.vehicle.type || trip.vehicle.category || '';
      vehicleDisplay = vehicleType ? `${vehicleName} (${vehicleType})` : vehicleName;
    } else if (typeof trip.vehicle === 'string') {
      vehicleDisplay = trip.vehicle;
    }
  }

  const reservationNumber = trip.reservationNumber || trip._id?.slice(-6) || 'N/A';
  const orderType = trip.orderType || trip.tripType || 'Standard';

  // Status color mapping
  const statusColors = {
    completed: { bg: 'bg-[#0B5C48]/10', text: 'text-[#0B5C48]', dot: 'bg-[#0B5C48]' },
    started: { bg: 'bg-[#2563EB]/10', text: 'text-[#2563EB]', dot: 'bg-[#2563EB]' },
    dispatched: { bg: 'bg-[#4F46E5]/10', text: 'text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
    confirmed: { bg: 'bg-[#B8860B]/10', text: 'text-[#B8860B]', dot: 'bg-[#B8860B]' },
    cancelled: { bg: 'bg-[#B42318]/10', text: 'text-[#B42318]', dot: 'bg-[#B42318]' },
    pending: { bg: 'bg-[#8A909C]/10', text: 'text-[#8A909C]', dot: 'bg-[#8A909C]' }
  };
  const statusColor = statusColors[trip.status] || statusColors.pending;

  return (
    <div className="max-w-4xl text-[#14181F]">
      {/* Back button */}
      <button
        onClick={() => navigate('/rides')}
        className="group mb-4 inline-flex items-center gap-2 text-sm text-[#6B7280] transition hover:text-[#14181F]"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to rides
      </button>

      {/* Main Card */}
      <div className="rounded-2xl border border-[#E8E9ED] bg-white overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-[#F0F1F3]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[26px] font-semibold leading-none tracking-[-0.02em]">
                  Trip #{reservationNumber}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                <span className="capitalize">{orderType}</span>
                <span className="text-[#D6D9DF]">·</span>
                <span>{pickupDateTime?.toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${statusColor.bg} ${statusColor.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
              {trip.status?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(canStart || canComplete) && (
          <div className="p-6 sm:p-8 border-b border-[#F0F1F3] bg-[#FAFAFA]">
            <div className="flex flex-col sm:flex-row gap-3">
              {canStart && (
                <button
                  onClick={handleStartTrip}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#14181F] px-6 py-3 
                           text-sm font-medium text-white transition hover:bg-[#2A2F38] disabled:opacity-60 
                           disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start trip
                </button>
              )}
              {canComplete && (
                <button
                  onClick={handleCompleteTrip}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#0B5C48] px-6 py-3 
                           text-sm font-medium text-white transition hover:bg-[#0A4D3B] disabled:opacity-60 
                           disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Complete trip
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Route */}
          <section>
            <h3 className="text-sm font-medium text-[#3A414D] mb-4">Route</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full border-2 border-[#14181F] bg-white" />
                  <div className="w-px h-8 bg-[#D6D9DF]" />
                  <div className="h-3 w-3 rounded-full bg-[#0B5C48]" />
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-[#9AA0AC]">Pickup</p>
                    <p className="text-sm font-medium text-[#14181F]">{pickupAddress}</p>
                    {pickupDateTime && (
                      <p className="text-sm text-[#6B7280]">
                        {pickupDateTime.toLocaleTimeString(undefined, { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} · {pickupDateTime.toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-[#9AA0AC]">Dropoff</p>
                    <p className="text-sm font-medium text-[#14181F]">{dropoffAddress}</p>
                    {dropoffDateTime && (
                      <p className="text-sm text-[#6B7280]">
                        {dropoffDateTime.toLocaleTimeString(undefined, { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} · {dropoffDateTime.toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Customer & Vehicle */}
          <section className="border-t border-[#F0F1F3] pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#F5F5F3] p-2">
                    <User className="h-4 w-4 text-[#6B7280]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#9AA0AC]">Customer</p>
                    <p className="text-sm font-medium text-[#14181F] truncate">{customerName}</p>
                  </div>
                </div>
                {customerPhone !== 'N/A' && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280] pl-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{customerPhone}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#F5F5F3] p-2">
                    <Car className="h-4 w-4 text-[#6B7280]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9AA0AC]">Vehicle</p>
                    <p className="text-sm font-medium text-[#14181F]">{vehicleDisplay}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Info */}
          <section className="border-t border-[#F0F1F3] pt-6">
            <h3 className="text-sm font-medium text-[#3A414D] mb-4">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem
                icon={CreditCard}
                label="Price"
                value={`$${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'}`}
              />
              <InfoItem
                icon={DollarSign}
                label="Payment status"
                value={
                  <span className={`font-medium ${
                    trip.paymentStatus === 'paid' ? 'text-[#0B5C48]' :
                    trip.paymentStatus === 'unpaid' ? 'text-[#B8860B]' :
                    'text-[#6B7280]'
                  }`}>
                    {trip.paymentStatus?.charAt(0).toUpperCase() + trip.paymentStatus?.slice(1) || 'N/A'}
                  </span>
                }
              />
              {trip.passengerCount && (
                <InfoItem
                  icon={Package}
                  label="Passengers"
                  value={trip.passengerCount}
                />
              )}
              {trip.distance && (
                <InfoItem
                  icon={Navigation}
                  label="Distance"
                  value={`${trip.distance} mi`}
                />
              )}
            </div>
          </section>

          {/* Notes */}
          {(trip.tripNotes || trip.driverNote) && (
            <section className="border-t border-[#F0F1F3] pt-6">
              <h3 className="text-sm font-medium text-[#3A414D] mb-2">Notes</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {trip.tripNotes || trip.driverNote}
              </p>
            </section>
          )}

          {/* Additional Stops */}
          {trip.stops && trip.stops.length > 2 && (
            <section className="border-t border-[#F0F1F3] pt-6">
              <h3 className="text-sm font-medium text-[#3A414D] mb-3">Waypoints</h3>
              <div className="space-y-2">
                {trip.stops.map((stop, index) => {
                  const isPickup = stop.type === 'pickup';
                  const isDropoff = stop.type === 'dropoff';
                  const label = isPickup ? 'Pickup' : isDropoff ? 'Dropoff' : `Stop ${index + 1}`;
                  const address = stop.locationType === 'airport'
                    ? [stop.airport?.code, stop.airport?.name].filter(Boolean).join(' · ') || 'Airport'
                    : [stop.address?.street || stop.address?.address, stop.address?.city, stop.address?.state]
                        .filter(Boolean).join(', ') || '—';
                  
                  return (
                    <div key={stop._id || index} className="flex items-center gap-3 rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isPickup ? 'bg-[#0B5C48]/10 text-[#0B5C48]' :
                        isDropoff ? 'bg-[#B42318]/10 text-[#B42318]' :
                        'bg-[#E8E9ED] text-[#6B7280]'
                      }`}>
                        {label}
                      </span>
                      <span className="text-sm text-[#14181F] truncate">{address}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] px-4 py-3">
      {Icon && <Icon className="h-4 w-4 text-[#8A909C] shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#9AA0AC]">{label}</p>
        <p className="text-sm font-medium text-[#14181F] truncate">{value || '—'}</p>
      </div>
    </div>
  );
};

export default TripDetails;