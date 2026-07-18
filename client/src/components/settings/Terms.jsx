import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, CheckCircle } from 'lucide-react';
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

const Terms = () => {
  const [termsList, setTermsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerms, setEditingTerms] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    waitingCharges: { enabled: false, rate: 0, gracePeriod: 15 },
    extraStops: { enabled: false, charge: 0 },
    carSeats: { enabled: false, charge: 0 },
    alcoholPolicy: { allowed: true, notes: '' },
    isDefault: false
  });

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/terms/list`
      );
      setTermsList(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch Terms & Conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const url = editingTerms
        ? `${import.meta.env.VITE_URL}/terms/update/${editingTerms._id}`
        : `${import.meta.env.VITE_URL}/terms/create`;

      const response = await axios[editingTerms ? 'put' : 'post'](url, formData);
      toast.success(response.data.message);
      setShowForm(false);
      setEditingTerms(null);
      setFormData({
        title: '',
        content: '',
        waitingCharges: { enabled: false, rate: 0, gracePeriod: 15 },
        extraStops: { enabled: false, charge: 0 },
        carSeats: { enabled: false, charge: 0 },
        alcoholPolicy: { allowed: true, notes: '' },
        isDefault: false
      });
      fetchTerms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save Terms & Conditions');
    }
  };

  const handleEdit = (terms) => {
    setEditingTerms(terms);
    setFormData({
      title: terms.title,
      content: terms.content,
      waitingCharges: terms.waitingCharges || { enabled: false, rate: 0, gracePeriod: 15 },
      extraStops: terms.extraStops || { enabled: false, charge: 0 },
      carSeats: terms.carSeats || { enabled: false, charge: 0 },
      alcoholPolicy: terms.alcoholPolicy || { allowed: true, notes: '' },
      isDefault: terms.isDefault || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete these Terms & Conditions?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/terms/delete/${id}`
      );
      toast.success(response.data.message);
      fetchTerms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete Terms & Conditions');
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage terms and conditions for your business
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTerms(null);
            setFormData({
              title: '',
              content: '',
              waitingCharges: { enabled: false, rate: 0, gracePeriod: 15 },
              extraStops: { enabled: false, charge: 0 },
              carSeats: { enabled: false, charge: 0 },
              alcoholPolicy: { allowed: true, notes: '' },
              isDefault: false
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Terms
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : termsList.length > 0 ? (
        <div className="space-y-4">
          {termsList.map((terms) => (
            <div key={terms._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{terms.title}</h3>
                    {terms.isDefault && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{terms.content}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(terms)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(terms._id)}
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
          <p className="text-lg">No Terms & Conditions created yet</p>
          <p className="text-sm">Click "Create Terms" to add your first terms</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingTerms ? 'Edit Terms & Conditions' : 'Create Terms & Conditions'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTerms(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <FieldLabel>Title</FieldLabel>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g., Standard Terms & Conditions"
                  required
                />
              </div>

              <div>
                <FieldLabel>Content</FieldLabel>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className={`${inputCls} resize-none`}
                  rows={6}
                  placeholder="Enter the full terms and conditions content..."
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <FieldLabel>Additional Policies</FieldLabel>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={formData.waitingCharges.enabled}
                      onChange={(e) => handleNestedChange('waitingCharges', 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enable Waiting Charges</span>
                  </div>
                  {formData.waitingCharges.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <FieldLabel>Rate ($/hour)</FieldLabel>
                        <input
                          type="number"
                          value={formData.waitingCharges.rate}
                          onChange={(e) => handleNestedChange('waitingCharges', 'rate', parseFloat(e.target.value))}
                          className={inputCls}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <FieldLabel>Grace Period (minutes)</FieldLabel>
                        <input
                          type="number"
                          value={formData.waitingCharges.gracePeriod}
                          onChange={(e) => handleNestedChange('waitingCharges', 'gracePeriod', parseInt(e.target.value))}
                          className={inputCls}
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={formData.extraStops.enabled}
                      onChange={(e) => handleNestedChange('extraStops', 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enable Extra Stops Charges</span>
                  </div>
                  {formData.extraStops.enabled && (
                    <div className="ml-6">
                      <FieldLabel>Charge per Stop ($)</FieldLabel>
                      <input
                        type="number"
                        value={formData.extraStops.charge}
                        onChange={(e) => handleNestedChange('extraStops', 'charge', parseFloat(e.target.value))}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={formData.carSeats.enabled}
                      onChange={(e) => handleNestedChange('carSeats', 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enable Car Seats</span>
                  </div>
                  {formData.carSeats.enabled && (
                    <div className="ml-6">
                      <FieldLabel>Charge per Seat ($)</FieldLabel>
                      <input
                        type="number"
                        value={formData.carSeats.charge}
                        onChange={(e) => handleNestedChange('carSeats', 'charge', parseFloat(e.target.value))}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={formData.alcoholPolicy.allowed}
                      onChange={(e) => handleNestedChange('alcoholPolicy', 'allowed', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Allow Alcohol</span>
                  </div>
                  <div className="ml-6 mt-2">
                    <FieldLabel>Alcohol Notes</FieldLabel>
                    <input
                      type="text"
                      value={formData.alcoholPolicy.notes}
                      onChange={(e) => handleNestedChange('alcoholPolicy', 'notes', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., Must be 21+ to consume alcohol"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Set as Default Terms</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTerms(null);
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
                  {editingTerms ? 'Update Terms' : 'Create Terms'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Terms;