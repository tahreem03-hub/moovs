import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold tracking-wide text-black/90 uppercase mb-4">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const Toggle = ({ enabled, onChange, label, description, className = '' }) => (
  <div className={`flex items-center justify-between py-3 border-b border-gray-100 ${className}`}>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    creditCardEnabled: true,
    paymentPreference: 'full_charge',
    depositAmount: 0,
    depositType: 'flat'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/customer-portal`
      );
      if (data.data?.payments) {
        setSettings(prev => ({ ...prev, ...data.data.payments }));
      }
    } catch (error) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_URL}/customer-portal/payments`,
        settings
      );
      toast.success('Payment settings saved!');
    } catch (error) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SectionTitle>Credit Card Payments</SectionTitle>

      <div className="bg-white border border-gray-200 rounded-lg">
        <Toggle
          enabled={settings.creditCardEnabled}
          onChange={() => handleToggle('creditCardEnabled')}
          label="Enable credit cards for reservations"
          description={settings.creditCardEnabled 
            ? "Credit card section enabled" 
            : "Credit card section disabled, customers using the widget will not be able to enter a credit card"
          }
        />
      </div>

      <SectionTitle>Reservation Payment Preference</SectionTitle>
      <p className="text-sm text-gray-500 mb-4">
        Choose how much your customers will be charged when confirming a reservation
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          {['no_charge', 'deposit', 'full_charge'].map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentPreference"
                value={option}
                checked={settings.paymentPreference === option}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm capitalize">{option.replace('_', ' ')}</span>
            </label>
          ))}
        </div>

        {settings.paymentPreference === 'deposit' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Collect a partial payment</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="depositType"
                    value="percentage"
                    checked={settings.depositType === 'percentage'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">%</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="depositType"
                    value="flat"
                    checked={settings.depositType === 'flat'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">$</span>
                </label>
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {settings.depositType === 'flat' ? '$' : ''}
                </span>
                <input
                  type="number"
                  name="depositAmount"
                  value={settings.depositAmount}
                  onChange={handleChange}
                  className={`${inputCls} ${settings.depositType === 'flat' ? 'pl-7' : ''}`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Customers will be charged ${settings.depositAmount || 0} when making a reservation
            </p>
          </div>
        )}

        {settings.paymentPreference === 'full_charge' && (
          <p className="text-sm text-gray-500 mt-2">
            Collect the total amount
          </p>
        )}

        {settings.paymentPreference === 'no_charge' && (
          <p className="text-sm text-gray-500 mt-2">
            Customers won't be charged
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default Payments;