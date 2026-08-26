'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  barcode?: string;
  phone?: string;
}

interface ActiveLoan {
  id: string;
  memberName: string;
  memberBarcode: string;
  memberEmail: string;
  memberPhone?: string;
  bookTitle: string;
  copyBarcode: string;
  issuedDate: string;
  dueDate: string;
  isOverdue: boolean;
  fineAmount: number;
}

export default function PatronDashboardPage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeLoansList, setActiveLoansList] = useState<ActiveLoan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  // Load all active loans for Admin/Staff master view
  const fetchMasterActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patrons');
      const data = await res.json();
      if (data.success) {
        const loans: ActiveLoan[] = [];
        for (const member of data.patrons) {
          if (member.loans && member.loans.length > 0) {
            for (const loan of member.loans) {
              loans.push({
                id: loan.id,
                memberName: member.name,
                memberBarcode: member.barcode,
                memberEmail: member.email,
                memberPhone: member.phone,
                bookTitle: loan.copy?.book?.title || 'The C Programming Language',
                copyBarcode: loan.copy?.barcode || 'BC-1002',
                issuedDate: loan.issuedDate || new Date().toISOString(),
                dueDate: loan.dueDate || new Date().toISOString(),
                isOverdue: new Date() > new Date(loan.dueDate),
                fineAmount: 4500,
              });
            }
          }
        }
        // If empty, supply demo active loans for visual preview
        if (loans.length === 0) {
          loans.push({
            id: 'loan-101',
            memberName: 'Alex Rivera',
            memberBarcode: 'PAT-88401',
            memberEmail: 'alex.rivera@student.edu',
            memberPhone: '09-971234567',
            bookTitle: 'The C Programming Language',
            copyBarcode: 'BC-1002',
            issuedDate: '2026-07-14',
            dueDate: '2026-07-28',
            isOverdue: true,
            fineAmount: 4500,
          });
        }
        setActiveLoansList(loans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStaffOrAdmin) {
      fetchMasterActiveLoans();
    } else {
      setLoading(false);
    }
  }, [isStaffOrAdmin]);

  const filteredMasterLoans = activeLoansList.filter(
    (loan) =>
      loan.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.memberBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.copyBarcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* VIEW 1: STAFF / ADMIN MASTER MEMBER RENTAL REGISTRY VIEW                  */}
        {/* ========================================================================= */}
        {isStaffOrAdmin ? (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-900 text-xs font-bold mb-2">
                  <ShieldCheck className="w-4 h-4 text-green-800" />
                  <span>Admin / Staff Master Circulation Registry</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  All Active Renting Members & Loan Details
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Master registry of library members currently holding physical copies, due dates, and fine balances.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-500 font-bold block">Active Rented Copies</span>
                  <span className="text-xl font-extrabold text-green-950 font-mono">
                    {activeLoansList.length}
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-rose-700 font-bold block">Overdue Items</span>
                  <span className="text-xl font-extrabold text-rose-700 font-mono">
                    {activeLoansList.filter((l) => l.isOverdue).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Renting Member Name, Member Barcode, Book Title, or Copy Barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                />
              </div>
            </div>

            {/* Active Renting Members Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-900" />
                  <span>Renting Members List & Copy Details</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Showing {filteredMasterLoans.length} entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Renting Member Details</th>
                      <th className="px-6 py-3">Rented Book & Copy Barcode</th>
                      <th className="px-6 py-3">Issue Date</th>
                      <th className="px-6 py-3">Due Date & Status</th>
                      <th className="px-6 py-3 text-right">Fine Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-green-900" />
                          <span>Loading active member rentals...</span>
                        </td>
                      </tr>
                    ) : filteredMasterLoans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No active member rentals match search.
                        </td>
                      </tr>
                    ) : (
                      filteredMasterLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs block">
                                {loan.memberName}
                              </span>
                              <span className="text-[11px] text-green-900 font-mono font-bold flex items-center gap-1 mt-0.5">
                                <Barcode className="w-3 h-3 text-green-700" />
                                <span>{loan.memberBarcode}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {loan.memberEmail}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                {loan.bookTitle}
                              </span>
                              <span className="text-[11px] text-slate-600 font-mono mt-0.5 block">
                                Copy Barcode: <span className="font-bold text-slate-900">{loan.copyBarcode}</span>
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs text-slate-600">
                            {new Date(loan.issuedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="px-6 py-4">
                            {loan.isOverdue ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-200 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>OVERDUE</span>
                                </span>
                                <span className="text-[11px] text-rose-600 font-mono font-bold block">
                                  Was due:{' '}
                                  {new Date(loan.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                  ACTIVE LOAN
                                </span>
                                <span className="text-[11px] text-slate-600 font-mono block">
                                  Due:{' '}
                                  {new Date(loan.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right font-mono font-extrabold text-xs">
                            {loan.isOverdue ? (
                              <span className="text-rose-600 font-black text-sm">
                                {loan.fineAmount.toLocaleString()} MMK
                              </span>
                            ) : (
                              <span className="text-slate-400">0 MMK</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: SINGLE MEMBER PERSONAL DASHBOARD VIEW                             */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Member Profile Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-green-900 flex items-center justify-center font-black text-xl text-white shadow-sm uppercase">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'M'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-extrabold text-slate-900">
                      {currentUser?.name || 'Alex Rivera'}
                    </h1>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-900 border border-green-200">
                      Student Member
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Barcode: <span className="font-mono text-slate-800 font-semibold">{currentUser?.barcode || 'PAT-88401'}</span> • Email: {currentUser?.email || 'alex.rivera@student.edu'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-semibold">{t.patron.fineBalance}</span>
                  <span className="font-mono font-black text-rose-600 text-lg">4,500 MMK</span>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded border border-rose-200">
                  1 {t.patron.overdueItem}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Active Loans Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-900" />
                    <span>{t.patron.activeLoans} (1)</span>
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            OVERDUE
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">The C Programming Language</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Barcode: BC-1002 • Call: QA76.73.C15 K47 c.2</p>
                        <div className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{t.patron.wasDue} (Fine: 4,500 MMK)</span>
                        </div>
                      </div>

                      <button className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm">
                        {t.patron.payFine}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reading History */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-green-900" />
                    <span>{t.patron.borrowingHistory}</span>
                  </h2>

                  <div className="space-y-3">
                    {[
                      { title: 'Introduction to Algorithms', returnedDate: '2026-07-15', status: t.patron.returnedOnTime },
                      { title: 'Domain-Driven Design', returnedDate: '2026-06-20', status: t.patron.returnedOnTime },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{item.title}</span>
                          <span className="text-slate-500">Returned: {item.returnedDate}</span>
                        </div>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: Fine Ledger */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>{t.patron.fineBalance}</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">Overdue Loan Fine</span>
                        <span className="text-slate-500">The C Programming Language</span>
                      </div>
                      <span className="font-mono font-black text-rose-600">4,500 MMK</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-green-900" />
                    <span>{t.patron.savedLists}</span>
                  </h3>

                  <p className="text-xs text-slate-500">
                    {t.patron.noSavedLists}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
