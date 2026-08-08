import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Wallet, TrendingUp, TrendingDown, Receipt, RefreshCw } from 'lucide-react';

const Cashback = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ balance: 0, earned: 0, redeemed: 0 });
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchCashbackData();
    }, []);

    const fetchCashbackData = async () => {
        try {
            const [summaryRes, ledgerRes] = await Promise.all([
                api.get('/cashback'),
                api.get('/cashback/ledger')
            ]);

            if (summaryRes.data.success) setSummary(summaryRes.data.data);
            if (ledgerRes.data.success) setTransactions(ledgerRes.data.data);
        } catch (error) {
            console.error('Fetch cashback error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = filter === 'all' 
        ? transactions 
        : transactions.filter(t => t.type === filter);

    const getTypeColor = (type) => type === 'earn' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    const getTypeIcon = (type) => type === 'earn' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cashback & Rewards</h1>
                <button
                    onClick={fetchCashbackData}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-2xl font-bold text-blue-600">${(summary.balance / 100).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">${(summary.earned / 100).toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Total Redeemed</p>
                    <p className="text-2xl font-bold text-red-600">${(summary.redeemed / 100).toFixed(2)}</p>
                </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-600">
                    💡 Earn cashback on every completed ride. Redeem your cashback when paying for rides or invoices.
                </p>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                        <option value="all">All</option>
                        <option value="earn">Earned</option>
                        <option value="redeem">Redeemed</option>
                    </select>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                        <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No transactions found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredTransactions.map((tx) => (
                            <div key={tx._id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${getTypeColor(tx.type)}`}>
                                        {getTypeIcon(tx.type)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {tx.reason?.replace('_', ' ') || 'Transaction'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'earn' ? '+' : '-'}${(tx.amountCents / 100).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Balance: ${(tx.balanceAfterCents / 100).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cashback;