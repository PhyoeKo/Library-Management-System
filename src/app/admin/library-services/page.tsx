'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  FileSpreadsheet,
  Share2,
  Bookmark,
  Plus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Building2,
  ExternalLink,
  Layers,
  AlertCircle,
  Tag,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface SerialSubscription {
  id: string;
  title: string;
  issn?: string | null;
  frequency: string;
  publisher?: string | null;
  active: boolean;
}

interface ILLRequest {
  id: string;
  partnerLibrary: string;
  bookTitle: string;
  author: string;
  status: string;
  userId: string;
  user: {
    name: string;
    barcode: string;
    email: string;
    phone?: string | null;
  };
}

interface CourseReserveItem {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    copies: { id: string; barcode: string; status: string; location: string }[];
  };
}

interface CatalogBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
}

interface PatronUser {
  id: string;
  name: string;
  barcode: string;
}

export default function LibraryServicesPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'SERIALS' | 'ILL' | 'RESERVES'>('SERIALS');

  const [serials, setSerials] = useState<SerialSubscription[]>([]);
  const [illRequests, setIllRequests] = useState<ILLRequest[]>([]);
  const [reserves, setReserves] = useState<CourseReserveItem[]>([]);
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [patrons, setPatrons] = useState<PatronUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialForm, setSerialForm] = useState({
    title: '',
    issn: '',
    frequency: 'MONTHLY',
    publisher: '',
    active: true,
  });

  const [isIllModalOpen, setIsIllModalOpen] = useState(false);
  const [illForm, setIllForm] = useState({
    userId: '',
    partnerLibrary: 'MIT Central Library System',
    bookTitle: '',
    author: '',
    status: 'PENDING',
  });

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    courseCode: '',
    courseName: '',
    instructor: '',
    bookId: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSerials = useCallback(async () => {
    try {
      const res = await fetch(`/api/serials?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setSerials(data.subscriptions);
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery]);

  const fetchILL = useCallback(async () => {
    try {
      const res = await fetch(`/api/ill?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setIllRequests(data.requests);
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery]);

  const fetchReserves = useCallback(async () => {
    try {
      const res = await fetch(`/api/course-reserves?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setReserves(data.reserves);
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery]);

  const fetchAuxiliary = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([fetch('/api/books'), fetch('/api/patrons')]);
      const [bData, pData] = await Promise.all([bRes.json(), pRes.json()]);
      if (bData.success) setBooks(bData.books);
      if (pData.success) setPatrons(pData.patrons);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSerials(), fetchILL(), fetchReserves(), fetchAuxiliary()]);
    setLoading(false);
  }, [fetchSerials, fetchILL, fetchReserves, fetchAuxiliary]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Serial Actions
  const handleSerialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('serial_submit');
    try {
      const res = await fetch('/api/serials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Serial subscription registered');
        setIsSerialModalOpen(false);
        setSerialForm({ title: '', issn: '', frequency: 'MONTHLY', publisher: '', active: true });
        fetchSerials();
      } else {
        showToast(data.error || 'Failed to add serial', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSerialActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/serials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Subscription ${!currentActive ? 'activated' : 'paused'}`);
        fetchSerials();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteSerial = async (id: string, title: string) => {
    if (!confirm(`Delete serial subscription "${title}"?`)) return;
    try {
      const res = await fetch(`/api/serials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Serial subscription removed');
        fetchSerials();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // ILL Actions
  const handleIllSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('ill_submit');
    try {
      const res = await fetch('/api/ill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(illForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Interlibrary loan request logged');
        setIsIllModalOpen(false);
        setIllForm({ userId: '', partnerLibrary: 'MIT Central Library System', bookTitle: '', author: '', status: 'PENDING' });
        fetchILL();
      } else {
        showToast(data.error || 'Failed to log ILL', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleIllStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ill/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`ILL status updated to ${newStatus}`);
        fetchILL();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteIll = async (id: string) => {
    if (!confirm('Delete this ILL request record?')) return;
    try {
      const res = await fetch(`/api/ill/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('ILL record deleted');
        fetchILL();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Course Reserve Actions
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('reserve_submit');
    try {
      const res = await fetch('/api/course-reserves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reserveForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Book assigned to academic course reserve');
        setIsReserveModalOpen(false);
        setReserveForm({ courseCode: '', courseName: '', instructor: '', bookId: '' });
        fetchReserves();
      } else {
        showToast(data.error || 'Failed to place on reserve', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReserve = async (id: string) => {
    if (!confirm('Remove this book from course reserves?')) return;
    try {
      const res = await fetch(`/api/course-reserves/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Item removed from course reserve');
        fetchReserves();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Koha Enterprise & Academic Services
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Serials and periodical subscriptions, Interlibrary Loans (ILL), and University Course Reserves.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'SERIALS' && (
                <button
                  onClick={() => setIsSerialModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Serial Subscription</span>
                </button>
              )}
              {activeTab === 'ILL' && (
                <button
                  onClick={() => {
                    setIllForm({
                      userId: patrons[0]?.id || '',
                      partnerLibrary: 'MIT Central Library System',
                      bookTitle: '',
                      author: '',
                      status: 'PENDING',
                    });
                    setIsIllModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log ILL Request</span>
                </button>
              )}
              {activeTab === 'RESERVES' && (
                <button
                  onClick={() => {
                    setReserveForm({
                      courseCode: 'CS101',
                      courseName: 'Introduction to Computer Science',
                      instructor: 'Dr. Sarah Chen',
                      bookId: books[0]?.id || '',
                    });
                    setIsReserveModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Book to Course</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Serials</p>
                <p className="text-xl font-black text-slate-900">{serials.filter((s) => s.active).length} Subscriptions</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ILL In-Transit</p>
                <p className="text-xl font-black text-indigo-700">
                  {illRequests.filter((r) => r.status === 'IN_TRANSIT' || r.status === 'PENDING').length} Active
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Course Reserves</p>
                <p className="text-xl font-black text-amber-700">{reserves.length} Items Reserved</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button
              onClick={() => setActiveTab('SERIALS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'SERIALS'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Serials & Periodicals ({serials.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ILL')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'ILL'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Interlibrary Loans ILL ({illRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RESERVES')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'RESERVES'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Academic Course Reserves ({reserves.length})</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: SERIALS & PERIODICALS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'SERIALS' && (
            <div className="space-y-6">
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
                  Loading serial subscriptions...
                </div>
              ) : serials.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No serial subscriptions registered</p>
                  <p className="text-xs text-slate-400 mt-1">Register journals, magazines, and periodicals for regular issue tracking.</p>
                  <button
                    onClick={() => setIsSerialModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Add Subscription
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Publication Title</th>
                        <th className="px-6 py-3.5">ISSN</th>
                        <th className="px-6 py-3.5">Frequency</th>
                        <th className="px-6 py-3.5">Publisher</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serials.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">{s.title}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{s.issn || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                              {s.frequency}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{s.publisher || '—'}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleSerialActive(s.id, s.active)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                                s.active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {s.active ? 'ACTIVE' : 'PAUSED'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteSerial(s.id, s.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
              TAB 2: INTERLIBRARY LOANS (ILL)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'ILL' && (
            <div className="space-y-6">
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
                  Loading ILL requests...
                </div>
              ) : illRequests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No active Interlibrary Loan requests</p>
                  <p className="text-xs text-slate-400 mt-1">Facilitate borrowing between partner universities and external libraries.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Requested Book Title</th>
                        <th className="px-6 py-3.5">Partner Library Institution</th>
                        <th className="px-6 py-3.5">Borrowing Patron</th>
                        <th className="px-6 py-3.5">Transit Status</th>
                        <th className="px-6 py-3.5 text-right">Workflow Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {illRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{r.bookTitle}</span>
                            <span className="text-[11px] text-slate-400">By {r.author}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                              <span>{r.partnerLibrary}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{r.user.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Card: {r.user.barcode}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                r.status === 'IN_TRANSIT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : r.status === 'RECEIVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'COMPLETED'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status === 'IN_TRANSIT' && <Truck className="w-3 h-3" />}
                              {r.status === 'RECEIVED' && <CheckCircle className="w-3 h-3" />}
                              {r.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              <span>{r.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'PENDING' && (
                                <button
                                  onClick={() => handleIllStatusChange(r.id, 'IN_TRANSIT')}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  Mark In-Transit
                                </button>
                              )}
                              {r.status === 'IN_TRANSIT' && (
                                <button
                                  onClick={() => handleIllStatusChange(r.id, 'RECEIVED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  Mark Received
                                </button>
                              )}
                              {r.status === 'RECEIVED' && (
                                <button
                                  onClick={() => handleIllStatusChange(r.id, 'COMPLETED')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteIll(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
              TAB 3: ACADEMIC COURSE RESERVES
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'RESERVES' && (
            <div className="space-y-6">
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
                  Loading course reserves...
                </div>
              ) : reserves.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No books placed on course reserve</p>
                  <p className="text-xs text-slate-400 mt-1">Assign high-demand curriculum textbooks to university course reserve shelves.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reserves.map((cr) => (
                    <div
                      key={cr.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200 font-mono">
                            {cr.courseCode}
                          </span>
                          <button
                            onClick={() => handleDeleteReserve(cr.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition"
                            title="Remove from reserve"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-base">{cr.courseName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Instructor: {cr.instructor}</p>

                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Assigned Curriculum Reading
                          </span>
                          <p className="font-bold text-slate-900 text-sm mt-0.5">{cr.book.title}</p>
                          <p className="text-xs text-slate-500">By {cr.book.author} (ISBN: {cr.book.isbn})</p>

                          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              Physical Copies: <b className="text-slate-900">{cr.book.copies.length}</b>
                            </span>
                            <span className="text-teal-700 font-bold">Reserve Desk Location</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal: New Serial Subscription */}
          {isSerialModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                    <span>Add Periodical / Serial Subscription</span>
                  </h3>
                  <button onClick={() => setIsSerialModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleSerialSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Publication Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. ACM Transactions on Computer Systems"
                      value={serialForm.title}
                      onChange={(e) => setSerialForm({ ...serialForm, title: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ISSN Number</label>
                      <input
                        type="text"
                        placeholder="0734-2071"
                        value={serialForm.issn}
                        onChange={(e) => setSerialForm({ ...serialForm, issn: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                      <select
                        value={serialForm.frequency}
                        onChange={(e) => setSerialForm({ ...serialForm, frequency: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="BI-WEEKLY">Bi-Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="BI-MONTHLY">Bi-Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="ANNUAL">Annual</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Publisher / Society</label>
                    <input
                      type="text"
                      placeholder="e.g. Association for Computing Machinery"
                      value={serialForm.publisher}
                      onChange={(e) => setSerialForm({ ...serialForm, publisher: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsSerialModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm">Save Subscription</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: New ILL Request */}
          {isIllModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-teal-700" />
                    <span>Log Interlibrary Loan Request</span>
                  </h3>
                  <button onClick={() => setIsIllModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleIllSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Borrowing Patron *</label>
                    <select
                      value={illForm.userId}
                      onChange={(e) => setIllForm({ ...illForm, userId: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="">-- Choose Patron --</option>
                      {patrons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.barcode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Partner Library Institution *</label>
                    <input
                      type="text"
                      placeholder="e.g. National Library of Myanmar / MIT Central Library"
                      value={illForm.partnerLibrary}
                      onChange={(e) => setIllForm({ ...illForm, partnerLibrary: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
                      <input
                        type="text"
                        placeholder="Title of external book"
                        value={illForm.bookTitle}
                        onChange={(e) => setIllForm({ ...illForm, bookTitle: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Author *</label>
                      <input
                        type="text"
                        placeholder="Author name"
                        value={illForm.author}
                        onChange={(e) => setIllForm({ ...illForm, author: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsIllModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm">Save Request</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: New Course Reserve */}
          {isReserveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                    <span>Assign Book to Course Reserve</span>
                  </h3>
                  <button onClick={() => setIsReserveModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleReserveSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. CS101"
                        value={reserveForm.courseCode}
                        onChange={(e) => setReserveForm({ ...reserveForm, courseCode: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Instructor *</label>
                      <input
                        type="text"
                        placeholder="Prof. / Lecturer"
                        value={reserveForm.instructor}
                        onChange={(e) => setReserveForm({ ...reserveForm, instructor: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={reserveForm.courseName}
                      onChange={(e) => setReserveForm({ ...reserveForm, courseName: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Catalog Book *</label>
                    <select
                      value={reserveForm.bookId}
                      onChange={(e) => setReserveForm({ ...reserveForm, bookId: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="">-- Choose Book from Catalog --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.isbn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsReserveModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm">Assign to Reserve</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
