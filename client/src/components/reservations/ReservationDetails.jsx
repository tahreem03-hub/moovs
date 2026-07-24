// src/modules/reservations/components/ReservationDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Calendar, MapPin, Car, DollarSign,
    MessageSquare, Send, Edit2, Trash2, Phone, Mail,
    Building2, FileText, Users, X, UserPlus, Truck
} from 'lucide-react';
import reservationService from '../../services/reservationServices';
import ReservationStatusBadge from './ReservationStatusBadge';
import PaymentCollector from '../reservations/PaymentCollector';
import toast from 'react-hot-toast';
import axios from 'axios'

const ReservationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');

    // In ReservationDetails.jsx - Add this function

    const [generatingInvoice, setGeneratingInvoice] = useState(false);

    const handleGenerateInvoice = async () => {
        setGeneratingInvoice(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_URL}/invoice/generate/${reservation._id}`,
                {},
                { withCredentials: true }
            );
            toast.success(response.data.message);
            // Update reservation with invoice info
            setReservation(prev => ({
                ...prev,
                isInvoiced: true,
                invoiceId: response.data.data._id
            }));
            // Navigate to invoice
            navigate(`/invoices/${response.data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate invoice');
        } finally {
            setGeneratingInvoice(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchReservation();
            fetchDrivers();
        }
    }, [id]);

    const fetchReservation = async () => {
        try {
            setLoading(true);
            const response = await reservationService.getReservationById(id);
            setReservation(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch reservation details');
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const response = await reservationService.getDrivers();
            setDrivers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        try {
            const response = await reservationService.addComment(id, comment);
            if (response.data.success) {
                setReservation(prev => ({
                    ...prev,
                    internalComments: response.data.data
                }));
                setComment('');
                toast.success('Comment added');
            }
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleStatusChange = async (status) => {
        try {
            const response = await reservationService.updateReservationStatus(id, status);
            if (response.data.success) {
                toast.success(`Reservation ${status}`);
                fetchReservation();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleAssignDriver = async () => {
        if (!selectedDriver) {
            toast.error('Please select a driver');
            return;
        }
        try {
            const response = await reservationService.assignDriver(id, selectedDriver);
            if (response.data.success) {
                toast.success('Driver assigned successfully');
                setShowAssignDriver(false);
                fetchReservation();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign driver');
        }
    };

    const handleDelete = async () => {
        try {
            const response = await reservationService.deleteReservation(id);
            if (response.data.success) {
                toast.success('Reservation deleted');
                navigate('/reservations');
            }
        } catch (error) {
            toast.error('Failed to delete reservation');
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return '-';
        return `${formatDate(date)} at ${formatTime(date)}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        if (typeof phone === 'object') {
            return phone.number || '-';
        }
        return phone;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const getStopIcon = (type) => {
        switch (type) {
            case 'pickup': return '📍';
            case 'dropoff': return '🏁';
            default: return '📍';
        }
    };

    const getAvailableActions = () => {
        const status = reservation?.status;
        const actions = [];
        if (status === 'pending') actions.push('confirm');
        if (status === 'confirmed') actions.push('dispatch');
        if (status === 'dispatched') actions.push('start');
        if (status === 'started') actions.push('complete');
        if (!['cancelled', 'completed', 'billed'].includes(status)) {
            actions.push('cancel');
        }
        return actions;
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-screen text-gray-500 bg-gray-50">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg">No reservation selected</p>
                <p className="text-sm">Select a reservation from the list to view details</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-50 h-screen overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/reservations?status=ALL')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{reservation.reservationNumber}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <ReservationStatusBadge status={reservation.status} />
                                <span className="text-sm text-gray-500">
                                    {formatDateTime(reservation.pickupDateTime)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!reservation.driver && reservation.status !== 'cancelled' && (
                            <button
                                onClick={() => setShowAssignDriver(true)}
                                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                            >
                                <UserPlus className="w-4 h-4" />
                                Assign Driver
                            </button>
                        )}
                        {getAvailableActions().includes('confirm') && (
                            <button
                                onClick={() => handleStatusChange('confirmed')}
                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                                Confirm
                            </button>
                        )}
                        {getAvailableActions().includes('dispatch') && (
                            <button
                                onClick={() => handleStatusChange('dispatched')}
                                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                                Dispatch
                            </button>
                        )}
                        {getAvailableActions().includes('start') && (
                            <button
                                onClick={() => handleStatusChange('started')}
                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                                Start Trip
                            </button>
                        )}
                        {getAvailableActions().includes('complete') && (
                            <button
                                onClick={() => handleStatusChange('completed')}
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Complete
                            </button>
                        )}
                        {getAvailableActions().includes('cancel') && (
                            <button
                                onClick={() => handleStatusChange('cancelled')}
                                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/reservations/edit/${reservation._id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>

                        {/* Generate Invoice Button */}
                        {reservation.isClosed && !reservation.isInvoiced && (
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={generatingInvoice}
                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                                <FileText className="w-4 h-4" />
                                {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                            </button>
                        )}

                        {/* View Invoice Button */}
                        {reservation.invoiceId && (
                            <button
                                onClick={() => navigate(`/invoices/${reservation.invoiceId}`)}
                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                                <Eye className="w-4 h-4" />
                                View Invoice
                            </button>
                        )}

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Customer Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        Customer Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Name</p>
                            <p className="font-medium text-gray-900">
                                {reservation.bookingContact?.firstName} {reservation.bookingContact?.lastName || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Email</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {reservation.bookingContact?.email || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Phone</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {formatPhone(reservation.bookingContact?.phone)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Company</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {reservation.bookingContact?.company || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trip Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Trip Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Trip Type</p>
                            <p className="font-medium text-gray-900 capitalize">{reservation.tripType}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Order Type</p>
                            <p className="font-medium text-gray-900">{reservation.orderType || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-gray-400" />
                                {reservation.vehicle?.name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Passengers</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                {reservation.passengerCount || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Pickup</p>
                            <p className="font-medium text-gray-900">{formatDateTime(reservation.pickupDateTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Dropoff</p>
                            <p className="font-medium text-gray-900">
                                {reservation.dropoffDateTime ? formatDateTime(reservation.dropoffDateTime) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Assigned To</p>
                            <p className="font-medium text-gray-900">
                                {reservation.assignedMember?.Fname} {reservation.assignedMember?.Lname || 'Unassigned'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Driver</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-gray-400" />
                                {reservation.driver?.firstName} {reservation.driver?.lastName || 'Not assigned'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stops */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Route
                    </h2>
                    <div className="space-y-3">
                        {reservation.stops?.map((stop, index) => (
                            <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <span className="text-lg">{getStopIcon(stop.type)}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 capitalize">{stop.type}</p>
                                    <p className="text-sm text-gray-600">
                                        {stop.address?.street}, {stop.address?.city}, {stop.address?.state} {stop.address?.zipCode}
                                    </p>
                                    {stop.notes && (
                                        <p className="text-sm text-gray-500 mt-0.5">{stop.notes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        Pricing
                    </h2>
                    <div className="space-y-2">
                        {reservation.pricing?.items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm py-1">
                                <span className="text-gray-600">{item.label}</span>
                                <span className="font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                        {reservation.pricing?.taxRate > 0 && (
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-gray-600">Tax ({reservation.pricing.taxRate}%)</span>
                                <span className="font-medium">{formatCurrency((reservation.pricing.subtotal || 0) * (reservation.pricing.taxRate / 100))}</span>
                            </div>
                        )}
                        {reservation.pricing?.discount > 0 && (
                            <div className="flex justify-between text-sm py-1 text-green-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(reservation.pricing.discount)}</span>
                            </div>
                        )}
                        {reservation.pricing?.gratuity > 0 && (
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-gray-600">Gratuity</span>
                                <span className="font-medium">{formatCurrency(reservation.pricing.gratuity)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span>Total</span>
                                <span className="text-blue-600">{formatCurrency(reservation.pricing?.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ PAYMENT COLLECTOR - ADD THIS SECTION */}
                <div className="mt-6">
                    <PaymentCollector
                        reservation={reservation}
                        onPaymentComplete={fetchReservation}
                    />
                </div>

                {/* Internal Comments */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        Internal Comments
                    </h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {reservation.internalComments?.length === 0 ? (
                            <p className="text-sm text-gray-400">No comments yet</p>
                        ) : (
                            reservation.internalComments?.map((comment, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">{comment.createdByName || 'Unknown'}</span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <input
                            type="text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!comment.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <Send className="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </div>
            </div>

            {/* Assign Driver Modal */}
            {showAssignDriver && (
                <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Assign Driver</h3>
                            <button
                                onClick={() => setShowAssignDriver(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Select a driver to assign to this reservation.
                        </p>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            <option value="">Select a driver</option>
                            {drivers.map((driver) => (
                                <option key={driver._id} value={driver._id}>
                                    {driver.firstName} {driver.lastName} {driver.isAvailable ? '(Available)' : '(Unavailable)'}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAssignDriver(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignDriver}
                                disabled={!selectedDriver}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Delete Reservation</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{reservation.reservationNumber}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationDetails;