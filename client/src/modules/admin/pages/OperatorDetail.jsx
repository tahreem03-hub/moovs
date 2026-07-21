import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Loader2, Power, Trash2, Mail, Phone, CalendarDays,
  Building2, Car, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, getErrorMessage } from '../services/adminService';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];
const STATUSES = ['active', 'inactive', 'trial', 'expired'];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const initials = (op) => `${op?.Fname?.[0] || ''}${op?.Lname?.[0] || ''}` || '?';

const OperatorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [operator, setOperator] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  // editable subscription fields
  const [plan, setPlan] = useState('free');
  const [status, setStatus] = useState('trial');

  const load = async () => {
    try {
      setLoading(true);
      const [opRes, compRes, vehRes] = await Promise.all([
        adminService.getOperatorById(id),
        adminService.getOperatorCompanies(id),
        adminService.getOperatorVehicles(id),
      ]);
      const op = opRes.data?.data || opRes.data;
      setOperator(op);
      setPlan(op.subscriptionPlan || 'free');
      setStatus(op.subscriptionStatus || 'trial');
      setCompanies(compRes.data?.data || []);
      setVehicles(vehRes.data?.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load operator'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveSubscription = async () => {
    try {
      setSaving(true);
      const res = await adminService.updateOperator(id, { subscriptionPlan: plan, subscriptionStatus: status });
      setOperator(res.data?.data || { ...operator, subscriptionPlan: plan, subscriptionStatus: status });
      toast.success('Subscription updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update subscription'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      setBusy(true);
      await adminService.toggleOperatorStatus(id);
      setOperator((prev) => ({ ...prev, isActive: !prev.isActive }));
      toast.success(operator.isActive ? 'Operator deactivated' : 'Operator activated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = window.confirm(
      `Delete ${operator.CompanyName || operator.email}? All of their companies, vehicles, and contacts will be permanently removed.`
    );
    if (!ok) return;
    try {
      setBusy(true);
      await adminService.deleteOperator(id);
      toast.success('Operator deleted');
      navigate('/admin/operators');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete operator'));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-gray-900">Operator not found</p>
        <button onClick={() => navigate('/admin/operators')} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
          Back to operators
        </button>
      </div>
    );
  }

  const tiles = [
    { icon: Building2, label: 'Companies', value: companies.length, tint: 'bg-purple-100 text-purple-600' },
    { icon: Car, label: 'Vehicles', value: vehicles.length, tint: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <>
      <button
        onClick={() => navigate('/admin/operators')}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to operators
      </button>

      {/* Profile */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
              {initials(operator)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {[operator.Fname, operator.Lname].filter(Boolean).join(' ') || '—'}
              </h1>
              <p className="text-gray-500">{operator.CompanyName || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                operator.isActive
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <Power className="w-4 h-4" />
              {operator.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-6 text-sm">
          <Row icon={Mail} label="Email" value={operator.email} />
          <Row icon={Phone} label="Phone" value={operator.phone || '—'} />
          <Row icon={CalendarDays} label="Joined" value={fmtDate(operator.createdAt)} />
          <Row
            icon={Power}
            label="Status"
            value={operator.isActive ? 'Active' : 'Inactive'}
          />
        </div>
      </div>

      {/* Subscription editor */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Plan</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
            >
              {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
            >
              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </label>
          <button
            onClick={saveSubscription}
            disabled={saving || (plan === operator.subscriptionPlan && status === operator.subscriptionStatus)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {tiles.map(({ icon: Icon, label, value, tint }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${tint}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Companies + Vehicles lists */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <ListCard title="Companies" empty="No companies yet" items={companies} render={(c) => c.name || c.companyName || c._id} />
        <ListCard
          title="Vehicles"
          empty="No vehicles yet"
          items={vehicles}
          render={(v) => v.name || [v.make, v.model].filter(Boolean).join(' ') || v._id}
        />
      </div>
    </>
  );
};

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-4 w-4 text-gray-400" />
    <span className="text-gray-500 w-16">{label}</span>
    <span className="text-gray-900 font-medium truncate">{value}</span>
  </div>
);

const ListCard = ({ title, items, empty, render }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="px-5 py-3 border-b border-gray-100">
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="px-5 py-8 text-center text-sm text-gray-400">{empty}</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item._id} className="px-5 py-3 text-sm text-gray-700">{render(item)}</li>
        ))}
      </ul>
    )}
  </div>
);

export default OperatorDetail;