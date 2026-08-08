import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Car, Calendar, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { getAddressString } from '../utils/helper';
import { getStatusColor, getStatusLabel } from '../utils/tripStatus';

const Trips = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [tab, setTab] = useState(0);

    const tabs = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];
    const statusMap = ['upcoming', 'in_progress', 'completed', 'cancelled'];

    useEffect(() => {
        fetchTrips();
    }, [tab]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reservations?status=${statusMap[tab]}`);
            if (response.data.success) {
                setTrips(response.data.data);
            }
        } catch (error) {
            console.error('Fetch trips error:', error);
        } finally {
            setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h1>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                {tabs.map((label, index) => (
                    <button
                        key={index}
                        onClick={() => setTab(index)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === index
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Trips List */}
            {trips.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-600 font-medium">No trips found</h3>
                    <p className="text-gray-400 text-sm mt-1">Book your first ride to get started</p>
                    <button
                        onClick={() => navigate('/book-ride')}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Book a Ride
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {trips.map((trip) => (
                        <div
                            key={trip._id}
                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                            onClick={() => navigate(`/trips/${trip._id}`)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(trip.status)}`}>
                                            {getStatusLabel(trip.status)}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            #{trip.reservationNumber}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{getAddressString(trip.stops[0]) || 'N/A'}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{getAddressString(trip.stops[1]) || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(trip.pickupDateTime).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(trip.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="font-medium text-gray-700">
                                            ${((trip.pricing.total || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    View →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Trips;