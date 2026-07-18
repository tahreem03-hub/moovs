// components/settings/Cancellation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
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

const Cancellation = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'flexible',
    description: '',
    vehicleType: 'all',
    refundConditions: []
  });

  const [refundCondition, setRefundCondition] = useState({
    refundPercentage: 100,
    quantity: 24,
    timeUnit: 'hours'
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/cancellation/list`
      );
      setPolicies(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch cancellation policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addRefundCondition = () => {
    if (refundCondition.quantity > 0) {
      setFormData(prev => ({
        ...prev,
        refundConditions: [...prev.refundConditions, { ...refundCondition }]
      }));
      setRefundCondition({ refundPercentage: 100, quantity: 24, timeUnit: 'hours' });
    }
  };

  const removeRefundCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      refundConditions: prev.refundConditions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Policy name is required');
      return;
    }

    if (formData.refundConditions.length === 0) {
      toast.error('At least one refund condition is required');
      return;
    }

    try {
      const url = editingPolicy
        ? `${import.meta.env.VITE_URL}/cancellation/update/${editingPolicy._id}`
        : `${import.meta.env.VITE_URL}/cancellation/create`;

      const response = await axios[editingPolicy ? 'put' : 'post'](url, formData);
      toast.success(response.data.message);
      setShowForm(false);
      setEditingPolicy(null);
      setFormData({
        name: '',
        level: 'flexible',
        description: '',
        vehicleType: 'all',
        refundConditions: []
      });
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save policy');
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      level: policy.level,
      description: policy.description || '',
      vehicleType: policy.vehicleType || 'all',
      refundConditions: policy.refundConditions || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/cancellation/delete/${id}`
      );
      toast.success(response.data.message);
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const getLevelBadge = (level) => {
    const colors = {
      flexible: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      strict: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cancellation Policy</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage cancellation policies for your vehicles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPolicy(null);
            setFormData({
              name: '',
              level: 'flexible',
              description: '',
              vehicleType: 'all',
              refundConditions: []
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Policy
        </button>
      </div>

      {/* Policy List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : policies.length > 0 ? (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                  <span className={getLevelBadge(policy.level)}>
                    {policy.level.charAt(0).toUpperCase() + policy.level.slice(1)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(policy)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(policy._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {policy.refundConditions && policy.refundConditions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {policy.refundConditions.map((cond, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {cond.refundPercentage}% refund ({cond.quantity} {cond.timeUnit})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No cancellation policies created yet</p>
          <p className="text-sm">Click "Create Policy" to add your first policy</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingPolicy ? 'Edit Cancellation Policy' : 'Create Cancellation Policy'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPolicy(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <FieldLabel>Policy Name</FieldLabel>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g., Standard Cancellation"
                  required
                />
              </div>

              <div>
                <FieldLabel>Policy Level</FieldLabel>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Flexible for SUVs/Sedans, Strict for larger vehicles [citation:4]
                </p>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Brief description of this policy"
                />
              </div>

              <div>
                <FieldLabel>Vehicle Type</FieldLabel>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="all">All Vehicles</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="minibus">Minibus</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              <div>
                <SectionTitle>Refund Conditions</SectionTitle>
                <p className="text-sm text-gray-500 mb-3">
                  Moovs supports Full Refund, 50% Refund, and 25% Refund conditions [citation:4]
                </p>

                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <FieldLabel>Refund %</FieldLabel>
                    <select
                      value={refundCondition.refundPercentage}
                      onChange={(e) => setRefundCondition(prev => ({
                        ...prev,
                        refundPercentage: parseInt(e.target.value)
                      }))}
                      className={`${inputCls} bg-white`}
                    >
                      <option value={100}>100% (Full)</option>
                      <option value={50}>50%</option>
                      <option value={25}>25%</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Quantity</FieldLabel>
                    <input
                      type="number"
                      value={refundCondition.quantity}
                      onChange={(e) => setRefundCondition(prev => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0
                      }))}
                      className={inputCls}
                      min={1}
                    />
                  </div>
                  <div>
                    <FieldLabel>Time Unit</FieldLabel>
                    <select
                      value={refundCondition.timeUnit}
                      onChange={(e) => setRefundCondition(prev => ({
                        ...prev,
                        timeUnit: e.target.value
                      }))}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addRefundCondition}
                  className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                >
                  + Add Refund Condition
                </button>

                {formData.refundConditions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.refundConditions.map((cond, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm">
                          {cond.refundPercentage}% refund ({cond.quantity} {cond.timeUnit})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRefundCondition(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPolicy(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cancellation;