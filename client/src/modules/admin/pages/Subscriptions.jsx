import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, getErrorMessage } from '../services/adminService';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];
const STATUSES = ['active', 'trial', 'inactive', 'expired'];

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
  const [byPlan, setByPlan] = useState({});
  const [byStatus, setByStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await adminService.getSubscriptionStats();
        const data = res.data?.data || res.data || {};
        if (cancelled) return;
        setByPlan(data.byPlan || {});
        setByStatus(data.byStatus || {});
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Failed to load subscription stats'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const planRows = PLANS.map((p) => ({ key: p, count: byPlan[p] || 0 }));
  const statusRows = STATUSES.map((s) => ({ key: s, count: byStatus[s] || 0 }));
  const total = planRows.reduce((n, r) => n + r.count, 0);
  const maxPlan = Math.max(1, ...planRows.map((r) => r.count));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How your {total} operator{total === 1 ? '' : 's'} are distributed across plans and billing states.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-lg border border-gray-200">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plans */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">By plan</h2>
            </div>
            <div className="space-y-4">
              {planRows.map(({ key, count }) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-24"><Badge map={PLAN_STYLES} value={key} /></span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count / maxPlan) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">By billing status</h2>
            <div className="grid grid-cols-2 gap-4">
              {statusRows.map(({ key, count }) => (
                <div key={key} className="rounded-lg border border-gray-100 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{count}</p>
                  <div className="mt-1"><Badge map={STATUS_STYLES} value={key} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Subscriptions;