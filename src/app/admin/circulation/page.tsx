'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  Repeat,
  UserCheck,
  Barcode,
  ArrowRight,
  CheckCircle,
  ShieldAlert,
  Eye,
  BookOpen,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X,
  User,
  ListOrdered,
  PlusCircle,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Library,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function CirculationDeskPage() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin'>('checkout');

  // Check Out Form State
  const [patronBarcode, setPatronBarcode] = useState('PAT-88401');
  const [copyBarcodeOut, setCopyBarcodeOut] = useState('9780321125217');
  const [checkoutPreview, setCheckoutPreview] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    loanStatusDetails?: any;
  } | null>(null);

  // Check In Form State
  const [copyBarcodeIn, setCopyBarcodeIn] = useState('BC-1002');
  const [checkinPreview, setCheckinPreview] = useState<any>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    fineAssessed?: number;
  } | null>(null);

  // Desk KPI Metrics & Recent Activity
  const [stats, setStats] = useState({
    activeLoansCount: 0,
    overdueLoansCount: 0,
    todayCheckoutsCount: 0,
    todayCheckinsCount: 0,
    pendingHoldsCount: 0,
  });
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [sampleItems, setSampleItems] = useState<any[]>([]);
  const [deskLoading, setDeskLoading] = useState(false);

  const fetchCirculationData = async () => {
    setDeskLoading(true);
    try {
      const res = await fetch('/api/circulation');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentLoans(data.recentLoans || []);
        setSampleItems(data.sampleItems || []);
      }
    } catch (e) {
      console.error('Error loading circulation stats:', e);
    } finally {
      setDeskLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  // 1. Fetch Check-Out Preview
  const handleFetchCheckoutPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutMessage(null);
    setCheckoutPreview(null);
    setCheckoutLoading(true);

    try {
      const res = await fetch('/api/circulation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          patronBarcode,
          copyBarcode: copyBarcodeOut,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutPreview(data.preview);
      } else {
        setCheckoutMessage({
          type: 'error',
          text: data.error,
          loanStatusDetails: data.loanStatusDetails,
        });
      }
    } catch (err) {
      setCheckoutMessage({ type: 'error', text: 'Failed to generate checkout preview.' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // 2. Confirm & Commit Check-Out
  const handleConfirmCheckout = async () => {
    if (!checkoutPreview) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/circulation/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronBarcode,
          copyBarcode: checkoutPreview?.copy?.barcode || copyBarcodeOut,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutMessage({ type: 'success', text: data.message });
        setCheckoutPreview(null);
        fetchCirculationData();
      } else {
        setCheckoutMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setCheckoutMessage({ type: 'error', text: 'Checkout transaction failed.' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Add Member to Hold Queue directly from Circulation Desk
  const handleAddMemberToQueue = async (bookId?: string) => {
    try {
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          patronBarcode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Member "${patronBarcode}" added to Priority Hold Queue at Position #${data.queuePosition}!`);
        setCheckoutMessage(null);
        fetchCirculationData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Fetch Check-In Preview
  const handleFetchCheckinPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckinMessage(null);
    setCheckinPreview(null);
    setCheckinLoading(true);

    try {
      const res = await fetch('/api/circulation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          copyBarcode: copyBarcodeIn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckinPreview(data.preview);
      } else {
        setCheckinMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setCheckinMessage({ type: 'error', text: 'Failed to generate checkin preview.' });
    } finally {
      setCheckinLoading(false);
    }
  };

  // 4. Confirm & Commit Check-In
  const handleConfirmCheckin = async () => {
    if (!checkinPreview) return;
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/circulation/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copyBarcode: checkinPreview?.copy?.barcode || copyBarcodeIn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckinMessage({
          type: 'success',
          text: data.message,
          fineAssessed: data.fineAssessed,
        });
        setCheckinPreview(null);
        fetchCirculationData();
      } else {
        setCheckinMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setCheckinMessage({ type: 'error', text: 'Check-in transaction failed.' });
    } finally {
      setCheckinLoading(false);
    }
  };

  const details = checkoutMessage?.loanStatusDetails;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-green-900 text-white flex items-center justify-center shadow-sm">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t.circulation.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {t.circulation.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Scanner Readiness Indicator */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Barcode & ISBN Scanner Ready</span>
              </div>
              <button
                onClick={fetchCirculationData}
                disabled={deskLoading}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${deskLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Main Workstation Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Segmented Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('checkout');
                  setCheckoutMessage(null);
                  setCheckoutPreview(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'checkout'
                    ? 'bg-white text-green-950 shadow-sm border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'checkout' ? 'bg-green-100 text-green-900' : 'bg-slate-200/60 text-slate-600'}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <span>{t.circulation.checkoutTab}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('checkin');
                  setCheckinMessage(null);
                  setCheckinPreview(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'checkin'
                    ? 'bg-white text-emerald-950 shadow-sm border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'checkin' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200/60 text-slate-600'}`}>
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
                <span>{t.circulation.checkinTab}</span>
              </button>
            </div>

            {/* TAB 1: CHECK-OUT */}
            {activeTab === 'checkout' ? (
              <div className="p-6 sm:p-8 space-y-6">
                {checkoutMessage && !details && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                      checkoutMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border border-rose-300 text-rose-800'
                    }`}
                  >
                    {checkoutMessage.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="leading-relaxed">{checkoutMessage.text}</span>
                  </div>
                )}

                {/* RENTED ITEM STATUS & PRIORITY QUEUE INTELLIGENCE CARD */}
                {details && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md text-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                      <div className="flex items-center space-x-2 text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                        <h3 className="font-extrabold text-sm">
                          Copy "{details.copyBarcode}" is Currently Rented (ON_LOAN)
                        </h3>
                      </div>
                      <button
                        onClick={() => setCheckoutMessage(null)}
                        className="text-amber-700 hover:text-amber-900 font-bold text-base"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Current Borrower Information */}
                    <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                        👤 Current Borrower Status
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">
                            {details.borrower?.name || 'Alex Rivera'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            Barcode: {details.borrower?.barcode || 'PAT-88401'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{details.borrower?.phone || '09-971234567'}</span>
                          </span>
                        </div>

                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-600 font-sans">Issued Date:</span>
                            <span className="font-bold text-slate-800">
                              {details.issuedDate
                                ? new Date(details.issuedDate).toLocaleDateString()
                                : '2026-07-20'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 font-sans">Due Date:</span>
                            <span className="font-bold text-amber-900">
                              {details.dueDate
                                ? new Date(details.dueDate).toLocaleDateString()
                                : '2026-08-18'}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-amber-200 text-amber-900 font-extrabold">
                            <span className="font-sans">Wait Time:</span>
                            <span>{details.daysRemainingStr || '5 days remaining'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Priority Queue List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                          📋 Hold Reservation Waiting Queue ({details.priorityQueue?.length || 0})
                        </span>
                      </div>

                      {details.priorityQueue && details.priorityQueue.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {details.priorityQueue.map((item: any) => (
                            <div
                              key={item.position}
                              className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between font-mono text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                                  #{item.position}
                                </span>
                                <span className="font-sans font-bold text-slate-900">
                                  {item.memberName}
                                </span>
                                <span className="text-slate-500">({item.memberBarcode})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {new Date(item.requestDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-center italic text-[11px]">
                          No members currently in queue for this item.
                        </div>
                      )}
                    </div>

                    {/* Action: Add Member to Queue */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleAddMemberToQueue()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Current Member ({patronBarcode}) to Priority Queue</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1 Form */}
                {!checkoutPreview ? (
                  <form onSubmit={handleFetchCheckoutPreview} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Patron Barcode Field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-800">
                            {t.circulation.patronBarcode} *
                          </label>
                          <button
                            type="button"
                            onClick={() => setPatronBarcode('PAT-88401')}
                            className="text-[11px] text-emerald-800 hover:underline font-mono font-semibold"
                          >
                            Use Alex Rivera (PAT-88401)
                          </button>
                        </div>
                        <div className="relative">
                          <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-700" />
                          <input
                            type="text"
                            placeholder="e.g. PAT-88401"
                            value={patronBarcode}
                            onChange={(e) => setPatronBarcode(e.target.value)}
                            required
                            className="w-full bg-slate-50/50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3 py-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white transition"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Scan the library member's card barcode or type barcode number.
                        </p>
                      </div>

                      {/* Book Copy Barcode or ISBN Field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-800">
                            {t.circulation.copyBarcode} *
                          </label>
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                            Supports ISBN or Barcode
                          </span>
                        </div>
                        <div className="relative">
                          <Barcode className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-700" />
                          <input
                            type="text"
                            placeholder="e.g. BC-1001 or ISBN (9780321125217)"
                            value={copyBarcodeOut}
                            onChange={(e) => setCopyBarcodeOut(e.target.value)}
                            required
                            className="w-full bg-slate-50/50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3 py-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white transition"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Scan book sticker barcode (BC-XXXX) or scan/enter printed ISBN on the book.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full py-3.5 rounded-xl bg-green-950 hover:bg-green-900 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-[0.99]"
                    >
                      {checkoutLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      <span>
                        {checkoutLoading
                          ? 'Locating Book & Verifying Member...'
                          : 'Preview Check-Out Loan'}
                      </span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: PREVIEW CARD BEFORE CONFIRMING CHECKOUT */
                  <div className="bg-slate-50 border border-green-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-900 flex items-center justify-center">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Check-Out Loan Confirmation Preview
                          </h3>
                          <p className="text-[11px] text-slate-500">Please review and confirm to issue book loan to member.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCheckoutPreview(null)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Patron Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-green-800 uppercase tracking-wider block flex items-center gap-1">
                          <User className="w-3 h-3" /> Member Profile
                        </span>
                        <p className="font-extrabold text-slate-900 text-base">
                          {checkoutPreview.patron.name}
                        </p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          Barcode: <span className="font-bold text-slate-800">{checkoutPreview.patron.barcode}</span>
                        </p>
                        <p className="text-slate-600">
                          Category: <span className="font-bold text-slate-800">{checkoutPreview.patron.categoryName}</span>
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500">Loan Capacity:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                            {checkoutPreview.patron.activeLoansCount} / {checkoutPreview.patron.maxLoanCount} active loans
                          </span>
                        </div>
                      </div>

                      {/* Book & Copy Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-green-800 uppercase tracking-wider block flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Book & Copy Item
                        </span>
                        <div className="flex gap-3">
                          {checkoutPreview.copy.coverUrl ? (
                            <img
                              src={checkoutPreview.copy.coverUrl}
                              alt={checkoutPreview.copy.bookTitle}
                              className="w-12 h-16 object-cover rounded border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="font-extrabold text-slate-900 text-sm line-clamp-1">
                              {checkoutPreview.copy.bookTitle}
                            </p>
                            <p className="text-slate-500 text-[11px] truncate">by {checkoutPreview.copy.author}</p>
                            <p className="text-slate-500 font-mono text-[10px]">
                              ISBN: {checkoutPreview.copy.isbn}
                            </p>
                            <div className="pt-1 flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                              <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                Barcode: {checkoutPreview.copy.barcode}
                              </span>
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                Shelf: {checkoutPreview.copy.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Due Date & Rule Summary */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                      <div className="flex items-center space-x-2 text-emerald-900">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold">
                          Calculated Loan Period & Return Due Date:
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-950 text-sm bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                        Due: {new Date(checkoutPreview.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} ({checkoutPreview.loanPeriodDays} Days)
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        onClick={() => setCheckoutPreview(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                      >
                        Cancel / Change Input
                      </button>

                      <button
                        onClick={handleConfirmCheckout}
                        disabled={checkoutLoading}
                        className="px-6 py-2.5 rounded-xl bg-green-950 hover:bg-green-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                      >
                        {checkoutLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span>{checkoutLoading ? 'Processing...' : 'Confirm & Issue Loan'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: CHECK-IN */
              <div className="p-6 sm:p-8 space-y-6">
                {checkinMessage && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      checkinMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border border-rose-300 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="leading-relaxed">{checkinMessage.text}</span>
                    </div>
                    {checkinMessage.fineAssessed && checkinMessage.fineAssessed > 0 ? (
                      <span className="font-mono font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-lg text-xs border border-rose-200">
                        {t.circulation.fineAssessed}: {checkinMessage.fineAssessed.toLocaleString('en-US')} MMK
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Step 1 Form */}
                {!checkinPreview ? (
                  <form onSubmit={handleFetchCheckinPreview} className="space-y-6">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-800">
                          {t.circulation.copyBarcode} *
                        </label>
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                          Supports Barcode or ISBN
                        </span>
                      </div>
                      <div className="relative">
                        <Barcode className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-700" />
                        <input
                          type="text"
                          placeholder="e.g. BC-1002 or ISBN (9780262033848)"
                          value={copyBarcodeIn}
                          onChange={(e) => setCopyBarcodeIn(e.target.value)}
                          required
                          className="w-full bg-slate-50/50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3 py-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Scan the copy barcode on the returning book, or enter the book ISBN.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={checkinLoading}
                      className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-[0.99]"
                    >
                      {checkinLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      <span>
                        {checkinLoading ? 'Loading Return Preview...' : 'Preview Check-In Return'}
                      </span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: PREVIEW CARD BEFORE CONFIRMING CHECKIN */
                  <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Check-In Return Confirmation Preview
                          </h3>
                          <p className="text-[11px] text-slate-500">Confirm returning physical copy to library inventory.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCheckinPreview(null)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Item & Book Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                          Returning Item
                        </span>
                        <p className="font-bold text-slate-900 text-base">
                          {checkinPreview.copy.bookTitle}
                        </p>
                        <p className="text-slate-500">by {checkinPreview.copy.author}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          Barcode: <span className="font-bold text-slate-800">{checkinPreview.copy.barcode}</span> • Call: {checkinPreview.copy.callNumber}
                        </p>
                      </div>

                      {/* Patron & Loan Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                          Borrower & Loan Status
                        </span>
                        <p className="font-bold text-slate-900 text-base">
                          {checkinPreview.patron.name}
                        </p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          Member Barcode: <span className="font-bold text-slate-800">{checkinPreview.patron.barcode}</span>
                        </p>
                        <p className="text-slate-600 font-mono">
                          Due Date: <span className="font-bold text-slate-800">{new Date(checkinPreview.loan.dueDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Fine & Overdue Warning Box */}
                    {checkinPreview.finePreview > 0 ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-rose-800">
                        <div className="flex items-center space-x-2.5">
                          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-sm block">
                              Overdue Item ({checkinPreview.overdueDays} Days Late)
                            </span>
                            <span className="text-[11px] text-rose-700">
                              Book fine rate: {(checkinPreview.dailyFineRate || 500).toLocaleString('en-US')} MMK / day × {checkinPreview.overdueDays} overdue days
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-extrabold text-sm text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-300 self-start sm:self-auto">
                          Total Fine: {checkinPreview.finePreview.toLocaleString('en-US')} MMK
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                          <span className="font-bold">Item returned on time (No overdue fine)</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded">0 MMK Fine</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        onClick={() => setCheckinPreview(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                      >
                        Cancel / Change Barcode
                      </button>

                      <button
                        onClick={handleConfirmCheckin}
                        disabled={checkinLoading}
                        className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                      >
                        {checkinLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-300" />
                        )}
                        <span>{checkinLoading ? 'Processing...' : 'Confirm Return & Update Status'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Recent Transactions Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Recent Circulation Desk Transactions
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Latest check-outs, returns, and inventory movements processed at the desk.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 font-mono">
                {recentLoans.length} records shown
              </span>
            </div>

            {recentLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Book Title / Author</th>
                      <th className="px-5 py-3">Copy Barcode</th>
                      <th className="px-5 py-3">Borrower</th>
                      <th className="px-5 py-3">Issued Date</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLoans.map((loan) => {
                      const isReturned = loan.status === 'RETURNED';
                      const isOverdue = loan.status === 'OVERDUE' || (!isReturned && new Date(loan.dueDate) < new Date());

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 line-clamp-1">{loan.bookTitle}</div>
                            <div className="text-[11px] text-slate-500">by {loan.bookAuthor}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">
                            {loan.copyBarcode}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-800">{loan.borrowerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loan.borrowerBarcode}</div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {new Date(loan.issuedDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold">
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isReturned
                                  ? 'bg-slate-100 text-slate-600'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {!isReturned ? (
                              <button
                                onClick={() => {
                                  setActiveTab('checkin');
                                  setCopyBarcodeIn(loan.copyBarcode);
                                  window.scrollTo({ top: 150, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition"
                              >
                                Return
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">✓ Returned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recent circulation transactions found.
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
