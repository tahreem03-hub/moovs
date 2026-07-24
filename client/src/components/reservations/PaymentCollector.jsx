// src/components/Reservation/PaymentCollector.jsx
import React, { useState } from 'react';
import { CreditCard, DollarSign, Link, Clock, CheckCircle, XCircle, Copy, CreditCardIcon, ReceiptText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
    { value: 'card', label: 'Card on the spot', icon: CreditCard },
    { value: 'cash', label: 'Cash Payment', icon: DollarSign },
    { value: 'advance', label: 'Advance Payment', icon: Clock },
    { value: 'online', label: 'Online Payment', icon: Link }
];

const PaymentCollector = ({ reservation, onPaymentComplete }) => {
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState('card');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentLink, setPaymentLink] = useState(null);
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!reservation) return null;

    const totalPaid = reservation.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remainingBalance = (reservation.pricing?.total || 0) - totalPaid;
    const isFullyPaid = remainingBalance <= 0;

    // Set initial amount to remaining balance
    React.useEffect(() => {
        if (remainingBalance > 0) {
            setAmount(remainingBalance);
        }
    }, [remainingBalance]);

    const handleCollectPayment = async () => {
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (amount > remainingBalance) {
            toast.error(`Amount exceeds remaining balance of $${remainingBalance.toFixed(2)}`);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_URL}/payment/${reservation._id}/collect`,
                { amount, method, reference, notes },
                { withCredentials: true }
            );
            toast.success(res.data.message);
            if (onPaymentComplete) onPaymentComplete();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to collect payment');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePaymentLink = async () => {
        setLoading(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_URL}/payment/${reservation._id}/payment-link`,
                {},
                { withCredentials: true }
            );
            setPaymentLink(res.data.data);
            setShowPaymentLink(true);
            toast.success('Payment link generated!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate payment link');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseReservation = async () => {
        if (!window.confirm('Close this reservation? It must be fully paid.')) return;

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_URL}/payment/${reservation._id}/close`,
                {},
                { withCredentials: true }
            );
            toast.success(res.data.message);
            if (onPaymentComplete) onPaymentComplete();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close reservation');
        }
    };

    const copyPaymentLink = () => {
        navigator.clipboard.writeText(paymentLink.paymentLink);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">

            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Customer Information
            </h2>

            {/* Balance Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">${reservation.pricing?.total?.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${remainingBalance > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className={`text-xl font-bold ${remainingBalance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        ${remainingBalance.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${isFullyPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {isFullyPaid ? ' Fully Paid' : ' Partially Paid'}
                </span>
                {reservation.isClosed && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                        Closed
                    </span>
                )}
            </div>

            {!isFullyPaid && !reservation.isClosed && (
                <>
                    {/* Payment Methods */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {PAYMENT_METHODS.map((pm) => {
                            const Icon = pm.icon;
                            return (
                                <button
                                    key={pm.value}
                                    type="button"
                                    onClick={() => setMethod(pm.value)}
                                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors flex items-center gap-2 ${method === pm.value
                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {pm.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Collect</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max={remainingBalance}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Max: ${remainingBalance.toFixed(2)}</p>
                    </div>

                    {/* Reference & Notes */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Check #, TXN ID, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Payment notes..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCollectPayment}
                            disabled={loading || !amount || amount <= 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                'Collect Payment'
                            )}
                        </button>

                        <button
                            onClick={handleGeneratePaymentLink}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Link className="w-4 h-4" />
                            Generate Payment Link
                        </button>
                    </div>
                </>
            )}

            {/* Payment Link Display */}
            {showPaymentLink && paymentLink && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">🔗 Payment Link</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={paymentLink.paymentLink}
                            readOnly
                            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                        />
                        <button
                            onClick={copyPaymentLink}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Expires: {new Date(paymentLink.expiresAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Amount: ${paymentLink.amount.toFixed(2)}</p>
                </div>
            )}

            {/* Close Button */}
            {isFullyPaid && !reservation.isClosed && (
                <button
                    onClick={handleCloseReservation}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    🔒 Close Reservation
                </button>
            )}

            {/* Payment History */}
            {reservation.payments && reservation.payments.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-blue-600" />
                Payment History
            </h2>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {reservation.payments.map((payment, index) => (
                            <div key={index} className="flex items-center justify-between text-sm border-b pb-1">
                                <div>
                                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                                    <span className="text-gray-500 ml-2 capitalize">{payment.method}</span>
                                    {payment.reference && (
                                        <span className="text-gray-400 text-xs ml-2">({payment.reference})</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                        {new Date(payment.collectedAt).toLocaleDateString()}
                                    </span>
                                    {payment.status === 'completed' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentCollector;