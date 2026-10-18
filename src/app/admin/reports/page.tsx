'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Calendar,
  Filter,
  FileSpreadsheet,
  Search,
  Crown,
  FileText,
  ChevronDown,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DetailedLoan {
  id: string;
  bookTitle: string;
  author: string;
  isbn: string;
  copyBarcode: string;
  patronName: string;
  patronBarcode: string;
  patronEmail: string;
  patronPhone: string;
  isVip: boolean;
  issuedDate: string;
  dueDate: string;
  returnedDate: string | null;
  status: string;
  renewCount: number;
}

interface DetailedFine {
  id: string;
  patronName: string;
  patronBarcode: string;
  patronPhone: string;
  isVip: boolean;
  bookTitle: string;
  amount: number;
  paidAmount: number;
  balance: number;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DetailedBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publisher: string;
  totalCopies: number;
  availableCopies: number;
  onLoanCopies: number;
  maxRentDays: number;
  dailyFineRate: number;
}

interface DetailedPatron {
  id: string;
  name: string;
  email: string;
  barcode: string;
  phone: string;
  isVip: boolean;
  isBlocked: boolean;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  outstandingFine: number;
  createdAt: string;
}

interface OverdueItem {
  id: string;
  patronName: string;
  patronBarcode: string;
  patronPhone: string;
  patronIsVip: boolean;
  bookTitle: string;
  copyBarcode: string;
  dueDate: string;
  daysOverdue: number;
  pendingFine: number;
}

interface ReportData {
  generatedAt: string;
  filter: {
    preset: string;
    startDate: string;
    endDate: string;
    diffDays: number;
  };
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
    vipPatrons: number;
  };
  circulation: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    returnedLoans: number;
    loansLast30Days: number;
    loansLast7Days: number;
    periodLoanCount: number;
    periodActiveLoans: number;
    periodOverdueLoans: number;
    periodReturnedLoans: number;
    returnRate: number;
    overdueRate: number;
  };
  fines: {
    totalFineAmount: number;
    totalCollected: number;
    totalOutstanding: number;
    periodFineAmount: number;
    periodCollected: number;
    periodOutstanding: number;
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
    topBooks: { title: string; author: string; loanCount: number; genre?: string }[];
    genreDistribution: { genre: string; count: number }[];
  };
  overdueItems: OverdueItem[];
  detailedLoans: DetailedLoan[];
  detailedFines: DetailedFine[];
  detailedBooks: DetailedBook[];
  detailedPatrons: DetailedPatron[];
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
    : `${Math.round(v).toLocaleString()} MMK`;
};

// UTF-8 BOM CSV generator
function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const escapeCell = (cell: any) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Simple SVG bar chart
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
  const barW = Math.max(4, Math.floor((W - data.length * 4) / (data.length || 1)));

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

// Horizontal bar
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

// KPI card with NaN bug fixed
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
  const displayVal = typeof value === 'number' ? fmt(value) : value;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex gap-4 items-start">
      <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{displayVal}</p>
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
function SectionHeader({
  icon: Icon,
  title,
  color,
  badge,
  action,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {badge}
            </span>
          )}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'circulation' | 'fines' | 'inventory' | 'patrons' | 'overdue'
  >('overview');

  // Date filters
  const [preset, setPreset] = useState<string>('14d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Search queries for tables
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('ALL');
  const [fineSearch, setFineSearch] = useState('');
  const [fineStatusFilter, setFineStatusFilter] = useState('ALL');
  const [bookSearch, setBookSearch] = useState('');
  const [patronSearch, setPatronSearch] = useState('');

  // Fetch report data
  const fetchReport = useCallback(
    async (selectedPreset = preset, start = customStart, end = customEnd) => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/reports/summary?preset=${selectedPreset}`;
        if (selectedPreset === 'custom' && start && end) {
          url += `&startDate=${start}&endDate=${end}`;
        }
        const res = await fetch(url);
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
    },
    [preset, customStart, customEnd]
  );

  useEffect(() => {
    fetchReport(preset, customStart, customEnd);
  }, []);

  const handleApplyPreset = (p: string) => {
    setPreset(p);
    fetchReport(p, customStart, customEnd);
  };

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    setPreset('custom');
    fetchReport('custom', customStart, customEnd);
  };

  // ── CSV Export Generators ───────────────────────────────────────────────────

  // 1. Executive Summary CSV
  const exportExecutiveSummaryCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = ['Category', 'Metric Indicator', 'Value', 'Unit / Note'];
    const rows = [
      ['Date Range', 'Preset Filter', data.filter.preset, 'Selected range'],
      ['Date Range', 'Start Date', data.filter.startDate, 'YYYY-MM-DD'],
      ['Date Range', 'End Date', data.filter.endDate, 'YYYY-MM-DD'],
      ['Catalog', 'Total Book Titles', data.catalog.totalBooks, 'Bibliographic records'],
      ['Catalog', 'Total Physical Copies', data.catalog.totalCopies, 'Barcoded items'],
      ['Catalog', 'Available Copies', data.catalog.availableCopies, 'On shelf ready to lend'],
      ['Catalog', 'On Loan Copies', data.catalog.onLoanCopies, 'Currently borrowed'],
      ['Catalog', 'Maintenance / Lost', data.catalog.maintenanceCopies + data.catalog.lostCopies, 'Unavailable copies'],
      ['Catalog', 'Collection Utilization Rate', `${data.catalog.utilizationRate}%`, 'On Loan / Total'],
      ['Catalog', 'Digital E-Resources', data.catalog.totalEResources, 'PDF / EPUB items'],
      ['Patrons', 'Total Registered Members', data.patrons.totalPatrons, 'All patron accounts'],
      ['Patrons', 'Active Members', data.patrons.activePatrons, 'Good standing'],
      ['Patrons', 'VIP Members', data.patrons.vipPatrons, '+7 days loan privilege'],
      ['Patrons', 'Suspended / Blocked', data.patrons.blockedPatrons, 'Overdue / restriction'],
      ['Circulation', 'Total Loans All Time', data.circulation.totalLoans, 'System lifetime'],
      ['Circulation', 'Loans in Period', data.circulation.periodLoanCount, 'Selected date range'],
      ['Circulation', 'Currently Active Loans', data.circulation.activeLoans, 'Checked out'],
      ['Circulation', 'Currently Overdue Loans', data.circulation.overdueLoans, 'Exceeded due date'],
      ['Circulation', 'Returned Loans', data.circulation.returnedLoans, 'Successfully returned'],
      ['Circulation', 'Return Rate', `${data.circulation.returnRate}%`, 'Returned / Total'],
      ['Circulation', 'Overdue Rate', `${data.circulation.overdueRate}%`, 'Overdue / Total'],
      ['Fines & Revenue', 'Total Fine Amount Incurred', data.fines.totalFineAmount, 'MMK'],
      ['Fines & Revenue', 'Total Collected Revenue', data.fines.totalCollected, 'MMK'],
      ['Fines & Revenue', 'Total Outstanding Balance', data.fines.totalOutstanding, 'MMK'],
      ['Fines & Revenue', 'Fine Collection Rate', `${data.fines.collectionRate}%`, 'Collected / Total Incurred'],
      ['Fines & Revenue', 'Unpaid Fines Count', data.fines.unpaidFines, 'Ledger items'],
      ['Fines & Revenue', 'Paid Fines Count', data.fines.paidFines, 'Settled items'],
      ['Holds', 'Total Hold Requests', data.holds.totalHolds, 'Reservations'],
      ['Holds', 'Pending Holds', data.holds.pendingHolds, 'Awaiting fulfillment'],
      ['Holds', 'Fulfilled Holds', data.holds.fulfilledHolds, 'Completed pickups'],
    ];
    downloadCsv(`lms_executive_summary_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 2. Circulation Loans CSV
  const exportCirculationCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Loan ID',
      'Patron Name',
      'Patron Barcode',
      'Patron VIP',
      'Patron Phone',
      'Book Title',
      'Author',
      'ISBN',
      'Copy Barcode',
      'Issued Date',
      'Due Date',
      'Returned Date',
      'Status',
      'Renew Count',
    ];
    const rows = data.detailedLoans.map((l) => [
      l.id,
      l.patronName,
      l.patronBarcode,
      l.isVip ? 'VIP' : 'Standard',
      l.patronPhone,
      l.bookTitle,
      l.author,
      l.isbn,
      l.copyBarcode,
      l.issuedDate.slice(0, 10),
      l.dueDate.slice(0, 10),
      l.returnedDate ? l.returnedDate.slice(0, 10) : '—',
      l.status,
      l.renewCount,
    ]);
    downloadCsv(`lms_circulation_loans_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 3. Fines Ledger CSV
  const exportFinesCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Fine ID',
      'Patron Name',
      'Patron Barcode',
      'Patron Phone',
      'VIP Member',
      'Book / Reason',
      'Fine Reason',
      'Amount (MMK)',
      'Paid Amount (MMK)',
      'Balance Outstanding (MMK)',
      'Status',
      'Incurred Date',
      'Last Updated',
    ];
    const rows = data.detailedFines.map((f) => [
      f.id,
      f.patronName,
      f.patronBarcode,
      f.patronPhone,
      f.isVip ? 'VIP' : 'Standard',
      f.bookTitle,
      f.reason,
      f.amount,
      f.paidAmount,
      f.balance,
      f.status,
      f.createdAt.slice(0, 10),
      f.updatedAt.slice(0, 10),
    ]);
    downloadCsv(`lms_fines_ledger_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 4. Catalog Inventory CSV
  const exportCatalogCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Book ID',
      'ISBN',
      'Title',
      'Author',
      'Genre',
      'Publisher',
      'Total Copies',
      'Available Copies',
      'On Loan Copies',
      'Max Rent Days',
      'Daily Fine Rate (MMK)',
    ];
    const rows = data.detailedBooks.map((b) => [
      b.id,
      b.isbn,
      b.title,
      b.author,
      b.genre,
      b.publisher,
      b.totalCopies,
      b.availableCopies,
      b.onLoanCopies,
      b.maxRentDays,
      b.dailyFineRate,
    ]);
    downloadCsv(`lms_catalog_inventory_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 5. Patrons Directory CSV
  const exportPatronsCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Patron ID',
      'Name',
      'Barcode',
      'VIP Member',
      'Email',
      'Phone',
      'Status',
      'Total Loans All Time',
      'Active Loans',
      'Overdue Loans',
      'Outstanding Fines (MMK)',
      'Member Since',
    ];
    const rows = data.detailedPatrons.map((p) => [
      p.id,
      p.name,
      p.barcode,
      p.isVip ? 'VIP' : 'Standard',
      p.email,
      p.phone,
      p.isBlocked ? 'SUSPENDED' : 'ACTIVE',
      p.totalLoans,
      p.activeLoans,
      p.overdueLoans,
      p.outstandingFine,
      p.createdAt.slice(0, 10),
    ]);
    downloadCsv(`lms_patrons_directory_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 6. Overdue Action List CSV
  const exportOverdueCsv = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Loan ID',
      'Patron Name',
      'Patron Barcode',
      'Phone Number',
      'VIP Member',
      'Book Title',
      'Copy Barcode',
      'Due Date',
      'Days Overdue',
      'Pending Fine (MMK)',
    ];
    const rows = data.overdueItems.map((item) => [
      item.id,
      item.patronName,
      item.patronBarcode,
      item.patronPhone,
      item.patronIsVip ? 'VIP' : 'Standard',
      item.bookTitle,
      item.copyBarcode,
      item.dueDate.slice(0, 10),
      item.daysOverdue,
      item.pendingFine,
    ]);
    downloadCsv(`lms_overdue_action_list_${dateStr}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  // 7. Download All CSVs (Bundle)
  const exportAllCsvs = () => {
    exportExecutiveSummaryCsv();
    setTimeout(() => exportCirculationCsv(), 400);
    setTimeout(() => exportFinesCsv(), 800);
    setTimeout(() => exportCatalogCsv(), 1200);
    setTimeout(() => exportPatronsCsv(), 1600);
    setTimeout(() => exportOverdueCsv(), 2000);
    setShowExportMenu(false);
  };

  // Export JSON
  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms-analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Filtered lists for tables
  const filteredLoans = useMemo(() => {
    if (!data) return [];
    return data.detailedLoans.filter((l) => {
      const matchSearch =
        l.patronName.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.patronBarcode.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.bookTitle.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.copyBarcode.toLowerCase().includes(loanSearch.toLowerCase());
      const matchStatus = loanStatusFilter === 'ALL' || l.status === loanStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, loanSearch, loanStatusFilter]);

  const filteredFines = useMemo(() => {
    if (!data) return [];
    return data.detailedFines.filter((f) => {
      const matchSearch =
        f.patronName.toLowerCase().includes(fineSearch.toLowerCase()) ||
        f.patronBarcode.toLowerCase().includes(fineSearch.toLowerCase()) ||
        f.bookTitle.toLowerCase().includes(fineSearch.toLowerCase()) ||
        f.reason.toLowerCase().includes(fineSearch.toLowerCase());
      const matchStatus = fineStatusFilter === 'ALL' || f.status === fineStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, fineSearch, fineStatusFilter]);

  const filteredBooks = useMemo(() => {
    if (!data) return [];
    return data.detailedBooks.filter((b) => {
      return (
        b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.isbn.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.genre.toLowerCase().includes(bookSearch.toLowerCase())
      );
    });
  }, [data, bookSearch]);

  const filteredPatrons = useMemo(() => {
    if (!data) return [];
    return data.detailedPatrons.filter((p) => {
      return (
        p.name.toLowerCase().includes(patronSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(patronSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(patronSearch.toLowerCase()) ||
        p.phone.toLowerCase().includes(patronSearch.toLowerCase())
      );
    });
  }, [data, patronSearch]);

  // Chart data
  const loanTrendChartData =
    data?.charts.loanTrend.map((d) => ({
      label: d.date.length > 5 ? d.date.slice(5) : d.date,
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
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Page Header ── */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Reporting & Analytics
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  အစီရင်ခံစာနှင့် လုပ်ငန်းစွမ်းဆောင်ရည် သုံးသပ်ချက်များ — စာကြည့်တိုက် စာရင်းဇယားများနှင့် ငွေကြေးအနှစ်ချုပ်။
                  {lastRefreshed && (
                    <span className="ml-2 text-slate-400 font-medium">
                      (မွမ်းမံပြီး: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 relative">
              <button
                onClick={() => fetchReport(preset, customStart, customEnd)}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>ပြန်လည်စစ်ဆေးရန် (Refresh)</span>
              </button>

              {/* CSV & Data Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!data || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV ဒေါင်းလုဒ် (Export CSV)</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </button>

                {showExportMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setShowExportMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        CSV Report Export Suite
                      </p>
                      <p className="text-[11px] text-slate-400">Excel / Spreadsheet အသင့်ဒေါင်းလုဒ်</p>
                    </div>

                    <div className="space-y-1 mt-1 text-xs">
                      <button
                        onClick={exportExecutiveSummaryCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-800">Executive Summary (CSV)</p>
                          <p className="text-[10px] text-slate-400">KPIs & financial totals</p>
                        </div>
                      </button>

                      <button
                        onClick={exportCirculationCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Repeat className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="font-bold text-slate-800">Circulation Loans Log (CSV)</p>
                          <p className="text-[10px] text-slate-400">All loans with VIP & due dates</p>
                        </div>
                      </button>

                      <button
                        onClick={exportFinesCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="font-bold text-slate-800">Fines & Revenue Ledger (CSV)</p>
                          <p className="text-[10px] text-slate-400">Paid, unpaid & waived fines</p>
                        </div>
                      </button>

                      <button
                        onClick={exportCatalogCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-800">Book Catalog Inventory (CSV)</p>
                          <p className="text-[10px] text-slate-400">Copies, genres & rates</p>
                        </div>
                      </button>

                      <button
                        onClick={exportPatronsCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-bold text-slate-800">Patrons & VIP Directory (CSV)</p>
                          <p className="text-[10px] text-slate-400">Members with VIP & balances</p>
                        </div>
                      </button>

                      <button
                        onClick={exportOverdueCsv}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <div>
                          <p className="font-bold text-slate-800">Overdue Action List (CSV)</p>
                          <p className="text-[10px] text-slate-400">Items needing phone/call follow-up</p>
                        </div>
                      </button>

                      <div className="pt-1 mt-1 border-t border-slate-100 space-y-1">
                        <button
                          onClick={exportAllCsvs}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                        >
                          <Download className="w-4 h-4 text-emerald-700" />
                          <span>ဒေါင်းလုဒ်အားလုံးယူမည် (Download All CSVs)</span>
                        </button>
                        <button
                          onClick={handleExportJson}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left font-semibold text-slate-500 hover:bg-slate-100 transition text-[11px]"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Raw Data (JSON Export)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              DATE FILTER TOOLBAR
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  ရက်စွဲ စစ်ထုတ်ရန်:
                </span>
                {[
                  { id: '14d', label: '၁၄ ရက် (14 Days)' },
                  { id: '7d', label: '၇ ရက် (7 Days)' },
                  { id: '30d', label: '၃၀ ရက် (30 Days)' },
                  { id: 'month', label: 'ဒီလ (This Month)' },
                  { id: '90d', label: '၃ လ (90 Days)' },
                  { id: 'today', label: 'ယနေ့ (Today)' },
                  { id: 'all', label: 'မှတ်တမ်းအားလုံး (All Time)' },
                  { id: 'custom', label: 'ရက်စွဲရွေးမည် (Custom)' },
                ].map((p) => {
                  const isActive = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Date details badge */}
              {data?.filter && (
                <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 self-start lg:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    ကာလ: <strong className="text-slate-800">{data.filter.startDate}</strong> မှ{' '}
                    <strong className="text-slate-800">{data.filter.endDate}</strong> ({data.filter.diffDays} ရက်)
                  </span>
                </div>
              )}
            </div>

            {/* Custom Date Form (Visible when 'custom' is active) */}
            {preset === 'custom' && (
              <form
                onSubmit={handleApplyCustomDate}
                className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">မှ (From):</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">ထိ (To):</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  အချက်အလက်ပြောင်းရန် (Apply Range)
                </button>
              </form>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB NAVIGATION BAR
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 mb-6 overflow-x-auto pb-1 text-sm font-bold">
            {[
              { id: 'overview', label: 'အနှစ်ချုပ် (Overview)', icon: Activity },
              {
                id: 'circulation',
                label: `ငှားရမ်းမှုမှတ်တမ်း (Loans: ${data?.detailedLoans?.length ?? 0})`,
                icon: Repeat,
              },
              {
                id: 'fines',
                label: `ဒဏ်ကြေးစာရင်း (Fines: ${data?.detailedFines?.length ?? 0})`,
                icon: DollarSign,
              },
              {
                id: 'inventory',
                label: `စာအုပ်စာရင်း (Catalog: ${data?.catalog?.totalBooks ?? 0})`,
                icon: BookOpen,
              },
              {
                id: 'patrons',
                label: `အသင်းဝင်များ (Members: ${data?.patrons?.totalPatrons ?? 0})`,
                icon: Users,
              },
              {
                id: 'overdue',
                label: `ရက်ကျော်စာရင်း (Overdue: ${data?.overdueItems?.length ?? 0})`,
                icon: AlertTriangle,
                badge: data?.overdueItems?.length ? String(data.overdueItems.length) : undefined,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition whitespace-nowrap border-b-2 font-bold ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Loading State ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-28 bg-white border border-slate-200 rounded-2xl">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-3" />
              <p className="text-slate-500 font-bold text-sm">အချက်အလက်များ တွက်ချက်ရယူနေပါသည်…</p>
              <p className="text-slate-400 text-xs mt-1">Aggregating live library database metrics...</p>
            </div>
          )}

          {/* ── Error State ── */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">အချက်အလက်ဖော်ပြရာတွင် အမှားတစ်ခုရှိနေပါသည်</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              DASHBOARD BODY
          ═══════════════════════════════════════════════════════════════════ */}
          {!loading && data && (
            <div className="space-y-8">
              {/* ═══════════════════════════════════════════════════════════════
                  TAB 1: OVERVIEW
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <>
                  {/* Top KPI Ribbon (NaN-fixed) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KpiCard
                      icon={BookOpen}
                      label="Total Titles"
                      value={data.catalog.totalBooks}
                      sub={`${data.catalog.totalCopies} physical copies`}
                      iconBg="bg-green-100"
                      iconColor="text-green-700"
                    />
                    <KpiCard
                      icon={Layers}
                      label="E-Resources"
                      value={data.catalog.totalEResources}
                      sub="Digital / PDF / EPUB"
                      iconBg="bg-teal-100"
                      iconColor="text-teal-700"
                    />
                    <KpiCard
                      icon={Users}
                      label="Active Members"
                      value={data.patrons.activePatrons}
                      sub={`${data.patrons.vipPatrons} VIP members`}
                      iconBg="bg-blue-100"
                      iconColor="text-blue-700"
                    />
                    <KpiCard
                      icon={Repeat}
                      label="Period Loans"
                      value={data.circulation.periodLoanCount}
                      sub={`${data.circulation.totalLoans} all time`}
                      trend="up"
                      iconBg="bg-cyan-100"
                      iconColor="text-cyan-700"
                    />
                    <KpiCard
                      icon={BookMarked}
                      label="Pending Holds"
                      value={data.holds.pendingHolds}
                      sub={`${data.holds.totalHolds} total requests`}
                      iconBg="bg-violet-100"
                      iconColor="text-violet-700"
                    />
                    <KpiCard
                      icon={DollarSign}
                      label="Outstanding Fines"
                      value={fmtMMK(data.fines.totalOutstanding)}
                      sub={`${fmtMMK(data.fines.totalCollected)} collected`}
                      trend={data.fines.totalOutstanding > 0 ? 'down' : 'neutral'}
                      iconBg="bg-amber-100"
                      iconColor="text-amber-700"
                    />
                  </div>

                  {/* Row 2: Loan Trend Chart + Performance Rings */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Loan Activity Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={Activity}
                        title={`စာအုပ်ငှားရမ်းမှု ပြောင်းလဲချက် (Loan Activity Trend)`}
                        color="bg-cyan-100 text-cyan-700"
                        badge={`${data.filter.diffDays} Days`}
                      />
                      <div className="h-28 mt-2">
                        <MiniBarChart data={loanTrendChartData} color="#0891b2" />
                      </div>
                      <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-mono">
                        {loanTrendChartData
                          .filter((_, i) => i % Math.max(1, Math.floor(loanTrendChartData.length / 7)) === 0)
                          .map((d) => (
                            <span key={d.label}>{d.label}</span>
                          ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 font-semibold">ဤကာလအတွင်း (In Period)</span>
                          <p className="text-xl font-black text-cyan-700 mt-0.5">
                            {data.circulation.periodLoanCount}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 font-semibold">လွန်ခဲ့သော ၇ ရက် (Last 7 Days)</span>
                          <p className="text-xl font-black text-slate-900 mt-0.5">
                            {data.circulation.loansLast7Days}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 font-semibold">မှတ်တမ်းအားလုံး (All Time)</span>
                          <p className="text-xl font-black text-slate-900 mt-0.5">
                            {data.circulation.totalLoans}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Performance Rates */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={Target}
                        title="စွမ်းဆောင်ရည် နှုန်းထားများ (Key Rates)"
                        color="bg-indigo-100 text-indigo-700"
                      />
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <RingChart
                          value={data.catalog.utilizationRate}
                          max={100}
                          color="#0891b2"
                          label="စာအုပ်ငှားရမ်းမှုနှုန်း (Utilization)"
                        />
                        <RingChart
                          value={data.circulation.returnRate}
                          max={100}
                          color="#16a34a"
                          label="ပြန်အပ်မှုနှုန်း (Return Rate)"
                        />
                        <RingChart
                          value={data.fines.collectionRate}
                          max={100}
                          color="#d97706"
                          label="ဒဏ်ကြေးကောက်ခံနှုန်း (Collection)"
                        />
                        <RingChart
                          value={data.circulation.overdueRate}
                          max={100}
                          color="#dc2626"
                          label="ရက်ကျော်မှုနှုန်း (Overdue Rate)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Collection Status + Fine Ledger Breakdown + Circulation Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Collection Status */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={BookOpen}
                        title="စာအုပ်မိတ္တူ အခြေအနေ (Collection Status)"
                        color="bg-green-100 text-green-700"
                      />
                      <div className="space-y-3">
                        {[
                          {
                            label: 'Available (စင်ပေါ်ရှိ)',
                            value: data.catalog.availableCopies,
                            color: 'bg-green-500',
                            text: 'text-green-700',
                          },
                          {
                            label: 'On Loan (ငှားထားဆဲ)',
                            value: data.catalog.onLoanCopies,
                            color: 'bg-cyan-500',
                            text: 'text-cyan-700',
                          },
                          {
                            label: 'Maintenance (ပြုပြင်ဆဲ)',
                            value: data.catalog.maintenanceCopies,
                            color: 'bg-amber-500',
                            text: 'text-amber-700',
                          },
                          {
                            label: 'Lost (ပျောက်ဆုံး)',
                            value: data.catalog.lostCopies,
                            color: 'bg-rose-500',
                            text: 'text-rose-700',
                          },
                        ].map(({ label, value, color, text }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                            <span className="text-xs text-slate-600 w-36 flex-shrink-0">{label}</span>
                            <HBar value={value} max={data.catalog.totalCopies} color={color} />
                            <span className={`text-xs font-black w-6 text-right ${text}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                        <span>စုစုပေါင်း စာအုပ်မိတ္တူ (Total Copies)</span>
                        <span className="font-black text-slate-900">{data.catalog.totalCopies}</span>
                      </div>
                    </div>

                    {/* Fine Ledger Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={CreditCard}
                        title="ဒဏ်ကြေးစာရင်း အခြေအနေ (Fine Ledger)"
                        color="bg-amber-100 text-amber-700"
                      />
                      <div className="space-y-3">
                        {[
                          {
                            label: 'Unpaid (မပေးရသေး)',
                            value: data.fines.unpaidFines,
                            color: 'bg-rose-500',
                            text: 'text-rose-600',
                          },
                          {
                            label: 'Paid (ပေးပြီး)',
                            value: data.fines.paidFines,
                            color: 'bg-green-500',
                            text: 'text-green-700',
                          },
                          {
                            label: 'Waived (ကင်းလွတ်ခွင့်ပြု)',
                            value: data.fines.waivedFines,
                            color: 'bg-slate-400',
                            text: 'text-slate-500',
                          },
                        ].map(({ label, value, color, text }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                            <span className="text-xs text-slate-600 w-36 flex-shrink-0">{label}</span>
                            <HBar
                              value={value}
                              max={
                                data.fines.unpaidFines +
                                data.fines.paidFines +
                                data.fines.waivedFines
                              }
                              color={color}
                            />
                            <span className={`text-xs font-black w-6 text-right ${text}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between font-extrabold text-slate-900">
                          <span>ရရန်ကျန်ဒဏ်ကြေး (Outstanding)</span>
                          <span className="text-rose-600">{fmtMMK(data.fines.totalOutstanding)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-900">
                          <span>ကောက်ခံရရှိပြီးငွေ (Collected)</span>
                          <span className="text-green-700">{fmtMMK(data.fines.totalCollected)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Circulation Status */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={Repeat}
                        title="ငှားရမ်းမှု အခြေအနေ (Circulation Status)"
                        color="bg-cyan-100 text-cyan-700"
                      />
                      <div className="space-y-3">
                        {[
                          {
                            label: 'Active Loans (ငှားရမ်းဆဲ)',
                            value: data.circulation.activeLoans,
                            color: 'bg-blue-500',
                            icon: Clock,
                            text: 'text-blue-700',
                          },
                          {
                            label: 'Overdue (ရက်ကျော်နေ)',
                            value: data.circulation.overdueLoans,
                            color: 'bg-rose-500',
                            icon: AlertTriangle,
                            text: 'text-rose-600',
                          },
                          {
                            label: 'Returned (အပ်နှံပြီး)',
                            value: data.circulation.returnedLoans,
                            color: 'bg-green-500',
                            icon: CheckCircle,
                            text: 'text-green-700',
                          },
                        ].map(({ label, value, color, icon: Icon2, text }) => (
                          <div key={label} className="flex items-center gap-3">
                            <Icon2 className={`w-4 h-4 flex-shrink-0 ${text}`} />
                            <span className="text-xs text-slate-600 w-36 flex-shrink-0">{label}</span>
                            <HBar value={value} max={data.circulation.totalLoans} color={color} />
                            <span className={`text-xs font-black w-8 text-right ${text}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>စောင့်ဆိုင်းစာရင်း (Pending Holds)</span>
                          <span className="font-black text-violet-700">{data.holds.pendingHolds}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>ပြီးမြောက်သည့် Holds (Fulfilled)</span>
                          <span className="font-black text-green-700">{data.holds.fulfilledHolds}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Top Books + Genre Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top 5 Most Borrowed */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={TrendingUp}
                        title="အငှားရဆုံး စာအုပ်များ (Top Borrowed Titles)"
                        color="bg-violet-100 text-violet-700"
                      />
                      {data.charts.topBooks.length === 0 ? (
                        <p className="text-slate-400 text-sm italic py-4">ငှားရမ်းမှု မှတ်တမ်း မရှိသေးပါ။</p>
                      ) : (
                        <div className="space-y-4">
                          {data.charts.topBooks.map((book, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                                #{i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{book.title}</p>
                                <p className="text-xs text-slate-400 truncate">{book.author}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <HBar value={book.loanCount} max={maxBook} color="bg-violet-500" />
                                  <span className="text-xs font-black text-violet-700 flex-shrink-0">
                                    {book.loanCount} ကြိမ်ငှားရမ်း
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Genre Distribution */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <SectionHeader
                        icon={BookOpen}
                        title="အမျိုးအစားအလိုက် စာအုပ်များ (Collection by Genre)"
                        color="bg-green-100 text-green-700"
                      />
                      {genreChartData.length === 0 ? (
                        <p className="text-slate-400 text-sm italic py-4">အမျိုးအစား စာရင်း မရှိသေးပါ။</p>
                      ) : (
                        <>
                          <div className="h-20 mb-4">
                            <MiniBarChart data={genreChartData} color="#16a34a" />
                          </div>
                          <div className="space-y-2.5">
                            {data.charts.genreDistribution.map((g, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-slate-600 w-36 flex-shrink-0 truncate">
                                  {g.genre}
                                </span>
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
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 2: CIRCULATION LOG TABLE
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'circulation' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader
                    icon={Repeat}
                    title="ငှားရမ်းမှုမှတ်တမ်း (Circulation Loans Ledger)"
                    color="bg-cyan-100 text-cyan-700"
                    badge={`${filteredLoans.length} Loans`}
                    action={
                      <button
                        onClick={exportCirculationCsv}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>ငှားရမ်းမှုမှတ်တမ်း CSV ဒေါင်းလုဒ်</span>
                      </button>
                    }
                  />

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="အသင်းဝင်အမည်၊ ဘားကုဒ်၊ စာအုပ်အမည် ရှာရန်..."
                        value={loanSearch}
                        onChange={(e) => setLoanSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 font-semibold">အခြေအနေ:</span>
                      <select
                        value={loanStatusFilter}
                        onChange={(e) => setLoanStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ALL">အားလုံး (All Statuses)</option>
                        <option value="ISSUED">ISSUED (ငှားရမ်းဆဲ)</option>
                        <option value="OVERDUE">OVERDUE (ရက်ကျော်နေ)</option>
                        <option value="RETURNED">RETURNED (အပ်နှံပြီး)</option>
                      </select>
                    </div>
                  </div>

                  {filteredLoans.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      ရှာဖွေမှုနှင့် ကိုက်ညီသော ငှားရမ်းမှု မှတ်တမ်း မတွေ့ရှိပါ။
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[750px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {[
                              'Patron (အသင်းဝင်)',
                              'Book (စာအုပ်)',
                              'Copy Barcode',
                              'Issued Date',
                              'Due Date',
                              'Returned Date',
                              'Status',
                              'Renew',
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLoans.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{l.patronName}</span>
                                  {l.isVip && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                                      <Crown className="w-3 h-3 text-amber-600" />
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {l.patronBarcode}
                                </p>
                              </td>
                              <td className="py-3 px-3 max-w-[200px]">
                                <p className="font-bold text-slate-800 truncate">{l.bookTitle}</p>
                                <p className="text-[11px] text-slate-400 truncate">{l.author}</p>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600 font-semibold">
                                {l.copyBarcode}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {new Date(l.issuedDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3 px-3 text-slate-800 font-semibold">
                                {new Date(l.dueDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {l.returnedDate
                                  ? new Date(l.returnedDate).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    l.status === 'ISSUED'
                                      ? 'bg-blue-100 text-blue-700'
                                      : l.status === 'RETURNED'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : l.status === 'OVERDUE'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {l.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-600">{l.renewCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 3: FINES & REVENUE TABLE
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'fines' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader
                    icon={DollarSign}
                    title="ဒဏ်ကြေးနှင့် ဝင်ငွေမှတ်တမ်း (Fines & Financial Ledger)"
                    color="bg-amber-100 text-amber-700"
                    badge={`${filteredFines.length} Fines`}
                    action={
                      <button
                        onClick={exportFinesCsv}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>ဒဏ်ကြေးစာရင်း CSV ဒေါင်းလုဒ်</span>
                      </button>
                    }
                  />

                  {/* Financial summary mini cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <span className="text-xs font-bold text-amber-800 uppercase">
                        ကျသင့်ဒဏ်ကြေးစုစုပေါင်း (Total Incurred)
                      </span>
                      <p className="text-xl font-black text-amber-900 mt-1">
                        {fmtMMK(data.fines.totalFineAmount)}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <span className="text-xs font-bold text-emerald-800 uppercase">
                        ကောက်ခံပြီးငွေ (Total Collected)
                      </span>
                      <p className="text-xl font-black text-emerald-900 mt-1">
                        {fmtMMK(data.fines.totalCollected)}
                      </p>
                    </div>
                    <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl">
                      <span className="text-xs font-bold text-rose-800 uppercase">
                        ရရန်ကျန်ဒဏ်ကြေး (Outstanding Balance)
                      </span>
                      <p className="text-xl font-black text-rose-700 mt-1">
                        {fmtMMK(data.fines.totalOutstanding)}
                      </p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="အသင်းဝင်၊ ဘားကုဒ်၊ စာအုပ်အမည် ရှာရန်..."
                        value={fineSearch}
                        onChange={(e) => setFineSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 font-semibold">အခြေအနေ:</span>
                      <select
                        value={fineStatusFilter}
                        onChange={(e) => setFineStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ALL">အားလုံး (All Fines)</option>
                        <option value="UNPAID">UNPAID (မပေးရသေး)</option>
                        <option value="PAID">PAID (ပေးပြီး)</option>
                        <option value="WAIVED">WAIVED (ကင်းလွတ်)</option>
                      </select>
                    </div>
                  </div>

                  {filteredFines.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      ဒဏ်ကြေး မှတ်တမ်း မရှိပါ။
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {[
                              'Patron (အသင်းဝင်)',
                              'Book / Reason',
                              'Amount (ကျသင့်ငွေ)',
                              'Paid (ပေးပြီး)',
                              'Balance (ရရန်ကျန်)',
                              'Status',
                              'Date',
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredFines.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-900">{f.patronName}</p>
                                <p className="text-[11px] font-mono text-slate-400">{f.patronBarcode}</p>
                              </td>
                              <td className="py-3 px-3 max-w-[200px]">
                                <p className="font-semibold text-slate-800 truncate">{f.bookTitle}</p>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  {f.reason}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">{fmtMMK(f.amount)}</td>
                              <td className="py-3 px-3 font-bold text-green-700">
                                {fmtMMK(f.paidAmount)}
                              </td>
                              <td className="py-3 px-3 font-black text-rose-600">{fmtMMK(f.balance)}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    f.status === 'PAID'
                                      ? 'bg-green-100 text-green-700'
                                      : f.status === 'UNPAID'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {f.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {new Date(f.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 4: CATALOG & INVENTORY TABLE
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'inventory' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader
                    icon={BookOpen}
                    title="စာအုပ်စာရင်း အခြေအနေ (Catalog & Inventory Status)"
                    color="bg-emerald-100 text-emerald-700"
                    badge={`${filteredBooks.length} Titles`}
                    action={
                      <button
                        onClick={exportCatalogCsv}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>စာအုပ်စာရင်း CSV ဒေါင်းလုဒ်</span>
                      </button>
                    }
                  />

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ခေါင်းစဉ်၊ စာရေးဆရာ၊ ISBN၊ အမျိုးအစား ရှာရန်..."
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {filteredBooks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      စာအုပ်စာရင်း မတွေ့ရှိပါ။
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {[
                              'Title & Author (ခေါင်းစဉ် / စာရေးဆရာ)',
                              'ISBN',
                              'Genre (အမျိုးအစား)',
                              'Total Copies',
                              'Available',
                              'On Loan',
                              'Max Rent',
                              'Fine Rate',
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredBooks.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 max-w-[220px]">
                                <p className="font-bold text-slate-900 truncate">{b.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{b.author}</p>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500">{b.isbn}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                  {b.genre}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-800">{b.totalCopies}</td>
                              <td className="py-3 px-3 font-bold text-green-700">{b.availableCopies}</td>
                              <td className="py-3 px-3 font-bold text-cyan-700">{b.onLoanCopies}</td>
                              <td className="py-3 px-3 text-slate-600">{b.maxRentDays} days</td>
                              <td className="py-3 px-3 font-semibold text-amber-700">
                                {fmtMMK(b.dailyFineRate)}/d
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 5: PATRONS & VIP DIRECTORY TABLE
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'patrons' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader
                    icon={Users}
                    title="အသင်းဝင်များ စာရင်းနှင့် VIP အခြေအနေ (Patrons & VIP Directory)"
                    color="bg-blue-100 text-blue-700"
                    badge={`${filteredPatrons.length} Members`}
                    action={
                      <button
                        onClick={exportPatronsCsv}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>အသင်းဝင်များ CSV ဒေါင်းလုဒ်</span>
                      </button>
                    }
                  />

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="အမည်၊ ဘားကုဒ်၊ Email၊ ဖုန်း ရှာရန်..."
                        value={patronSearch}
                        onChange={(e) => setPatronSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {filteredPatrons.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      အသင်းဝင် စာရင်း မတွေ့ရှိပါ။
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {[
                              'Patron Name (အမည်)',
                              'Barcode',
                              'Type',
                              'Contact Info',
                              'Total Loans',
                              'Active Loans',
                              'Overdue',
                              'Outstanding Fine',
                              'Status',
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPatrons.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                              <td className="py-3 px-3 font-mono text-slate-500">{p.barcode}</td>
                              <td className="py-3 px-3">
                                {p.isVip ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    VIP (+7d)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                    Standard
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                <p>{p.email}</p>
                                {p.phone && <p className="text-[11px] text-slate-400">{p.phone}</p>}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-700">{p.totalLoans}</td>
                              <td className="py-3 px-3 font-bold text-blue-700">{p.activeLoans}</td>
                              <td className="py-3 px-3 font-bold text-rose-600">
                                {p.overdueLoans > 0 ? (
                                  <span className="px-1.5 py-0.5 bg-rose-100 rounded text-rose-700">
                                    {p.overdueLoans}
                                  </span>
                                ) : (
                                  '0'
                                )}
                              </td>
                              <td className="py-3 px-3 font-black text-rose-700">
                                {p.outstandingFine > 0 ? (
                                  fmtMMK(p.outstandingFine)
                                ) : (
                                  <span className="text-slate-400 font-normal">0 MMK</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    p.isBlocked
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {p.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
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

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 6: OVERDUE ACTION LIST
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'overdue' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader
                    icon={AlertTriangle}
                    title="ရက်ကျော်လွန်နေသော စာအုပ်များ (Overdue Items Requiring Follow-Up)"
                    color="bg-rose-100 text-rose-600"
                    badge={`${data.overdueItems.length} Overdue Items`}
                    action={
                      <button
                        onClick={exportOverdueCsv}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>ရက်ကျော်စာရင်း CSV ဒေါင်းလုဒ်</span>
                      </button>
                    }
                  />

                  {data.overdueItems.length === 0 ? (
                    <div className="flex items-center gap-3 py-12 justify-center text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-bold text-sm">
                        ရက်ကျော်လွန်နေသော စာအုပ်များ မရှိပါ — စာကြည့်တိုက် ကျန်းမာရေး အလွန်ကောင်းမွန်ပါသည်။
                      </span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {[
                              'Patron (အသင်းဝင်)',
                              'Barcode',
                              'Book Title (စာအုပ်အမည်)',
                              'Copy',
                              'Due Date',
                              'Days Overdue',
                              'Pending Fine',
                              'Contact / Action',
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.overdueItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{item.patronName}</span>
                                  {item.patronIsVip && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded">
                                      VIP
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono text-violet-700 font-semibold">
                                {item.patronBarcode}
                              </td>
                              <td className="py-3 px-3 text-slate-800 font-bold max-w-[180px] truncate">
                                {item.bookTitle}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500 font-medium">
                                {item.copyBarcode}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {new Date(item.dueDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    item.daysOverdue > 14
                                      ? 'bg-rose-100 text-rose-700'
                                      : item.daysOverdue > 7
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {item.daysOverdue} ရက်ကျော်
                                </span>
                              </td>
                              <td className="py-3 px-3 font-black text-rose-600">
                                {item.pendingFine > 0 ? (
                                  fmtMMK(item.pendingFine)
                                ) : (
                                  <span className="text-slate-400 font-normal">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {item.patronPhone}
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

              {/* ═══════════════════════════════════════════════════════════════
                  FOOTER
              ═══════════════════════════════════════════════════════════════ */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <p>
                  အစီရင်ခံစာ ထုတ်ယူချိန်: {new Date(data.generatedAt).toLocaleString('en-GB')}
                </p>
                <p className="font-semibold text-slate-500">
                  MOCHT National Library Management System · Reporting & Analytics Suite
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
