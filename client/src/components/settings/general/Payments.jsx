import React, { useState, useEffect } from 'react';
import { Save, Plus, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
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

  const [newBank, setNewBank] = useState({
    accountName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking'
  });

  useEffect(() => {
    fetchSettings();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setNewBank(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_URL}/company-profile/payments`, settings);
      toast.success('Payment settings saved!');
    } catch (error) {
      toast.error('Failed to save');
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

      <div className="pt-4 border-t border-gray-200">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default Payments;