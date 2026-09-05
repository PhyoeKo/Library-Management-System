'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  BookMarked,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ListOrdered,
  User,
  BookOpen,
  Calendar,
  ChevronDown,
  Layers,
  AlertTriangle,
  CheckCheck,
  Filter,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface HoldCopy {
  id: string;
  status: string;
  barcode: string;
}

interface Hold {
  id: string;
  status: string;
  requestDate: string;
  queuePosition: number;
  availableCopies: number;
  user: {
    id: string;
    name: string;
    email: string;
    barcode: string;
    role: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverUrl?: string;
    copies: HoldCopy[];
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  FULFILLED: {
    label: 'Fulfilled',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function HoldsQueuePage() {
  const { t } = useLanguage();
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedHoldId, setExpandedHoldId] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<'LIFO' | 'FIFO'>('LIFO');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHolds = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterStatus !== 'ALL' ? `/api/holds?status=${filterStatus}` : '/api/holds';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setHolds(data.holds);
      } else {
        showToast('error', data.error || 'Failed to load holds.');
      }
    } catch {
      showToast('error', 'Network error while loading holds.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchHolds();
  }, [fetchHolds]);

  const updateHoldStatus = async (holdId: string, newStatus: string) => {
    setActionLoading(holdId + newStatus);
    try {
      const res = await fetch(`/api/holds/${holdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchHolds();
      } else {
        showToast('error', data.error || 'Action failed.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredHolds = holds
    .filter((h) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        h.user.name.toLowerCase().includes(q) ||
        h.user.barcode.toLowerCase().includes(q) ||
        h.book.title.toLowerCase().includes(q) ||
        h.book.isbn.toLowerCase().includes(q) ||
        h.book.author.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.requestDate).getTime();
      const timeB = new Date(b.requestDate).getTime();
      return sortOrder === 'LIFO' ? timeB - timeA : timeA - timeB;
    });

  // Summary stats
  const pendingCount = holds.filter((h) => h.status === 'PENDING').length;
  const approvedCount = holds.filter((h) => h.status === 'APPROVED').length;
  const fulfilledCount = holds.filter((h) => h.status === 'FULFILLED').length;
  const cancelledCount = holds.filter((h) => h.status === 'CANCELLED').length;

  const tabs = [
    { key: 'ALL', label: `All (${holds.length})` },
    { key: 'PENDING', label: `Pending (${pendingCount})` },
    { key: 'APPROVED', label: `Approved (${approvedCount})` },
    { key: 'FULFILLED', label: `Fulfilled (${fulfilledCount})` },
    { key: 'CANCELLED', label: `Cancelled (${cancelledCount})` },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'bg-rose-50 border-rose-300 text-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            {toast.text}
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {(t as any).holds?.title || 'Holds & Reservation Queue'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {(t as any).holds?.subtitle ||
                    'Manage patron book reservations, approve or fulfil holds, and monitor the waiting queue.'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Pending',
                value: pendingCount,
                icon: Clock,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                label: 'Approved',
                value: approvedCount,
                icon: CheckCheck,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Fulfilled',
                value: fulfilledCount,
                icon: CheckCircle,
                color: 'text-green-700',
                bg: 'bg-green-50',
              },
              {
                label: 'Cancelled',
                value: cancelledCount,
                icon: XCircle,
                color: 'text-slate-500',
                bg: 'bg-slate-100',
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500 font-semibold">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls: Tabs + Search + Refresh */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg whitespace-nowrap transition border-b-2 -mb-px ${
                    filterStatus === tab.key
                      ? 'text-violet-700 border-violet-600 bg-violet-50'
                      : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patron name, barcode, book title, ISBN..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <ListOrdered className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-slate-500 font-medium">Order:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'LIFO' | 'FIFO')}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="LIFO">LIFO (Newest First)</option>
                    <option value="FIFO">FIFO (Oldest First)</option>
                  </select>
                </div>
                <button
                  onClick={fetchHolds}
                  disabled={loading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Holds Table / Cards */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 font-semibold text-sm">Loading reservation queue…</p>
            </div>
          ) : filteredHolds.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
              <BookMarked className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-base">No holds found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchQuery
                  ? 'Try a different search term.'
                  : filterStatus !== 'ALL'
                  ? `No ${filterStatus.toLowerCase()} holds at this time.`
                  : 'No reservation requests have been placed yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHolds.map((hold) => {
                const cfg = STATUS_CONFIG[hold.status] || STATUS_CONFIG.PENDING;
                const isExpanded = expandedHoldId === hold.id;
                const isActing = actionLoading?.startsWith(hold.id);

                return (
                  <div
                    key={hold.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition hover:shadow-md"
                  >
                    {/* Main row */}
                    <div className="flex items-start gap-4 p-4">
                      {/* Queue badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
                        #{hold.status === 'PENDING' ? hold.queuePosition : '—'}
                      </div>

                      {/* Book info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-bold text-slate-900 text-sm truncate max-w-xs sm:max-w-lg">
                              {hold.book.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {hold.book.author} &middot; ISBN: {hold.book.isbn}
                            </p>
                          </div>

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Patron + meta row */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{hold.user.name}</span>
                            <span className="font-mono text-slate-400">{hold.user.barcode}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Requested:{' '}
                            {new Date(hold.requestDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {hold.book.copies.length} total copies &middot;{' '}
                            <span
                              className={
                                hold.availableCopies > 0
                                  ? 'text-green-700 font-bold'
                                  : 'text-rose-600 font-bold'
                              }
                            >
                              {hold.availableCopies} available
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons + expand */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0 ml-auto">
                        {hold.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateHoldStatus(hold.id, 'APPROVED')}
                              disabled={!!isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-60"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              {actionLoading === hold.id + 'APPROVED' ? 'Approving…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => updateHoldStatus(hold.id, 'CANCELLED')}
                              disabled={!!isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition disabled:opacity-60"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                        {hold.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => updateHoldStatus(hold.id, 'FULFILLED')}
                              disabled={!!isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-60"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {actionLoading === hold.id + 'FULFILLED' ? 'Marking…' : 'Mark Fulfilled'}
                            </button>
                            <button
                              onClick={() => updateHoldStatus(hold.id, 'CANCELLED')}
                              disabled={!!isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition disabled:opacity-60"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Expand toggle */}
                        <button
                          onClick={() =>
                            setExpandedHoldId(isExpanded ? null : hold.id)
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs rounded-lg border border-slate-200 transition"
                          title="Show details"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expanded details panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Patron details */}
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                              Patron Details
                            </p>
                            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Name</span>
                                <span className="font-semibold text-slate-800">{hold.user.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Barcode</span>
                                <span className="font-mono font-bold text-violet-700">
                                  {hold.user.barcode}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Email</span>
                                <span className="font-semibold text-slate-800">{hold.user.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Role</span>
                                <span className="font-semibold text-slate-800 uppercase text-[10px]">
                                  {hold.user.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Copy inventory */}
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                              Physical Copies
                            </p>
                            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs max-h-36 overflow-y-auto">
                              {hold.book.copies.length === 0 ? (
                                <p className="text-slate-400 italic">No physical copies catalogued.</p>
                              ) : (
                                hold.book.copies.map((copy) => (
                                  <div
                                    key={copy.id}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="font-mono text-slate-600">{copy.barcode}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        copy.status === 'AVAILABLE'
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : copy.status === 'ON_LOAN'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}
                                    >
                                      {copy.status}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Workflow hint */}
                        {hold.status === 'PENDING' && hold.availableCopies > 0 && (
                          <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <span className="font-bold">
                                {hold.availableCopies} copy available.
                              </span>{' '}
                              Approve this hold and proceed to the Circulation Desk to issue the loan to this patron.
                            </span>
                          </div>
                        )}
                        {hold.status === 'PENDING' && hold.availableCopies === 0 && (
                          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <span className="font-bold">No copies currently available.</span>{' '}
                              This patron is waiting in position #{hold.queuePosition}. Approve when a copy becomes available.
                            </span>
                          </div>
                        )}
                        {hold.status === 'APPROVED' && (
                          <div className="mt-3 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-xs text-green-700">
                            <CheckCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <span className="font-bold">Hold approved.</span>{' '}
                              Proceed to{' '}
                              <a href="/admin/circulation" className="underline font-bold">
                                Circulation Desk
                              </a>{' '}
                              to check out the book to <strong>{hold.user.name}</strong>, then click{' '}
                              <em>"Mark Fulfilled"</em>.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer count */}
          {!loading && filteredHolds.length > 0 && (
            <p className="text-center text-xs text-slate-400 mt-6 font-semibold">
              Showing {filteredHolds.length} of {holds.length} reservation record
              {holds.length !== 1 ? 's' : ''}
            </p>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
