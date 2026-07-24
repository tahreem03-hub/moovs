// src/pages/PaymentSuccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, FileText, ArrowRight } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h1>
        <p className="text-gray-500 mb-6">
          Your payment has been processed successfully.
        </p>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-medium text-gray-900">#PAY-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-t border-gray-200">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Completed
            </span>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium text-blue-700 mb-2">What's Next?</p>
          <ul className="text-sm text-blue-600 space-y-2">
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Your reservation is now confirmed
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              An invoice has been generated
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Check your email for confirmation
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/reservations')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View My Reservations
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;