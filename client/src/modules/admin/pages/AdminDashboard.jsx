
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, getErrorMessage } from '../services/adminService';
import StatsCards from '../components/StatsCards';
 
const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};
 
const planLabel = (plan) =>
  ({ free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' }[plan] || 'Free');
 
const fullName = (op) => [op.Fname, op.Lname].filter(Boolean).join(' ');
 
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [statsRes, operatorsRes] = await Promise.all([
          adminService.getStats(),
          adminService.getOperators(1, 5, ''),
        ]);
        if (cancelled) return;
 
        const statsData = statsRes.data?.data || statsRes.data || {};
        setStats(statsData.stats || statsData);
 
        // backend responds { success, data: [...], pagination: {...} }
        const opsData = operatorsRes.data?.data || operatorsRes.data || {};
        setRecent(Array.isArray(opsData) ? opsData : opsData.operators || opsData.results || []);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Failed to load dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
 
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview and recent activity</p>
      </div>
 
      <StatsCards stats={stats} loading={loading} />
 
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Operators</h2>
          <Link
            to="/admin/operators"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all operators
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
 
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-900">No operators yet</p>
              <p className="text-sm text-gray-500 mt-1">Operators appear here once they register.</p>
            </div>
          ) : (
            recent.map((op) => (
              <button
                key={op._id}
                type="button"
                onClick={() => navigate(`/admin/operators/${op._id}`)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{op.CompanyName || '—'}</p>
                  <p className="text-sm text-gray-500 truncate">{fullName(op)} · {op.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {planLabel(op.subscriptionPlan)}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      op.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {op.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="hidden md:block text-xs text-gray-400 whitespace-nowrap">{timeAgo(op.createdAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
 
export default AdminDashboard;
 
