// src/modules/reservations/components/ReservationStatusBadge.jsx
import React from 'react';
import { Clock, CheckCircle, Car, MapPin, AlertCircle, XCircle, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle
  },
  dispatched: {
    label: 'Dispatched',
    color: 'bg-purple-100 text-purple-700',
    icon: Car
  },
  started: {
    label: 'Started',
    color: 'bg-green-100 text-green-700',
    icon: MapPin
  },
  completed: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-700',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    icon: XCircle
  },
  billed: {
    label: 'Billed',
    color: 'bg-teal-100 text-teal-700',
    icon: FileText
  }
};

const ReservationStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default ReservationStatusBadge;