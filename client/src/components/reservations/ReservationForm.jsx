// src/modules/reservations/components/ReservationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X, Save, Plus, Trash2, Calendar, MapPin, Car,
  User, DollarSign, Search, ChevronDown,
  Phone, Mail, Building2, RefreshCw
} from 'lucide-react';
import reservationService from '../../services/reservationServices';
import toast from 'react-hot-toast';
import axios from 'axios';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    {children}
  </h3>
);

const ReservationForm = ({ isFormOpen, isEdit = false, quoteId = null }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const editingId = quoteId || id;
  const isEditing = isEdit || !!editingId;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [settings, setSettings] = useState({
    orderTypes: { selected: [], requirement: 'optional' },
    tripTypes: { oneWay: true, roundTrip: true, hourly: true },
    pricingItems: [],
    pricePerStop: 0,
    skipVehicleSelection: { enabled: false, defaultVehicleId: null }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const [showPricingDropdown, setShowPricingDropdown] = useState(false);

  const [formData, setFormData] = useState({
    bookingContact: null,
    orderType: '',
    assignedMember: '',
    tripType: 'hourly',
    passenger: null,
    pickupDateTime: '',
    dropoffDateTime: '',
    stops: [
      { type: 'pickup', address: { street: '', city: '', state: '', zipCode: '' } },
      { type: 'dropoff', address: { street: '', city: '', state: '', zipCode: '' } }
    ],
    passengerCount: 0,
    driverNote: '',
    tripNotes: '',
    vehicle: '',
    driver: '',
    pricing: {
      items: [],
      subtotal: 0,
      taxRate: 0,
      discount: 0,
      gratuity: 0,
      total: 0
    },
    internalComment: '',
    internalComments: []
  });

  useEffect(() => {
    if (isFormOpen) {
      fetchAllData();
      if (isEditing) {
        fetchReservation();
      }
    }
  }, [isFormOpen, isEditing, editingId]);

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      const VITE_URL = import.meta.env.VITE_URL;

      const [contactsRes, vehiclesRes, usersRes, driversRes, profileRes, portalRes] = await Promise.all([
        axios.get(`${VITE_URL}/contact/list`, { withCredentials: true }),
        axios.get(`${VITE_URL}/vehicle/my-vehicles`, { withCredentials: true }),
        axios.get(`${VITE_URL}/member/list`, { withCredentials: true }),
        axios.get(`${VITE_URL}/driver/list`, { withCredentials: true }),
        axios.get(`${VITE_URL}/company-profile/preferences`, { withCredentials: true }),
        axios.get(`${VITE_URL}/company-profile/customer-portal/settings`, { withCredentials: true })
      ]);

      setContacts(contactsRes.data.data || []);
      setVehicles(vehiclesRes.data.vehicles || []);
      setUsers(usersRes.data.data || []);
      setDrivers(driversRes.data.data || []);

      const preferences = profileRes.data.data || {};
      const portalSettings = portalRes.data.data || {};

      setSettings({
        orderTypes: {
          selected: preferences.orderTypes?.selected || [],
          requirement: preferences.orderTypes?.requirement || 'optional'
        },
        tripTypes: portalSettings.tripTypes || { oneWay: true, roundTrip: true, hourly: true },
        pricingItems: preferences.pricingLayout?.selectedItems || [],
        pricePerStop: preferences.pricingLayout?.pricePerStop || 0,
        skipVehicleSelection: portalSettings.skipVehicleSelection || { enabled: false, defaultVehicleId: null }
      });

      if (!isEditing) {
        const items = preferences.pricingLayout?.selectedItems || [];
        setFormData(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            items: items.map(item => ({
              name: item.name,
              type: item.type || 'flat',
              amount: item.amount || 0
            }))
          }
        }));
      }

      setFetchingData(false);
    } catch (error) {
      toast.error('Failed to load data');
      setFetchingData(false);
    }
  };

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getReservationById(editingId);
      const res = response.data.data;
      setFormData({
        bookingContact: res.bookingContact || null,
        orderType: res.orderType || '',
        assignedMember: res.assignedMember?._id || '',
        tripType: res.tripType || 'hourly',
        passenger: res.passenger || null,
        pickupDateTime: res.pickupDateTime?.split('.')[0] || '',
        dropoffDateTime: res.dropoffDateTime?.split('.')[0] || '',
        stops: res.stops || [
          { type: 'pickup', address: { street: '', city: '', state: '', zipCode: '' } },
          { type: 'dropoff', address: { street: '', city: '', state: '', zipCode: '' } }
        ],
        passengerCount: res.passengerCount || 0,
        driverNote: res.driverNote || '',
        tripNotes: res.tripNotes || '',
        vehicle: res.vehicle?._id || '',
        driver: res.driver?._id || '',
        pricing: res.pricing || { items: [], subtotal: 0, taxRate: 0, discount: 0, gratuity: 0, total: 0 },
        internalComment: '',
        internalComments: res.internalComments || []
      });

      if (res.bookingContact) {
        setSearchQuery(`${res.bookingContact.firstName} ${res.bookingContact.lastName}`);
      }
    } catch (error) {
      toast.error('Failed to fetch reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSelect = (contact) => {
    setFormData(prev => ({ ...prev, bookingContact: contact }));
    setSearchQuery(`${contact.firstName} ${contact.lastName}`);
    setShowContactDropdown(false);
  };

  const handleOrderTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, orderType: type }));
    setShowOrderTypeDropdown(false);
  };

  const handleTripTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, tripType: type }));
  };

  const updatePickupAddress = (value) => {
    setFormData(prev => {
      const newStops = [...prev.stops];
      newStops[0].address.street = value;
      return { ...prev, stops: newStops };
    });
  };

  const updateDropoffAddress = (value) => {
    setFormData(prev => {
      const newStops = [...prev.stops];
      newStops[1].address.street = value;
      return { ...prev, stops: newStops };
    });
  };

  const updatePricingItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        items: prev.pricing.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removePricingItem = (index) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        items: prev.pricing.items.filter((_, i) => i !== index)
      }
    }));
  };

  const handlePricingItemToggle = (item) => {
    setFormData(prev => {
      const exists = prev.pricing.items.find(i => i.name === item.name);
      let newItems;
      if (exists) {
        newItems = prev.pricing.items.filter(i => i.name !== item.name);
      } else {
        newItems = [...prev.pricing.items, { ...item, amount: 0 }];
      }
      return {
        ...prev,
        pricing: { ...prev.pricing, items: newItems }
      };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.pricing.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxAmount = subtotal * (parseFloat(formData.pricing.taxRate) / 100);
    const total = subtotal + taxAmount + (parseFloat(formData.pricing.gratuity) || 0) - (parseFloat(formData.pricing.discount) || 0);
    return { subtotal, taxAmount, total };
  };

  const getAvailableTripTypes = () => {
    const types = [];
    if (settings.tripTypes.oneWay) types.push('one_way');
    if (settings.tripTypes.roundTrip) types.push('round_trip');
    if (settings.tripTypes.hourly) types.push('hourly');
    return types;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.bookingContact) {
      toast.error('Please select a booking contact');
      setLoading(false);
      return;
    }

    if (!formData.vehicle) {
      toast.error('Please select a vehicle');
      setLoading(false);
      return;
    }

    if (!formData.pickupDateTime) {
      toast.error('Please select pickup date/time');
      setLoading(false);
      return;
    }

    if (!formData.stops[0]?.address?.street?.trim()) {
      toast.error('Please enter a pickup address');
      setLoading(false);
      return;
    }

    if (!formData.stops[1]?.address?.street?.trim()) {
      toast.error('Please enter a dropoff address');
      setLoading(false);
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    const internalComments = [...(formData.internalComments || [])];
    if (formData.internalComment?.trim()) {
      internalComments.push({
        text: formData.internalComment.trim(),
        createdByName: formData.bookingContact?.firstName || 'User',
        createdAt: new Date().toISOString()
      });
    }

    const payload = {
      bookingContact: formData.bookingContact?._id,
      orderType: formData.orderType,
      assignedMember: formData.assignedMember || null,
      tripType: formData.tripType,
      passenger: formData.passenger?._id || null,
      pickupDateTime: formData.pickupDateTime ? new Date(formData.pickupDateTime) : null,
      dropoffDateTime: formData.dropoffDateTime ? new Date(formData.dropoffDateTime) : null,
      stops: formData.stops,
      passengerCount: parseInt(formData.passengerCount) || 0,
      driverNote: formData.driverNote || '',
      tripNotes: formData.tripNotes || '',
      vehicle: formData.vehicle,
      driver: formData.driver || null,
      internalComments: internalComments,
      pricing: {
        items: formData.pricing.items.map(item => ({
          name: item.name,
          type: item.type || 'flat',
          amount: parseFloat(item.amount) || 0
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate: parseFloat(formData.pricing.taxRate) || 0,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discount: parseFloat(formData.pricing.discount) || 0,
        gratuity: parseFloat(formData.pricing.gratuity) || 0,
        total: Math.round(Math.max(0, total) * 100) / 100
      }
    };

    try {
      const VITE_URL = import.meta.env.VITE_URL;
      let response;

      if (isEditing) {
        response = await axios.put(`${VITE_URL}/reservation/update/${editingId}`, payload, {
          withCredentials: true
        });
        toast.success('Reservation updated successfully');
      } else {
        response = await axios.post(`${VITE_URL}/reservation/create`, payload, {
          withCredentials: true
        });
        toast.success('Reservation created successfully');
      }

      navigate('/reservations?status=ALL');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reservation');
    } finally {
      setLoading(false);
    }
  };

  if (!isFormOpen) return null;

  const availableTripTypes = getAvailableTripTypes();
  const { subtotal, total } = calculateTotals();

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isFormOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-gray-600/60" onClick={() => navigate('/reservations?status=ALL')} />

      <div className={`absolute right-0 top-0 h-full w-[700px] max-w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isFormOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/reservations?status=ALL')}
                className="p-2 hover:bg-gray-100 rounded-full transition-transform duration-300 ease-out hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Reservation' : 'Create Reservation'}
              </h2>
            </div>
            <button
              type="submit"
              disabled={loading || fetchingData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 space-y-6">
            {fetchingData ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* ORDER DETAILS */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Order Details</SectionTitle>

                  <div className="relative">
                    <FieldLabel>Search for booking contact</FieldLabel>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowContactDropdown(true);
                        }}
                        onFocus={() => setShowContactDropdown(true)}
                        className={`${inputCls} pl-9`}
                        placeholder="Type to search for a contact"
                      />
                    </div>
                    {showContactDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {contacts.filter(c => {
                          const search = searchQuery.toLowerCase();
                          return (c.firstName + ' ' + c.lastName).toLowerCase().includes(search) ||
                                 c.email?.toLowerCase().includes(search) ||
                                 c.phone?.includes(search);
                        }).map(contact => (
                          <div
                            key={contact._id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                            onClick={() => handleContactSelect(contact)}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                              <p className="text-xs text-gray-500">{contact.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative mt-4">
                    <FieldLabel>Order Type</FieldLabel>
                    <button
                      type="button"
                      onClick={() => setShowOrderTypeDropdown(!showOrderTypeDropdown)}
                      className="w-full flex items-center justify-between border rounded px-4 py-2.5 bg-white hover:border-black transition-colors"
                    >
                      <span className={formData.orderType ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.orderType || 'Select order type'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {showOrderTypeDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {settings.orderTypes.selected.map(type => (
                            <div
                              key={type}
                              className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                              onClick={() => handleOrderTypeSelect(type)}
                            >
                              {type}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <FieldLabel>Assigned Member</FieldLabel>
                    <select
                      name="assignedMember"
                      value={formData.assignedMember}
                      onChange={handleChange}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.Fname} {u.Lname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TRIP TYPE */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Trip Type</SectionTitle>
                  <div className="flex gap-4">
                    {availableTripTypes.map(type => {
                      const labels = {
                        one_way: 'One Way',
                        round_trip: 'Round Trip',
                        hourly: 'Hourly'
                      };
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTripTypeSelect(type)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.tripType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TRIP DETAILS */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Trip Details</SectionTitle>

                  <div>
                    <FieldLabel>Passenger (optional)</FieldLabel>
                    <select
                      name="passenger"
                      value={formData.passenger?._id || ''}
                      onChange={(e) => {
                        const selected = contacts.find(c => c._id === e.target.value);
                        setFormData(prev => ({ ...prev, passenger: selected }));
                      }}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">No passenger</option>
                      {contacts.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <SectionTitle>Date & Time</SectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Pick-up Date & Time *</FieldLabel>
                        <input
                          type="datetime-local"
                          name="pickupDateTime"
                          value={formData.pickupDateTime}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      </div>
                      {formData.tripType !== 'one_way' && (
                        <div>
                          <FieldLabel>Drop-off Date & Time</FieldLabel>
                          <input
                            type="datetime-local"
                            name="dropoffDateTime"
                            value={formData.dropoffDateTime}
                            onChange={handleChange}
                            className={inputCls}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* STOPS */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Stops</SectionTitle>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-24">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                        PICK-UP
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.stops[0]?.address?.street || ''}
                      onChange={(e) => updatePickupAddress(e.target.value)}
                      className={`${inputCls} flex-1`}
                      placeholder="Pickup Address *"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-700">
                        DROP-OFF
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.stops[1]?.address?.street || ''}
                      onChange={(e) => updateDropoffAddress(e.target.value)}
                      className={`${inputCls} flex-1`}
                      placeholder="Dropoff Address *"
                    />
                  </div>
                </div>

                {/* VEHICLE & DRIVER */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Vehicle & Driver</SectionTitle>

                  <div>
                    <FieldLabel>Vehicle</FieldLabel>
                    <select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleChange}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.type}) - {v.passengerCapacity} seats
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <FieldLabel>Driver (Optional)</FieldLabel>
                    <select
                      name="driver"
                      value={formData.driver}
                      onChange={handleChange}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.firstName} {d.lastName} {d.isAvailable ? '(Available)' : '(Unavailable)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PRICING */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Pricing</SectionTitle>

                  <div className="space-y-3">
                    {formData.pricing.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-32">{item.name}</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updatePricingItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          className={`${inputCls} flex-1`}
                          placeholder="Enter Amount"
                          step="0.01"
                        />
                        <button
                          type="button"
                          onClick={() => removePricingItem(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowPricingDropdown(!showPricingDropdown)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Pricing
                    </button>

                    {showPricingDropdown && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {settings.pricingItems.map((item) => {
                          const isSelected = formData.pricing.items.some(i => i.name === item.name);
                          return (
                            <label key={item.name} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handlePricingItemToggle(item)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{item.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 font-bold">
                      <span className="text-gray-600">Total</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* INTERNAL COMMENTS */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <SectionTitle>Internal Comments</SectionTitle>

                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {formData.internalComments?.length === 0 ? (
                      <p className="text-sm text-gray-400">No comments yet</p>
                    ) : (
                      formData.internalComments?.map((comment, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {comment.createdByName || 'Unknown'}
                            </span>
                            <span className="text-gray-400">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {formData.bookingContact?.firstName?.[0] || 'U'}
                    </div>
                    <input
                      type="text"
                      name="internalComment"
                      value={formData.internalComment || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        internalComment: e.target.value
                      }))}
                      className={inputCls}
                      placeholder="Comment..."
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;