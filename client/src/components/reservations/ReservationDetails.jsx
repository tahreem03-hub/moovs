// src/modules/reservations/components/ReservationDashboard.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, RefreshCw, Inbox } from 'lucide-react';
import reservationService from '../../services/reservationServices';
import ReservationCard from './ReservationCard';
import ReservationStats from './ReservationStat';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  ALL: 'All',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DISPATCHED: 'Dispatched',
  STARTED: 'Started',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  BILLED: 'Billed'
};

const ListSkeleton = () => (
  <div className="space-y-2" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="rounded-lg border border-gray-200 bg-white p-3 animate-pulse"
        style={{ animationDelay: `${i * 90}ms` }}
      >
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-20 rounded-full bg-gray-200" />
          <div className="h-4 w-14 rounded-full bg-gray-100" />
        </div>
        <div className="mt-3 h-3 w-4/5 rounded-full bg-gray-200" />
        <div className="mt-2 h-3 w-3/5 rounded-full bg-gray-100" />
      </div>
    ))}
  </div>
);

const ReservationDashboard = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const currentStatus = searchParams.get("status") || "ALL";

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        status: filterStatus || undefined
      };
      const response = await reservationService.getReservations(params);
      setReservations(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reservationService.getReservationStats();
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchReservations();
      fetchStats();
    }
  }));

  useEffect(() => {
    fetchReservations();
    fetchStats();
  }, [search, filterStatus]);

  useEffect(() => {
    if (!searchParams.get("status")) {
      setSearchParams({ status: "ALL" }, { replace: true });
    } else {
      setFilterStatus(currentStatus === "ALL" ? '' : currentStatus.toLowerCase());
    }
  }, [searchParams]);

  const changeStatus = (status) => {
    setSearchParams({ status });
  };

  const handleReservationClick = (id) => {
    navigate(`/reservations/${id}`, { state: { fromDashboard: true } });
  };

  const handleRefresh = () => {
    fetchReservations();
    fetchStats();
  };

  const statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'DISPATCHED', 'STARTED', 'COMPLETED', 'CANCELLED', 'BILLED'];

  const isFiltered = Boolean(search) || currentStatus !== 'ALL';

  return (
    <div className="h-screen w-80 min-w-[20rem] max-w-[20rem] shrink-0 overflow-x-hidden bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="shrink-0 w-full min-w-0 bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-3 min-w-0">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-gray-900 truncate">
                Reservations
              </h1>
              {!loading && (
                <span className="text-xs font-medium text-gray-400 tabular-nums">
                  {reservations.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh reservations"
                className="h-8 w-8 grid place-items-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                           disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/reservations/create')}
                className="h-8 pl-2.5 pr-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 text-white
                           text-[13px] font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                           transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Create
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 min-w-0">
            <ReservationStats stats={stats} loading={loading} />
          </div>

          {/* Search */}
          <div className="relative mt-3 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400
                         group-focus-within:text-blue-600 transition-colors pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-900
                         placeholder:text-gray-400 outline-none
                         hover:border-gray-300
                         focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         transition-all duration-150"
              placeholder="Search reservations"
            />
          </div>
        </div>

        {/* Status rail */}
        <div className="relative min-w-0">
          <div className="flex gap-1 min-w-0 overflow-x-auto overscroll-x-contain px-4 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusOptions.map((status) => {
              const active = currentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeStatus(status)}
                  className={`shrink-0 h-7 px-2.5 rounded-full text-[11px] font-medium whitespace-nowrap
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                              transition-colors duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {STATUS_LABELS[status] || status}
                </button>
              );
            })}
          </div>
          {/* Edge fade cues that the rail scrolls */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-3 py-3 bg-gray-50/60">
        {loading ? (
          <ListSkeleton />
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-14">
            <div className="w-11 h-11 rounded-full bg-white border border-gray-200 grid place-items-center shadow-sm">
              {isFiltered ? (
                <Search className="w-5 h-5 text-gray-300" strokeWidth={2} />
              ) : (
                <Inbox className="w-5 h-5 text-gray-300" strokeWidth={2} />
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">
              {isFiltered ? 'No matching reservations' : 'No reservations yet'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {isFiltered
                ? 'Try a different search term or status.'
                : 'Create your first reservation to see it here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 min-w-0">
            {reservations.map((reservation) => (
              <div key={reservation._id} className="min-w-0 [&_*]:min-w-0">
                <ReservationCard
                  reservation={reservation}
                  onClick={handleReservationClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ReservationDashboard;