import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Lock, Calendar, Tag } from 'lucide-react';
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

const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100">
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

const PromoCodes = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    autoApply: false,
    codes: []
  });

  const [newCode, setNewCode] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0
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
      if (data.data?.promoCode) {
        setSettings(prev => ({ ...prev, ...data.data.promoCode }));
      }
    } catch (error) {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNewCodeChange = (e) => {
    const { name, value } = e.target;
    setNewCode(prev => ({ ...prev, [name]: value }));
  };

  const addCode = () => {
    if (!newCode.code.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    if (newCode.discountAmount <= 0) {
      toast.error('Please enter a valid discount amount');
      return;
    }

    setSettings(prev => ({
      ...prev,
      codes: [...prev.codes, { ...newCode, isActive: true, usedCount: 0 }]
    }));
    setNewCode({
      code: '',
      discountType: 'percentage',
      discountAmount: 0,
      validFrom: '',
      validUntil: '',
      usageLimit: 0
    });
  };

  const removeCode = (index) => {
    setSettings(prev => ({
      ...prev,
      codes: prev.codes.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_URL}/customer-portal/promo-codes`,
        settings
      );
      toast.success('Promo codes saved!');
    } catch (error) {
      toast.error('Failed to save promo codes');
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
      <div className="bg-white border border-gray-200 rounded-lg">
        <Toggle
          enabled={settings.enabled}
          onChange={() => handleToggle('enabled')}
          label="Enable Promo Codes"
          description="Allow customers to apply promo codes during booking"
        />

        {settings.enabled && (
          <>
            <Toggle
              enabled={settings.autoApply}
              onChange={() => handleToggle('autoApply')}
              label="Auto Apply Best Promo Code"
              description="Automatically apply the best available promo code to each booking"
              className="border-t border-gray-100"
            />

            <div className="p-4 border-t border-gray-200">
              <SectionTitle>Create New Promo Code</SectionTitle>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Code</FieldLabel>
                  <input
                    type="text"
                    name="code"
                    value={newCode.code}
                    onChange={handleNewCodeChange}
                    className={inputCls}
                    placeholder="e.g., SUMMER25"
                  />
                </div>
                <div>
                  <FieldLabel>Discount Type</FieldLabel>
                  <select
                    name="discountType"
                    value={newCode.discountType}
                    onChange={handleNewCodeChange}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <FieldLabel>Discount Amount</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {newCode.discountType === 'flat' ? '$' : ''}
                    </span>
                    <input
                      type="number"
                      name="discountAmount"
                      value={newCode.discountAmount}
                      onChange={handleNewCodeChange}
                      className={`${inputCls} ${newCode.discountType === 'flat' ? 'pl-7' : ''}`}
                      placeholder={newCode.discountType === 'flat' ? '0.00' : '0'}
                      min="0"
                      step="0.01"
                    />
                    {newCode.discountType === 'percentage' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>Usage Limit</FieldLabel>
                  <input
                    type="number"
                    name="usageLimit"
                    value={newCode.usageLimit}
                    onChange={handleNewCodeChange}
                    className={inputCls}
                    placeholder="0 (unlimited)"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <FieldLabel>Valid From</FieldLabel>
                  <input
                    type="date"
                    name="validFrom"
                    value={newCode.validFrom}
                    onChange={handleNewCodeChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>Valid Until</FieldLabel>
                  <input
                    type="date"
                    name="validUntil"
                    value={newCode.validUntil}
                    onChange={handleNewCodeChange}
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addCode}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Promo Code
              </button>
            </div>
          </>
        )}
      </div>

      {/* Existing Codes */}
      {settings.enabled && settings.codes.length > 0 && (
        <div>
          <SectionTitle>Existing Promo Codes</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {settings.codes.map((code, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-sm">{code.code}</td>
                    <td className="px-4 py-2">
                      {code.discountType === 'percentage' 
                        ? `${code.discountAmount}%` 
                        : `$${code.discountAmount.toFixed(2)}`
                      }
                    </td>
                    <td className="px-4 py-2">{code.usedCount || 0} / {code.usageLimit || '∞'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeCode(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!settings.enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-700">Promo Codes Disabled</p>
            <p className="text-xs text-yellow-600">Enable promo codes above to start creating discounts</p>
          </div>
        </div>
      )}

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

export default PromoCodes;