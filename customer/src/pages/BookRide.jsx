import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, MapPin, Users, Car, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const BookRide = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        tripType: 'one_way',
        pickupDateTime: '',
        stops: [
            { type: 'pickup', address: '', notes: '' },
            { type: 'dropoff', address: '', notes: '' }
        ],
        passengerCount: 1,
        vehicleType: '',
        specialRequirements: ''
    });

    const steps = ['Trip Details', 'Vehicle & Passengers', 'Review & Book'];

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            
            if (response.data.success) {
                setVehicles(response.data.data);
            }
        } catch (error) {
            console.error('Fetch vehicles error:', error);
            setError('Failed to load vehicles. Please try again.');
        }
    };

    const getVehiclePrice = (vehicle) => {
        // Try to get price from various possible structures
        if (vehicle.price?.hourly?.weekdays?.block?.hourlyRate) {
            return vehicle.price.hourly.weekdays.block.hourlyRate;
        }
        if (vehicle.price?.hourly?.weekends?.block?.hourlyRate) {
            return vehicle.price.hourly.weekends.block.hourlyRate;
        }
        if (vehicle.price?.transfer?.transferRate) {
            return vehicle.price.transfer.transferRate;
        }
        return 0;
    };

    const getVehicleDisplay = (vehicle) => {
        const price = getVehiclePrice(vehicle);
        let display = `${vehicle.name} - ${vehicle.type}`;
        if (price > 0) {
            display += ` ($${price}/hr)`;
        }
        if (vehicle.passengerCapacity) {
            display += ` - ${vehicle.passengerCapacity} seats`;
        }
        return display;
    };

    const handleStopChange = (index, field, value) => {
        const newStops = [...formData.stops];
        newStops[index][field] = value;
        setFormData({ ...formData, stops: newStops });
    };

    const addStop = () => {
        setFormData({
            ...formData,
            stops: [...formData.stops, { type: 'stop', address: '', notes: '' }]
        });
    };

    const removeStop = (index) => {
        if (formData.stops.length <= 2) return;
        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData({ ...formData, stops: newStops });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Find selected vehicle
            const selectedVehicle = vehicles.find(v => v.type === formData.vehicleType);
            
            const payload = {
                ...formData,
                pickupDateTime: new Date(formData.pickupDateTime).toISOString(),
                vehicleId: selectedVehicle?._id || null
            };

            const response = await api.post('/reservations', payload);
            if (response.data.success) {
                navigate(`/trips/${response.data.data.reservation._id}`);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to book ride');
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = (step) => {
        if (step === 0) {
            return formData.pickupDateTime && 
                   formData.stops[0].address && 
                   formData.stops[formData.stops.length - 1].address;
        }
        if (step === 1) {
            return formData.vehicleType && formData.passengerCount > 0;
        }
        return true;
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Route Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.pickupDateTime}
                                    onChange={(e) => setFormData({ ...formData, pickupDateTime: e.target.value })}
                                />
                            </div>
                        </div>

                        {formData.stops.map((stop, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <select
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={stop.type}
                                    onChange={(e) => handleStopChange(index, 'type', e.target.value)}
                                >
                                    <option value="pickup">Pickup</option>
                                    <option value="stop">Stop</option>
                                    <option value="dropoff">Dropoff</option>
                                </select>
                                <div className="flex-1 relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required={stop.type === 'pickup' || stop.type === 'dropoff'}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Enter address"
                                        value={stop.address}
                                        onChange={(e) => handleStopChange(index, 'address', e.target.value)}
                                    />
                                </div>
                                {index > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeStop(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addStop}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Stop
                        </button>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vehicle & Passengers</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    <option value="">Select vehicle</option>
                                    {vehicles.map((v) => (
                                        <option key={v._id} value={v.type}>
                                            {getVehicleDisplay(v)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.passengerCount}
                                    onChange={(e) => setFormData({ ...formData, passengerCount: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows="2"
                                placeholder="Wheelchair access, pet friendly, etc."
                                value={formData.specialRequirements}
                                onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                            />
                        </div>
                    </div>
                );

            case 2:
                const selectedVehicle = vehicles.find(v => v.type === formData.vehicleType);
                const vehiclePrice = selectedVehicle ? getVehiclePrice(selectedVehicle) : 0;

                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Review Your Booking</h3>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="font-medium text-gray-700">Route</p>
                            {formData.stops.map((stop, index) => (
                                <p key={index} className="text-sm text-gray-600">
                                    {index + 1}. {stop.type}: {stop.address || 'N/A'}
                                </p>
                            ))}

                            <hr className="my-2" />

                            <p className="font-medium text-gray-700">Details</p>
                            <p className="text-sm text-gray-600">Date: {new Date(formData.pickupDateTime).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Passengers: {formData.passengerCount}</p>
                            <p className="text-sm text-gray-600">Vehicle: {formData.vehicleType || 'Not selected'}</p>
                            {vehiclePrice > 0 && (
                                <p className="text-sm text-gray-600">Price: ${vehiclePrice}/hour</p>
                            )}

                            {formData.specialRequirements && (
                                <>
                                    <hr className="my-2" />
                                    <p className="font-medium text-gray-700">Special Requirements</p>
                                    <p className="text-sm text-gray-600">{formData.specialRequirements}</p>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Ride</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Steps */}
                <div className="flex items-center gap-4 mb-8">
                    {steps.map((label, index) => (
                        <React.Fragment key={index}>
                            <div className={`flex items-center gap-2 ${index === activeStep ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    index === activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {index + 1}
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">{label}</span>
                            </div>
                            {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200"></div>}
                        </React.Fragment>
                    ))}
                </div>

                <form>
                    {renderStep()}

                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={() => setActiveStep(activeStep - 1)}
                            disabled={activeStep === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                        </button>
                        {activeStep < steps.length - 1 && (
                            <button
                                type="button"
                                onClick={() => setActiveStep(activeStep + 1)}
                                disabled={!isStepValid(activeStep)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                Next <ChevronRight className="w-4 h-4 inline ml-1" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookRide;