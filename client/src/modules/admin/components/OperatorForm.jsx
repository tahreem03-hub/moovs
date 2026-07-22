// src/modules/admin/components/OperatorForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, User, Building2, Mail, Phone, Lock } from 'lucide-react';
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

const OperatorForm = ({ 
  isOpen, 
  onClose, 
  operator, 
  onSuccess, 
  isEditing = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Fname: '',
    Lname: '',
    email: '',
    CompanyName: '',
    phone: '',
    password: '',
    isActive: true,
    subscriptionPlan: 'free',
    subscriptionStatus: 'trial'
  });

  useEffect(() => {
    if (operator) {
      setFormData({
        Fname: operator.Fname || '',
        Lname: operator.Lname || '',
        email: operator.email || '',
        CompanyName: operator.CompanyName || '',
        phone: operator.phone || '',
        password: '',
        isActive: operator.isActive !== undefined ? operator.isActive : true,
        subscriptionPlan: operator.subscriptionPlan || 'free',
        subscriptionStatus: operator.subscriptionStatus || 'trial'
      });
    } else {
      setFormData({
        Fname: '',
        Lname: '',
        email: '',
        CompanyName: '',
        phone: '',
        password: '',
        isActive: true,
        subscriptionPlan: 'free',
        subscriptionStatus: 'trial'
      });
    }
  }, [operator]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.Fname || !formData.Lname || !formData.email || !formData.CompanyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('Password is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      
      // Remove password if empty (for edit mode)
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      const response = await axios({
        method: isEditing ? 'put' : 'post',
        url: `${import.meta.env.VITE_URL}/admin/operators${isEditing ? `/${operator._id}` : ''}`,
        data: payload,
        withCredentials: true
      });

      toast.success(response.data.message || `Operator ${isEditing ? 'updated' : 'created'} successfully`);
      
      // Reset password field
      setFormData(prev => ({ ...prev, password: '' }));
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this operator? This cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/admin/operators/${operator._id}`,
        { withCredentials: true }
      );
      toast.success(response.data.message || 'Operator deleted successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete operator';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-opacity duration-300">
      <div className="absolute inset-0 bg-gray-600/60" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-[600px] max-w-full bg-white border shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Operator' : 'Create Operator'}
              </h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Company Name */}
            <div>
              <FieldLabel>Company Name</FieldLabel>
              <input
                type="text"
                name="CompanyName"
                value={formData.CompanyName}
                onChange={handleChange}
                className={inputCls}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>First Name</FieldLabel>
                <input
                  type="text"
                  name="Fname"
                  value={formData.Fname}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <input
                  type="text"
                  name="Lname"
                  value={formData.Lname}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <FieldLabel>Email Address</FieldLabel>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputCls}
                placeholder="email@company.com"
                required
              />
            </div>

            <div>
              <FieldLabel>Phone Number</FieldLabel>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputCls}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <FieldLabel>{isEditing ? 'New Password (optional)' : 'Password'}</FieldLabel>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputCls}
                placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                required={!isEditing}
                minLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Subscription Plan</FieldLabel>
                <select
                  name="subscriptionPlan"
                  value={formData.subscriptionPlan}
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
                <FieldLabel>Subscription Status</FieldLabel>
                <select
                  name="subscriptionStatus"
                  value={formData.subscriptionStatus}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Footer */}
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
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : isEditing ? 'Update Operator' : 'Create Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperatorForm;