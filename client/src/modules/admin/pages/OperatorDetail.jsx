// src/modules/admin/pages/OperatorDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Car, Users, Mail, Phone, Calendar, Edit2, Power, Trash2 } from 'lucide-react';
import adminService, { getErrorMessage } from '../services/adminService';
import toast from 'react-hot-toast';

const OperatorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchOperatorDetails();
  }, [id]);

  const fetchOperatorDetails = async () => {
    try {
      setLoading(true);
      const [opRes, companiesRes, vehiclesRes] = await Promise.all([
        adminService.getOperatorById(id),
        adminService.getOperatorCompanies(id),
        adminService.getOperatorVehicles(id)
      ]);

      setOperator(opRes.data.data);
      setCompanies(companiesRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const response = await adminService.toggleOperatorStatus(id);
      toast.success(response.data.message);
      fetchOperatorDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;
    
    try {
      const response = await adminService.deleteOperator(id);
      toast.success(response.data.message);
      navigate('/admin/operators');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Operator not found</p>
        <button
          onClick={() => navigate('/admin/operators')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Operators
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/operators')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {operator.CompanyName}
            </h1>
            <p className="text-sm text-gray-500">
              {operator.Fname} {operator.Lname}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              operator.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Power className="w-4 h-4 inline mr-1" />
            {operator.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => navigate(`/admin/operators/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
              <p className="text-sm text-gray-500">Companies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              <p className="text-sm text-gray-500">Vehicles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{operator.stats?.contacts || 0}</p>
              <p className="text-sm text-gray-500">Contacts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">Email</p>
              <p className="text-sm text-gray-900">{operator.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Phone</p>
              <p className="text-sm text-gray-900">{operator.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Subscription</p>
              <p className="text-sm text-gray-900">
                <span className="capitalize">{operator.subscriptionPlan}</span>
                {' • '}
                <span className={`capitalize ${
                  operator.subscriptionStatus === 'active' ? 'text-green-600' :
                  operator.subscriptionStatus === 'trial' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {operator.subscriptionStatus}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Joined</p>
              <p className="text-sm text-gray-900">
                {new Date(operator.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Created By</p>
              <p className="text-sm text-gray-900">
                {operator.createdBy ? 'Admin' : 'Self-Registered'}
              </p>
            </div>
          </div>
        </div>

        {/* Companies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Companies</h2>
          {companies.length === 0 ? (
            <p className="text-sm text-gray-500">No companies yet</p>
          ) : (
            <div className="space-y-2">
              {companies.map((company) => (
                <div key={company._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicles</h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-500">No vehicles yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                <p className="font-medium text-gray-900">{vehicle.name}</p>
                <p className="text-sm text-gray-500">{vehicle.type}</p>
                <p className="text-xs text-gray-400">{vehicle.passengerCapacity} seats</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDetail;