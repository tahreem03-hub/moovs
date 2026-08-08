import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Download, CreditCard, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const InvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { contact } = useAuth();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState(null);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const response = await api.get(`/invoices/${id}`);
            if (response.data.success) setInvoice(response.data.data);
        } catch (error) {
            console.error('Fetch invoice error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        setPaying(true);
        setError('');
        try {
            const methodsRes = await api.get('/payment-methods');
            if (!methodsRes.data.success || methodsRes.data.data.length === 0) {
                setError('Please add a payment method first');
                setPaying(false);
                return;
            }

            const defaultMethod = methodsRes.data.data.find(m => m.isDefault) || methodsRes.data.data[0];

            const response = await api.post(`/invoices/${id}/pay`, {
                paymentMethodId: defaultMethod._id,
                useCashback: true
            });

            if (response.data.success) {
                setSuccess('Invoice paid successfully!');
                fetchInvoice();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Payment failed');
        } finally {
            setPaying(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice?.invoiceNumber || id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-gray-900">Invoice not found</h2>
                <button
                    onClick={() => navigate('/invoices')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                    Back to Invoices
                </button>
            </div>
        );
    }

    const isPayable = ['sent', 'overdue'].includes(invoice.status);

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/invoices')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Invoices
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
                        <p className="text-gray-500 text-sm">{invoice.invoiceNumber}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {invoice.status}
                    </span>
                </div>

                <hr className="mb-6" />

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-500">Bill To</p>
                        <p className="font-medium">{invoice.customerName}</p>
                        <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Invoice Details</p>
                        <p className="text-sm">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                {/* Items */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2">{item.description}</td>
                                    <td className="px-4 py-2 text-right">${(item.rate / 100).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">${(item.amount / 100).toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-semibold">
                                <td colSpan="2" className="px-4 py-2 text-right">Total</td>
                                <td className="px-4 py-2 text-right text-blue-600 text-lg">
                                    ${(invoice.total / 100).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <hr className="mb-6" />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate(`/trips/${invoice.reservationId}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        View Trip
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    {isPayable && (
                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="flex items-center gap-2 ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            <CreditCard className="w-4 h-4" />
                            {paying ? 'Processing...' : 'Pay Now'}
                        </button>
                    )}
                    {invoice.status === 'paid' && (
                        <div className="ml-auto flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span>Paid on {new Date(invoice.paidAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                        {success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceDetail;