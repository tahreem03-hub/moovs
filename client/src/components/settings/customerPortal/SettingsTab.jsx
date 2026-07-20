import React, { useState, useEffect } from 'react';
import { Save, Lock, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold tracking-wide text-black/90 uppercase mb-4">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const Toggle = ({ enabled, onChange, label, description, className = '' }) => (
  <div className={`flex items-center justify-between py-3 border-b border-gray-100 ${className}`}>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [showGratuityDetails, setShowGratuityDetails] = useState(false);
  const [settings, setSettings] = useState({
    tripTypes: {
      oneWay: true,
      roundTrip: true,
      hourly: true
    },
    gratuity: {
      enabled: false,
      percentages: [15, 18, 20],
      cashOption: false,
      customOption: true,
      minPercentage: 15,
      optional: true
    },
    customerSignature: {
      enabled: false,
      termsId: null
    },
    reservationCutoff: {
      enabled: false,
      hours: 0,
      type: 'hours'
    },
    requestChanges: {
      automated: false,
      cutoffPeriod: 7,
      allowCancellation: false
    },
    locationRestriction: {
      enabled: false,
      country: 'US'
    },
    skipVehicleSelection: {
      enabled: false,
      defaultVehicleId: null
    },
    vehicleOrder: 'price',
    vehicleOrderDirection: 'ascending'
  });

  useEffect(() => {
    fetchSettings();
    fetchVehicles();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/customer-portal`
      );
      if (data.data?.settings) {
        setSettings(prev => ({ ...prev, ...data.data.settings }));
        // Show gratuity details if enabled
        if (data.data.settings.gratuity?.enabled) {
          setShowGratuityDetails(true);
        }
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/customer-portal/vehicles`
      );
      if (data.success) {
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const handleToggle = (section, key) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key]
      }
    }));

    // Show gratuity details when enabled
    if (section === 'gratuity' && key === 'enabled') {
      setShowGratuityDetails(!settings.gratuity.enabled);
    }
  };

  const handleTripTypeToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      tripTypes: {
        ...prev.tripTypes,
        [key]: !prev.tripTypes[key]
      }
    }));
  };

  const handleGratuityPercentageToggle = (percentage) => {
    setSettings(prev => ({
      ...prev,
      gratuity: {
        ...prev.gratuity,
        percentages: prev.gratuity.percentages.includes(percentage)
          ? prev.gratuity.percentages.filter(p => p !== percentage)
          : [...prev.gratuity.percentages, percentage]
      }
    }));
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate customer signature requires terms
    if (settings.customerSignature.enabled) {
      // Check if there are terms available (backend will validate)
      // Frontend check - we'll let backend handle the error
    }

    setSaving(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_URL}/customer-portal/settings`,
        settings
      );
      toast.success('Settings saved!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* ============ TRIP TYPES ============ */}
      <div>
        <SectionTitle>Trip Types</SectionTitle>
        <p className="text-sm text-gray-500 mb-4">
          Select trip types you would like to offer to your customers
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          {['oneWay', 'roundTrip', 'hourly'].map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.tripTypes[type]}
                onChange={() => handleTripTypeToggle(type)}
                className="w-4 h-4"
              />
              <span className="text-sm capitalize">
                {type === 'oneWay' ? 'One Way' : type === 'roundTrip' ? 'Round Trip' : 'Hourly'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ============ GRATUITY ============ */}
      <div>
        <SectionTitle>Gratuity</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.gratuity.enabled}
            onChange={() => handleToggle('gratuity', 'enabled')}
            label="Enable gratuity selection for customers"
            description={settings.gratuity.enabled 
              ? "Gratuity selection is enabled" 
              : "Gratuity selection is disabled"
            }
          />

          {settings.gratuity.enabled && (
            <div className="p-4 space-y-4">
              {/* Gratuity Percentages */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Gratuity Options</p>
                <div className="flex gap-3">
                  {[15, 18, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleGratuityPercentageToggle(pct)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        settings.gratuity.percentages.includes(pct)
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Option */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Offer cash gratuity option</span>
                <button
                  type="button"
                  onClick={() => handleNestedChange('gratuity', 'cashOption', !settings.gratuity.cashOption)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.gratuity.cashOption ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.gratuity.cashOption ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Custom Option */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Offer custom gratuity option</span>
                <button
                  type="button"
                  onClick={() => handleNestedChange('gratuity', 'customOption', !settings.gratuity.customOption)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.gratuity.customOption ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.gratuity.customOption ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {settings.gratuity.customOption && (
                <div className="flex items-center gap-4 pl-4">
                  <span className="text-sm text-gray-700">Min {settings.gratuity.minPercentage}%</span>
                  <button
                    type="button"
                    onClick={() => handleNestedChange('gratuity', 'optional', !settings.gratuity.optional)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.gratuity.optional ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.gratuity.optional ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-gray-700">
                    {settings.gratuity.optional ? 'No minimum' : 'Required'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ CUSTOMER SIGNATURE ============ */}
      <div>
        <SectionTitle>Customer Signature</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.customerSignature.enabled}
            onChange={() => handleToggle('customerSignature', 'enabled')}
            label="Require customer consent to book"
            description={settings.customerSignature.enabled 
              ? "Terms & Conditions and Cancellation Policy checkbox enabled" 
              : "Terms & Conditions and Cancellation Policy checkbox disabled"
            }
          />
        </div>
      </div>

      {/* ============ RESERVATION CUTOFF ============ */}
      <div>
        <SectionTitle>Reservation Cutoff</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.reservationCutoff.enabled}
            onChange={() => handleToggle('reservationCutoff', 'enabled')}
            label="Reservation cutoff period"
            description={`No reservations created within ${settings.reservationCutoff.hours} ${settings.reservationCutoff.type === 'hours' ? 'hour(s)' : 'day(s)'} of booking time. The cutoff period also applies to cancellation requests.`}
          />

          {settings.reservationCutoff.enabled && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={settings.reservationCutoff.hours}
                  onChange={(e) => handleChange('reservationCutoff', 'hours', parseInt(e.target.value) || 0)}
                  className={`${inputCls} w-24`}
                  min="0"
                  max="23"
                />
                <select
                  value={settings.reservationCutoff.type}
                  onChange={(e) => handleChange('reservationCutoff', 'type', e.target.value)}
                  className={`${inputCls} w-32`}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ REQUEST CHANGES TO TRIP ============ */}
      <div>
        <SectionTitle>Request Changes to Trip</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.requestChanges.automated}
            onChange={() => handleToggle('requestChanges', 'automated')}
            label="Automate trip updates requested by customer"
            description={`When this is on, any trip update that is requested by the customer will automatically be updated if request is made prior to your cutoff time selected`}
          />

          {settings.requestChanges.automated && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">Automation Cutoff Period</span>
                <select
                  value={settings.requestChanges.cutoffPeriod}
                  onChange={(e) => handleChange('requestChanges', 'cutoffPeriod', parseInt(e.target.value))}
                  className={`${inputCls} w-32`}
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">
                Any customer request for changes will be automated if made {settings.requestChanges.cutoffPeriod} days or more before trip pickup time
              </p>
            </div>
          )}

          <Toggle
            enabled={settings.requestChanges.allowCancellation}
            onChange={() => handleToggle('requestChanges', 'allowCancellation')}
            label="Allow customers to request a cancellation from the customer portal"
            description="When this is on, customers will be able to request a trip's cancellation from the customer portal before the configured reservation cutoff. Cancellations must still be manually managed by the operator."
            className="border-t border-gray-100"
          />
        </div>
      </div>

      {/* ============ BOOKING LOCATION RESTRICTION ============ */}
      <div>
        <SectionTitle>Booking Location Restriction</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.locationRestriction.enabled}
            onChange={() => handleToggle('locationRestriction', 'enabled')}
            label={`Restrict customer portal addresses to ${settings.locationRestriction.country}`}
            description="When this is on, customers will only see and submit booking addresses within your operating country."
          />
          {settings.locationRestriction.enabled && (
            <div className="p-4 border-t border-gray-200">
              <select
                value={settings.locationRestriction.country}
                onChange={(e) => handleChange('locationRestriction', 'country', e.target.value)}
                className={`${inputCls} w-48`}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="PK">Pakistan</option>
                <option value="AE">UAE</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ============ SKIP VEHICLE SELECTION ============ */}
      <div>
        <SectionTitle>Skip Vehicle Selection</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg">
          <Toggle
            enabled={settings.skipVehicleSelection.enabled}
            onChange={() => handleToggle('skipVehicleSelection', 'enabled')}
            label="Choose the default vehicle for reservations created without step 2"
            description="When this is on, the vehicle selection step won't be displayed in the customer portal. The default vehicle assigned to trips will be:"
          />

          {settings.skipVehicleSelection.enabled && (
            <div className="p-4 border-t border-gray-200">
              <select
                value={settings.skipVehicleSelection.defaultVehicleId || ''}
                onChange={(e) => handleChange('skipVehicleSelection', 'defaultVehicleId', e.target.value)}
                className={`${inputCls} w-full`}
              >
                <option value="">Select default vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.name} ({vehicle.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ============ VEHICLE ORDER (Coming Soon) ============ */}
      <div>
        <SectionTitle>Vehicle Order</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Coming soon</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default SettingsTab;