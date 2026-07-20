import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Clock, Calendar, Zap, Power, PowerOff, Tag, MapPin, Car } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TripRules = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/trip-rules/list`
      );
      setRules(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch trip rules');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_URL}/trip-rules/toggle/${id}`
      );
      toast.success(response.data.message);
      fetchRules();
    } catch (error) {
      toast.error('Failed to toggle rule status');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/trip-rules/delete/${id}`
      );
      toast.success(response.data.message);
      setShowDeleteModal(null);
      fetchRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const getRuleTypeIcon = (type) => {
    switch(type) {
      case 'anytime': return <Zap className="w-4 h-4" />;
      case 'specific_date': return <Calendar className="w-4 h-4" />;
      case 'date_range': return <Calendar className="w-4 h-4" />;
      case 'time_of_day': return <Clock className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (type) => {
    switch(type) {
      case 'anytime': return 'Anytime';
      case 'specific_date': return 'Specific Date';
      case 'date_range': return 'Date Range';
      case 'time_of_day': return 'Time of Day';
      default: return type;
    }
  };

  const getPricingLabel = (rule) => {
    if (rule.pricingAction === 'skip') return 'Skip Pricing';
    const action = rule.pricingAction === 'increase' ? '+' : '-';
    const type = rule.adjustmentType === 'percentage' ? '%' : '$';
    return `${action}${rule.adjustmentAmount}${type}`;
  };

  const getVehicleLabel = (rule) => {
    if (rule.applyToAllVehicles) return 'All Vehicles';
    if (rule.vehicles?.length > 0) {
      return `${rule.vehicles.length} vehicle${rule.vehicles.length > 1 ? 's' : ''}`;
    }
    return 'No vehicles';
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create rules to automatically adjust pricing based on time, date, or location
          </p>
        </div>
        <button
          onClick={() => navigate('/settings/trip-rules/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Trip Rule
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule) => (
            <div key={rule._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600">
                      {getRuleTypeIcon(rule.ruleType)}
                    </span>
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {getRuleTypeLabel(rule.ruleType)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                      rule.pricingAction === 'increase' ? 'bg-green-100 text-green-700' :
                      rule.pricingAction === 'decrease' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getPricingLabel(rule)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      {getVehicleLabel(rule)}
                    </span>
                    {!rule.applyToAllLocations && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Custom Zone
                      </span>
                    )}
                    {rule.driverNote && (
                      <span className="text-gray-400 text-xs">
                        Note: {rule.driverNote}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(rule._id, rule.isActive)}
                    className={`p-1.5 rounded transition-colors ${
                      rule.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={rule.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {rule.isActive ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/settings/trip-rules/edit/${rule._id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(rule._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg">No trip rules created yet</p>
          <p className="text-sm">Click "Create Trip Rule" to add your first rule</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Trip Rule</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this trip rule? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
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

export default TripRules;