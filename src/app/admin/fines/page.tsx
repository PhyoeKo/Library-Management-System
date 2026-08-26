'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  CreditCard,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface FinePayment {
  id: string;
  amountPaid: number;
  paymentMethod: string;
  receiptNumber: string;
  createdAt: string;
}

interface Fine {
  id: string;
  amount: number;
  paidAmount: number;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    barcode: string;
    email: string;
  };
  loan?: {
    dueDate: string;
    copy: {
      barcode: string;
      book: { title: string };
    };
  };
  payments: FinePayment[];
}

export default function FinesPOSPage() {
  const { t } = useLanguage();
  const [fines, setFines] = useState<Fine[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchPatron, setSearchPatron] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // POS Payment Modal State
  const [selectedFineForPOS, setSelectedFineForPOS] = useState<Fine | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('CASH');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fines');
      const data = await res.json();
      if (data.success) {
        setFines(data.fines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handleRunFineEngine = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/fines/calculate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(
          `Fine Engine Executed!\nOverdue Loans Processed: ${data.overdueLoansProcessed}\nNew Fines Created: ${data.newFinesCreated}`
        );
        fetchFines();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForPOS) return;

    setPaymentProcessing(true);
    try {
      const res = await fetch(`/api/fines/${selectedFineForPOS.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: paymentAmountInput,
          paymentMethod: paymentMethodInput,
          processedBy: 'STAFF-OFFICER',
        }),
      });
      const data = await res.json();
      if (data.success && data.receipt) {
        setGeneratedReceipt(data.receipt);
        fetchFines();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleWaiveFine = async (fineId: string) => {
    if (!confirm('Are you sure you want to waive this fine?')) return;
    try {
      const res = await fetch(`/api/fines/${fineId}/waive`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchFines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalUnpaid = fines
    .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
    .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

  const totalCollected = fines.reduce((sum, f) => sum + f.paidAmount, 0);

  const filteredFines = fines.filter((fine) => {
    const matchesStatus = filterStatus === 'ALL' || fine.status === filterStatus;
    const matchesPatron =
      fine.user.name.toLowerCase().includes(searchPatron.toLowerCase()) ||
      fine.user.barcode.toLowerCase().includes(searchPatron.toLowerCase());
    return matchesStatus && matchesPatron;
  });

  const formatMMK = (val: number) => {
    return `${val.toLocaleString('en-US')} MMK`;
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-green-900" />
                <span>{t.fines.title}</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {t.fines.subtitle}
              </p>
            </div>

            <button
              onClick={handleRunFineEngine}
              disabled={calculating}
              className="flex items-center justify-center space-x-1.5 bg-green-900 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg font-bold text-xs transition shadow-sm"
            >
              {calculating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Calculator className="w-3.5 h-3.5" />
              )}
              <span>{t.fines.runEngine}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t.fines.outstandingBalance}</p>
                <h3 className="text-2xl font-black text-rose-600 mt-0.5">{formatMMK(totalUnpaid)}</h3>
              </div>
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t.fines.revenueCollected}</p>
                <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{formatMMK(totalCollected)}</h3>
              </div>
              <span className="text-emerald-700 font-black text-xl">MMK</span>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-col sm:flex-row gap-3 justify-between shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Patron Name or Barcode..."
                value={searchPatron}
                onChange={(e) => setSearchPatron(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
              />
            </div>

            <div className="flex items-center space-x-1 text-xs">
              {['ALL', 'UNPAID', 'PAID', 'WAIVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold transition ${
                    filterStatus === st
                      ? 'bg-green-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Patron</th>
                    <th className="px-4 py-3">Book Title / Barcode</th>
                    <th className="px-4 py-3">Total Fine</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">POS Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Loading fines...
                      </td>
                    </tr>
                  ) : filteredFines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No fines recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredFines.map((fine) => {
                      const balance = fine.amount - fine.paidAmount;
                      return (
                        <tr key={fine.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{fine.user.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{fine.user.barcode}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-slate-800 font-medium block truncate max-w-[200px]">
                              {fine.loan?.copy.book.title || 'Overdue Item'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-medium">{formatMMK(fine.amount)}</td>

                          <td className="px-4 py-3 font-mono font-black text-rose-600">
                            {formatMMK(balance)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                                fine.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : fine.status === 'UNPAID'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {fine.status === 'PAID' ? t.fines.paid : fine.status === 'UNPAID' ? t.fines.unpaid : fine.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {balance > 0 && fine.status !== 'WAIVED' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedFineForPOS(fine);
                                      setPaymentAmountInput(balance.toString());
                                      setGeneratedReceipt(null);
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm transition"
                                  >
                                    <span>{t.fines.collectPayment}</span>
                                  </button>
                                  <button
                                    onClick={() => handleWaiveFine(fine.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                                  >
                                    {t.fines.waive}
                                  </button>
                                </>
                              )}
                              {fine.status === 'PAID' && (
                                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> {t.fines.paid}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* POS Payment Modal */}
          {selectedFineForPOS && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl">
                {!generatedReceipt ? (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>{t.fines.collectPayment}</span>
                      </h3>
                      <button
                        onClick={() => setSelectedFineForPOS(null)}
                        className="text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Amount to Collect (MMK)</label>
                        <input
                          type="number"
                          step="100"
                          value={paymentAmountInput}
                          onChange={(e) => setPaymentAmountInput(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2.5 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedFineForPOS(null)}
                          className="px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={paymentProcessing}
                          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-sm"
                        >
                          {paymentProcessing ? 'Processing...' : t.fines.collectPayment}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-slate-900 bg-slate-50 p-5 rounded-lg border border-slate-200 font-mono text-xs">
                    <div className="text-center pb-3 border-b border-dashed border-slate-300 mb-3">
                      <h3 className="font-bold text-sm">RECEIPT #{generatedReceipt.receiptNumber}</h3>
                      <p className="text-[10px] text-slate-600">{generatedReceipt.patronName}</p>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800 py-2">
                      <span>Paid Amount:</span>
                      <span>{formatMMK(generatedReceipt.amountPaidThisTransaction)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFineForPOS(null);
                        setGeneratedReceipt(null);
                      }}
                      className="w-full mt-4 py-2.5 bg-green-950 hover:bg-green-900 text-white rounded-lg text-xs font-sans font-bold shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
