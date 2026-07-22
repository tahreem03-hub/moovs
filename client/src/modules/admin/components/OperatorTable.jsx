// src/modules/admin/components/OperatorTable.jsx
import React from 'react';
import { Edit2, Trash2, Power, Eye } from 'lucide-react';

const OperatorTable = ({ operators, onEdit, onDelete, onToggle, onView }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getPlanBadge = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700'
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  if (operators.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No operators found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {operators.map((op) => (
            <tr key={op._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{op.CompanyName}</td>
              <td className="px-4 py-3 text-gray-700">{op.Fname} {op.Lname}</td>
              <td className="px-4 py-3 text-gray-600">{op.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(op.isActive)}`}>
                  {op.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlanBadge(op.subscriptionPlan)}`}>
                  {op.subscriptionPlan?.charAt(0).toUpperCase() + op.subscriptionPlan?.slice(1) || 'Free'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {op.stats?.companies || 0} C • {op.stats?.vehicles || 0} V • {op.stats?.contacts || 0} Ct
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(op.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onView(op._id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(op._id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggle(op._id)}
                    className={`p-1.5 transition-colors ${op.isActive ? 'text-green-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                    title={op.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(op._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperatorTable;