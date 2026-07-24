// src/components/Invoice/InvoiceView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, CheckCircle, Printer } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_URL}/invoice/${id}`, {
        withCredentials: true
      });
      setInvoice(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_URL}/invoice/${id}/send`, {}, {
        withCredentials: true
      });
      toast.success('Invoice sent!');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_URL}/invoice/${id}/mark-paid`, {}, {
        withCredentials: true
      });
      toast.success('Invoice marked as paid');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${import.meta.env.VITE_URL}/invoice/${id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <p>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
            invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'paid' && (
            <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
              <Send className="w-4 h-4" /> Send
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button onClick={handleMarkPaid} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Mark Paid
            </button>
          )}
          <button onClick={handleDownloadPDF} className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-lg border p-8">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
          <p className="text-gray-500">{invoice.invoiceNumber}</p>
        </div>

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Bill To:</p>
            <p className="font-medium">{invoice.customerName}</p>
            <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm">Description</th>
              <th className="px-4 py-2 text-right text-sm">Rate</th>
              <th className="px-4 py-2 text-right text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 text-right">${item.rate?.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${item.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" className="px-4 py-2 text-right font-medium">Subtotal</td>
              <td className="px-4 py-2 text-right">${invoice.subtotal?.toFixed(2)}</td>
            </tr>
            {invoice.taxRate > 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-2 text-right text-sm">Tax ({invoice.taxRate}%)</td>
                <td className="px-4 py-2 text-right">${invoice.taxAmount?.toFixed(2)}</td>
              </tr>
            )}
            {invoice.discount > 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-2 text-right text-sm text-green-600">Discount</td>
                <td className="px-4 py-2 text-right text-green-600">-${invoice.discount?.toFixed(2)}</td>
              </tr>
            )}
            <tr className="border-t-2 border-blue-600">
              <td colSpan="2" className="px-4 py-2 text-right font-bold text-lg">Total</td>
              <td className="px-4 py-2 text-right font-bold text-lg text-blue-600">
                ${invoice.total?.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Notes: {invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;