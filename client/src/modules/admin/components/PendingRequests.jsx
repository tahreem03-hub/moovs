// src/modules/admin/components/PendingRequests.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Image, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const VITE_URL = import.meta.env.VITE_URL;
      const res = await axios.get(`${VITE_URL}/admin/billing/pending-requests`, {
        withCredentials: true
      });
      setRequests(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this payment request? The operator\'s plan will be upgraded.')) return;
    
    setProcessing(requestId);
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      await axios.put(`${VITE_URL}/admin/billing/approve/${requestId}`, {}, {
        withCredentials: true
      });
      toast.success('Request approved successfully');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this payment request?')) return;
    
    setProcessing(requestId);
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      await axios.put(`${VITE_URL}/admin/billing/reject/${requestId}`, {}, {
        withCredentials: true
      });
      toast.success('Request rejected');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve manual payment requests from operators
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">No pending requests</p>
          <p className="text-sm text-gray-400">All payment requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {req.operator?.CompanyName || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {req.operator?.Fname} {req.operator?.Lname}
                    </span>
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-medium">Plan:</span> {req.planName}
                    </span>
                    <span className="text-gray-600">
                      <span className="font-medium">Amount:</span> {formatCurrency(req.amount)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatDate(req.requestedAt)}
                    </span>
                  </div>
                  {req.notes && (
                    <p className="text-sm text-gray-500 mt-2">{req.notes}</p>
                  )}
                  {req.screenshot && (
                    <a 
                      href={req.screenshot} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      <Image className="w-4 h-4" />
                      View Screenshot
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(req._id)}
                    disabled={processing === req._id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing === req._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={processing === req._id}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;