'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  ShoppingBag,
  Building2,
  FileSpreadsheet,
  Globe,
  Plus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Tag,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  accountNumber?: string;
  poCount: number;
  activePOs: number;
  totalSpend: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  totalBudget: number;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
    code: string;
    contactEmail?: string;
    phone?: string;
  };
}

interface EResourceItem {
  id: string;
  title: string;
  author: string;
  format: string;
  fileUrl: string;
  isOpenAccess: boolean;
  downloads: number;
  book?: {
    title: string;
    isbn: string;
  };
}

export default function AcquisitionsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'VENDORS' | 'ORDERS' | 'ERM'>('VENDORS');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [eResources, setEResources] = useState<EResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    code: '',
    contactEmail: '',
    phone: '',
    address: '',
    accountNumber: '',
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    vendorId: '',
    totalBudget: '',
    orderNumber: '',
    status: 'DRAFT',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch(`/api/acquisitions/vendors?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const statusParam = orderStatusFilter !== 'ALL' ? `&status=${orderStatusFilter}` : '';
      const res = await fetch(`/api/acquisitions/orders?q=${encodeURIComponent(searchQuery)}${statusParam}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery, orderStatusFilter]);

  const fetchEResources = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      if (data.success) {
        // Extract eResources from books
        const eList: EResourceItem[] = [];
        data.books.forEach((b: any) => {
          if (b.eResources && b.eResources.length > 0) {
            b.eResources.forEach((er: any) => {
              eList.push({ ...er, book: { title: b.title, isbn: b.isbn } });
            });
          }
        });
        setEResources(eList);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchVendors(), fetchOrders(), fetchEResources()]);
    setLoading(false);
  }, [fetchVendors, fetchOrders, fetchEResources]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Vendor Submit
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('vendor_submit');
    try {
      const url = editingVendor
        ? `/api/acquisitions/vendors/${editingVendor.id}`
        : '/api/acquisitions/vendors';
      const method = editingVendor ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      });
      const data = await res.json();

      if (data.success) {
        showToast(editingVendor ? 'Vendor details updated' : 'Vendor registered successfully');
        setIsVendorModalOpen(false);
        setEditingVendor(null);
        fetchVendors();
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Vendor
  const handleDeleteVendor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      const res = await fetch(`/api/acquisitions/vendors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Vendor removed');
        fetchVendors();
      } else {
        showToast(data.error || 'Failed to delete vendor', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Order Submit
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('order_submit');
    try {
      const res = await fetch('/api/acquisitions/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          totalBudget: parseFloat(orderForm.totalBudget),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Purchase order created');
        setIsOrderModalOpen(false);
        setOrderForm({ vendorId: '', totalBudget: '', orderNumber: '', status: 'DRAFT' });
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to create order', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Order Status Change Workflow
  const handleOrderStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(`order_${id}_${newStatus}`);
    try {
      const res = await fetch(`/api/acquisitions/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Purchase order status updated to ${newStatus}`);
        fetchOrders();
        fetchVendors();
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      code: '',
      contactEmail: '',
      phone: '',
      address: '',
      accountNumber: '',
    });
    setIsVendorModalOpen(true);
  };

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      code: v.code,
      contactEmail: v.contactEmail || '',
      phone: v.phone || '',
      address: v.address || '',
      accountNumber: v.accountNumber || '',
    });
    setIsVendorModalOpen(true);
  };

  const openAddOrder = (defaultVendorId?: string) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    setOrderForm({
      vendorId: defaultVendorId || (vendors[0]?.id ?? ''),
      totalBudget: '500000',
      orderNumber: `PO-${dateStr}-${rand}`,
      status: 'DRAFT',
    });
    setIsOrderModalOpen(true);
  };

  const totalAcqBudget = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalBudget, 0);

  const totalReceivedBudget = orders
    .filter((o) => o.status === 'RECEIVED')
    .reduce((sum, o) => sum + o.totalBudget, 0);

  return (
    <AdminGuard>
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Koha Acquisitions & Enterprise ERM
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor management, purchase order baskets, fund allocation, and electronic resource licenses.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={openAddVendor}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                Add Vendor
              </button>
              <button
                onClick={() => openAddOrder()}
                disabled={vendors.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                New Purchase Order
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Registered Vendors</p>
                <p className="text-xl font-black text-slate-900">{vendors.length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Purchase Orders</p>
                <p className="text-xl font-black text-slate-900">{orders.length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Invoiced / Received</p>
                <p className="text-xl font-black text-emerald-700">
                  {totalReceivedBudget.toLocaleString()} MMK
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ERM Licenses</p>
                <p className="text-xl font-black text-indigo-700">{eResources.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button
              onClick={() => setActiveTab('VENDORS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'VENDORS'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Vendors & Booksellers ({vendors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'ORDERS'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baskets & Purchase Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ERM')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'ERM'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Electronic Resources & ERM ({eResources.length})</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: VENDORS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'VENDORS' && (
            <div className="space-y-6">
              {/* Search & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search vendor name, code, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  onClick={fetchVendors}
                  className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                  Loading vendor directory...
                </div>
              ) : vendors.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No vendors found</p>
                  <p className="text-xs text-slate-400 mt-1">Add your library booksellers and suppliers.</p>
                  <button
                    onClick={openAddVendor}
                    className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Add First Vendor
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                              {vendor.code}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-base mt-1">{vendor.name}</h3>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditVendor(vendor)}
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-50 rounded-lg transition"
                              title="Edit Vendor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition"
                              title="Delete Vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                          {vendor.contactEmail && (
                            <p className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-mono truncate">{vendor.contactEmail}</span>
                            </p>
                          )}
                          {vendor.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-mono">{vendor.phone}</span>
                            </p>
                          )}
                          {vendor.address && (
                            <p className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{vendor.address}</span>
                            </p>
                          )}
                          {vendor.accountNumber && (
                            <p className="flex items-center gap-2">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-mono text-slate-500">Acc: {vendor.accountNumber}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Total Spend</span>
                          <span className="font-black text-slate-900">{vendor.totalSpend.toLocaleString()} MMK</span>
                        </div>
                        <button
                          onClick={() => openAddOrder(vendor.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New PO</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: PURCHASE ORDERS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-6">
              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {['ALL', 'DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        orderStatusFilter === st
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PO number or vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                  Loading purchase orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No purchase orders found</p>
                  <p className="text-xs text-slate-400 mt-1">Create a purchase basket to order new books from vendors.</p>
                  <button
                    onClick={() => openAddOrder()}
                    className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Create Purchase Order
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3.5">PO Number</th>
                          <th className="px-6 py-3.5">Vendor</th>
                          <th className="px-6 py-3.5">Order Date</th>
                          <th className="px-6 py-3.5">Total Budget</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Workflow Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">
                              {order.orderNumber}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-900 block">{order.vendor.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Code: {order.vendor.code}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 font-black text-slate-900">
                              {order.totalBudget.toLocaleString()} MMK
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  order.status === 'RECEIVED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : order.status === 'ORDERED'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : order.status === 'DRAFT'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {order.status === 'RECEIVED' && <CheckCircle className="w-3 h-3" />}
                                {order.status === 'ORDERED' && <Truck className="w-3 h-3" />}
                                {order.status === 'DRAFT' && <Clock className="w-3 h-3" />}
                                {order.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                                <span>{order.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {order.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleOrderStatusChange(order.id, 'ORDERED')}
                                    disabled={!!actionLoading}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition"
                                  >
                                    Send Order
                                  </button>
                                )}
                                {order.status === 'ORDERED' && (
                                  <button
                                    onClick={() => handleOrderStatusChange(order.id, 'RECEIVED')}
                                    disabled={!!actionLoading}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                                  >
                                    Receive Items
                                  </button>
                                )}
                                {order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && (
                                  <button
                                    onClick={() => handleOrderStatusChange(order.id, 'CANCELLED')}
                                    disabled={!!actionLoading}
                                    className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 transition"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: ERM & DIGITAL LICENSES
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'ERM' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <span>Electronic Resource Management (ERM) & Digital Access</span>
                  </h2>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-200">
                    {eResources.length} Active E-Resources
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Manage digital subscriptions, open access licenses, format compliance, and PDF/EPUB access points.
                </p>

                {eResources.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center italic">
                    No electronic resources registered in the catalog yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eResources.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                item.isOpenAccess
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {item.isOpenAccess ? 'OPEN ACCESS' : 'RESTRICTED LICENSE'}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-500">{item.format}</span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Author: {item.author}</p>
                          {item.book && (
                            <p className="text-[11px] text-slate-400 font-mono mt-1">
                              Linked Title: {item.book.title} (ISBN: {item.book.isbn})
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Total Downloads: <b className="text-slate-900">{item.downloads}</b></span>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            <span>Access Asset</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MODAL: ADD/EDIT VENDOR
          ══════════════════════════════════════════════════════════════ */}
          {isVendorModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>{editingVendor ? 'Edit Vendor / Bookseller' : 'Register New Vendor'}</span>
                  </h3>
                  <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleVendorSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Vendor Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Oxford University Press"
                        value={vendorForm.name}
                        onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Vendor Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. OUP-01"
                        value={vendorForm.code}
                        onChange={(e) => setVendorForm({ ...vendorForm, code: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        placeholder="orders@vendor.com"
                        value={vendorForm.contactEmail}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactEmail: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+95-9-123456"
                        value={vendorForm.phone}
                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      placeholder="Vendor office address"
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank / Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. KBZ Bank: 0123-4567-890"
                      value={vendorForm.accountNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, accountNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsVendorModalOpen(false)}
                      className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      {actionLoading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MODAL: CREATE PURCHASE ORDER
          ══════════════════════════════════════════════════════════════ */}
          {isOrderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    <span>Create Purchase Order Basket</span>
                  </h3>
                  <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleOrderSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Bookseller / Vendor *</label>
                    <select
                      value={orderForm.vendorId}
                      onChange={(e) => setOrderForm({ ...orderForm, vendorId: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Purchase Order Reference</label>
                    <input
                      type="text"
                      value={orderForm.orderNumber}
                      onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estimated Budget / Total (MMK) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={orderForm.totalBudget}
                      onChange={(e) => setOrderForm({ ...orderForm, totalBudget: e.target.value })}
                      required
                      min="0"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="DRAFT">DRAFT (Basket Open)</option>
                      <option value="ORDERED">ORDERED (Sent to Bookseller)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsOrderModalOpen(false)}
                      className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      {actionLoading ? 'Creating...' : 'Create Order'}
                    </button>
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
