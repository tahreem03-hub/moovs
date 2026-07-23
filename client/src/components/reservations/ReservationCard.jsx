// src/modules/reservations/components/ReservationCard.jsx
import React from 'react';
import { Calendar, Clock, User, Car, MapPin } from 'lucide-react';
import ReservationStatusBadge from './ReservationStatusBadge';

const ReservationCard = ({ reservation, onClick }) => {
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div
      onClick={() => onClick(reservation._id)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-900">
              {reservation.reservationNumber}
            </span>
            <ReservationStatusBadge status={reservation.status} />
            <span className="text-sm text-gray-500">
              {formatDate(reservation.pickupDateTime)} at {formatTime(reservation.pickupDateTime)}
            </span>
          </div>
          
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {reservation.bookingContact?.firstName} {reservation.bookingContact?.lastName}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-gray-400" />
              {reservation.vehicle?.name || 'No vehicle'}
            </span>
            {reservation.driver && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {reservation.driver?.firstName} {reservation.driver?.lastName}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(reservation.pricing?.total)}
            </span>
          </div>

          {reservation.stops && reservation.stops.length > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-xs">
                {reservation.stops[0]?.address?.street} → {reservation.stops[reservation.stops.length - 1]?.address?.street}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;