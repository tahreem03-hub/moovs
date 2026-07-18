import { X, Plus, Trash2, ChevronDown, Image, Camera, MoreVertical } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-3 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200`;

const SectionTitle = ({ children }) => (
  <h2 className="text-sm mt-6 mb-2 font-bold tracking-wide text-black/90 uppercase">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5 mt-4">
    {children}
  </p>
);

const VehicleUpdateForm = ({ onVehicleUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const formOpen = location.pathname.includes('/update/');

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const tabs = ['DETAILS', 'FEATURES', 'PRICING', 'CUSTOMER PORTAL SETTINGS', 'UNAVAILABILITY'];

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: '',
    passengerCapacity: '',
    licenseNo: '',
    description: '',
    exteriorColor: '',
    vinNumber: '',
    garageLocation: '',
    cancellationPolicy: '',
    insurancePolicy: '',
    images: [],
    features: {
      general: [],
      multiMedia: [],
      policies: [],
      childSeats: {
        rearFacing: { enabled: false, quantity: 1, amount: 0, description: '' },
        forwardFacing: { enabled: false, quantity: 1, amount: 0, description: '' },
        booster: { enabled: false, quantity: 1, amount: 0, description: '' }
      }
    },
    price: {
      BRAuto: false,
      transfer: {
        tieredPricing: false,
        deadheadRatePerMile: 0,
        minimumTotalBaseRate: 0,
        transferRate: 0,
        transferRateType: 'per_mile',
        tierMode: 'incremental',
        tiers: []
      },
      hourly: {
        coveredDeadheadDuration: 'disabled',
        weekdays: {
          tieredPricing: false,
          hourlyMinimum: '',
          hourlyRate: 0,
          rateType: 'per_hour',
          tiers: []
        },
        weekends: {
          days: [],
          block: {
            tieredPricing: false,
            hourlyMinimum: '',
            hourlyRate: 0,
            rateType: 'per_hour',
            tiers: []
          }
        }
      }
    },
    display: true,
    enableBRAuto: true,
    reservationReq: false,
    blockQuoteReq: false,
    blockResOnConflict: false
  });

  // Fetch vehicle data
  useEffect(() => {
    if (formOpen && id) {
      fetchVehicle();
    }
  }, [formOpen, id]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/vehicle/${id}`
      );
      const vehicle = response.data.vehicle;
      setForm(vehicle);
    } catch (error) {
      toast.error('Failed to fetch vehicle details');
      console.error('Error fetching vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureToggle = (category, feature) => {
    setForm((prev) => {
      const features = { ...prev.features };
      const categoryArray = features[category] || [];
      const index = categoryArray.indexOf(feature);
      
      if (index > -1) {
        features[category] = categoryArray.filter(f => f !== feature);
      } else {
        features[category] = [...categoryArray, feature];
      }
      
      return { ...prev, features };
    });
  };

  const handleChildSeatChange = (type, field, value) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        childSeats: {
          ...prev.features.childSeats,
          [type]: {
            ...prev.features.childSeats[type],
            [field]: value
          }
        }
      }
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    toast.success(`${files.length} images selected`);
  };

  // ✅ Handle checkbox changes for portal settings
  const handlePortalSettingChange = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const closeForm = () => {
    setActiveTab(0);
    setError('');
    navigate('/vehicles');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const response = await axios.put(
        `${import.meta.env.VITE_URL}/vehicle/update/${id}`,
        form
      );
      toast.success(response.data.message || 'Vehicle updated successfully!');
      if (onVehicleUpdated) {
        onVehicleUpdated();
      }
      closeForm();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/vehicle/delete/${id}`
      );
      toast.success(response.data.message || 'Vehicle deleted successfully!');
      if (onVehicleUpdated) {
        onVehicleUpdated();
      }
      closeForm();
    } catch (error) {
      toast.error('Failed to delete vehicle');
      console.error('Error deleting vehicle:', error);
    }
  };

  const getInitials = () => {
    return form.name?.substring(0, 2).toUpperCase() || 'VN';
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${formOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    >
      <div className="absolute inset-0 bg-gray-600/60" onClick={closeForm} />

      <div
        className={`absolute right-0 top-0 h-full w-[600px] max-w-full
          bg-white border shadow-xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${formOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-400/50 sticky top-0 bg-white z-10">
              <button
                type="button"
                onClick={closeForm}
                className="transition-transform duration-300 ease-out hover:rotate-90"
              >
                <X className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <h1 className="text-lg font-semibold text-gray-900">{form.name}</h1>
                  <p className="text-sm text-gray-500">{form.type} • {form.passengerCapacity} Seats</p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showDeleteMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="relative flex h-12 px-6 border-b border-gray-200 overflow-x-auto">
              {tabs.map((tag, index) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`flex-1 text-xs font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap px-4
                    ${activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6">
              {/* DETAILS TAB */}
              <div className={activeTab === 0 ? 'block' : 'hidden'}>
                <SectionTitle>Basic Info</SectionTitle>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel>Type</FieldLabel>
                    <input
                      type="text"
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>

                <FieldLabel>Passenger Capacity</FieldLabel>
                <input
                  type="number"
                  name="passengerCapacity"
                  value={form.passengerCapacity}
                  onChange={handleChange}
                  className={inputCls}
                />

                <FieldLabel>License Plate</FieldLabel>
                <input
                  type="text"
                  name="licenseNo"
                  value={form.licenseNo}
                  onChange={handleChange}
                  className={inputCls}
                />

                <FieldLabel>Description</FieldLabel>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Vehicle description..."
                />

                <SectionTitle>Additional Details</SectionTitle>

                <FieldLabel>Exterior Color</FieldLabel>
                <input
                  type="text"
                  name="exteriorColor"
                  value={form.exteriorColor}
                  onChange={handleChange}
                  className={inputCls}
                />

                <FieldLabel>VIN Number</FieldLabel>
                <input
                  type="text"
                  name="vinNumber"
                  value={form.vinNumber}
                  onChange={handleChange}
                  className={inputCls}
                />

                <FieldLabel>Garage Location</FieldLabel>
                <input
                  type="text"
                  name="garageLocation"
                  value={form.garageLocation}
                  onChange={handleChange}
                  className={inputCls}
                />

                <SectionTitle>Photos</SectionTitle>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('imageUpload').click()}>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">.jpg and .png files</p>
                  <p className="text-xs text-gray-400 mt-1">Click to upload photos</p>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {form.images && form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.url} alt={`Vehicle ${idx}`} className="w-full h-24 object-cover rounded" />
                        {img.isPrimary && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">Primary</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FEATURES TAB */}
              <div className={activeTab === 1 ? 'block' : 'hidden'}>
                <SectionTitle>Vehicle Features</SectionTitle>
                <p className="text-sm text-gray-500 mb-4">GENERAL</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['AC', 'Dance Pole', 'Luggage', 'Tables', 'Wheelchair Accessible', 
                    'Bathroom', 'In-Vehicle Bar', 'Refrigerator', 'Trash Can', 'Ice Chest'].map(feature => (
                    <label key={feature} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.features.general.includes(feature)}
                        onChange={() => handleFeatureToggle('general', feature)}
                        className="w-4 h-4"
                      />
                      {feature}
                    </label>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mb-4">MULTIMEDIA</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['AUX', 'DVD Player', 'Karaoke', 'USB', 'Power Outlets'].map(feature => (
                    <label key={feature} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.features.multiMedia.includes(feature)}
                        onChange={() => handleFeatureToggle('multiMedia', feature)}
                        className="w-4 h-4"
                      />
                      {feature}
                    </label>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mb-4">POLICIES</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['Alcohol Friendly', 'Pets Allowed', 'Bluetooth', 'Game Console', 
                    'TV', 'Wifi', 'Food Allowed', 'Smoking Allowed'].map(feature => (
                    <label key={feature} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.features.policies.includes(feature)}
                        onChange={() => handleFeatureToggle('policies', feature)}
                        className="w-4 h-4"
                      />
                      {feature}
                    </label>
                  ))}
                </div>

                <SectionTitle>Child Seats</SectionTitle>
                {['rearFacing', 'forwardFacing', 'booster'].map((type) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.features.childSeats[type].enabled}
                        onChange={(e) => handleChildSeatChange(type, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium capitalize">{type.replace('Facing', '-facing')}</span>
                    </label>
                    {form.features.childSeats[type].enabled && (
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <div className="flex items-center gap-2">
                            <button type="button" className="border rounded px-2 py-1">-</button>
                            <input
                              type="number"
                              value={form.features.childSeats[type].quantity}
                              onChange={(e) => handleChildSeatChange(type, 'quantity', parseInt(e.target.value))}
                              className="w-12 text-center border rounded py-1"
                            />
                            <button type="button" className="border rounded px-2 py-1">+</button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <input
                            type="number"
                            value={form.features.childSeats[type].amount}
                            onChange={(e) => handleChildSeatChange(type, 'amount', parseFloat(e.target.value))}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Short Description</p>
                          <input
                            type="text"
                            value={form.features.childSeats[type].description}
                            onChange={(e) => handleChildSeatChange(type, 'description', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Description..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <SectionTitle>Internal Comments</SectionTitle>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {getInitials()}
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="Comment..."
                  />
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit →
                  </button>
                </div>
              </div>

              {/* PRICING TAB */}
              <div className={activeTab === 2 ? 'block' : 'hidden'}>
                <SectionTitle>Pricing</SectionTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <span className="font-medium">Transfer</span>
                    <span className="text-sm text-gray-500">Tiered Pricing</span>
                  </div>
                  <div>
                    <FieldLabel>Minimum Total Base Rate</FieldLabel>
                    <input type="number" className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <FieldLabel>Deadhead Rate per Mile</FieldLabel>
                    <input type="number" className={inputCls} placeholder="0.00" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Transfer Rate</FieldLabel>
                      <input type="number" className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <FieldLabel>Per mile</FieldLabel>
                      <select className={inputCls}>
                        <option>Per mile</option>
                        <option>Flat</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.enableBRAuto}
                      onChange={() => handlePortalSettingChange('enableBRAuto')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable Base Rate Automation</span>
                  </label>
                </div>
              </div>

              {/* CUSTOMER PORTAL SETTINGS TAB */}
              <div className={activeTab === 3 ? 'block' : 'hidden'}>
                <SectionTitle>Customer Portal Settings</SectionTitle>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.display}
                      onChange={() => handlePortalSettingChange('display')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Display on Customer Portal</span>
                  </label>
                  <p className="text-xs text-gray-500">When this is on, vehicle will be displayed on customer portal for customers to request</p>
                  
                  <div>
                    <FieldLabel>Request for pricing</FieldLabel>
                    <button type="button" className="border border-gray-300 rounded px-4 py-2 w-full text-left text-gray-500">
                      Choose Vehicle →
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Awaiting Photo</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <button type="button" className="px-4 py-2 text-sm bg-gray-100 rounded">GENERAL</button>
                    <button type="button" className="px-4 py-2 text-sm bg-gray-100 rounded">MULTIMEDIA</button>
                    <button type="button" className="px-4 py-2 text-sm bg-gray-100 rounded">POLICY</button>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.enableBRAuto}
                        onChange={() => handlePortalSettingChange('enableBRAuto')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Enable Base Rate Automation on Customer Portal</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">When this is on, price will be displayed and customers can book vehicle without requesting a quote</p>
                    
                    <div className="mt-4">
                      <input type="text" className={inputCls} placeholder="$XX.XX" />
                    </div>
                    
                    <div className="mt-4">
                      <button type="button" className="border border-gray-300 rounded px-4 py-2 w-full text-left text-gray-500">
                        Choose Vehicle →
                      </button>
                    </div>

                    <label className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        checked={form.reservationReq}
                        onChange={() => handlePortalSettingChange('reservationReq')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Enable reservation requests on Customer Portal</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* UNAVAILABILITY TAB */}
              <div className={activeTab === 4 ? 'block' : 'hidden'}>
                <SectionTitle>Unavailability Blocks</SectionTitle>
                <p className="text-sm text-gray-600 mb-4">
                  Schedule times when this vehicle is not available. Unavailability blocks apply to all bookings regardless of the trip conflict settings in Customer Portal Settings.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <p className="text-gray-500">No unavailability blocks configured for this vehicle.</p>
                  <button type="button" className="mt-4 text-blue-600 font-medium hover:text-blue-700">
                    Add blocks to mark times when this vehicle is unavailable.
                  </button>
                </div>

                <SectionTitle>Internal Comments</SectionTitle>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {getInitials()}
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="Comment..."
                  />
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit →
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 mt-4 bg-red-50 border border-red-200 rounded px-4 py-2.5">
                  {error}
                </p>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-gray-200 bg-gray-100/70 px-6 py-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white font-medium rounded px-8 py-2.5
                  hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VehicleUpdateForm;