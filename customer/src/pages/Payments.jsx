import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Plus, Trash2, Star, StarOff, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

const Payments = () => {
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [newCard, setNewCard] = useState({
        brand: 'visa',
        last4: '',
        expMonth: '',
        expYear: '',
        isDefault: false
    });

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            const [methodsRes, historyRes] = await Promise.all([
                api.get('/payment-methods'),
                api.get('/payments')
            ]);

            if (methodsRes.data.success) setPaymentMethods(methodsRes.data.data);
            if (historyRes.data.success) setPaymentHistory(historyRes.data.data);
        } catch (error) {
            console.error('Fetch payment data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async () => {
        try {
            const response = await api.post('/payment-methods', {
                ...newCard,
                gateway: 'stripe',
                gatewayPaymentMethodId: `pm_${Date.now()}`
            });
            if (response.data.success) {
                setSuccess('Card added successfully');
                setShowAddCard(false);
                fetchPaymentData();
                setNewCard({ brand: 'visa', last4: '', expMonth: '', expYear: '', isDefault: false });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add card');
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm('Are you sure you want to delete this card?')) return;
        try {
            await api.delete(`/payment-methods/${id}`);
            setSuccess('Card deleted successfully');
            fetchPaymentData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete card');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.put(`/payment-methods/${id}/default`);
            setSuccess('Default card updated');
            fetchPaymentData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to set default');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                    <button
                        onClick={() => setShowAddCard(!showAddCard)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Plus className="w-4 h-4" /> Add Card
                    </button>
                </div>

                {showAddCard && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Card</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newCard.brand}
                                onChange={(e) => setNewCard({...newCard, brand: e.target.value})}
                            >
                                <option value="visa">Visa</option>
                                <option value="mastercard">Mastercard</option>
                                <option value="amex">American Express</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Last 4 digits"
                                maxLength="4"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newCard.last4}
                                onChange={(e) => setNewCard({...newCard, last4: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="MM"
                                    maxLength="2"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCard.expMonth}
                                    onChange={(e) => setNewCard({...newCard, expMonth: e.target.value})}
                                />
                                <input
                                    type="text"
                                    placeholder="YY"
                                    maxLength="2"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCard.expYear}
                                    onChange={(e) => setNewCard({...newCard, expYear: e.target.value})}
                                />
                            </div>
                            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={newCard.isDefault}
                                    onChange={(e) => setNewCard({...newCard, isDefault: e.target.checked})}
                                    className="rounded border-gray-300"
                                />
                                Set as default
                            </label>
                            <button
                                onClick={handleAddCard}
                                className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                            >
                                Add Card
                            </button>
                        </div>
                    </div>
                )}

                {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No payment methods added</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                            <div key={method._id} className="border border-gray-200 rounded-lg p-4 relative">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-gray-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {method.brand?.toUpperCase()} •••• {method.last4}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Expires: {method.expMonth}/{method.expYear}
                                        </p>
                                    </div>
                                </div>
                                {method.isDefault && (
                                    <span className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        Default
                                    </span>
                                )}
                                <div className="flex justify-end gap-1 mt-3">
                                    {!method.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(method._id)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition"
                                            title="Set as default"
                                        >
                                            <StarOff className="w-4 h-4 text-gray-400" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteCard(method._id)}
                                        className="p-1 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
                {paymentHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No payment history</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {paymentHistory.map((payment) => (
                            <div key={payment._id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {payment.reservationNumber || 'Payment'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(payment.pickupDateTime || payment.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        ${((payment.totalAmount || payment.amount || 0) / 100).toFixed(2)}
                                    </p>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        {payment.paymentStatus || 'paid'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;