'use client';

import React, { useState } from 'react';
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
  Clock,
  RefreshCw,
  X,
  User,
  ListOrdered,
  PlusCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function CirculationDeskPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin'>('checkout');

  // Check Out Form State
  const [patronBarcode, setPatronBarcode] = useState('PAT-88401');
  const [copyBarcodeOut, setCopyBarcodeOut] = useState('BC-1001');
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
        body: JSON.stringify({ patronBarcode, copyBarcode: copyBarcodeOut }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutMessage({ type: 'success', text: data.message });
        setCheckoutPreview(null);
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
        body: JSON.stringify({ copyBarcode: copyBarcodeIn }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckinMessage({
          type: 'success',
          text: data.message,
          fineAssessed: data.fineAssessed,
        });
        setCheckinPreview(null);
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
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Repeat className="w-6 h-6 text-green-900" />
              <span>{t.circulation.title}</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.circulation.subtitle}
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex space-x-2 border-b border-slate-200 mb-6 text-xs font-bold bg-white p-1 rounded-t-xl">
            <button
              onClick={() => {
                setActiveTab('checkout');
                setCheckoutMessage(null);
                setCheckoutPreview(null);
              }}
              className={`flex-1 pb-2.5 pt-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'checkout'
                  ? 'border-green-900 text-green-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t.circulation.checkoutTab}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('checkin');
                setCheckinMessage(null);
                setCheckinPreview(null);
              }}
              className={`flex-1 pb-2.5 pt-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'checkin'
                  ? 'border-emerald-700 text-emerald-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.circulation.checkinTab}</span>
            </button>
          </div>

          {/* TAB 1: CHECK-OUT */}
          {activeTab === 'checkout' ? (
            <div className="bg-white border border-slate-200 rounded-b-xl rounded-t-sm p-6 shadow-sm">
              {checkoutMessage && !details && (
                <div
                  className={`p-3.5 rounded-lg mb-6 text-xs font-semibold flex items-center gap-2.5 ${
                    checkoutMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {checkoutMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{checkoutMessage.text}</span>
                </div>
              )}

              {/* RENTED ITEM STATUS & PRIORITY QUEUE INTELLIGENCE CARD */}
              {details && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-md text-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                    <div className="flex items-center space-x-2 text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                      <h3 className="font-extrabold text-sm">
                        Copy "{details.copyBarcode}" is Currently Rented (ON_LOAN)
                      </h3>
                    </div>
                    <button
                      onClick={() => setCheckoutMessage(null)}
                      className="text-amber-700 hover:text-amber-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 1. Current Borrower Information */}
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

                  {/* 2. Priority Hold Reservation Queue List */}
                  <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <ListOrdered className="w-3.5 h-3.5 text-amber-700" />
                        <span>Priority Hold Reservation Queue List ({details.totalHoldsWaiting} Waiting)</span>
                      </span>
                    </div>

                    {details.priorityQueueList && details.priorityQueueList.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {details.priorityQueueList.map((queueItem: any) => (
                          <div
                            key={queueItem.position}
                            className="bg-amber-50/60 p-2 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold font-mono text-[10px] flex items-center justify-center">
                                #{queueItem.position}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 block">{queueItem.memberName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {queueItem.memberBarcode} • {queueItem.phone}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] text-amber-800 font-mono">
                              Requested: {new Date(queueItem.requestDate).toLocaleDateString()}
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
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-lg shadow transition flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Current Member ({patronBarcode}) to Priority Queue</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1 Form */}
              {!checkoutPreview ? (
                <form onSubmit={handleFetchCheckoutPreview} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.circulation.patronBarcode} *
                      </label>
                      <div className="relative">
                        <UserCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. PAT-88401"
                          value={patronBarcode}
                          onChange={(e) => setPatronBarcode(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.circulation.copyBarcode} *
                      </label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. BC-1001"
                          value={copyBarcodeOut}
                          onChange={(e) => setCopyBarcodeOut(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full py-2.5 rounded-lg bg-green-950 hover:bg-green-900 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                  >
                    {checkoutLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{checkoutLoading ? 'Loading Preview...' : 'Preview Check-Out Loan'}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: PREVIEW CARD BEFORE CONFIRMING CHECKOUT */
                <div className="bg-slate-50 border border-green-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-green-900" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Check-Out Loan Confirmation Preview
                      </h3>
                    </div>
                    <button
                      onClick={() => setCheckoutPreview(null)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Patron Box */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider block">
                        Member Details
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {checkoutPreview.patron.name}
                      </p>
                      <p className="text-slate-500 font-mono">
                        Barcode: {checkoutPreview.patron.barcode}
                      </p>
                      <p className="text-slate-600">
                        Category: <span className="font-semibold text-slate-800">{checkoutPreview.patron.categoryName}</span>
                      </p>
                      <p className="text-slate-600">
                        Active Loans: <span className="font-bold text-slate-900">{checkoutPreview.patron.activeLoansCount} / {checkoutPreview.patron.maxLoanCount}</span>
                      </p>
                    </div>

                    {/* Book & Copy Box */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider block">
                        Book Copy Details
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {checkoutPreview.copy.bookTitle}
                      </p>
                      <p className="text-slate-500">by {checkoutPreview.copy.author}</p>
                      <p className="text-slate-500 font-mono">
                        Barcode: {checkoutPreview.copy.barcode} • Call: {checkoutPreview.copy.callNumber}
                      </p>
                      <p className="text-slate-600">
                        Shelf: <span className="font-semibold text-slate-800">{checkoutPreview.copy.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Due Date & Rule Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-900" />
                      <span className="font-semibold text-slate-800">
                        Calculated Due Date:
                      </span>
                    </div>
                    <span className="font-mono font-bold text-green-950 text-sm">
                      {new Date(checkoutPreview.dueDate).toLocaleDateString('en-US', {
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
                      className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
                    >
                      Cancel / Edit Barcodes
                    </button>

                    <button
                      onClick={handleConfirmCheckout}
                      disabled={checkoutLoading}
                      className="px-5 py-2 rounded-lg bg-green-950 hover:bg-green-900 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      {checkoutLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{checkoutLoading ? 'Processing...' : 'Confirm & Issue Loan'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: CHECK-IN */
            <div className="bg-white border border-slate-200 rounded-b-xl rounded-t-sm p-6 shadow-sm">
              {checkinMessage && (
                <div
                  className={`p-3.5 rounded-lg mb-6 text-xs font-semibold flex items-center justify-between ${
                    checkinMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{checkinMessage.text}</span>
                  </div>
                  {checkinMessage.fineAssessed && checkinMessage.fineAssessed > 0 ? (
                    <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded text-xs border border-rose-200">
                      {t.circulation.fineAssessed}: {checkinMessage.fineAssessed.toLocaleString('en-US')} MMK
                    </span>
                  ) : null}
                </div>
              )}

              {/* Step 1 Form */}
              {!checkinPreview ? (
                <form onSubmit={handleFetchCheckinPreview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.circulation.copyBarcode} *
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. BC-1002"
                        value={copyBarcodeIn}
                        onChange={(e) => setCopyBarcodeIn(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkinLoading}
                    className="w-full py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                  >
                    {checkinLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{checkinLoading ? 'Loading Preview...' : 'Preview Check-In Return'}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: PREVIEW CARD BEFORE CONFIRMING CHECKIN */
                <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-emerald-800" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Check-In Return Confirmation Preview
                      </h3>
                    </div>
                    <button
                      onClick={() => setCheckinPreview(null)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Item & Book Box */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Returning Item
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {checkinPreview.copy.bookTitle}
                      </p>
                      <p className="text-slate-500">by {checkinPreview.copy.author}</p>
                      <p className="text-slate-500 font-mono">
                        Barcode: {checkinPreview.copy.barcode} • Call: {checkinPreview.copy.callNumber}
                      </p>
                    </div>

                    {/* Patron & Loan Box */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Borrower & Loan Status
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {checkinPreview.patron.name}
                      </p>
                      <p className="text-slate-500 font-mono">
                        Barcode: {checkinPreview.patron.barcode}
                      </p>
                      <p className="text-slate-600">
                        Due Date: <span className="font-mono font-semibold text-slate-800">{new Date(checkinPreview.loan.dueDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Fine & Overdue Warning Box */}
                  {checkinPreview.finePreview > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between text-xs text-rose-800">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span className="font-semibold">
                          Overdue ({checkinPreview.overdueDays} Days Late)
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-rose-700">
                        Calculated Fine: {checkinPreview.finePreview.toLocaleString('en-US')} MMK
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span className="font-semibold">Item returned on time (No fine)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">0 MMK Fine</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setCheckinPreview(null)}
                      className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
                    >
                      Cancel / Edit Barcode
                    </button>

                    <button
                      onClick={handleConfirmCheckin}
                      disabled={checkinLoading}
                      className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      {checkinLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{checkinLoading ? 'Processing...' : 'Confirm Return & Update Status'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
