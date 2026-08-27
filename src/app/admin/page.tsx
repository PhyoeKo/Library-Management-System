'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import {
  Shield,
  BookOpen,
  Repeat,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  BookMarked,
  BarChart3,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function AdminDashboardPage() {
  const { t } = useLanguage();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-green-900" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t.admin.title}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {t.admin.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Link
              href="/admin/catalog"
              className="bg-white border border-slate-200 hover:border-green-900 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-900 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{t.admin.catalogingItems}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.admin.catalogingDesc}</p>
            </Link>

            <Link
              href="/admin/circulation"
              className="bg-white border border-slate-200 hover:border-cyan-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{t.admin.circulationDesk}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.admin.circulationDesc}</p>
            </Link>

            <Link
              href="/admin/holds"
              className="bg-white border border-slate-200 hover:border-violet-600 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BookMarked className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{(t.admin as any).holdsQueue || 'Holds & Reservations'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{(t.admin as any).holdsDesc || 'Manage patron reservation requests'}</p>
            </Link>

            <Link
              href="/admin/acquisitions"
              className="bg-white border border-slate-200 hover:border-amber-600 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{(t.admin as any).acquisitionsTitle || 'Acquisitions & Vendors'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{(t.admin as any).acquisitionsDesc || 'Purchase orders, booksellers & ERM'}</p>
            </Link>

            <Link
              href="/admin/library-services"
              className="bg-white border border-slate-200 hover:border-teal-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{(t.admin as any).libraryServicesTitle || 'Serials & ILL Services'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{(t.admin as any).libraryServicesDesc || 'Periodicals, ILL & course reserves'}</p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-white border border-slate-200 hover:border-indigo-600 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{(t.admin as any).reportsAnalytics || 'Reports & Analytics'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{(t.admin as any).reportsDesc || 'Live KPIs, trends & overdue alerts'}</p>
            </Link>

            <Link
              href="/admin/fines"
              className="bg-white border border-slate-200 hover:border-emerald-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{t.admin.fineMatrix}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.admin.fineDesc}</p>
            </Link>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {t.admin.titlesCount}
                </span>
                <BookOpen className="w-5 h-5 text-green-900" />
              </div>
              <div className="text-3xl font-black text-slate-900">3 Records</div>
              <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> 100% catalog health score
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {t.admin.activeLoans}
                </span>
                <Repeat className="w-5 h-5 text-cyan-800" />
              </div>
              <div className="text-3xl font-black text-slate-900">1 On Loan</div>
              <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> 1 Overdue item needing notice
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {t.admin.registeredPatrons}
                </span>
                <Users className="w-5 h-5 text-emerald-800" />
              </div>
              <div className="text-3xl font-black text-slate-900">2 Active</div>
              <p className="text-xs text-slate-500 mt-2 font-semibold">
                Student & Faculty categories configured
              </p>
            </div>
          </div>

          {/* System Activity Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-900" />
              <span>{t.admin.recentLogs}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Loan Status set to OVERDUE
                    </span>
                    <span className="text-slate-600">
                      Item BC-1002 (The C Programming Language) for Alex Rivera (PAT-88401)
                    </span>
                  </div>
                </div>
                <span className="font-mono text-rose-700 font-extrabold">4,500 MMK Fine Assessed</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
