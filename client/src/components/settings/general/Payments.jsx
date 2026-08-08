import React, { useState, useEffect } from 'react';
import { Save, Plus, Banknote, CheckCircle, AlertCircle, DollarSign, Percent } from 'lucide-react';
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

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [settings, setSettings] = useState({
    businessType: '',
    businessName: '',
    ein: '',
    bankAccounts: [],
    isSetupComplete: false
  });

  const [cashbackSettings, setCashbackSettings] = useState({
    enabled: true,
    rate: 5,
    minRideAmount: 0,
    maxRedeemPercent: 100,
    expiryDays: 365
  });

  const [newBank, setNewBank] = useState({
    accountName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking'
  });

  useEffect(() => {
    fetchSettings();
    fetchCashbackSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/company-profile/payments`
      );
      if (data.data) setSettings(prev => ({ ...prev, ...data.data }));
    } catch (error) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Cashback Settings
  const fetchCashbackSettings = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/company-profile/cashback`
      );
      if (data.data) {
        setCashbackSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      // If endpoint doesn't exist yet, use defaults
      console.log('Cashback endpoint not found, using defaults');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleCashbackChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCashbackSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setNewBank(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`${import.meta.env.VITE_URL}/company-profile/payments`, settings);
      await axios.patch(`${import.meta.env.VITE_URL}/company-profile/cashback`, cashbackSettings);
      toast.success('All settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
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
      {/* Payment Status */}
      <div className={`rounded-lg p-4 ${settings.isSetupComplete ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          {settings.isSetupComplete ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <p className={`font-medium ${settings.isSetupComplete ? 'text-green-700' : 'text-yellow-700'}`}>
            {settings.isSetupComplete ? 'Payments Active' : 'Setup Required'}
          </p>
        </div>
      </div>

      {/* Business Information */}
      <SectionTitle>Business Information</SectionTitle>
      <div className="space-y-4">
        <div>
          <FieldLabel>Business Type</FieldLabel>
          <select name="businessType" value={settings.businessType} onChange={handleChange} className={`${inputCls} bg-white`}>
            <option value="">Select</option>
            <option value="sole_proprietorship">Sole Proprietorship</option>
            <option value="llc">LLC</option>
            <option value="corporation">Corporation</option>
            <option value="partnership">Partnership</option>
            <option value="non_profit">Non-Profit</option>
          </select>
        </div>
        <div>
          <FieldLabel>Business Name</FieldLabel>
          <input type="text" name="businessName" value={settings.businessName} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <FieldLabel>EIN</FieldLabel>
          <input type="text" name="ein" value={settings.ein} onChange={handleChange} className={inputCls} placeholder="XX-XXXXXXX" />
        </div>
      </div>

      {/* Bank Account */}
      <SectionTitle>Bank Account</SectionTitle>
      {settings.bankAccounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {settings.bankAccounts.map((acc, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{acc.accountName}</p>
                  <p className="text-xs text-gray-500">{acc.accountType} •••• {acc.accountNumber?.slice(-4)}</p>
                </div>
                {acc.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBankForm ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <FieldLabel>Account Name</FieldLabel>
            <input type="text" name="accountName" value={newBank.accountName} onChange={handleBankChange} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Routing Number</FieldLabel>
              <input type="text" name="routingNumber" value={newBank.routingNumber} onChange={handleBankChange} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Account Number</FieldLabel>
              <input type="text" name="accountNumber" value={newBank.accountNumber} onChange={handleBankChange} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Add Account</button>
            <button type="button" onClick={() => setShowBankForm(false)} className="text-gray-600">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowBankForm(true)} className="flex items-center gap-2 text-blue-600 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Bank Account
        </button>
      )}

      {/* ============================================ */}
      {/* ✅ CASHBACK SECTION - NEW */}
      {/* ============================================ */}
      <div className="pt-6 border-t border-gray-200">
        <SectionTitle>Cashback Settings</SectionTitle>
        <p className="text-sm text-gray-500 mb-4">
          Configure cashback rewards for your customers
        </p>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <DollarSign className={`w-5 h-5 ${cashbackSettings.enabled ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className={`font-medium ${cashbackSettings.enabled ? 'text-green-700' : 'text-gray-500'}`}>
                  {cashbackSettings.enabled ? 'Cashback Active' : 'Cashback Disabled'}
                </p>
                <p className="text-xs text-gray-400">
                  {cashbackSettings.enabled ? 'Customers earn cashback on every ride' : 'No cashback will be awarded'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="enabled"
                checked={cashbackSettings.enabled}
                onChange={handleCashbackChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Cashback Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Cashback Rate (%)</FieldLabel>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="rate"
                  min="0"
                  max="100"
                  step="0.5"
                  value={cashbackSettings.rate}
                  onChange={handleCashbackChange}
                  disabled={!cashbackSettings.enabled}
                  className={`${inputCls} pl-9 ${!cashbackSettings.enabled && 'opacity-50 cursor-not-allowed'}`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Percentage of ride total customers earn</p>
            </div>

            <div>
              <FieldLabel>Max Redeem % of Invoice</FieldLabel>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="maxRedeemPercent"
                  min="0"
                  max="100"
                  step="5"
                  value={cashbackSettings.maxRedeemPercent}
                  onChange={handleCashbackChange}
                  disabled={!cashbackSettings.enabled}
                  className={`${inputCls} pl-9 ${!cashbackSettings.enabled && 'opacity-50 cursor-not-allowed'}`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Max % of invoice that can be paid with cashback</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-gray-600">
              💡 Customers will earn <strong className="text-blue-600">{cashbackSettings.rate}%</strong> cashback on each ride.
              They can redeem up to <strong className="text-blue-600">{cashbackSettings.maxRedeemPercent}%</strong> of their invoice total.
              {!cashbackSettings.enabled && <span className="text-red-500 ml-2">Currently disabled.</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </form>
  );
};

export default Payments;