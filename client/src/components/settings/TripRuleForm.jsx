import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Save, Zap, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const StepIndicator = ({ currentStep, totalSteps, labels }) => (
  <div className="flex items-center gap-2 mb-6">
    {labels.map((label, index) => (
      <React.Fragment key={index}>
        <div className={`flex items-center gap-2 ${index < currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${index < currentStep ? 'bg-blue-600 text-white' : 
              index === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
              'bg-gray-100 text-gray-400'}`}>
            {index + 1}
          </div>
          <span className={`text-sm font-medium ${index === currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
            {label}
          </span>
        </div>
        {index < totalSteps - 1 && (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </React.Fragment>
    ))}
  </div>
);

const TripRuleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'anytime',
    anytime: true,
    specificDate: '',
    dateRange: {
      start: '',
      end: '',
      daysOfWeek: []
    },
    timeOfDay: {
      start: '00:00',
      end: '23:59',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    pricingAction: 'increase',
    adjustmentType: 'flat',
    adjustmentAmount: 0,
    applyToAllVehicles: true,
    vehicles: [],
    applyToAllLocations: true,
    zones: [],
    zoneMatchType: 'pickup',
    driverNote: '',
    tripNote: '',
    restrictVehicles: false,
    repeat: false,
    isActive: true
  });

  const steps = [
    { label: 'When', fields: ['ruleType', 'specificDate', 'dateRange', 'timeOfDay'] },
    { label: 'Pricing', fields: ['pricingAction', 'adjustmentType', 'adjustmentAmount'] },
    { label: 'Vehicles', fields: ['applyToAllVehicles', 'vehicles'] },
    { label: 'Location', fields: ['applyToAllLocations', 'zones', 'zoneMatchType', 'driverNote', 'tripNote', 'restrictVehicles'] },
    { label: 'Review', fields: [] }
  ];

  const stepLabels = steps.map(s => s.label);

  useEffect(() => {
    fetchVehicles();
    if (isEditing) {
      fetchRule();
    }
  }, [id]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/vehicle/my-vehicles`
      );
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchRule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/trip-rules/${id}`
      );
      setFormData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch trip rule');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleArrayToggle = (section, value) => {
    setFormData(prev => {
      const current = prev[section] || [];
      const index = current.indexOf(value);
      if (index > -1) {
        return { ...prev, [section]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [section]: [...current, value] };
      }
    });
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 0 && formData.ruleType === 'specific_date' && !formData.specificDate) {
      toast.error('Please select a date');
      return;
    }
    if (currentStep === 0 && formData.ruleType === 'date_range' && (!formData.dateRange.start || !formData.dateRange.end)) {
      toast.error('Please select a date range');
      return;
    }
    if (currentStep === 0 && formData.ruleType === 'time_of_day' && (!formData.timeOfDay.start || !formData.timeOfDay.end)) {
      toast.error('Please select a time range');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing 
        ? `${import.meta.env.VITE_URL}/trip-rules/update/${id}`
        : `${import.meta.env.VITE_URL}/trip-rules/create`;
      
      const response = await axios[isEditing ? 'put' : 'post'](url, formData);
      toast.success(response.data.message);
      navigate('/settings/trip-rules');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save trip rule');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // When
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">When should this rule apply?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'anytime', label: 'Anytime', icon: Zap },
                  { id: 'specific_date', label: 'Specific Date', icon: Calendar },
                  { id: 'date_range', label: 'Date Range', icon: Calendar },
                  { id: 'time_of_day', label: 'Time of Day', icon: Clock }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        ruleType: option.id,
                        anytime: option.id === 'anytime'
                      }));
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-colors flex items-center gap-3
                      ${formData.ruleType === option.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <option.icon className={`w-5 h-5 ${formData.ruleType === option.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${formData.ruleType === option.id ? 'text-blue-600' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {formData.ruleType === 'specific_date' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={formData.specificDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, specificDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            )}

            {formData.ruleType === 'date_range' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.dateRange.start}
                      onChange={(e) => handleNestedChange('dateRange', 'start', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.dateRange.end}
                      onChange={(e) => handleNestedChange('dateRange', 'end', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleArrayToggle('dateRange.daysOfWeek', day)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors capitalize
                          ${(formData.dateRange.daysOfWeek || []).includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formData.ruleType === 'time_of_day' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.timeOfDay.start}
                      onChange={(e) => handleNestedChange('timeOfDay', 'start', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.timeOfDay.end}
                      onChange={(e) => handleNestedChange('timeOfDay', 'end', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleArrayToggle('timeOfDay.daysOfWeek', day)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors capitalize
                          ${(formData.timeOfDay.daysOfWeek || []).includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g., Late Night Surcharge"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="repeat"
                checked={formData.repeat}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700">Repeat this rule</label>
            </div>
          </div>
        );

      case 1: // Pricing
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Action</label>
              <div className="grid grid-cols-3 gap-3">
                {['increase', 'decrease', 'skip'].map(action => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricingAction: action }))}
                    className={`p-3 border-2 rounded-lg text-center transition-colors capitalize
                      ${formData.pricingAction === action 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={`font-medium ${formData.pricingAction === action ? 'text-blue-600' : 'text-gray-700'}`}>
                      {action}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {formData.pricingAction !== 'skip' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="flat">$ Amount</option>
                    <option value="percentage">% Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.adjustmentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, adjustmentAmount: parseFloat(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder={formData.adjustmentType === 'percentage' ? 'e.g., 20' : 'e.g., 10'}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Vehicles
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apply to Vehicles</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, applyToAllVehicles: true, vehicles: [] }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors
                    ${formData.applyToAllVehicles 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`font-medium ${formData.applyToAllVehicles ? 'text-blue-600' : 'text-gray-700'}`}>
                    All Vehicles
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, applyToAllVehicles: false }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors
                    ${!formData.applyToAllVehicles 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`font-medium ${!formData.applyToAllVehicles ? 'text-blue-600' : 'text-gray-700'}`}>
                    Select Vehicles
                  </span>
                </button>
              </div>
            </div>

            {!formData.applyToAllVehicles && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicles</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {vehicles.map(vehicle => (
                    <label key={vehicle._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.vehicles.includes(vehicle._id)}
                        onChange={() => {
                          const current = formData.vehicles;
                          const index = current.indexOf(vehicle._id);
                          if (index > -1) {
                            setFormData(prev => ({ ...prev, vehicles: current.filter(v => v !== vehicle._id) }));
                          } else {
                            setFormData(prev => ({ ...prev, vehicles: [...current, vehicle._id] }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{vehicle.name} ({vehicle.type})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Location
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, applyToAllLocations: true, zones: [] }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors
                    ${formData.applyToAllLocations 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`font-medium ${formData.applyToAllLocations ? 'text-blue-600' : 'text-gray-700'}`}>
                    All Locations
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, applyToAllLocations: false }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors
                    {!formData.applyToAllLocations 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`font-medium ${!formData.applyToAllLocations ? 'text-blue-600' : 'text-gray-700'}`}>
                    Custom Zone
                  </span>
                </button>
              </div>
            </div>

            {!formData.applyToAllLocations && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone Match Type</label>
                <select
                  value={formData.zoneMatchType}
                  onChange={(e) => setFormData(prev => ({ ...prev, zoneMatchType: e.target.value }))}
                  className={inputCls}
                >
                  <option value="pickup">Pickup in zone</option>
                  <option value="dropoff">Dropoff in zone</option>
                  <option value="both">Both pickup and dropoff in zone</option>
                  <option value="either">Pickup or dropoff in zone</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Map zone drawing will be available here</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Note</label>
              <input
                type="text"
                name="driverNote"
                value={formData.driverNote}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g., Check tire pressure before trip"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Note</label>
              <input
                type="text"
                name="tripNote"
                value={formData.tripNote}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g., This is a premium route"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="restrictVehicles"
                checked={formData.restrictVehicles}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700">Restrict vehicles for this rule</label>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Your Trip Rule</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium">{formData.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">When</span>
                <span className="font-medium capitalize">{formData.ruleType.replace('_', ' ')}</span>
              </div>
              {formData.pricingAction !== 'skip' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pricing</span>
                  <span className="font-medium">
                    {formData.pricingAction} by {formData.adjustmentAmount}
                    {formData.adjustmentType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              )}
              {formData.pricingAction === 'skip' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pricing</span>
                  <span className="font-medium">Skip pricing (notes only)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicles</span>
                <span className="font-medium">
                  {formData.applyToAllVehicles ? 'All Vehicles' : `${formData.vehicles.length} selected`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">
                  {formData.applyToAllLocations ? 'All Locations' : 'Custom Zone'}
                </span>
              </div>
              {formData.driverNote && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver Note</span>
                  <span className="font-medium">{formData.driverNote}</span>
                </div>
              )}
              {formData.repeat && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Repeat</span>
                  <span className="font-medium">Yes</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
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
    <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {isEditing ? 'Edit Trip Rule' : 'Create Trip Rule'}
          </h2>
          <button
            onClick={() => navigate('/settings/trip-rules')}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={steps.length} 
            labels={stepLabels} 
          />

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                className={`px-4 py-2 text-sm font-medium transition-colors
                  ${currentStep > 0 ? 'text-gray-600 hover:text-gray-800' : 'invisible'}`}
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/settings/trip-rules')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                {currentStep === steps.length - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripRuleForm;