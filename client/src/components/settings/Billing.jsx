// src/components/settings/Billing.jsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Crown,
  ArrowRight,
  X,
  Upload,
  Loader2,
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  useEffect(() => {
    fetchBillingData();
    fetchPlans();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const VITE_URL = import.meta.env.VITE_URL;
      const res = await axios.get(`${VITE_URL}/billing/my-billing`, {
        withCredentials: true
      });
      setBilling(res.data.data || null);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      const res = await axios.get(`${VITE_URL}/billing/plans`, {
        withCredentials: true
      });
      setPlans(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRequestUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    if (!screenshot) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    setSubmitting(true);
    try {
      const VITE_URL = import.meta.env.VITE_URL;
      const formData = new FormData();
      formData.append('planId', selectedPlan._id);
      formData.append('notes', paymentNotes);
      formData.append('screenshot', screenshot);

      const res = await axios.post(`${VITE_URL}/billing/upgrade`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message || 'Upgrade request submitted!');
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      setScreenshot(null);
      setScreenshotPreview(null);
      setPaymentNotes('');
      fetchBillingData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit upgrade request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      trial: 'bg-blue-100 text-blue-600',
      expired: 'bg-red-100 text-red-600',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPlanBadge = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-600',
      basic: 'bg-blue-100 text-blue-600',
      pro: 'bg-purple-100 text-purple-600',
      enterprise: 'bg-amber-100 text-amber-600'
    };
    return colors[plan?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const getFeatureList = (features) => {
    const items = [];
    if (features?.vehicles?.limit !== undefined) {
      items.push({
        label: features.vehicles.label || 'Vehicles',
        limit: features.vehicles.limit === 0 ? 'Unlimited' : features.vehicles.limit
      });
    }
    if (features?.drivers?.limit !== undefined) {
      items.push({
        label: features.drivers.label || 'Drivers',
        limit: features.drivers.limit === 0 ? 'Unlimited' : features.drivers.limit
      });
    }
    if (features?.companies?.limit !== undefined) {
      items.push({
        label: features.companies.label || 'Companies',
        limit: features.companies.limit === 0 ? 'Unlimited' : features.companies.limit
      });
    }
    if (features?.contacts?.limit !== undefined) {
      items.push({
        label: features.contacts.label || 'Contacts',
        limit: features.contacts.limit === 0 ? 'Unlimited' : features.contacts.limit
      });
    }
    if (features?.advancedFeatures) {
      features.advancedFeatures.forEach(f => {
        if (f.enabled) {
          items.push({ label: f.name, limit: '✓' });
        }
      });
    }
    return items;
  };

  const isCurrentPlan = (plan) => {
    return plan.tier === billing?.plan?.tier;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and view billing history
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Current Plan</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                {billing?.plan?.name || 'Free'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadge(billing?.plan?.tier)}`}>
                {billing?.plan?.tier || 'free'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{billing?.plan?.description || 'Basic free plan'}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(billing?.plan?.price || 0)}
              <span className="text-sm font-normal text-gray-500">/{billing?.plan?.billingCycle || 'month'}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(billing?.status)}`}>
                {getStatusIcon(billing?.status)}
                {(billing?.status || 'trial').charAt(0).toUpperCase() + (billing?.status || 'trial').slice(1)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Renewal Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(billing?.renewalDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Trial Ends</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(billing?.trialEnds)}</p>
            </div>
          </div>
          {/* ✅ REMOVED Upgrade Plan button from here */}
        </div>
      </div>

      {/* Plans Pricing Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-500">No plans available</p>
              <p className="text-sm text-gray-400">Check back later for subscription plans</p>
            </div>
          ) : (
            plans.filter(p => p.tier !== 'free').map((plan) => {
              const features = getFeatureList(plan.features);
              const isCurrent = isCurrentPlan(plan);
              const isPopular = plan.tier === 'pro';

              return (
                <div 
                  key={plan._id}
                  className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all relative ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50/30' 
                      : isPopular 
                        ? 'border-blue-400' 
                        : 'border-gray-200'
                  } ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}
                >
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      <Star className="w-3 h-3 inline mr-1" />
                      Most Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="p-6 pt-8">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                      <span className="text-sm text-gray-500">/{plan.billingCycle}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>
                            {feature.limit === 'Unlimited' || feature.limit === '✓' 
                              ? feature.label 
                              : `${feature.limit} ${feature.label}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full mt-6 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowUpgradeModal(true);
                        }}
                        className={`w-full mt-6 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isPopular 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Upgrade to {selectedPlan?.name}</h2>
              </div>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                  setScreenshot(null);
                  setScreenshotPreview(null);
                  setPaymentNotes('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  You are upgrading to <strong>{selectedPlan?.name}</strong> plan.
                  Price: {formatCurrency(selectedPlan?.price)}/{selectedPlan?.billingCycle}
                </p>
              </div>

              {/* Screenshot Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot *
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    screenshotPreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                  }`}
                  onClick={() => document.getElementById('screenshotUpload').click()}
                >
                  {screenshotPreview ? (
                    <div className="relative">
                      <img src={screenshotPreview} alt="Screenshot" className="max-h-40 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshot(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload payment screenshot</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, WEBP (max 5MB)</p>
                    </div>
                  )}
                  <input
                    id="screenshotUpload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Add any notes for the admin..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Manual Payment Process:</strong> Upload your payment screenshot. Admin will verify and activate your plan within 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                  setScreenshot(null);
                  setScreenshotPreview(null);
                  setPaymentNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestUpgrade}
                disabled={!selectedPlan || !screenshot || submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;