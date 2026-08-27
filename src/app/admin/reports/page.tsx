'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  BarChart3,
  BookOpen,
  Users,
  Repeat,
  CreditCard,
  BookMarked,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Layers,
  DollarSign,
  Target,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportData {
  generatedAt: string;
  catalog: {
    totalBooks: number;
    totalCopies: number;
    totalEResources: number;
    availableCopies: number;
    onLoanCopies: number;
    maintenanceCopies: number;
    lostCopies: number;
    utilizationRate: number;
  };
  patrons: {
    totalPatrons: number;
    blockedPatrons: number;
    activePatrons: number;
  };
  circulation: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    returnedLoans: number;
    loansLast30Days: number;
    loansLast7Days: number;
    returnRate: number;
    overdueRate: number;
  };
  fines: {
    totalFineAmount: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    unpaidFines: number;
    paidFines: number;
    waivedFines: number;
    finesByReason: { reason: string; count: number; total: number }[];
  };
  holds: {
    totalHolds: number;
    pendingHolds: number;
    fulfilledHolds: number;
  };
  charts: {
    loanTrend: { date: string; count: number }[];
    topBooks: { title: string; author: string; loanCount: number }[];
    genreDistribution: { genre: string; count: number }[];
  };
  overdueItems: {
    patronName: string;
    patronBarcode: string;
    bookTitle: string;
    copyBarcode: string;
    dueDate: string;
    daysOverdue: number;
    pendingFine: number;
  }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString();
const fmtMMK = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v) || v === 0) return '0 MMK';
  return v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M MMK`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}K MMK`
    : `${Math.round(v)} MMK`;
};


// Simple SVG bar chart (pure, no library needed)
function MiniBarChart({
  data,
  color = '#6d28d9',
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 480;
  const H = 80;
  const barW = Math.floor((W - data.length * 4) / data.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * (H - 4));
        const x = i * (barW + 4);
        const y = H - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={color}
              opacity={d.value === 0 ? 0.15 : 0.85}
            />
            {d.value > 0 && (
              <title>
                {d.label}: {d.value}
              </title>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Horizontal bar (for top books / genre)
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Radial progress ring
function RingChart({
  value,
  max,
  color,
  label,
  size = 80,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
          {pct}%
        </text>
      </svg>
      <p className="text-[11px] text-slate-500 font-semibold text-center leading-tight">{label}</p>
    </div>
  );
}

// KPI card
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex gap-4 items-start">
      <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{fmt(Number(value))}</p>
        {sub && (
          <p
            className={`text-xs mt-1 font-semibold flex items-center gap-1 ${
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2.5 mb-4`}>
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/summary');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setLastRefreshed(new Date());
      } else {
        setError(json.error || 'Failed to load report data.');
      }
    } catch {
      setError('Network error — could not reach the report server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export as JSON
  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dlac-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loanTrendChartData =
    data?.charts.loanTrend.map((d) => ({
      label: d.date.slice(5), // MM-DD
      value: d.count,
    })) ?? [];

  const genreChartData =
    data?.charts.genreDistribution.map((g) => ({
      label: g.genre,
      value: g.count,
    })) ?? [];

  const maxGenre = Math.max(...(data?.charts.genreDistribution.map((g) => g.count) ?? [1]));
  const maxBook = Math.max(...(data?.charts.topBooks.map((b) => b.loanCount) ?? [1]));

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Page Header ── */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Reporting & Analytics
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Live performance dashboard — catalog, circulation, fines, and patron metrics.
                  {lastRefreshed && (
                    <span className="ml-2 text-slate-400">
                      Last updated:{' '}
                      {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={!data}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
              <p className="text-slate-400 font-semibold text-sm">Aggregating library data…</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Could not load report</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* ── Dashboard ── */}
          {!loading && data && (
            <div className="space-y-8">

              {/* ═══════════════════════════════════════════════════════
                  ROW 1 — Top KPI ribbon
              ═══════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard icon={BookOpen} label="Total Titles" value={data.catalog.totalBooks} sub={`${data.catalog.totalCopies} physical copies`} iconBg="bg-green-100" iconColor="text-green-700" />
                <KpiCard icon={Layers} label="E-Resources" value={data.catalog.totalEResources} sub="Digital / PDF / EPUB" iconBg="bg-teal-100" iconColor="text-teal-700" />
                <KpiCard icon={Users} label="Active Members" value={data.patrons.activePatrons} sub={`${data.patrons.blockedPatrons} suspended`} iconBg="bg-blue-100" iconColor="text-blue-700" />
                <KpiCard icon={Repeat} label="Total Loans" value={data.circulation.totalLoans} sub={`${data.circulation.loansLast7Days} this week`} trend="up" iconBg="bg-cyan-100" iconColor="text-cyan-700" />
                <KpiCard icon={BookMarked} label="Pending Holds" value={data.holds.pendingHolds} sub={`${data.holds.totalHolds} total requests`} iconBg="bg-violet-100" iconColor="text-violet-700" />
                <KpiCard icon={DollarSign} label="Outstanding Fines" value={fmtMMK(data.fines.totalOutstanding)} sub={`${fmtMMK(data.fines.totalCollected)} collected`} trend={data.fines.totalOutstanding > 0 ? 'down' : 'neutral'} iconBg="bg-amber-100" iconColor="text-amber-700" />
              </div>

              {/* ═══════════════════════════════════════════════════════
                  ROW 2 — Loan Trend chart + Performance Rings
              ═══════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Loan Trend (14 days) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={Activity} title="Loan Activity — Last 14 Days" color="bg-cyan-100 text-cyan-700" />
                  <div className="h-24 mt-2">
                    <MiniBarChart data={loanTrendChartData} color="#0891b2" />
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-mono">
                    {loanTrendChartData
                      .filter((_, i) => i % 2 === 0)
                      .map((d) => (
                        <span key={d.label}>{d.label}</span>
                      ))}
                  </div>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">Last 7 days</span>
                      <p className="text-xl font-black text-slate-900">{data.circulation.loansLast7Days}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Last 30 days</span>
                      <p className="text-xl font-black text-slate-900">{data.circulation.loansLast30Days}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">All time</span>
                      <p className="text-xl font-black text-slate-900">{data.circulation.totalLoans}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Rings */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={Target} title="Key Rates" color="bg-indigo-100 text-indigo-700" />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <RingChart
                      value={data.catalog.utilizationRate}
                      max={100}
                      color="#0891b2"
                      label="Collection Utilization"
                    />
                    <RingChart
                      value={data.circulation.returnRate}
                      max={100}
                      color="#16a34a"
                      label="Return Rate"
                    />
                    <RingChart
                      value={data.fines.collectionRate}
                      max={100}
                      color="#d97706"
                      label="Fine Collection Rate"
                    />
                    <RingChart
                      value={data.circulation.overdueRate}
                      max={100}
                      color="#dc2626"
                      label="Overdue Rate"
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════
                  ROW 3 — Catalog breakdown + Fines breakdown
              ═══════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Copy Status Breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={BookOpen} title="Collection Status" color="bg-green-100 text-green-700" />
                  <div className="space-y-3">
                    {[
                      { label: 'Available', value: data.catalog.availableCopies, color: 'bg-green-500', text: 'text-green-700' },
                      { label: 'On Loan', value: data.catalog.onLoanCopies, color: 'bg-cyan-500', text: 'text-cyan-700' },
                      { label: 'Maintenance', value: data.catalog.maintenanceCopies, color: 'bg-amber-500', text: 'text-amber-700' },
                      { label: 'Lost', value: data.catalog.lostCopies, color: 'bg-rose-500', text: 'text-rose-700' },
                    ].map(({ label, value, color, text }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                        <span className="text-xs text-slate-600 w-24 flex-shrink-0">{label}</span>
                        <HBar value={value} max={data.catalog.totalCopies} color={color} />
                        <span className={`text-xs font-black w-6 text-right ${text}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                    <span>Total Copies</span>
                    <span className="font-black text-slate-900">{data.catalog.totalCopies}</span>
                  </div>
                </div>

                {/* Fine Status Breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={CreditCard} title="Fine Ledger Breakdown" color="bg-amber-100 text-amber-700" />
                  <div className="space-y-3">
                    {[
                      { label: 'Unpaid', value: data.fines.unpaidFines, color: 'bg-rose-500', text: 'text-rose-600' },
                      { label: 'Paid', value: data.fines.paidFines, color: 'bg-green-500', text: 'text-green-700' },
                      { label: 'Waived', value: data.fines.waivedFines, color: 'bg-slate-400', text: 'text-slate-500' },
                    ].map(({ label, value, color, text }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                        <span className="text-xs text-slate-600 w-24 flex-shrink-0">{label}</span>
                        <HBar
                          value={value}
                          max={data.fines.unpaidFines + data.fines.paidFines + data.fines.waivedFines}
                          color={color}
                        />
                        <span className={`text-xs font-black w-6 text-right ${text}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                    {data.fines.finesByReason.map((r) => (
                      <div key={r.reason} className="flex justify-between text-slate-600">
                        <span className="capitalize">{r.reason.toLowerCase().replace('_', ' ')}</span>
                        <span className="font-bold text-slate-900">{fmtMMK(r.total)} ({r.count})</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total Outstanding</span>
                      <span className="text-rose-600">{fmtMMK(data.fines.totalOutstanding)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-slate-900">
                      <span>Total Collected</span>
                      <span className="text-green-700">{fmtMMK(data.fines.totalCollected)}</span>
                    </div>
                  </div>
                </div>

                {/* Circulation Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={Repeat} title="Circulation Status" color="bg-cyan-100 text-cyan-700" />
                  <div className="space-y-3">
                    {[
                      { label: 'Active Loans', value: data.circulation.activeLoans, color: 'bg-blue-500', icon: Clock, text: 'text-blue-700' },
                      { label: 'Overdue', value: data.circulation.overdueLoans, color: 'bg-rose-500', icon: AlertTriangle, text: 'text-rose-600' },
                      { label: 'Returned', value: data.circulation.returnedLoans, color: 'bg-green-500', icon: CheckCircle, text: 'text-green-700' },
                    ].map(({ label, value, color, icon: Icon2, text }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon2 className={`w-4 h-4 flex-shrink-0 ${text}`} />
                        <span className="text-xs text-slate-600 w-24 flex-shrink-0">{label}</span>
                        <HBar value={value} max={data.circulation.totalLoans} color={color} />
                        <span className={`text-xs font-black w-8 text-right ${text}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Loans All Time</span>
                      <span className="font-black text-slate-900">{data.circulation.totalLoans}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pending Holds</span>
                      <span className="font-black text-violet-700">{data.holds.pendingHolds}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Holds Fulfilled</span>
                      <span className="font-black text-green-700">{data.holds.fulfilledHolds}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════
                  ROW 4 — Top Books + Genre Distribution
              ═══════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top 5 Most Borrowed */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={TrendingUp} title="Top 5 Most Borrowed Titles" color="bg-violet-100 text-violet-700" />
                  {data.charts.topBooks.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No loan data available yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.charts.topBooks.map((book, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{book.title}</p>
                            <p className="text-xs text-slate-400 truncate">{book.author}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <HBar value={book.loanCount} max={maxBook} color="bg-violet-500" />
                              <span className="text-xs font-black text-violet-700 flex-shrink-0">
                                {book.loanCount} loan{book.loanCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Genre Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={BookOpen} title="Collection by Genre" color="bg-green-100 text-green-700" />
                  {genreChartData.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No genre data available.</p>
                  ) : (
                    <>
                      <div className="h-20 mb-4">
                        <MiniBarChart data={genreChartData} color="#16a34a" />
                      </div>
                      <div className="space-y-2.5">
                        {data.charts.genreDistribution.map((g, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 w-36 flex-shrink-0 truncate">{g.genre}</span>
                            <HBar value={g.count} max={maxGenre} color="bg-green-500" />
                            <span className="text-xs font-black text-green-700 w-6 text-right flex-shrink-0">
                              {g.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════
                  ROW 5 — Overdue Alert Table
              ═══════════════════════════════════════════════════════ */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <SectionHeader icon={AlertTriangle} title="Overdue Items Requiring Attention" color="bg-rose-100 text-rose-600" />
                {data.overdueItems.length === 0 ? (
                  <div className="flex items-center gap-3 py-6 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm">No overdue items — great library health!</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Patron', 'Barcode', 'Book Title', 'Copy', 'Due Date', 'Days Overdue', 'Pending Fine'].map((h) => (
                            <th key={h} className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pb-2 px-2">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.overdueItems.map((item, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                            <td className="py-2.5 px-2 font-semibold text-slate-800">{item.patronName}</td>
                            <td className="py-2.5 px-2 font-mono text-violet-700">{item.patronBarcode}</td>
                            <td className="py-2.5 px-2 text-slate-700 max-w-[180px] truncate">{item.bookTitle}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-500">{item.copyBarcode}</td>
                            <td className="py-2.5 px-2 text-slate-500">
                              {new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.daysOverdue > 14
                                  ? 'bg-rose-100 text-rose-700'
                                  : item.daysOverdue > 7
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {item.daysOverdue}d
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-black text-rose-600">
                              {item.pendingFine > 0 ? fmtMMK(item.pendingFine) : <span className="text-slate-400 font-normal">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-slate-400 pb-4">
                Report generated at{' '}
                {new Date(data.generatedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {' '}· DLAC Library Management System
              </p>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
