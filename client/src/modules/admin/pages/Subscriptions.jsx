// src/modules/admin/pages/Subscriptions.jsx
import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard, Users, UserCheck, UserX, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService, { getErrorMessage } from '../services/adminService';

const PLAN_STYLES = {
  free: 'bg-gray-100 text-gray-600',
  basic: 'bg-sky-100 text-sky-700',
  pro: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-100 text-red-600',
};

const Badge = ({ map, value }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[value] || 'bg-gray-100 text-gray-600'}`}>
    {value}
  </span>
);

const Subscriptions = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubscriptionStats();
      setStats(res.data?.data || {});
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load subscription stats'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-white rounded-lg border border-gray-200">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      </div>
    );
  }

  const byPlan = stats.byPlan || {};
  const byStatus = stats.byStatus || {};
  const total = Object.values(byPlan).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of your {total} operator{total === 1 ? '' : 's'} and their subscription status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total Operators</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{byStatus.active || 0}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{byStatus.trial || 0}</p>
              <p className="text-sm text-gray-500">Trial</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(byStatus.inactive || 0) + (byStatus.expired || 0)}</p>
              <p className="text-sm text-gray-500">Inactive/Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plans */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">By Plan</h2>
          </div>
          <div className="space-y-4">
            {['free', 'basic', 'pro', 'enterprise'].map((plan) => {
              const count = byPlan[plan] || 0;
              const maxPlan = Math.max(1, ...Object.values(byPlan));
              return (
                <div key={plan} className="flex items-center gap-4">
                  <span className="w-24"><Badge map={PLAN_STYLES} value={plan} /></span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count / maxPlan) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statuses */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">By Billing Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {['active', 'trial', 'inactive', 'expired'].map((status) => (
              <div key={status} className="rounded-lg border border-gray-100 p-4">
                <p className="text-2xl font-semibold text-gray-900">{byStatus[status] || 0}</p>
                <div className="mt-1"><Badge map={STATUS_STYLES} value={status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Subscriptions;