// driver-app/src/components/driver/MyRides.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronLeft, ChevronRight, ChevronRight as Arrow } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/api';

/* ---- design tokens (kept local; promote to app-wide theme when ready) ----
   ink       #14181F   primary text / solid buttons
   ink-soft  #3A414D
   muted     #8A909C
   faint     #9AA0AC
   line      #E8E9ED   hairlines
   canvas    #F5F5F3   warm porcelain
   accent    #0B5C48   heritage racing green (used with restraint)
--------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

// Small solid dot per status — a quiet legend rather than loud pills.
const statusDot = {
  pending: '#B8860B',
  confirmed: '#2563EB',
  dispatched: '#4F46E5',
  started: '#7C3AED',
  completed: '#0B5C48',
  cancelled: '#B42318',
  billed: '#6B7280',
};

const FILTERS = ['all', 'upcoming', 'in-progress', 'completed', 'cancelled'];
const STATUS_BY_FILTER = {
  all: '',
  upcoming: 'confirmed,dispatched',
  'in-progress': 'started',
  completed: 'completed',
  cancelled: 'cancelled',
};

// ---- shared data extraction (matches the real reservation payload) ----
const customerName = (trip) => {
  const c = trip.bookingContact;
  if (c?.firstName && c?.lastName) return `${c.firstName} ${c.lastName}`;
  return c?.name || 'Unknown passenger';
};

const stopAddress = (trip, type) => {
  const stop = trip.stops?.find((s) => s.type === type);
  if (!stop) return '—';
  if (stop.locationType === 'airport' && stop.airport) {
    return [stop.airport.code, stop.airport.name].filter(Boolean).join(' · ') || 'Airport';
  }
  const a = stop.address;
  if (a) {
    const parts = [a.street || a.address || a.formattedAddress, a.city, a.state].filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return '—';
};

const tripPrice = (trip) => {
  const total = trip.pricing?.total ?? trip.totalPrice ?? 0;
  return typeof total === 'number' ? total : 0;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

const MyRides = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const status = STATUS_BY_FILTER[filter] ?? '';
      const response = await driverApi.getTrips(status ? { status } : {});
      setTrips(response.data.data || []);
    } catch (error) {
      toast.error('Couldn’t load your rides. Pull to refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Reset to first page whenever the working set changes.
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return trips;
    const q = searchTerm.toLowerCase();
    return trips.filter((t) => {
      const hay = [
        customerName(t),
        t.reservationNumber,
        stopAddress(t, 'pickup'),
        stopAddress(t, 'dropoff'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [trips, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageTrips = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error('Nothing to export in this view.');
      return;
    }
    const headers = ['Reservation', 'Date', 'Passenger', 'Pickup', 'Dropoff', 'Status', 'Fare'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = filtered.map((t) =>
      [
        t.reservationNumber || t._id,
        fmtDate(t.pickupDateTime),
        customerName(t),
        stopAddress(t, 'pickup'),
        stopAddress(t, 'dropoff'),
        t.status,
        tripPrice(t).toFixed(2),
      ]
        .map(esc)
        .join(',')
    );
    const csv = [headers.map(esc).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-rides-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl text-[#14181F]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-none tracking-[-0.02em]">My rides</h1>
          <p className="mt-2 text-sm tabular-nums text-[#8A909C]">
            {filtered.length} {filtered.length === 1 ? 'trip' : 'trips'}
            {filter !== 'all' && <span className="text-[#C4C8D0]"> · {filter.replace('-', ' ')}</span>}
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0AC]" />
            <input
              type="text"
              placeholder="Search passenger, address, or #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-[#E8E9ED] bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition
                         placeholder:text-[#B4B9C2] focus-visible:border-[#0B5C48] focus-visible:ring-2 focus-visible:ring-[#0B5C48]/15"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E9ED] bg-white px-4 text-sm font-medium text-[#14181F]
                       transition hover:border-[#14181F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Segmented filter control */}
      <div className="mt-6 inline-flex flex-wrap gap-1 rounded-full border border-[#E8E9ED] bg-white p-1">
        {FILTERS.map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25 ${
                            active
                              ? 'bg-[#14181F] text-white'
                              : 'text-[#6B7280] hover:text-[#14181F]'
                          }`}
            >
              {tab.replace('-', ' ')}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[132px] rounded-2xl border border-[#EEEFF2] bg-white animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : pageTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1E3E8] bg-white/60 px-6 py-16 text-center">
            <p className="text-[15px] font-medium text-[#14181F]">No rides to show</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#8A909C]">
              {searchTerm
                ? 'No trips match your search. Clear it to see everything in this tab.'
                : 'Trips assigned to you by dispatch will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pageTrips.map((trip) => (
              <RideCard key={trip._id} trip={trip} onOpen={() => navigate(`/trips/${trip._id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm tabular-nums text-[#8A909C]">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-full border border-[#E8E9ED] bg-white p-2 transition hover:border-[#14181F]
                         disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E8E9ED]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-full border border-[#E8E9ED] bg-white p-2 transition hover:border-[#14181F]
                         disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E8E9ED]"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Ride card: an itinerary document with a pickup→dropoff route spine ----
const RideCard = ({ trip, onOpen }) => {
  const dot = statusDot[trip.status] || '#6B7280';
  const pickup = stopAddress(trip, 'pickup');
  const dropoff = stopAddress(trip, 'dropoff');

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-2xl border border-[#E8E9ED] bg-white p-5 transition
                 hover:-translate-y-0.5 hover:border-[#D2D5DC] hover:shadow-[0_8px_24px_-12px_rgba(20,24,31,0.18)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5C48]/25
                 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Top line: status · reservation · date */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium capitalize text-[#3A414D]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
          {trip.status}
        </span>
        <div className="flex items-center gap-3 text-[13px] tabular-nums text-[#8A909C]">
          <span className="font-medium text-[#6B7280]">{trip.reservationNumber || `#${trip._id?.slice(-6)}`}</span>
          <span className="text-[#D6D9DF]">·</span>
          <span>{fmtDate(trip.pickupDateTime)}</span>
        </div>
      </div>

      {/* Route spine */}
      <div className="relative mt-4">
        <span aria-hidden className="absolute left-[5px] top-3 bottom-3 w-px bg-[#E2E4E9]" />

        <div className="relative flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#14181F] bg-white" />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#9AA0AC]">Pickup</p>
              <p className="truncate text-[15px] text-[#14181F]">{pickup}</p>
            </div>
            <p className="shrink-0 pt-3 text-[13px] tabular-nums text-[#8A909C]">{fmtTime(trip.pickupDateTime)}</p>
          </div>
        </div>

        <div className="relative mt-3 flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rotate-45 bg-[#0B5C48]" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#9AA0AC]">Dropoff</p>
            <p className="truncate text-[15px] text-[#14181F]">{dropoff}</p>
          </div>
        </div>
      </div>

      {/* Footer: passenger · type — fare */}
      <div className="mt-4 flex items-center justify-between border-t border-[#F0F1F3] pt-4">
        <p className="min-w-0 truncate text-sm text-[#6B7280]">
          <span className="text-[#14181F]">{customerName(trip)}</span>
          {trip.orderType && <span className="text-[#B7BCC5]"> · {trip.orderType}</span>}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tabular-nums text-[#14181F]">
            ${tripPrice(trip).toFixed(2)}
          </span>
          <Arrow className="h-4 w-4 -translate-x-1 text-[#C4C8D0] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none" />
        </div>
      </div>
    </article>
  );
};

export default MyRides;