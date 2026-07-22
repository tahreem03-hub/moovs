// src/modules/admin/components/StatsCards.jsx
import React from 'react';
import { Users, UserCheck, UserX, Building2, Car, Clock } from 'lucide-react';

const StatsCards = ({ stats }) => {
  const cards = [
    { 
      key: 'totalOperators', 
      label: 'Total Operators', 
      value: stats.totalOperators || 0, 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600' 
    },
    { 
      key: 'activeOperators', 
      label: 'Active Operators', 
      value: stats.activeOperators || 0, 
      icon: UserCheck, 
      color: 'bg-green-50 text-green-600' 
    },
    { 
      key: 'pendingOperators', 
      label: 'Pending', 
      value: stats.pendingOperators || 0, 
      icon: UserX, 
      color: 'bg-yellow-50 text-yellow-600' 
    },
    { 
      key: 'totalCompanies', 
      label: 'Total Companies', 
      value: stats.totalCompanies || 0, 
      icon: Building2, 
      color: 'bg-purple-50 text-purple-600' 
    },
    { 
      key: 'totalVehicles', 
      label: 'Total Vehicles', 
      value: stats.totalVehicles || 0, 
      icon: Car, 
      color: 'bg-orange-50 text-orange-600' 
    },
    { 
      key: 'trialExpiring', 
      label: 'Trials Expiring', 
      value: stats.trialExpiring || 0, 
      icon: Clock, 
      color: 'bg-red-50 text-red-600' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;