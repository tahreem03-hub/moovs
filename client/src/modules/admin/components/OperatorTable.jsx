import React from 'react';
import { Pencil, Power, Trash2, Mail, Phone } from 'lucide-react';

/**
 * OperatorTable
 * Props:
 *   operators: array of operator objects
 *   onEdit(operator)
 *   onToggle(operator)
 *   onDelete(operator)
 *   togglingId: id of operator whose status is currently toggling (optional)
 */
const planLabel = (plan) => {
  const map = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };
  return map[plan] || 'Free';
};

const planClasses = (plan) => {
  switch (plan) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-700';
    case 'pro':
      return 'bg-blue-100 text-blue-700';
    case 'basic':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const OperatorTable = ({ operators = [], onEdit, onToggle, onDelete, togglingId = null }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Company', 'Contact', 'Email', 'Phone', 'Status', 'Plan', 'Created', 'Actions'].map(
              (h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    h === 'Actions' ? 'text-right' : ''
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {operators.map((op) => (
            <tr key={op._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {op.companyName || '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {[op.firstName, op.lastName].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {op.email}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {op.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {op.phone}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    op.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {op.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${planClasses(
                    op.subscriptionPlan
                  )}`}
                >
                  {planLabel(op.subscriptionPlan)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(op.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit?.(op)}
                    title="Edit operator"
                    className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle?.(op)}
                    disabled={togglingId === op._id}
                    title={op.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                      op.isActive
                        ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(op)}
                    title="Delete operator"
                    className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
