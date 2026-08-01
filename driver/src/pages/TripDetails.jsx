// driver-app/src/pages/TripDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Car,
  DollarSign,
  CheckCircle,
  Play,
  Loader2,
  Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../services/api';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getTripById(id);
      setTrip(response.data.data);
    } catch (error) {
      toast.error('Failed to load trip details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!confirm('Are you sure you want to start this trip?')) return;

    try {
      setActionLoading(true);
      await driverApi.startTrip(id);
      toast.success('Trip started!');
      await loadTrip();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!confirm('Complete this trip?')) return;

    try {
      setActionLoading(true);
      await driverApi.completeTrip(id);
      toast.success('Trip completed!');
      await loadTrip();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Trip not found</p>
      </div>
    );
  }

  const canStart = ['confirmed', 'dispatched'].includes(trip.status);
  const canComplete = trip.status === 'started';

  // Safely extract customer information
  const customerName = trip.bookingContact?.firstName && trip.bookingContact?.lastName
    ? `${trip.bookingContact.firstName} ${trip.bookingContact.lastName}`
    : trip.bookingContact?.name || 'Unknown Customer';

  // Fix: Handle phone number which might be an object with countryCode and number
  let customerPhone = 'N/A';
  if (trip.bookingContact) {
    if (trip.bookingContact.phone) {
      // If phone is an object with countryCode and number
      if (typeof trip.bookingContact.phone === 'object' && trip.bookingContact.phone.number) {
        customerPhone = trip.bookingContact.phone.number;
      } 
      // If phone is a string
      else if (typeof trip.bookingContact.phone === 'string') {
        customerPhone = trip.bookingContact.phone;
      }
    } 
    // Fallback to bookingContact.number if phone doesn't exist
    else if (trip.bookingContact.number) {
      if (typeof trip.bookingContact.number === 'object' && trip.bookingContact.number.number) {
        customerPhone = trip.bookingContact.number.number;
      } else if (typeof trip.bookingContact.number === 'string') {
        customerPhone = trip.bookingContact.number;
      }
    }
  }

  const pickupAddress = trip.pickupLocation?.address 
    || trip.pickupLocation?.formattedAddress 
    || 'Address not available';

  const dropoffAddress = trip.dropoffLocation?.address 
    || trip.dropoffLocation?.formattedAddress 
    || 'Address not available';

  const pickupDateTime = trip.pickupDateTime 
    ? new Date(trip.pickupDateTime).toLocaleString() 
    : 'Date/Time not set';

  const totalPrice = trip.pricing?.total || trip.totalPrice || 0;

  // Safely extract vehicle information - handle case where vehicle might be an object or string
  let vehicleDisplay = 'N/A';
  if (trip.vehicle) {
    if (typeof trip.vehicle === 'object') {
      // If vehicle is an object, try to get name or display from it
      const vehicleName = trip.vehicle.name || trip.vehicle.model || trip.vehicle.make || 'Vehicle';
      const vehicleType = trip.vehicle.type || trip.vehicle.category || '';
      vehicleDisplay = vehicleType ? `${vehicleName} (${vehicleType})` : vehicleName;
    } else if (typeof trip.vehicle === 'string') {
      // If vehicle is a string, display it directly
      vehicleDisplay = trip.vehicle;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Trip Details</h1>

          {/* Status */}
          <div className="flex items-center justify-between mb-6">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              trip.status === 'completed' ? 'bg-green-100 text-green-800' :
              trip.status === 'started' ? 'bg-blue-100 text-blue-800' :
              trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Status: {trip.status ? trip.status.toUpperCase() : 'UNKNOWN'}
            </div>
            <div className="text-2xl font-bold text-gray-800">
              ${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'}
            </div>
          </div>

          {/* Actions */}
          {(canStart || canComplete) && (
            <div className="flex gap-3 mb-6">
              {canStart && (
                <button
                  onClick={handleStartTrip}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  Start Trip
                </button>
              )}
              {canComplete && (
                <button
                  onClick={handleCompleteTrip}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Complete Trip
                </button>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-3">Customer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                {customerName}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                {customerPhone}
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-3">Trip Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Pickup</p>
                  <p>{pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Dropoff</p>
                  <p>{dropoffAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                {pickupDateTime}
              </div>
              {/* Vehicle display - fixed to handle both object and string */}
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="w-4 h-4" />
                {vehicleDisplay}
              </div>
            </div>
          </div>

          {/* Notes */}
          {trip.notes && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600 text-sm">{trip.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetails;