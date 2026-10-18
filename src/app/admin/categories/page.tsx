'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

interface BookCategory {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  icon?: string | null;
  bookCount?: number;
  createdAt?: string;
}

export default function BookCategoriesPage() {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BookCategory | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<BookCategory | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/book-categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setNameInput('');
    setCodeInput('');
    setDescriptionInput('');
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: BookCategory) => {
    setEditingCategory(cat);
    setNameInput(cat.name);
    setCodeInput(cat.code || '');
    setDescriptionInput(cat.description || '');
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setFormSubmitting(true);
    setFormMessage(null);

    try {
      const url = editingCategory
        ? `/api/book-categories/${editingCategory.id}`
        : '/api/book-categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          code: codeInput.trim() || undefined,
          description: descriptionInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormMessage({
          type: 'success',
          text: editingCategory
            ? (lang === 'my' ? 'အမျိုးအစား ပြင်ဆင်ခြင်း အောင်မြင်ပါသည်' : 'Category updated successfully.')
            : (lang === 'my' ? 'အမျိုးအစား အသစ်ထည့်သွင်းခြင်း အောင်မြင်ပါသည်' : 'Category created successfully.'),
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchCategories();
        }, 600);
      } else {
        setFormMessage({ type: 'error', text: data.error || 'Operation failed.' });
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'Network request failed.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/book-categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeletingCategory(null);
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      alert('Network request failed.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/admin/catalog"
                  className="text-xs text-slate-500 hover:text-green-900 font-bold inline-flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'my' ? 'စာအုပ်စာရင်း သို့ပြန်သွားရန်' : 'Back to Catalog'}</span>
                </Link>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-green-900" />
                <span>{lang === 'my' ? 'စာအုပ် အမျိုးအစားများ စီမံခန့်ခွဲမှု' : 'Book Categories Management'}</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {lang === 'my'
                  ? 'စာအုပ်အမျိုးအစား (Genre/Category) များကို ဖန်တီး၊ ပြင်ဆင်၊ ဖျက်ပစ်နိုင်ပြီး စာအုပ်များတွင် ချိတ်ဆက်အသုံးပြုနိုင်ပါသည်။'
                  : 'Create, edit, rename, and manage book categories and genres used throughout the library catalog.'}
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-900 hover:bg-green-800 text-white text-xs font-bold shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'my' ? 'အမျိုးအစား အသစ်ထည့်မည်' : 'Add New Category'}</span>
            </button>
          </div>

          {/* Search bar & Statistics */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'my' ? 'အမျိုးအစား အမည်ဖြင့် ရှာဖွေပါ...' : 'Search categories by name or code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              <span>{lang === 'my' ? 'စုစုပေါင်း အမျိုးအစား: ' : 'Total Categories: '}</span>
              <span className="font-bold text-slate-900 font-mono">{categories.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Category Name</th>
                    <th className="px-6 py-3.5">System Code</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Assigned Books</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-green-900" />
                        <span>Loading categories...</span>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        No categories found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-green-700 flex-shrink-0" />
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                          {cat.code || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
                          {cat.description || '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              (cat.bookCount || 0) > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{cat.bookCount || 0} books</span>
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Add / Edit Category Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-900" />
                  <span>{editingCategory ? 'Edit Book Category' : 'Add New Book Category'}</span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              {formMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {formMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{formMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science Fiction, Myanmar History"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                  />
                  {editingCategory && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      Note: Renaming this category will automatically update all books currently assigned to "{editingCategory.name}".
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SCI_FI, MM_HIST"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-800 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description or classification notes..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-2 rounded-xl bg-green-900 hover:bg-green-800 text-white font-bold transition shadow cursor-pointer"
                  >
                    {formSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-xs space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Category</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingCategory.name}"</span>?
                </p>
                {(deletingCategory.bookCount || 0) > 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                    {deletingCategory.bookCount} books currently in this category will be safely reassigned to "General".
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  disabled={deleteSubmitting}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteSubmitting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow cursor-pointer"
                >
                  {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
