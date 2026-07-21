
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, getErrorMessage } from '../services/adminService';
import OperatorTable from '../components/OperatorTable';
 
/**
 * Operators list page.
 * Route: /admin/operators
 * Viewing a single operator lives on its own page: /admin/operators/:id (OperatorDetail).
 * Admins do NOT create operators — operators self-register.
 */
const Operators = () => {
  const navigate = useNavigate();
 
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState(null);
  const limit = 10;
 
  const debounceRef = useRef(null);
 
  const fetchOperators = useCallback(
    async (pageArg = page, searchArg = search, silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await adminService.getOperators(pageArg, limit, searchArg);
        const body = res.data || {};
        // backend: { success, data: [...operators], pagination: { total, page, pages, limit } }
        const list = Array.isArray(body.data) ? body.data : body.data?.operators || [];
        setOperators(list);
        const pagination = body.pagination || body.data?.pagination || {};
        setTotalPages(pagination.pages || pagination.totalPages || 1);
        setTotal(pagination.total ?? list.length);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load operators'));
      } finally {
        setLoading(false);
      }
    },
    [page, search]
  );
 
  // Fetch on page change
  useEffect(() => {
    fetchOperators(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
 
  // Debounced search
  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchOperators(1, value);
    }, 400);
  };
 
  useEffect(() => () => clearTimeout(debounceRef.current), []);
 
  const handleToggle = async (op) => {
    try {
      setTogglingId(op._id);
      await adminService.toggleOperatorStatus(op._id);
      toast.success(op.isActive ? 'Operator deactivated' : 'Operator activated');
      fetchOperators(page, search, true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setTogglingId(null);
    }
  };
 
  const handleDelete = async (op) => {
    const ok = window.confirm(
      `Delete ${op.CompanyName || op.email}? All of their companies, vehicles, and contacts will be permanently removed.`
    );
    if (!ok) return;
    try {
      await adminService.deleteOperator(op._id);
      toast.success('Operator deleted');
      const nextPage = operators.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchOperators(nextPage, search, true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete operator'));
    }
  };
 
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Operators</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} operator{total === 1 ? '' : 's'} on the platform
        </p>
      </div>
 
      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, email, or company"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
        />
      </div>
 
      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-lg border border-gray-200">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        </div>
      ) : operators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-lg border border-gray-200 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No operators found</p>
          <p className="text-sm text-gray-500 mt-1">
            {search ? 'Try a different search term.' : 'Operators appear here once they register.'}
          </p>
        </div>
      ) : (
        <>
          <OperatorTable
            operators={operators}
            onView={(op) => navigate(`/admin/operators/${op._id}`)}
            onToggle={handleToggle}
            onDelete={handleDelete}
            togglingId={togglingId}
          />
 
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
 
export default Operators;
 
