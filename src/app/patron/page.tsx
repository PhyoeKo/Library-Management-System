'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import {
  BookOpen,
  Clock,
  CreditCard,
  History,
  Bookmark,
  CheckCircle,
  Users,
  Search,
  AlertTriangle,
  RefreshCw,
  Phone,
  Barcode,
  IdCard,
  GraduationCap,
  RotateCw,
  Tag,
  Calendar,
  AlertCircle,
  CheckCheck,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface PatronProfile {
  id: string;
  name: string;
  email: string;
  barcode: string;
  nrcNumber?: string;
  phone?: string;
  address?: string;
  isBlocked: boolean;
  blockReason?: string;
  category: {
    name: string;
    code: string;
    maxLoanCount: number;
    loanPeriodDays: number;
    fineRatePerDay: number;
  };
}

interface CheckoutItem {
  id: string;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  copyBarcode: string;
  callNumber?: string;
  issuedDate: string;
  dueDate: string;
  renewalCount: number;
  isOverdue: boolean;
  daysRemaining: number;
  daysOverdue: number;
  fineAccrued: number;
  canRenew: boolean;
}

interface HoldItem {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  requestDate: string;
  status: string;
  queueRank: number;
  totalQueue: number;
  availableCopies: number;
}

interface FineItem {
  id: string;
  reason: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  bookTitle: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  copyBarcode: string;
  issuedDate: string;
  returnedDate?: string;
}

interface SavedListItem {
  id: string;
  name: string;
  description?: string;
  bookCount: number;
}

export default function PatronDashboardPage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patronData, setPatronData] = useState<{
    patron: PatronProfile;
    summary: {
      currentCheckoutsCount: number;
      overdueCount: number;
      activeHoldsCount: number;
      totalOutstandingFine: number;
      totalHistoryCount: number;
    };
    checkouts: CheckoutItem[];
    holds: HoldItem[];
    fineStatement: FineItem[];
    history: HistoryItem[];
    savedLists: SavedListItem[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'CHECKOUTS' | 'HOLDS' | 'FINES' | 'HISTORY' | 'LISTS'>('CHECKOUTS');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New list modal
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listNameInput, setListNameInput] = useState('');
  const [listDescInput, setListDescInput] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchPatronAccount = useCallback(async () => {
    setLoading(true);
    try {
      const userIdParam = currentUser?.id ? `?userId=${currentUser.id}` : '';
      const res = await fetch(`/api/patron/me${userIdParam}`);
      const data = await res.json();
      if (data.success) {
        setPatronData(data);
      }
    } catch (err) {
      console.error('Failed to load patron account:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPatronAccount();
  }, [fetchPatronAccount]);

  // Self-service loan renewal
  const handleRenewLoan = async (loanId: string) => {
    setActionLoading(`renew_${loanId}`);
    try {
      const res = await fetch('/api/patron/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, userId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Loan renewed successfully');
        fetchPatronAccount();
      } else {
        showToast(data.error || 'Failed to renew loan', 'error');
      }
    } catch {
      showToast('Network error during renewal', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel hold request
  const handleCancelHold = async (holdId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation request?')) return;
    setActionLoading(`hold_${holdId}`);
    try {
      const res = await fetch(`/api/holds/${holdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Hold request cancelled');
        fetchPatronAccount();
      } else {
        showToast(data.error || 'Failed to cancel hold', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Create Saved List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listNameInput.trim()) return;
    try {
      const res = await fetch('/api/patron/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: patronData?.patron.id || currentUser?.id,
          name: listNameInput,
          description: listDescInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Virtual list created');
        setIsListModalOpen(false);
        setListNameInput('');
        setListDescInput('');
        fetchPatronAccount();
      } else {
        showToast(data.error || 'Failed to create list', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Delete Saved List
  const handleDeleteList = async (id: string) => {
    try {
      const res = await fetch(`/api/patron/lists?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Virtual list deleted');
        fetchPatronAccount();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const p = patronData?.patron;
  const s = patronData?.summary;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-bold text-white transition-all ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* MOCHT Official Government Patron Header Ribbon */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-[2px] shadow flex-shrink-0">
              <img
                src="/mocht-logo.png"
                alt="Ministry of Culture, Hotels and Tourism Seal"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် · MOCHT LMS
                </span>
                {p?.category && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>{p.category.name}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {p?.name || 'နိုင်ငံသား စာကြည့်တိုက် အဖွဲ့ဝင်'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                {p?.nrcNumber && (
                  <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    NRC: <b>{p.nrcNumber}</b>
                  </span>
                )}
                <span>Card Barcode: <b className="font-mono text-slate-800">{p?.barcode || 'PAT-00000'}</b></span>
                <span>•</span>
                <span className="font-mono">{p?.email}</span>
                {p?.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-800 font-semibold">{p.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Circulation Balance
              </span>
              <span className={`text-base font-black font-mono ${(s?.totalOutstandingFine ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {(s?.totalOutstandingFine ?? 0).toLocaleString()} MMK
              </span>
            </div>

            {p?.isBlocked ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-extrabold block">Account Suspended</span>
                  <span className="text-[10px]">{p.blockReason || 'Contact circulation desk'}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <span className="text-xs font-extrabold block">Good Standing</span>
                  <span className="text-[10px]">Borrowing permitted (Max {p?.category.maxLoanCount || 5} items)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation (Koha OPAC Account Tabs) */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('CHECKOUTS')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'CHECKOUTS'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Current Checkouts ({patronData?.checkouts.length || 0})</span>
            {(s?.overdueCount ?? 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('HOLDS')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'HOLDS'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Holds & Reservations ({patronData?.holds.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('FINES')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'FINES'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Fines & Charges ({patronData?.fineStatement.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'HISTORY'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Borrowing History ({patronData?.history.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('LISTS')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'LISTS'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Virtual Shelves ({patronData?.savedLists.length || 0})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: CURRENT CHECKOUTS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'CHECKOUTS' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-800" />
                Loading your current checkouts...
              </div>
            ) : !patronData?.checkouts || patronData.checkouts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No items currently checked out</p>
                <p className="text-xs text-slate-400 mt-1">Browse the library catalog to borrow physical books or read e-books.</p>
                <a
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition"
                >
                  Explore OPAC Catalog
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {patronData.checkouts.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      item.isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={item.bookTitle}
                          className="w-14 h-20 object-cover rounded-lg border border-slate-200 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-20 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>OVERDUE BY {item.daysOverdue} DAYS</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              DUE IN {item.daysRemaining} DAYS
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-mono">
                            Renewals: {item.renewalCount}/3
                          </span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-base mt-1">{item.bookTitle}</h3>
                        <p className="text-xs text-slate-500">By {item.author}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-2 flex-wrap">
                          <span>Barcode: <b className="text-slate-800">{item.copyBarcode}</b></span>
                          {item.callNumber && <span>• Call: {item.callNumber}</span>}
                          <span>• Due Date: <b className={item.isOverdue ? 'text-rose-600' : 'text-slate-800'}>
                            {new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </b></span>
                        </div>

                        {item.fineAccrued > 0 && (
                          <p className="text-xs font-bold text-rose-600 mt-1">
                            Accrued Fine: {item.fineAccrued.toLocaleString()} MMK
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleRenewLoan(item.id)}
                        disabled={!item.canRenew || actionLoading === `renew_${item.id}`}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          item.canRenew
                            ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${actionLoading === `renew_${item.id}` ? 'animate-spin' : ''}`} />
                        <span>{item.canRenew ? 'Self-Renew (+14d)' : 'Cannot Renew'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: HOLDS & RESERVATIONS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'HOLDS' && (
          <div className="space-y-4">
            {!patronData?.holds || patronData.holds.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No active holds or reservations</p>
                <p className="text-xs text-slate-400 mt-1">When books are currently checked out, place a hold to reserve the next copy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {patronData.holds.map((hold) => (
                  <div
                    key={hold.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            hold.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : hold.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {hold.status === 'APPROVED' ? 'WAITING FOR PICKUP' : hold.status}
                        </span>

                        {hold.status === 'PENDING' && (
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            Queue Position: #{hold.queueRank} of {hold.totalQueue}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base">{hold.bookTitle}</h3>
                      <p className="text-xs text-slate-500">By {hold.author}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Requested on {new Date(hold.requestDate).toLocaleDateString('en-GB')} •{' '}
                        {hold.availableCopies > 0 ? (
                          <span className="text-emerald-700 font-bold">{hold.availableCopies} copy available at desk</span>
                        ) : (
                          <span>All copies currently on loan</span>
                        )}
                      </p>
                    </div>

                    {hold.status !== 'CANCELLED' && hold.status !== 'FULFILLED' && (
                      <button
                        onClick={() => handleCancelHold(hold.id)}
                        disabled={actionLoading === `hold_${hold.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Hold</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: FINES & CHARGES STATEMENT
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'FINES' && (
          <div className="space-y-4">
            {!patronData?.fineStatement || patronData.fineStatement.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No library fines or charges</p>
                <p className="text-xs text-slate-400 mt-1">Your library circulation record is clean with zero outstanding debts.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Charge Reason & Item</th>
                      <th className="px-6 py-3.5">Date Assessed</th>
                      <th className="px-6 py-3.5">Total Amount</th>
                      <th className="px-6 py-3.5">Outstanding Balance</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patronData.fineStatement.map((fine) => (
                      <tr key={fine.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{fine.reason}</span>
                          <span className="text-slate-500 text-[11px]">{fine.bookTitle}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">
                          {new Date(fine.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {fine.amount.toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-rose-600">
                          {fine.balance.toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              fine.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {fine.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: BORROWING HISTORY
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            {!patronData?.history || patronData.history.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No returned loans history yet</p>
                <p className="text-xs text-slate-400 mt-1">Returned books and reading logs will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patronData.history.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                  >
                    <div className="w-12 h-16 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{h.bookTitle}</h4>
                      <p className="text-xs text-slate-500 truncate">{h.author}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Borrowed: {new Date(h.issuedDate).toLocaleDateString('en-GB')}
                        {h.returnedDate && ` • Returned: ${new Date(h.returnedDate).toLocaleDateString('en-GB')}`}
                      </p>
                    </div>
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Returned</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: VIRTUAL SHELVES / LISTS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'LISTS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Your Personal Virtual Lists & Shelves</h3>
                <p className="text-xs text-slate-500">Organize and bookmark library materials for study or future borrowing.</p>
              </div>
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New List</span>
              </button>
            </div>

            {!patronData?.savedLists || patronData.savedLists.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No virtual lists created yet</p>
                <p className="text-xs text-slate-400 mt-1">Create reading lists to bookmark items from the catalog.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patronData.savedLists.map((list) => (
                  <div
                    key={list.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {list.bookCount} Saved Books
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base mt-2">{list.name}</h4>
                      {list.description && <p className="text-xs text-slate-500 mt-0.5">{list.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition"
                      title="Delete List"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create Virtual Shelf */}
        {isListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-800" />
                  <span>Create Virtual Shelf / List</span>
                </h3>
                <button onClick={() => setIsListModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateList} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">List Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Architecture Finals Prep"
                    value={listNameInput}
                    onChange={(e) => setListNameInput(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea
                    placeholder="Notes or purpose of this reading shelf"
                    value={listDescInput}
                    onChange={(e) => setListDescInput(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsListModalOpen(false)}
                    className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
                  >
                    Create List
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
