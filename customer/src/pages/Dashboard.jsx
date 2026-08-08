// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Car, Receipt, Wallet, Plus, Clock, MapPin } from 'lucide-react';
import {getAddressString} from '../utils/helper'

const Dashboard = () => {
    const { user, contact } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTrips: 0,
        upcomingTrips: 0,
        cashbackBalance: 0,
        outstandingBalance: 0
    });
    const [activeRide, setActiveRide] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/dashboard/home');
            if (response.data.success) {
                setStats(response.data.data.stats);
                setActiveRide(response.data.data.activeRide);
            }
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };


    const statCards = [
        { title: 'Total Rides', value: stats.totalTrips, icon: Car, color: 'blue' },
        { title: 'Upcoming Rides', value: stats.upcomingTrips, icon: Clock, color: 'green' },
        { title: 'Cashback', value: `$${(stats.cashbackBalance / 100).toFixed(2)}`, icon: Wallet, color: 'orange' },
        { title: 'Outstanding', value: `$${(stats.outstandingBalance / 100).toFixed(2)}`, icon: Receipt, color: 'red' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {contact?.firstName || user?.email}!
            </h1>
            <p className="text-gray-500 text-sm mb-6">Here's what's happening with your rides</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Active Ride */}
            {activeRide && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Car className="w-5 h-5" />
                        <span className="font-medium">Active Ride</span>
                        <span className="ml-auto text-sm bg-blue-200 px-2 py-0.5 rounded-full">
                            {activeRide.status || 'N/A'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {getAddressString(activeRide.stops?.[0])}
                        </span>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {getAddressString(activeRide.stops?.[activeRide.stops.length - 1])}
                        </span>
                        <button 
                            onClick={() => navigate(`/trips/${activeRide._id}`)}
                            className="ml-auto text-blue-600 hover:underline text-sm font-medium"
                        >
                            Track Ride →
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button 
                    onClick={() => navigate('/book-ride')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">Book a Ride</span>
                </button>
                <button 
                    onClick={() => navigate('/trips')} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                    <Car className="w-6 h-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">My Trips</span>
                </button>
                <button 
                    onClick={() => navigate('/invoices')} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                    <Receipt className="w-6 h-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Invoices</span>
                </button>
                <button 
                    onClick={() => navigate('/cashback')} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                    <Wallet className="w-6 h-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Cashback</span>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;