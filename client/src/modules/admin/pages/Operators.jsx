// src/modules/admin/pages/Operators.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, RefreshCw } from 'lucide-react';

import OperatorTable from '../components/OperatorTable';
import OperatorForm from '../components/OperatorForm';
import toast from 'react-hot-toast';

import adminService, { getErrorMessage } from '../services/adminService';

const Operators = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchOperators = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const response = await adminService.getOperators(page, 10, searchTerm);
      if (response.data.success) {
        setOperators(response.data.data || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          limit: response.data.pagination?.limit || 10,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        });
      }
    } catch (error) {
      console.error('Fetch operators error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
    
    // Check if we should open create form
    if (location.pathname === '/admin/operators/create') {
      handleCreate();
    }
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOperators(1, search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchOperators(1, '');
  };

  const handleCreate = () => {
    setSelectedOperator(null);
    setIsEditing(false);
    setFormOpen(true);
    navigate('/admin/operators/create');
  };

  const handleEdit = (id) => {
    const operator = operators.find(op => op._id === id);
    if (operator) {
      setSelectedOperator(operator);
      setIsEditing(true);
      setFormOpen(true);
    }
  };

  const handleView = (id) => {
    // Navigate to operator details page
    navigate(`/admin/operators/${id}`);
  };

  const handleToggle = async (id) => {
    try {
      const response = await adminService.toggleOperatorStatus(id);
      toast.success(response.data.message);
      fetchOperators(pagination.page, search);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;
    
    try {
      const response = await adminService.deleteOperator(id);
      toast.success(response.data.message);
      fetchOperators(pagination.page, search);
    } catch (error) {
      
      toast.error(getErrorMessage(error));
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedOperator(null);
    setIsEditing(false);
    navigate('/admin/operators');
  };

  const handleFormSuccess = () => {
    fetchOperators(pagination.page, search);
  };

  const handlePageChange = (newPage) => {
    fetchOperators(newPage, search);
  };

  if (loading && operators.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-sm text-gray-500">Manage all transportation companies using your platform</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Operator
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              placeholder="Search by company, name, or email..."
            />
          </div>
        </form>
        <button
          onClick={() => fetchOperators(pagination.page, search)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <OperatorTable
        operators={operators}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onView={handleView}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Operator Form (Slide-in) */}
      <OperatorForm
        isOpen={formOpen}
        onClose={handleFormClose}
        operator={selectedOperator}
        onSuccess={handleFormSuccess}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Operators;