import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuotesDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const currentStatus = searchParams.get("status") || "ALL";

  // ✅ Fetch quotes based on status
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const VITE_URL = import.meta.env.VITE_URL;
      const params = {};
      
      if (currentStatus !== "ALL") {
        params.status = currentStatus.toLowerCase();
      }

      const response = await axios.get(`${VITE_URL}/quote/list`, {
        params,
        withCredentials: true
      });

      if (response.data.success) {
        setQuotes(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      toast.error('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchParams.get("status")) {
      setSearchParams({ status: "ALL" }, { replace: true });
    } else {
      fetchQuotes();
    }
  }, [searchParams]);

  const changeStatus = (status) => {
    setSearchParams({ status });
  };

  // ✅ Handle quote click to show details
  const handleQuoteClick = (quote) => {
    setSelectedQuote(quote);
    navigate(`/quotes/${quote._id}`, { state: { quote } });
  };

  // ✅ Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // ✅ Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      new: 'bg-blue-100 text-blue-600',
      sent: 'bg-yellow-100 text-yellow-600',
      archived: 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className='min-h-screen w-80 border-r border-gray-400/20 flex flex-col'>
      {/* Title & Create Button */}
      <div className='p-3 border-b border-gray-300 pb-4'>
        <div className='flex justify-between pb-3'>
          <h1 className='text-2xl font-bold text-black/90'>Quotes</h1>
          <button 
            className='rounded text-white bg-blue-600/95 text-lg w-20 h-9'
            onClick={() => navigate({
              pathname: "/quotes/create",
              search: `?${searchParams.toString()}`
            })}
          >
            Create
          </button>
        </div>

        {/* Filter tabs */}
        <div className='flex flex-wrap gap-1'>
          {['ALL', 'NEW', 'SENT', 'DRAFT', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              className={`text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50 ${
                currentStatus === status ? 'bg-sky-100 text-blue-600' : ''
              }`}
              onClick={() => changeStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Records */}
      <div className='flex-1 overflow-y-auto p-3'>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No quotes found</p>
            <p className="text-xs mt-1">Create a new quote to get started</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {quotes.map((quote) => (
              <div
                key={quote._id}
                onClick={() => handleQuoteClick(quote)}
                className='bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='font-semibold text-sm text-gray-900'>
                      {quote.quoteNumber}
                    </p>
                    <p className='text-xs text-gray-600'>
                      {quote.bookingContact?.firstName} {quote.bookingContact?.lastName}
                    </p>
                    <p className='text-xs text-gray-400'>
                      {formatDate(quote.pickupDateTime)}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-sm text-gray-900'>
                      {formatCurrency(quote.pricing?.total)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status?.toUpperCase() || 'DRAFT'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesDashboard;