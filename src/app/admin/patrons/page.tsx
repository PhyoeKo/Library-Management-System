'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  Users,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  MapPin,
  IdCard,
  Image as ImageIcon,
  Eye,
  Phone,
  BookOpen,
  DollarSign,
  AlertCircle,
  GraduationCap,
  Briefcase,
  UserX,
  Download,
  Printer,
  X,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface PatronCategory {
  id: string;
  code: string;
  name: string;
  maxLoanCount: number;
  loanPeriodDays: number;
  fineRatePerDay: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  barcode: string;
  role: string;
  categoryId?: string | null;
  category?: PatronCategory | null;
  phone?: string;
  address?: string;
  nrcNumber?: string;
  nrcFrontUrl?: string;
  nrcBackUrl?: string;
  kycStatus?: string;
  isBlocked: boolean;
  blockReason?: string;
  activeLoanCount?: number;
  overdueLoanCount?: number;
  unpaidFineTotal?: number;
  activeHoldCount?: number;
  createdAt: string;
}

export default function MemberManagementPage() {
  const { lang, t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<PatronCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Member Card Modal State
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState('PATRON');
  const [categoryIdInput, setCategoryIdInput] = useState('');
  const [statusInput, setStatusInput] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // KYC Fields
  const [nrcNumberInput, setNrcNumberInput] = useState('');
  const [currentLocationInput, setCurrentLocationInput] = useState('');
  const [nrcFrontUrlInput, setNrcFrontUrlInput] = useState('');
  const [nrcBackUrlInput, setNrcBackUrlInput] = useState('');

  // KYC Preview Modal State
  const [kycPreviewMember, setKycPreviewMember] = useState<Member | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const exportMemberCardAsImage = async (member: Member) => {
    try {
      setIsExportingImage(true);
      const canvas = document.createElement('canvas');
      const width = 1050;
      const height = 660;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background gradient (Rich Emerald/Teal National Theme)
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#064e3b');
      bgGradient.addColorStop(0.4, '#022c22');
      bgGradient.addColorStop(1, '#042f2e');
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 32);
      ctx.fill();

      // 2. Outer & Inner Gold Foil Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(16, 16, width - 32, height - 32, 24);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(24, 24, width - 48, height - 48, 20);
      ctx.stroke();

      // 3. Top Ribbon Accent
      const ribbonGrad = ctx.createLinearGradient(30, 30, width - 30, 30);
      ribbonGrad.addColorStop(0, '#f59e0b');
      ribbonGrad.addColorStop(0.5, '#10b981');
      ribbonGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(30, 30, width - 60, 4);

      // 4. Logo & Government Header
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/mocht-logo.png';
      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
      });

      if (logo.complete && logo.naturalHeight !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(95, 105, 45, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, 50, 60, 90, 90);
        ctx.restore();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(95, 105, 46, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Header text
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်', 160, 80);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('ယဉ်ကျေးမှု၊ ဟိုတယ်နှင့် ခရီးသွားလာရေး ဝန်ကြီးဌာန · MOCHT', 160, 105);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 23px sans-serif';
      ctx.fillText('NATIONAL LIBRARY OF MYANMAR · MEMBER PASS', 160, 136);

      // Smart chip graphic on top right
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(width - 150, 65, 85, 60, 8);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width - 150 + 28, 65);
      ctx.lineTo(width - 150 + 28, 125);
      ctx.moveTo(width - 150 + 56, 65);
      ctx.lineTo(width - 150 + 56, 125);
      ctx.moveTo(width - 150, 95);
      ctx.lineTo(width - 65, 95);
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('RFID PASS', width - 138, 138);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 165);
      ctx.lineTo(width - 50, 165);
      ctx.stroke();

      // 5. Member Photo / Portrait box
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.roundRect(50, 190, 170, 210, 16);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(135, 275, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((member.name || 'U').charAt(0).toUpperCase(), 135, 288);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('OFFICIAL PHOTO', 82, 375);

      // 6. Member Details
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('MEMBER FULL NAME', 250, 205);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 30px sans-serif';
      ctx.fillText(member.name, 250, 242);

      const categoryName = member.category?.name || 'Standard Patron';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.roundRect(250, 255, Math.min(420, ctx.measureText(categoryName).width + 36), 30, 8);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`★ ${categoryName}`, 262, 275);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('NRC / KYC CITIZEN ID', 250, 318);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(member.nrcNumber || 'NOT DOCUMENTED', 250, 340);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('PHONE NUMBER', 560, 318);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(member.phone || 'N/A', 560, 340);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('EMAIL ADDRESS', 250, 378);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '15px sans-serif';
      ctx.fillText(member.email || 'N/A', 250, 398);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('STATUS', 560, 378);
      ctx.fillStyle = member.isBlocked ? '#f87171' : '#4ade80';
      ctx.font = '900 15px sans-serif';
      ctx.fillText(member.isBlocked ? '● SUSPENDED' : '● ACTIVE MEMBER', 560, 398);

      // 7. Bottom Barcode Box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(50, 435, width - 100, 150, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Barcode stripes
      const barcodeStr = member.barcode || 'PAT-00000';
      const barcodeStartX = 90;
      const barcodeHeight = 70;
      const barcodeY = 455;

      ctx.fillStyle = '#0f172a';
      let currentX = barcodeStartX;
      ctx.fillRect(currentX, barcodeY, 3, barcodeHeight); currentX += 5;
      ctx.fillRect(currentX, barcodeY, 2, barcodeHeight); currentX += 6;

      for (let i = 0; i < barcodeStr.length; i++) {
        const code = barcodeStr.charCodeAt(i);
        const w1 = (code % 3) + 1.5;
        const gap1 = ((code >> 1) % 3) + 2;
        const w2 = ((code >> 2) % 3) + 1.5;
        const gap2 = ((code >> 3) % 3) + 2.5;
        ctx.fillRect(currentX, barcodeY, w1 * 1.5, barcodeHeight);
        currentX += (w1 * 1.5) + gap1 * 1.5;
        ctx.fillRect(currentX, barcodeY, w2 * 1.5, barcodeHeight);
        currentX += (w2 * 1.5) + gap2 * 1.5;
      }

      ctx.fillRect(width - 110, barcodeY, 2, barcodeHeight);
      ctx.fillRect(width - 104, barcodeY, 3, barcodeHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`* ${member.barcode} *`, width / 2, 555);
      ctx.textAlign = 'left';

      // 8. Footer legal line
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '11px sans-serif';
      ctx.fillText('This card is the property of Ministry of Culture, Hotels & Tourism. Return if found to any branch.', 50, 618);
      ctx.textAlign = 'right';
      ctx.fillText('VALID: 2026 - 2028 · OFFICIAL DLAC PASS', width - 50, 618);
      ctx.textAlign = 'left';

      // 9. Download the generated PNG
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `MemberCard_${member.barcode}_${member.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`Member card for ${member.name} exported as PNG!`, 'success');
    } catch (err) {
      console.error('Failed to export member card:', err);
      showToast('Failed to export card image', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/patron-categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/patrons?q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategoryFilter !== 'ALL') url += `&categoryId=${selectedCategoryFilter}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMembers(data.patrons);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Image Upload Handler for NRC Front/Back
  const handleNrcUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file for the NRC photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (side === 'front') setNrcFrontUrlInput(reader.result);
        else setNrcBackUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setNameInput('');
    setEmailInput('');
    setBarcodeInput('');
    setPhoneInput('');
    setRoleInput('PATRON');
    setCategoryIdInput(categories[0]?.id || '');
    setStatusInput('ACTIVE');
    setBlockReasonInput('');
    setNrcNumberInput('');
    setCurrentLocationInput('');
    setNrcFrontUrlInput('');
    setNrcBackUrlInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setNameInput(member.name);
    setEmailInput(member.email);
    setBarcodeInput(member.barcode);
    setPhoneInput(member.phone || '');
    setRoleInput(member.role);
    setCategoryIdInput(member.categoryId || categories[0]?.id || '');
    setStatusInput(member.isBlocked ? 'SUSPENDED' : 'ACTIVE');
    setBlockReasonInput(member.blockReason || '');
    setNrcNumberInput(member.nrcNumber || '');
    setCurrentLocationInput(member.address || '');
    setNrcFrontUrlInput(member.nrcFrontUrl || '');
    setNrcBackUrlInput(member.nrcBackUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const isBlocked = statusInput === 'SUSPENDED';
      const payload = {
        name: nameInput,
        email: emailInput,
        role: roleInput,
        categoryId: categoryIdInput || null,
        barcode: barcodeInput,
        phone: phoneInput,
        address: currentLocationInput,
        nrcNumber: nrcNumberInput,
        nrcFrontUrl: nrcFrontUrlInput,
        nrcBackUrl: nrcBackUrlInput,
        isBlocked,
        blockReason: isBlocked ? (blockReasonInput || 'Suspended by staff') : null,
      };

      const url = editingMember ? `/api/patrons/${editingMember.id}` : '/api/patrons';
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast(editingMember ? 'Member details updated' : 'New member registered successfully');
        setIsModalOpen(false);
        fetchMembers();
      } else {
        showToast(data.error || 'Failed to save member', 'error');
      }
    } catch {
      showToast('Network error while saving member', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete member record for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/patrons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Member record removed');
        fetchMembers();
      } else {
        showToast(data.error || 'Failed to delete member', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => !m.isBlocked).length;
  const suspendedMembers = members.filter((m) => m.isBlocked).length;
  const kycVerifiedMembers = members.filter((m) => m.nrcNumber).length;

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {lang === 'my' ? 'အဖွဲ့ဝင်နှင့် စာအုပ်ငှားရမ်းသူများ စီမံခန့်ခွဲမှု' : 'Patron & Borrower Management'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Member directory, borrower categories, Myanmar KYC verification, circulation limits, and restriction rules.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.patronMgmt.addPatron || 'New Patron Registration'}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Members</p>
                <p className="text-xl font-black text-slate-900">{totalMembers}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Borrowers</p>
                <p className="text-xl font-black text-emerald-700">{activeMembers}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Suspended / Blocked</p>
                <p className="text-xl font-black text-rose-700">{suspendedMembers}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">KYC Documented</p>
                <p className="text-xl font-black text-indigo-700">{kycVerifiedMembers}</p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Phone, Email, Barcode, NRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <button
                onClick={fetchMembers}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Card / Barcode</th>
                    <th className="px-6 py-3.5">Member & Contact Details</th>
                    <th className="px-6 py-3.5">Borrower Category</th>
                    <th className="px-6 py-3.5">Circulation & Fines</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading members database...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No member records match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Barcode className="w-4 h-4 text-blue-600" />
                            <span>{member.barcode}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {member.email}
                            </span>
                            {member.phone && (
                              <span className="text-[11px] text-emerald-800 font-mono font-semibold flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{member.phone}</span>
                              </span>
                            )}
                            {member.nrcNumber && (
                              <button
                                onClick={() => setKycPreviewMember(member)}
                                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition"
                              >
                                <IdCard className="w-3 h-3 text-blue-700" />
                                <span>NRC: {member.nrcNumber}</span>
                                <Eye className="w-3 h-3 text-blue-600 ml-0.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {member.category ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <GraduationCap className="w-3 h-3" />
                              <span>{member.category.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">Default Patron</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  (member.activeLoanCount ?? 0) > 0
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                {member.activeLoanCount ?? 0} active loans
                              </span>
                              {(member.overdueLoanCount ?? 0) > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                                  {member.overdueLoanCount} overdue
                                </span>
                              )}
                            </div>

                            {(member.unpaidFineTotal ?? 0) > 0 ? (
                              <span className="text-[11px] font-black text-rose-600 block">
                                Fine: {(member.unpaidFineTotal ?? 0).toLocaleString()} MMK
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium block">No outstanding fines</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {member.isBlocked ? (
                            <div className="group relative inline-block">
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 inline-flex items-center gap-1 cursor-help">
                                <AlertTriangle className="w-3 h-3" />
                                <span>SUSPENDED</span>
                              </span>
                              {member.blockReason && (
                                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                  Reason: {member.blockReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedMemberForCard(member)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition"
                              title="Member Card & Export as Image"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Member & KYC"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Add/Edit Member */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>{editingMember ? 'Edit Patron Record & KYC' : 'Register New Member (renter)'}</span>
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Daw Aye Aye Win"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 09-971234567"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        placeholder="member@library.edu"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Library Card / Barcode</label>
                      <input
                        type="text"
                        placeholder="Auto: PAT-XXXXX"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Category & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Borrower Category *</label>
                      <select
                        value={categoryIdInput}
                        onChange={(e) => setCategoryIdInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- General Borrower --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} (Max {cat.maxLoanCount} books, {cat.fineRatePerDay} MMK/day)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Access Role</label>
                      <select
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PATRON">PATRON (Borrowing Member)</option>
                        <option value="STAFF">STAFF (Library Officer)</option>
                        <option value="ADMIN">ADMIN (System Administrator)</option>
                      </select>
                    </div>
                  </div>

                  {/* KYC Section */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-3">
                    <h3 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                      <IdCard className="w-4 h-4 text-blue-700" />
                      <span>Myanmar KYC & Identification Documentation</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">NRC Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 12/DAGAMA(N)123456"
                          value={nrcNumberInput}
                          onChange={(e) => setNrcNumberInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Current Residential Address</label>
                        <input
                          type="text"
                          placeholder="Current township and city"
                          value={currentLocationInput}
                          onChange={(e) => setCurrentLocationInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                        <span className="block font-bold text-slate-800 text-[11px]">NRC Photo (Front)</span>
                        {nrcFrontUrlInput ? (
                          <div className="w-full h-20 rounded border border-slate-300 bg-slate-100 overflow-hidden">
                            <img src={nrcFrontUrlInput} alt="NRC Front" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-20 rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] mt-0.5">No Front Photo</span>
                          </div>
                        )}
                        <label className="cursor-pointer w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold text-center block transition">
                          Upload Front
                          <input type="file" accept="image/*" onChange={(e) => handleNrcUpload(e, 'front')} className="hidden" />
                        </label>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                        <span className="block font-bold text-slate-800 text-[11px]">NRC Photo (Back)</span>
                        {nrcBackUrlInput ? (
                          <div className="w-full h-20 rounded border border-slate-300 bg-slate-100 overflow-hidden">
                            <img src={nrcBackUrlInput} alt="NRC Back" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-20 rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] mt-0.5">No Back Photo</span>
                          </div>
                        )}
                        <label className="cursor-pointer w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold text-center block transition">
                          Upload Back
                          <input type="file" accept="image/*" onChange={(e) => handleNrcUpload(e, 'back')} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Status & Block Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Borrower Status</label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVE">ACTIVE (Borrowing Permitted)</option>
                        <option value="SUSPENDED">SUSPENDED (Borrowing Blocked)</option>
                      </select>
                    </div>

                    {statusInput === 'SUSPENDED' && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Suspension Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Unpaid fine limit exceeded"
                          value={blockReasonInput}
                          onChange={(e) => setBlockReasonInput(e.target.value)}
                          className="w-full bg-rose-50 border border-rose-300 text-rose-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 rounded-lg text-slate-600 font-semibold hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                    >
                      {formSubmitting ? 'Saving...' : 'Save Patron Record'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* KYC Preview Modal */}
          {kycPreviewMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>KYC Document Preview: {kycPreviewMember.name}</span>
                  </h3>
                  <button onClick={() => setKycPreviewMember(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Name:</span>
                    <span className="font-bold text-slate-900">{kycPreviewMember.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Phone:</span>
                    <span className="font-bold text-emerald-800">{kycPreviewMember.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">NRC Number:</span>
                    <span className="font-bold text-blue-900">{kycPreviewMember.nrcNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Address:</span>
                    <span className="font-bold text-slate-800">{kycPreviewMember.address || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block font-bold text-slate-700 mb-1">NRC Front</span>
                    {kycPreviewMember.nrcFrontUrl ? (
                      <img src={kycPreviewMember.nrcFrontUrl} alt="Front" className="w-full h-32 object-cover rounded-lg border border-slate-300" />
                    ) : (
                      <div className="w-full h-32 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        No Front Photo
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="block font-bold text-slate-700 mb-1">NRC Back</span>
                    {kycPreviewMember.nrcBackUrl ? (
                      <img src={kycPreviewMember.nrcBackUrl} alt="Back" className="w-full h-32 object-cover rounded-lg border border-slate-300" />
                    ) : (
                      <div className="w-full h-32 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        No Back Photo
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setKycPreviewMember(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          )}

          {/* Modal: Member Card Preview & Export as Image */}
          {selectedMemberForCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        {lang === 'my' ? 'အမျိုးသား စာကြည့်တိုက် အဖွဲ့ဝင် ကတ်ပြား' : 'National Library Member ID Card'}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'my' ? 'ပုံအဖြစ် ထုတ်ယူနိုင်သော တရားဝင် အဖွဲ့ဝင်ကတ်' : 'Official DLAC Member Card & Image Export'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMemberForCard(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* THE PHYSICAL MEMBER CARD DISPLAY (Standard CR80 Credit Card Ratio) */}
                <div className="relative mx-auto w-full max-w-[480px] bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 rounded-2xl p-4.5 border-2 border-amber-400/90 shadow-2xl text-white overflow-hidden select-none">
                  {/* Decorative Background Elements & Watermark */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border-8 border-amber-400/10 pointer-events-none" />
                  <div className="absolute right-10 top-10 w-64 h-64 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

                  {/* Top Header Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80 mb-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-[1.5px] shadow-sm flex-shrink-0">
                        <img
                          src="/mocht-logo.png"
                          alt="MOCHT Official Seal"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-amber-300 tracking-tight leading-none">
                          ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်
                        </span>
                        <span className="block text-[8px] text-emerald-200 font-medium leading-tight mt-0.5">
                          ယဉ်ကျေးမှု၊ ဟိုတယ်နှင့် ခရီးသွားလာရေး ဝန်ကြီးဌာန · MOCHT
                        </span>
                        <span className="block text-[11px] font-black text-white tracking-wide uppercase mt-0.5">
                          NATIONAL LIBRARY MEMBER PASS
                        </span>
                      </div>
                    </div>

                    {/* Smart RFID Chip Graphic */}
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 border border-amber-200/90 shadow-inner flex flex-col justify-around p-0.5 flex-shrink-0">
                      <div className="w-full h-[1px] bg-amber-800/40" />
                      <div className="w-full h-[1px] bg-amber-800/40" />
                    </div>
                  </div>

                  {/* Middle Content Row: Photo + Details */}
                  <div className="grid grid-cols-12 gap-3.5 mb-3 relative z-10">
                    {/* Photo Box */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="w-24 h-28 rounded-xl bg-emerald-900 border-2 border-amber-400/80 overflow-hidden shadow-md flex items-center justify-center">
                        {selectedMemberForCard.nrcFrontUrl ? (
                          <img
                            src={selectedMemberForCard.nrcFrontUrl}
                            alt={selectedMemberForCard.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-800 to-emerald-950 p-2 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white font-black text-xl flex items-center justify-center mb-1 shadow-xs">
                              {(selectedMemberForCard.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[8px] font-extrabold uppercase text-emerald-300 tracking-wider">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-300 mt-1">
                        {selectedMemberForCard.barcode}
                      </span>
                    </div>

                    {/* Member Details Column */}
                    <div className="col-span-8 flex flex-col justify-between text-left space-y-1">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block">
                          Member Full Name
                        </span>
                        <h3 className="text-sm font-black text-white truncate">
                          {selectedMemberForCard.name}
                        </h3>
                        <div className="mt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                            ★ {selectedMemberForCard.category?.name || 'Standard Member'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-400 block font-bold">NRC CITIZEN ID</span>
                          <span className="font-mono font-bold text-slate-100 truncate block">
                            {selectedMemberForCard.nrcNumber || 'Not Documented'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block font-bold">PHONE</span>
                          <span className="font-mono font-bold text-slate-100 truncate block">
                            {selectedMemberForCard.phone || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-emerald-800/60 text-[9px]">
                        <span className="text-emerald-300">
                          Status: <strong className={selectedMemberForCard.isBlocked ? 'text-rose-400' : 'text-emerald-300'}>
                            {selectedMemberForCard.isBlocked ? 'Suspended' : 'Active Member'}
                          </strong>
                        </span>
                        <span className="text-slate-400 font-mono">
                          ISSUED: 2026
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Barcode Card Container */}
                  <div className="bg-white rounded-xl p-2.5 shadow-inner text-slate-900 flex flex-col items-center justify-center relative z-10">
                    <div className="h-10 w-full flex items-center justify-center gap-[3px] overflow-hidden px-2">
                      {/* Crisp Visual Barcode Lines */}
                      {Array.from({ length: 48 }).map((_, idx) => {
                        const code = (selectedMemberForCard.barcode || 'PAT-00000').charCodeAt(idx % selectedMemberForCard.barcode.length);
                        const isThick = (code + idx) % 3 === 0;
                        const isThin = (code + idx) % 5 === 0;
                        return (
                          <div
                            key={idx}
                            className={`h-full bg-slate-900 ${
                              isThick ? 'w-[4px]' : isThin ? 'w-[1.5px]' : 'w-[2.5px]'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="font-mono font-black text-xs tracking-widest text-slate-900 mt-1">
                      * {selectedMemberForCard.barcode} *
                    </span>
                  </div>

                  {/* Micro Footer Line */}
                  <div className="flex items-center justify-between text-[8px] text-emerald-300/80 mt-2 px-1 relative z-10">
                    <span>Authorized Library Access Card · MOCHT</span>
                    <span>Valid across all National Branches</span>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 text-center sm:text-left">
                    Click <strong>Export as Image</strong> to download high-resolution PNG for printing or laminating.
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>Print</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportMemberCardAsImage(selectedMemberForCard)}
                      disabled={isExportingImage}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExportingImage ? 'Generating PNG...' : 'Export as Image (PNG)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
