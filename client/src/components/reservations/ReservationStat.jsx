// src/modules/reservations/components/ReservationStats.jsx
import React from 'react';
import { Calendar, Clock, CheckCircle, Car } from 'lucide-react';

// One instrument panel, not four floating boxes.
// Fixed 2x2 — this lives in a 320px rail, so no viewport breakpoints.
const Shell = ({ children }) => (
  <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-white overflow-hidden divide-x divide-y divide-gray-200 [&>*:nth-child(-n+2)]:border-t-0 [&>*:nth-child(odd)]:border-l-0">
    {children}
  </div>
);

const ReservationStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <Shell>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-3 py-2.5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-2 w-12 rounded-full bg-gray-100" />
            <div className="mt-2 h-5 w-8 rounded bg-gray-200" />
          </div>
        ))}
      </Shell>
    );
  }

  const statCards = [
    {
      label: 'Total',
      title: 'Total reservations',
      value: stats?.total || 0,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      label: 'Today',
      title: "Today's trips",
      value: stats?.today || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'Upcoming',
      title: 'Upcoming trips',
      value: stats?.upcoming || 0,
      icon: Car,
      color: 'text-green-600'
    },
    {
      label: 'Active',
      title: 'Dispatched + started',
      value: (stats?.statusCounts?.dispatched || 0) + (stats?.statusCounts?.started || 0),
      icon: CheckCircle,
      color: 'text-purple-600'
    }
  ];

  return (
    <Shell>
      {statCards.map((card) => {
        const Icon = card.icon;
        const isZero = card.value === 0;
        return (
          <div key={card.label} title={card.title} className="px-3 py-2.5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 truncate">
              {card.label}
            </p>
            <div className="mt-0.5 flex items-end justify-between gap-1">
              <span
                className={`text-xl font-semibold leading-none tabular-nums truncate ${
                  isZero ? 'text-gray-300' : 'text-gray-900'
                }`}
              >
                {card.value}
              </span>
              <Icon
                className={`w-3.5 h-3.5 shrink-0 mb-0.5 ${isZero ? 'text-gray-300' : card.color}`}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </Shell>
  );
};

export default ReservationStats;