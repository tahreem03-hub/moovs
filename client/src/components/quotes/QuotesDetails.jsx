// src/modules/quotes/components/QuotesDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  DollarSign, 
  MessageSquare, 
  Send, 
  Edit2, 
  Trash2,
  Phone,
  Mail,
  Building2,
  FileText,
  Users,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuoteStatusBadge = ({ status }) => {
  const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    new: { label: 'New', color: 'bg-blue-100 text-blue-600' },
    sent: { label: 'Sent', color: 'bg-yellow-100 text-yellow-600' },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' }
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// ✅ Helper function to format phone
const formatPhone = (phone) => {
  if (!phone) return '-';
  if (typeof phone === 'object') {
    return phone.number || '-';
  }
  return phone;
};

const QuotesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (location.state?.quote) {
      setQuote(location.state.quote);
      setLoading(false);
    } else if (id) {
      fetchQuote();
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const VITE_URL = import.meta.env.VITE_URL;
      const response = await axios.get(`${VITE_URL}/quote/${id}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setQuote(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch quote details');
      console.error('Fetch quote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      const response = await axios.post(
        `${VITE_URL}/quote/${id}/comments`,
        { text: comment },
        { withCredentials: true }
      );
      if (response.data.success) {
        setQuote(prev => ({
          ...prev,
          internalComments: response.data.data
        }));
        setComment('');
        toast.success('Comment added');
      }
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Add comment error:', error);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      const response = await axios.put(
        `${VITE_URL}/quote/${id}/status`,
        { status },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success(`Quote ${status}`);
        fetchQuote();
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      const response = await axios.delete(`${VITE_URL}/quote/delete/${id}`, {
        withCredentials: true
      });
      if (response.data.success) {
        toast.success('Quote deleted');
        navigate('/quotes?status=ALL');
      }
    } catch (error) {
      toast.error('Failed to delete quote');
      console.error('Delete error:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStopIcon = (type) => {
    switch(type) {
      case 'pickup': return '📍';
      case 'dropoff': return '🏁';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen text-gray-500 bg-gray-50">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-lg">No quote selected</p>
        <p className="text-sm">Select a quote from the list to view details</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/quotes?status=ALL')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quote.quoteNumber}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <QuoteStatusBadge status={quote.status} />
                <span className="text-sm text-gray-500">
                  {formatDateTime(quote.pickupDateTime)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quote.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('new')}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Mark as New
              </button>
            )}
            {quote.status === 'new' && (
              <button
                onClick={() => handleStatusChange('sent')}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Send Quote
              </button>
            )}
            <button
              onClick={() => navigate(`/quotes/edit/${quote._id}`)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Customer Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Name</p>
              <p className="font-medium text-gray-900">
                {quote.bookingContact?.firstName} {quote.bookingContact?.lastName || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Email</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {quote.bookingContact?.email || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Phone</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {/* ✅ FIXED: Format phone correctly */}
                {formatPhone(quote.bookingContact?.phone)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Company</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {quote.bookingContact?.company || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Trip Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Trip Type</p>
              <p className="font-medium text-gray-900 capitalize">{quote.tripType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Order Type</p>
              <p className="font-medium text-gray-900">{quote.orderType || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Vehicle</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-gray-400" />
                {quote.vehicle?.name || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Passengers</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {quote.passengerCount || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Pickup</p>
              <p className="font-medium text-gray-900">{formatDateTime(quote.pickupDateTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Dropoff</p>
              <p className="font-medium text-gray-900">
                {quote.dropoffDateTime ? formatDateTime(quote.dropoffDateTime) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Assigned To</p>
              <p className="font-medium text-gray-900">
                {quote.assignedMember?.Fname} {quote.assignedMember?.Lname || 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Passenger</p>
              <p className="font-medium text-gray-900">
                {quote.passenger?.firstName} {quote.passenger?.lastName || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Stops */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Route
          </h2>
          <div className="space-y-3">
            {quote.stops?.map((stop, index) => (
              <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-lg">{getStopIcon(stop.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize">{stop.type}</p>
                  <p className="text-sm text-gray-600">
                    {stop.address?.street}, {stop.address?.city}, {stop.address?.state} {stop.address?.zipCode}
                  </p>
                  {stop.notes && (
                    <p className="text-sm text-gray-500 mt-0.5">{stop.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            Pricing
          </h2>
          <div className="space-y-2">
            {quote.pricing?.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {quote.pricing?.taxRate > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Tax ({quote.pricing.taxRate}%)</span>
                <span className="font-medium">{formatCurrency((quote.pricing.subtotal || 0) * (quote.pricing.taxRate / 100))}</span>
              </div>
            )}
            {quote.pricing?.discount > 0 && (
              <div className="flex justify-between text-sm py-1 text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(quote.pricing.discount)}</span>
              </div>
            )}
            {quote.pricing?.gratuity > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Gratuity</span>
                <span className="font-medium">{formatCurrency(quote.pricing.gratuity)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(quote.pricing?.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(quote.driverNote || quote.tripNotes) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Notes</h2>
            {quote.driverNote && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 uppercase">Driver Note</p>
                <p className="text-sm text-gray-900">{quote.driverNote}</p>
              </div>
            )}
            {quote.tripNotes && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Trip Notes</p>
                <p className="text-sm text-gray-900">{quote.tripNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Internal Comments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Internal Comments
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {quote.internalComments?.length === 0 ? (
              <p className="text-sm text-gray-400">No comments yet</p>
            ) : (
              quote.internalComments?.map((comment, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{comment.createdByName || 'Unknown'}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!comment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Delete Quote</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{quote.quoteNumber}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesDetails;