// src/modules/admin/components/PendingRequests.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Image, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);

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
    setProcessing(requestId);
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      await axios.patch(`${VITE_URL}/admin/billing/approve/${requestId}`, {
        adminNotes
      }, {
        withCredentials: true
      });
      toast.success('Request approved successfully');
      setShowModal(false);
      setAdminNotes('');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(requestId);
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      await axios.patch(`${VITE_URL}/admin/billing/reject/${requestId}`, {
        adminNotes
      }, {
        withCredentials: true
      });
      toast.success('Request rejected');
      setShowModal(false);
      setAdminNotes('');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const openModal = (request, action) => {
    setSelectedRequest(request);
    setModalAction(action);
    setAdminNotes('');
    setShowModal(true);
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
                    onClick={() => openModal(req, 'approve')}
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
                    onClick={() => openModal(req, 'reject')}
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

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {modalAction === 'approve' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-bold text-gray-900">
                {modalAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Operator:</span> {selectedRequest.operator?.CompanyName || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Plan:</span> {selectedRequest.planName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span> {formatCurrency(selectedRequest.amount)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes {modalAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows="3"
                placeholder={modalAction === 'approve' ? 'Optional notes...' : 'Reason for rejection...'}
              />
              {modalAction === 'reject' && !adminNotes.trim() && (
                <p className="text-xs text-red-500 mt-1">Please provide a reason for rejection</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalAction === 'approve') {
                    handleApprove(selectedRequest._id);
                  } else {
                    handleReject(selectedRequest._id);
                  }
                }}
                disabled={processing === selectedRequest._id}
                className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing === selectedRequest._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  modalAction === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;