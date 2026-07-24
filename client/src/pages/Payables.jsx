// src/pages/Payables.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Payables = () => {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ driverId: '', type: 'driver_payment', description: '', amount: '' });

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_URL}/payable/list`, { withCredentials: true });
      setPayables(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch payables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_URL}/payable/${id}/status`, { status }, { withCredentials: true });
      toast.success(`Payable ${status}`);
      fetchPayables();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_URL}/payable/create`, formData, { withCredentials: true });
      toast.success('Payable created');
      setShowForm(false);
      setFormData({ driverId: '', type: 'driver_payment', description: '', amount: '' });
      fetchPayables();
    } catch (error) {
      toast.error('Failed to create payable');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payables</h1>
          <p className="text-sm text-gray-500">Manage driver payments and vendor payables</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Payable
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-gray-900">
            {payables.filter(p => p.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-yellow-600">
            {payables.filter(p => p.status === 'approved').length}
          </p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-green-600">
            {payables.filter(p => p.status === 'paid').length}
          </p>
          <p className="text-sm text-gray-500">Paid</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payables.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No payables found</td></tr>
            ) : (
              payables.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{p.payableNumber}</td>
                  <td className="px-4 py-3">{p.driverName || '-'}</td>
                  <td className="px-4 py-3">{p.description}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      p.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'paid' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.status === 'pending' && (
                        <button onClick={() => updateStatus(p._id, 'approved')} className="text-blue-600 hover:text-blue-700 text-sm">Approve</button>
                      )}
                      {p.status === 'approved' && (
                        <button onClick={() => updateStatus(p._id, 'paid')} className="text-green-600 hover:text-green-700 text-sm">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Payable</h3>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border rounded px-3 py-2 mb-3"
              >
                <option value="driver_payment">Driver Payment</option>
                <option value="vendor_payment">Vendor Payment</option>
                <option value="affiliate_commission">Affiliate Commission</option>
              </select>
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2 mb-3"
              />
              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border rounded px-3 py-2 mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payables;