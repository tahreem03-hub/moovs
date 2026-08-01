// driver-app/src/components/ChangePasswordModal.jsx
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../services/api';

const MIN_PASSWORD_LENGTH = 8; // keep in sync with the backend check

const ChangePasswordModal = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShow({ current: false, next: false, confirm: false });
  };

  const handleClose = () => {
    if (loading) return; // don't close mid-request
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from your current password');
      return;
    }

    try {
      setLoading(true);
      await driverApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, value, setValue, key) => (
    <div className="mt-4">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show[key] ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full border border-gray-300 rounded-xl pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
          placeholder={label}
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 rounded-lg p-2">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          For your security, set a new password to replace the one you were emailed.
        </p>

        {field('Current password', currentPassword, setCurrentPassword, 'current')}
        {field('New password', newPassword, setNewPassword, 'next')}
        {field('Confirm new password', confirmPassword, setConfirmPassword, 'confirm')}

        <p className="text-xs text-gray-400 mt-2">
          Must be at least {MIN_PASSWORD_LENGTH} characters.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;