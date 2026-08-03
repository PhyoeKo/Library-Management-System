'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
  Upload,
  MapPin,
  IdCard,
  Image as ImageIcon,
  Eye,
  Phone,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface Member {
  id: string;
  name: string;
  email: string;
  barcode: string;
  role: string;
  phone?: string;
  address?: string;
  nrcNumber?: string;
  nrcFrontUrl?: string;
  nrcBackUrl?: string;
  kycStatus?: string;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: string;
}

export default function MemberManagementPage() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState('PATRON');
  const [statusInput, setStatusInput] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // KYC Requested Fields
  const [nrcNumberInput, setNrcNumberInput] = useState('');
  const [currentLocationInput, setCurrentLocationInput] = useState('');
  const [nrcFrontUrlInput, setNrcFrontUrlInput] = useState('');
  const [nrcBackUrlInput, setNrcBackUrlInput] = useState('');

  // KYC Preview Modal State
  const [kycPreviewMember, setKycPreviewMember] = useState<Member | null>(null);

  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patrons?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.patrons);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [searchQuery]);

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
    setStatusInput('ACTIVE');
    setNrcNumberInput('');
    setCurrentLocationInput('');
    setNrcFrontUrlInput('');
    setNrcBackUrlInput('');
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setNameInput(member.name);
    setEmailInput(member.email);
    setBarcodeInput(member.barcode);
    setPhoneInput(member.phone || '');
    setRoleInput(member.role);
    setStatusInput(member.isBlocked ? 'SUSPENDED' : 'ACTIVE');
    setNrcNumberInput(member.nrcNumber || '');
    setCurrentLocationInput(member.address || '');
    setNrcFrontUrlInput(member.nrcFrontUrl || '');
    setNrcBackUrlInput(member.nrcBackUrl || '');
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormSubmitting(true);

    try {
      const isBlocked = statusInput === 'SUSPENDED';

      if (editingMember) {
        const res = await fetch(`/api/patrons/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput,
            email: emailInput,
            role: roleInput,
            barcode: barcodeInput,
            phone: phoneInput,
            address: currentLocationInput,
            nrcNumber: nrcNumberInput,
            nrcFrontUrl: nrcFrontUrlInput,
            nrcBackUrl: nrcBackUrlInput,
            isBlocked,
            blockReason: isBlocked ? 'Blocked by admin' : null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchMembers();
        } else {
          setFormMessage({ type: 'error', text: data.error });
        }
      } else {
        const res = await fetch('/api/patrons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput,
            email: emailInput,
            role: roleInput,
            barcode: barcodeInput,
            phone: phoneInput,
            address: currentLocationInput,
            nrcNumber: nrcNumberInput,
            nrcFrontUrl: nrcFrontUrlInput,
            nrcBackUrl: nrcBackUrlInput,
            isBlocked,
            blockReason: isBlocked ? 'Blocked by admin' : null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchMembers();
        } else {
          setFormMessage({ type: 'error', text: data.error });
        }
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: 'Operation failed.' });
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
        fetchMembers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-900" />
                <span>{t.patronMgmt.title}</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {t.patronMgmt.subtitle}
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center space-x-2 bg-blue-950 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.patronMgmt.addPatron}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Members by Actual Name, Phone, Email, Barcode, or NRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">{t.patronMgmt.barcode}</th>
                    <th className="px-6 py-3">Member & Contact Info</th>
                    <th className="px-6 py-3">Current Location</th>
                    <th className="px-6 py-3">{t.patronMgmt.roleType}</th>
                    <th className="px-6 py-3">{t.patronMgmt.status}</th>
                    <th className="px-6 py-3 text-right">{t.patronMgmt.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-900" />
                        <span>Loading members...</span>
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No member records found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Barcode className="w-4 h-4 text-blue-900" />
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

                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                          {member.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                              <span className="truncate">{member.address}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              member.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : member.role === 'STAFF'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {member.role === 'PATRON' ? 'MEMBER' : member.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {member.isBlocked ? (
                            <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                              {t.patronMgmt.suspended}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              {t.patronMgmt.active}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition"
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

          {/* Modal: Add/Edit Member & KYC Information */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <span>{editingMember ? 'Edit Member & KYC' : t.patronMgmt.addPatron}</span>
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                {formMessage && (
                  <div
                    className={`p-3 rounded-lg mb-4 text-xs font-semibold flex items-center gap-2 ${
                      formMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    {formMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{formMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  {/* Basic Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Actual Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aung Kyaw Oo"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Phone Number *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 09-971234567"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{t.patronMgmt.email} *</label>
                      <input
                        type="email"
                        placeholder="aungkyaw@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{t.patronMgmt.barcode}</label>
                      <input
                        type="text"
                        placeholder="Auto: PAT-XXXXX"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* KYC Section: NRC & Current Location */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-3">
                    <h3 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                      <IdCard className="w-4 h-4 text-blue-800" />
                      <span>Myanmar KYC & Identification Verification</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          NRC Number (National Registration)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12/DAGAMA(N)123456"
                          value={nrcNumberInput}
                          onChange={(e) => setNrcNumberInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Current Location / Address
                        </label>
                        <input
                          type="text"
                          placeholder="Current residential address in Myanmar"
                          value={currentLocationInput}
                          onChange={(e) => setCurrentLocationInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>
                    </div>

                    {/* NRC Photo Uploads (Front & Back) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* NRC Front */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                        <span className="block font-bold text-slate-800 text-[11px]">NRC Photo (Front)</span>
                        {nrcFrontUrlInput ? (
                          <div className="w-full h-24 rounded border border-slate-300 bg-slate-100 overflow-hidden">
                            <img src={nrcFrontUrlInput} alt="NRC Front" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] mt-1">No Front Photo</span>
                          </div>
                        )}
                        <label className="cursor-pointer w-full py-1.5 px-2 rounded bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold text-center block transition">
                          Upload Front Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNrcUpload(e, 'front')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* NRC Back */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                        <span className="block font-bold text-slate-800 text-[11px]">NRC Photo (Back)</span>
                        {nrcBackUrlInput ? (
                          <div className="w-full h-24 rounded border border-slate-300 bg-slate-100 overflow-hidden">
                            <img src={nrcBackUrlInput} alt="NRC Back" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] mt-1">No Back Photo</span>
                          </div>
                        )}
                        <label className="cursor-pointer w-full py-1.5 px-2 rounded bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold text-center block transition">
                          Upload Back Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNrcUpload(e, 'back')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Role & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Role / Access Level</label>
                      <select
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                      >
                        <option value="PATRON">PATRON (Student / Member)</option>
                        <option value="STAFF">STAFF (Librarian)</option>
                        <option value="ADMIN">ADMIN (System Administrator)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Membership Status</label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                      >
                        <option value="ACTIVE">Active (Permitted)</option>
                        <option value="SUSPENDED">Suspended (Blocked)</option>
                      </select>
                    </div>
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
                      className="px-5 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold shadow-sm"
                    >
                      {formSubmitting ? 'Saving...' : 'Save Member Record'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: View Member KYC Details */}
          {kycPreviewMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>KYC Document Preview: {kycPreviewMember.name}</span>
                  </h3>
                  <button onClick={() => setKycPreviewMember(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Actual Name:</span>
                    <span className="font-bold text-slate-900">{kycPreviewMember.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Phone Number:</span>
                    <span className="font-bold text-emerald-800">{kycPreviewMember.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">NRC Number:</span>
                    <span className="font-bold text-blue-900">{kycPreviewMember.nrcNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Current Location:</span>
                    <span className="font-bold text-slate-800">{kycPreviewMember.address || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block font-bold text-slate-700 mb-1">NRC Front Photo</span>
                    {kycPreviewMember.nrcFrontUrl ? (
                      <img src={kycPreviewMember.nrcFrontUrl} alt="Front" className="w-full h-32 object-cover rounded-lg border border-slate-300" />
                    ) : (
                      <div className="w-full h-32 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        No Front Photo
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="block font-bold text-slate-700 mb-1">NRC Back Photo</span>
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
        </main>
      </div>
    </AdminGuard>
  );
}
