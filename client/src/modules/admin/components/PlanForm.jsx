// src/modules/admin/components/PlanForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import subscriptionService from '../services/subscriptionService';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const PlanForm = ({ isOpen, onClose, plan, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'basic',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    trialPeriod: 30,
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    features: {
      vehicles: { limit: 0, label: 'Vehicles' },
      drivers: { limit: 0, label: 'Drivers' },
      companies: { limit: 0, label: 'Companies' },
      contacts: { limit: 0, label: 'Contacts' },
      advancedFeatures: [],
      customFeatures: []
    }
  });

  const [newAdvancedFeature, setNewAdvancedFeature] = useState({ name: '', enabled: true, limit: 0 });
  const [newCustomFeature, setNewCustomFeature] = useState({ name: '', enabled: true, limit: 0 });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        tier: plan.tier || 'basic',
        price: plan.price || 0,
        currency: plan.currency || 'USD',
        billingCycle: plan.billingCycle || 'monthly',
        trialPeriod: plan.trialPeriod || 30,
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        isDefault: plan.isDefault || false,
        sortOrder: plan.sortOrder || 0,
        features: {
          vehicles: plan.features?.vehicles || { limit: 0, label: 'Vehicles' },
          drivers: plan.features?.drivers || { limit: 0, label: 'Drivers' },
          companies: plan.features?.companies || { limit: 0, label: 'Companies' },
          contacts: plan.features?.contacts || { limit: 0, label: 'Contacts' },
          advancedFeatures: plan.features?.advancedFeatures || [],
          customFeatures: plan.features?.customFeatures || []
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        tier: 'basic',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        trialPeriod: 30,
        isActive: true,
        isDefault: false,
        sortOrder: 0,
        features: {
          vehicles: { limit: 0, label: 'Vehicles' },
          drivers: { limit: 0, label: 'Drivers' },
          companies: { limit: 0, label: 'Companies' },
          contacts: { limit: 0, label: 'Contacts' },
          advancedFeatures: [],
          customFeatures: []
        }
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureLimitChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: {
          ...prev.features[key],
          limit: parseInt(value) || 0
        }
      }
    }));
  };

  const addAdvancedFeature = () => {
    if (!newAdvancedFeature.name.trim()) {
      toast.error('Please enter a feature name');
      return;
    }
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        advancedFeatures: [
          ...prev.features.advancedFeatures,
          { ...newAdvancedFeature, name: newAdvancedFeature.name.trim() }
        ]
      }
    }));
    setNewAdvancedFeature({ name: '', enabled: true, limit: 0 });
  };

  const removeAdvancedFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        advancedFeatures: prev.features.advancedFeatures.filter((_, i) => i !== index)
      }
    }));
  };

  const addCustomFeature = () => {
    if (!newCustomFeature.name.trim()) {
      toast.error('Please enter a feature name');
      return;
    }
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        customFeatures: [
          ...prev.features.customFeatures,
          { ...newCustomFeature, name: newCustomFeature.name.trim() }
        ]
      }
    }));
    setNewCustomFeature({ name: '', enabled: true, limit: 0 });
  };

  const removeCustomFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        customFeatures: prev.features.customFeatures.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plan) {
        await subscriptionService.updatePlan(plan._id, formData);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionService.createPlan(formData);
        toast.success('Plan created successfully');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-opacity duration-300">
      <div className="absolute inset-0 bg-gray-600/60" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-[700px] max-w-full bg-white border shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {plan ? 'Edit Plan' : 'Create Plan'}
              </h2>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div>
              <FieldLabel>Plan Name</FieldLabel>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g., Pro Plan"
                required
              />
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`${inputCls} resize-none`}
                rows={2}
                placeholder="Brief description of this plan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Tier</FieldLabel>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <FieldLabel>Price ($)</FieldLabel>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Billing Cycle</FieldLabel>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <FieldLabel>Trial Period (days)</FieldLabel>
                <input
                  type="number"
                  name="trialPeriod"
                  value={formData.trialPeriod}
                  onChange={handleChange}
                  className={inputCls}
                  min="0"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Features</FieldLabel>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-700">Vehicles</label>
                    <input
                      type="number"
                      value={formData.features.vehicles.limit}
                      onChange={(e) => handleFeatureLimitChange('vehicles', e.target.value)}
                      className={inputCls}
                      placeholder="0 = Unlimited"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Drivers</label>
                    <input
                      type="number"
                      value={formData.features.drivers.limit}
                      onChange={(e) => handleFeatureLimitChange('drivers', e.target.value)}
                      className={inputCls}
                      placeholder="0 = Unlimited"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-700">Companies</label>
                    <input
                      type="number"
                      value={formData.features.companies.limit}
                      onChange={(e) => handleFeatureLimitChange('companies', e.target.value)}
                      className={inputCls}
                      placeholder="0 = Unlimited"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Contacts</label>
                    <input
                      type="number"
                      value={formData.features.contacts.limit}
                      onChange={(e) => handleFeatureLimitChange('contacts', e.target.value)}
                      className={inputCls}
                      placeholder="0 = Unlimited"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Advanced Features</FieldLabel>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {formData.features.advancedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                    <span className="flex-1 text-sm">{feature.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAdvancedFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdvancedFeature.name}
                    onChange={(e) => setNewAdvancedFeature(prev => ({ ...prev, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Feature name"
                  />
                  <button
                    type="button"
                    onClick={addAdvancedFeature}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Custom Features</FieldLabel>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {formData.features.customFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                    <span className="flex-1 text-sm">{feature.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomFeature.name}
                    onChange={(e) => setNewCustomFeature(prev => ({ ...prev, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Custom feature name"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanForm;