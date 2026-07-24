// src/pages/PaymentLink.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PaymentLink = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate the payment link
    const validateLink = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_URL}/payment/validate/${token}`,
          { withCredentials: true }
        );
        setPaymentData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired payment link');
      } finally {
        setLoading(false);
      }
    };
    validateLink();
  }, [token]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/payment/pay/${token}`,
        { paymentMethod: 'online' },
        { withCredentials: true }
      );
      toast.success('Payment successful!');
      navigate('/payment-success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Invalid Payment Link</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Secure Payment</h1>
          <p className="text-gray-500 mt-2">
            Pay for {paymentData?.reservationNumber || 'your reservation'}
          </p>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-200 my-6 pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reservation</span>
            <span className="font-medium text-gray-900">{paymentData?.reservationNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-2xl text-gray-900">
              ${paymentData?.amount?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-gray-700">Online Payment</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
          <Lock className="w-4 h-4" />
          <span>Secured by SSL encryption</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ${paymentData?.amount?.toFixed(2)}
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          By clicking "Pay Now" you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};

export default PaymentLink;