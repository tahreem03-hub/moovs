import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, MapPin, Car, User, Calendar, Clock, DollarSign, Star, Trash2, RefreshCw } from 'lucide-react';
import { getAddressString } from '../utils/helper';
import { getStatusColor, getStatusLabel } from '../utils/tripStatus';

const TripDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState(null);
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showRating, setShowRating] = useState(false);
    const [rating, setRating] = useState(0);
    const [tipAmount, setTipAmount] = useState('');
    const [comment, setComment] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTripDetail();
    }, [id]);

    const fetchTripDetail = async () => {
        try {
            const response = await api.get(`/reservations/${id}`);
            if (response.data.success) setTrip(response.data.data);
        } catch (error) {
            console.error('Fetch trip error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            const response = await api.post(`/reservations/${id}/cancel`, {
                reason: cancelReason || 'Customer requested cancellation'
            });
            if (response.data.success) {
                setSuccess('Trip cancelled successfully');
                setShowCancel(false);
                fetchTripDetail();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to cancel');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleRateAndTip = async () => {
        try {
            const response = await api.post(`/reservations/${id}/rate`, {
                rating,
                tipAmountCents: parseFloat(tipAmount || 0) * 100,
                comment
            });
            if (response.data.success) {
                setSuccess('Rating submitted successfully!');
                setShowRating(false);
                fetchTripDetail();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit rating');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleRebook = async () => {
        try {
            const response = await api.post(`/reservations/${id}/rebook`);
            if (response.data.success) {
                navigate(`/trips/${response.data.data._id}`);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to rebook');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="max-w-3xl mx-auto text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Trip not found</h2>
                <button
                    onClick={() => navigate('/trips')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                    Back to Trips
                </button>
            </div>
        );
    }

    const canCancel = ['confirmed'].includes(trip.status);
    // no rated field in schema
    const canRate = trip.status === 'completed' && !trip.rated;
    const canRebook = ['completed', 'cancelled'].includes(trip.status);

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/trips')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Trips
            </button>

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

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Trip #{trip.reservationNumber}</h1>
                        <p className="text-sm text-gray-500">
                            {new Date(trip.pickupDateTime).toLocaleString()}
                        </p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(trip.status)}`}>
                        {getStatusLabel(trip.status)}
                    </span>
                </div>

                <hr className="mb-6" />

                {/* Route */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Route</h2>
                    {trip.stops?.map((stop, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${stop.type === 'pickup' ? 'bg-green-100 text-green-700' :
                                stop.type === 'dropoff' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {stop.type}
                            </span>
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{getAddressString(stop)}</span>
                        </div>
                    ))}
                </div>

                <hr className="mb-6" />

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Vehicle</p>
                            <p className="font-medium">{trip.vehicle?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{trip.vehicle?.licensePlate}</p>
                        </div>
                    </div>
                    {trip.driver && (
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Driver</p>
                                <p className="font-medium">{trip.driver.firstName} {trip.driver.lastName}</p>
                                <p className="text-sm text-gray-500">{trip.driver.phone}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{new Date(trip.pickupDateTime).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{new Date(trip.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </div>

                <hr className="mb-6" />

                {/* Pricing */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Pricing</h2>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total</span>
                        <span className="text-xl font-bold text-blue-600">${((trip.pricing.total || 0)).toFixed(2)}</span>
                    </div>
                    {/* not implemented yet -> model do not has this field */}
                    {/*trip.tipAmountCents > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tip</span>
                            <span className="text-gray-700">${(trip.tipAmountCents / 100).toFixed(2)}</span>
                        </div>
                   )*/}
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Payment</span>
                        <span className={`${trip.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {trip.paymentStatus || 'pending'}
                        </span>
                    </div>
                </div>

                <hr className="mb-6" />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    {canCancel && (
                        <button
                            onClick={() => setShowCancel(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            <Trash2 className="w-4 h-4" /> Cancel Trip
                        </button>
                    )}
                    {canRate && (
                        <button
                            onClick={() => setShowRating(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            <Star className="w-4 h-4" /> Rate & Tip
                        </button>
                    )}
                    {canRebook && (
                        <button
                            onClick={handleRebook}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                        >
                            <RefreshCw className="w-4 h-4" /> Rebook
                        </button>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-2">Cancel Trip</h2>
                        <p className="text-gray-500 text-sm mb-4">Are you sure you want to cancel this trip? Cancellation fees may apply.</p>
                        <textarea
                            placeholder="Reason (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows="2"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowCancel(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Keep Trip
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-2">Rate Your Trip</h2>
                        <p className="text-gray-500 text-sm mb-4">How was your ride?</p>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Comment (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows="2"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tip Amount ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={tipAmount}
                                onChange={(e) => setTipAmount(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowRating(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleRateAndTip}
                                disabled={rating === 0}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetail;