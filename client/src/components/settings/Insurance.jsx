import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText } from 'lucide-react';
import axios from 'axios';
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

const Insurance = () => {
  const [insurances, setInsurances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [formData, setFormData] = useState({
    provider: '',
    policyNumber: '',
    type: 'liability',
    coverageAmount: '',
    deductible: 0,
    startDate: '',
    endDate: '',
    notes: ''
  });

  const fetchInsurances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/insurance/list`
      );
      setInsurances(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch insurance policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurances();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.provider || !formData.policyNumber || !formData.coverageAmount || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingInsurance
        ? `${import.meta.env.VITE_URL}/insurance/update/${editingInsurance._id}`
        : `${import.meta.env.VITE_URL}/insurance/create`;

      const response = await axios[editingInsurance ? 'put' : 'post'](url, formData);
      toast.success(response.data.message);
      setShowForm(false);
      setEditingInsurance(null);
      setFormData({
        provider: '',
        policyNumber: '',
        type: 'liability',
        coverageAmount: '',
        deductible: 0,
        startDate: '',
        endDate: '',
        notes: ''
      });
      fetchInsurances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save insurance policy');
    }
  };

  const handleEdit = (insurance) => {
    setEditingInsurance(insurance);
    setFormData({
      provider: insurance.provider,
      policyNumber: insurance.policyNumber,
      type: insurance.type,
      coverageAmount: insurance.coverageAmount,
      deductible: insurance.deductible || 0,
      startDate: insurance.startDate?.split('T')[0] || '',
      endDate: insurance.endDate?.split('T')[0] || '',
      notes: insurance.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this insurance policy?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/insurance/delete/${id}`
      );
      toast.success(response.data.message);
      fetchInsurances();
    } catch (error) {
      toast.error('Failed to delete insurance policy');
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      liability: 'bg-blue-100 text-blue-800',
      comprehensive: 'bg-green-100 text-green-800',
      collision: 'bg-yellow-100 text-yellow-800',
      personal_injury: 'bg-purple-100 text-purple-800',
      commercial: 'bg-orange-100 text-orange-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage insurance policies for your vehicles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInsurance(null);
            setFormData({
              provider: '',
              policyNumber: '',
              type: 'liability',
              coverageAmount: '',
              deductible: 0,
              startDate: '',
              endDate: '',
              notes: ''
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Insurance
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : insurances.length > 0 ? (
        <div className="space-y-4">
          {insurances.map((insurance) => (
            <div key={insurance._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{insurance.provider}</h3>
                    <span className={getTypeBadge(insurance.type)}>
                      {insurance.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Policy: {insurance.policyNumber}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Coverage: ${insurance.coverageAmount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(insurance.startDate)} - {formatDate(insurance.endDate)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(insurance)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(insurance._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No insurance policies added yet</p>
          <p className="text-sm">Click "Add Insurance" to add your first policy</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingInsurance ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingInsurance(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Provider</FieldLabel>
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g., State Farm"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Policy Number</FieldLabel>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g., POL-123456"
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Insurance Type</FieldLabel>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="liability">Liability</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="collision">Collision</option>
                  <option value="personal_injury">Personal Injury</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Coverage Amount ($)</FieldLabel>
                  <input
                    type="number"
                    name="coverageAmount"
                    value={formData.coverageAmount}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Deductible ($)</FieldLabel>
                  <input
                    type="number"
                    name="deductible"
                    value={formData.deductible}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Start Date</FieldLabel>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>End Date</FieldLabel>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInsurance(null);
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
                  {editingInsurance ? 'Update Policy' : 'Add Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;