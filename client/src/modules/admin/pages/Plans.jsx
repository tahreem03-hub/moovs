// src/modules/admin/pages/Plans.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Check, Crown } from 'lucide-react';
import subscriptionService from '../services/subscriptionService';
import PlanForm from '../components/PlanForm';
import toast from 'react-hot-toast';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getPlans();
      setPlans(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await subscriptionService.deletePlan(id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await subscriptionService.setDefaultPlan(id);
      toast.success('Default plan set successfully');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to set default plan');
    }
  };

  const getTierBadge = (tier) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700'
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${colors[tier] || 'bg-gray-100'}`;
  };

  const getFeatureList = (features) => {
    const items = [];
    if (features?.vehicles?.limit !== undefined) {
      items.push(`${features.vehicles.limit === 0 ? 'Unlimited' : features.vehicles.limit} Vehicles`);
    }
    if (features?.drivers?.limit !== undefined) {
      items.push(`${features.drivers.limit === 0 ? 'Unlimited' : features.drivers.limit} Drivers`);
    }
    if (features?.companies?.limit !== undefined) {
      items.push(`${features.companies.limit === 0 ? 'Unlimited' : features.companies.limit} Companies`);
    }
    if (features?.contacts?.limit !== undefined) {
      items.push(`${features.contacts.limit === 0 ? 'Unlimited' : features.contacts.limit} Contacts`);
    }
    features?.advancedFeatures?.forEach(f => {
      if (f.enabled) items.push(f.name);
    });
    return items;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage subscription plans</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">No subscription plans created yet</p>
          <p className="text-sm text-gray-400">Click "Create Plan" to add your first subscription tier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <span className={getTierBadge(plan.tier)}>{plan.tier}</span>
                  </div>
                  {plan.isDefault && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Default
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500">/{plan.billingCycle}</span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>

                <div className="space-y-1.5 mb-4">
                  {getFeatureList(plan.features).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  {!plan.isDefault && (
                    <button
                      onClick={() => handleSetDefault(plan._id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowForm(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors ml-auto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!plan.isDefault && (
                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSuccess={fetchPlans}
      />
    </div>
  );
};

export default Plans;