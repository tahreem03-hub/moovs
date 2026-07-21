import React from 'react';
import { Users, CheckCircle, Clock, Building2, Car } from 'lucide-react';

/**
 * StatsCards
 * Props:
 *   stats: {
 *     totalOperators, activeOperators, pendingOperators,
 *     totalCompanies, totalVehicles
 *   }
 *   loading: boolean
 */
const CARDS = [
  {
    key: 'totalOperators',
    label: 'Total Operators',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'activeOperators',
    label: 'Active Operators',
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'pendingOperators',
    label: 'Pending Operators',
    icon: Clock,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'totalCompanies',
    label: 'Total Companies',
    icon: Building2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'totalVehicles',
    label: 'Total Vehicles',
    icon: Car,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

const StatsCards = ({ stats = {}, loading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
        <div
          key={key}
          className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4 shadow-sm"
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 leading-tight">
                {stats[key] ?? 0}
              </p>
            )}
            <p className="text-sm text-gray-500 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
