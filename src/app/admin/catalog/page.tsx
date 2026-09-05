'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Barcode,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  FileText,
  Image as ImageIcon,
  Clock,
  Banknote,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface Copy {
  id: string;
  barcode: string;
  callNumber: string;
  location: string;
  status: string;
  condition: string;
  price?: number;
}

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  genre?: string;
  subject?: string;
  description?: string;
  coverUrl?: string;
  maxRentDays?: number;
  originalPrice?: number;
  dailyFineRate?: number;
  copies: Copy[];
  eResources?: any[];
}

export default function CatalogPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<Book | null>(null);

  // Form State for Add Book
  const [isbnInput, setIsbnInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [publisherInput, setPublisherInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [genreInput, setGenreInput] = useState('Computer Science');
  const [subjectInput, setSubjectInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [coverUrlInput, setCoverUrlInput] = useState('');

  // Requested Fields: Book Type, Copies, PDF URL, Max Rent Days, Original Price (MMK)
  const [bookType, setBookType] = useState<'physical' | 'ebook'>('physical');
  const [numberOfCopies, setNumberOfCopies] = useState('1');
  const [maxRentDaysInput, setMaxRentDaysInput] = useState('7'); // Default 7 days
  const [originalPriceInput, setOriginalPriceInput] = useState(''); // Optional Original Book Price (MMK)
  const [dailyFineRateInput, setDailyFineRateInput] = useState('500'); // Daily Overdue Fine Amount (MMK)
  const [callNumberInput, setCallNumberInput] = useState('QA76.73');
  const [locationInput, setLocationInput] = useState('Main Floor - Shelf CS-01');
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [uploadedPdfSize, setUploadedPdfSize] = useState<number | null>(null);

  const [isbnLookupLoading, setIsbnLookupLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State for Adding Individual Barcode Copy
  const [copyBarcode, setCopyBarcode] = useState('');
  const [copyCallNumber, setCopyCallNumber] = useState('');
  const [copyLocation, setCopyLocation] = useState('Main Floor - Shelf CS-01');
  const [copyCondition, setCopyCondition] = useState('GOOD');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const handleIsbnLookup = async () => {
    if (!isbnInput.trim()) return;
    setIsbnLookupLoading(true);
    setFormMessage(null);
    try {
      const res = await fetch(`/api/isbn-lookup?isbn=${encodeURIComponent(isbnInput)}`);
      const data = await res.json();
      if (data.success && data.metadata) {
        const meta = data.metadata;
        setTitleInput(meta.title || '');
        setAuthorInput(meta.author || '');
        setPublisherInput(meta.publisher || '');
        setYearInput(meta.publicationYear ? String(meta.publicationYear) : '');
        setGenreInput(meta.genre || 'Computer Science');
        setSubjectInput(meta.subject || '');
        if (meta.description) setDescriptionInput(meta.description);
        if (meta.coverUrl) setCoverUrlInput(meta.coverUrl);
        setFormMessage({ type: 'success', text: 'Metadata fetched from ISBN lookup!' });
      } else {
        setFormMessage({ type: 'error', text: data.error || 'ISBN lookup failed.' });
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: 'ISBN auto-fill error.' });
    } finally {
      setIsbnLookupLoading(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file (.pdf).');
      return;
    }

    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'ebooks');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPdfUrlInput(data.fileUrl);
        setUploadedPdfName(data.fileName);
        setUploadedPdfSize(data.fileSize);
      } else {
        alert(data.error || 'Failed to upload PDF file.');
      }
    } catch (err: any) {
      console.error('PDF upload failed:', err);
      alert('Failed to upload PDF file.');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormSubmitting(true);

    try {
      const isEditing = !!editingBook;
      const url = isEditing ? `/api/books/${editingBook.id}` : '/api/books';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isbn: isbnInput,
          title: titleInput,
          author: authorInput,
          publisher: publisherInput,
          publicationYear: yearInput,
          genre: genreInput,
          subject: subjectInput,
          description: descriptionInput,
          coverUrl: coverUrlInput,
          maxRentDays: maxRentDaysInput,
          originalPrice: originalPriceInput,
          dailyFineRate: dailyFineRateInput,
          ...(isEditing ? {} : {
            bookType,
            ...(bookType === 'physical' ? {
              numberOfCopies,
              callNumber: callNumberInput,
              location: locationInput,
            } : {
              pdfUrl: pdfUrlInput,
            }),
          }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddBookModalOpen(false);
        resetBookForm();
        fetchBooks();
      } else {
        setFormMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: editingBook ? 'Failed to update book record.' : 'Failed to create book record.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForCopies) return;
    try {
      const res = await fetch(`/api/books/${selectedBookForCopies.id}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: copyBarcode,
          callNumber: copyCallNumber,
          location: copyLocation,
          condition: copyCondition,
          price: originalPriceInput ? parseFloat(originalPriceInput) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCopyBarcode('');
        setCopyCallNumber('');
        fetchBooks();
        const bookRes = await fetch(`/api/books/${selectedBookForCopies.id}`);
        const bookData = await bookRes.json();
        if (bookData.success) setSelectedBookForCopies(bookData.book);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const resetBookForm = () => {
    setIsbnInput('');
    setTitleInput('');
    setAuthorInput('');
    setPublisherInput('');
    setYearInput('');
    setGenreInput('Computer Science');
    setSubjectInput('');
    setDescriptionInput('');
    setCoverUrlInput('');
    setBookType('physical');
    setNumberOfCopies('1');
    setMaxRentDaysInput('7'); // Default 7 days
    setOriginalPriceInput('');
    setDailyFineRateInput('500');
    setCallNumberInput('QA76.73');
    setLocationInput('Main Floor - Shelf CS-01');
    setPdfUrlInput('');
    setUploadedPdfName(null);
    setUploadedPdfSize(null);
    setFormMessage(null);
    setEditingBook(null);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsbnInput(book.isbn);
    setTitleInput(book.title);
    setAuthorInput(book.author);
    setPublisherInput(book.publisher || '');
    setYearInput(book.publicationYear ? String(book.publicationYear) : '');
    setGenreInput(book.genre || 'Computer Science');
    setSubjectInput(book.subject || '');
    setDescriptionInput(book.description || '');
    setCoverUrlInput(book.coverUrl || '');
    setMaxRentDaysInput(book.maxRentDays ? String(book.maxRentDays) : '7');
    setOriginalPriceInput(book.originalPrice ? String(book.originalPrice) : '');
    setDailyFineRateInput(book.dailyFineRate !== undefined && book.dailyFineRate !== null ? String(book.dailyFineRate) : '500');
    setFormMessage(null);
    setIsAddBookModalOpen(true);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-green-900" />
                <span>{t.cataloging.title}</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {t.cataloging.subtitle}
              </p>
            </div>

            <button
              onClick={() => {
                resetBookForm();
                setIsAddBookModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 bg-green-950 hover:bg-green-900 text-white px-4 py-2.5 rounded-lg font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.cataloging.addRecord}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.cataloging.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
              />
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">{t.cataloging.bookDetails}</th>
                    <th className="px-6 py-3">{t.cataloging.isbn}</th>
                    <th className="px-6 py-3">Type & Price (MMK)</th>
                    <th className="px-6 py-3">{t.cataloging.copiesRatio}</th>
                    <th className="px-6 py-3 text-right">{t.cataloging.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-green-900" />
                        <span>Loading catalog...</span>
                      </td>
                    </tr>
                  ) : books.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No bibliographic records.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => {
                      const totalCopies = book.copies?.length || 0;
                      const availableCopies =
                        book.copies?.filter((c) => c.status === 'AVAILABLE').length || 0;
                      const hasEBook = book.eResources && book.eResources.length > 0;

                      return (
                        <tr key={book.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-16 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {book.coverUrl ? (
                                  <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-xs line-clamp-1">
                                  {book.title}
                                </h3>
                                <p className="text-[11px] text-slate-500">by {book.author}</p>
                                {book.description && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                                    {book.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs text-slate-600">
                            {book.isbn}
                          </td>

                          <td className="px-6 py-4 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {totalCopies > 0 && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                                  📖 Physical ({totalCopies})
                                </span>
                              )}
                              {totalCopies > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-mono text-[10px] border border-amber-200">
                                  Max: {book.maxRentDays || 7} Days
                                </span>
                              )}
                              {totalCopies > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-900 font-mono text-[10px] border border-rose-200" title="Overdue fine calculated per day">
                                  Fine: {(book.dailyFineRate ?? 500).toLocaleString()} MMK/day
                                </span>
                              )}
                              {book.originalPrice ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 font-mono font-bold text-[10px] border border-emerald-200">
                                  {book.originalPrice.toLocaleString()} MMK
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono text-[10px]">
                                  No Price Set
                                </span>
                              )}
                              {hasEBook && (
                                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px] border border-indigo-200">
                                  💻 Free E-Book
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1.5 font-bold">
                              <span className="text-green-900">{availableCopies}</span>
                              <span className="text-slate-400">/ {totalCopies}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleEditBook(book)}
                                className="p-2 text-slate-500 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                title="Edit book"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(book.id, book.title)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete book"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* Modal: Add Book */}
          {isAddBookModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-900" />
                    <span>{editingBook ? 'Edit Bibliographic Record' : t.cataloging.addRecord}</span>
                  </h2>
                  <button onClick={() => setIsAddBookModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
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

                <form onSubmit={handleSubmitBook} className="space-y-4">
                  {/* ISBN with Auto-Fill */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.cataloging.isbn} *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 9780131103627"
                        value={isbnInput}
                        onChange={(e) => setIsbnInput(e.target.value)}
                        required
                        className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleIsbnLookup}
                        disabled={isbnLookupLoading}
                        className="bg-green-100 text-green-900 hover:bg-green-200 font-bold px-3 py-2 rounded-lg transition"
                      >
                        {isbnLookupLoading ? 'Fetching...' : t.cataloging.isbnAutoFill}
                      </button>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                      <input
                        type="text"
                        placeholder="Book Title"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Author *</label>
                      <input
                        type="text"
                        placeholder="Author Name"
                        value={authorInput}
                        onChange={(e) => setAuthorInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                      />
                    </div>
                  </div>

                  {/* Book Description / Intro */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Book Description & Intro Summary
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter a brief summary, introduction, or synopsis of the book..."
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                    />
                  </div>

                  {/* Book Cover Image */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-green-900" />
                      <span>Book Cover Image</span>
                    </label>

                    <div className="flex items-center gap-4">
                      {coverUrlInput ? (
                        <div className="w-16 h-20 rounded border border-slate-300 bg-white overflow-hidden flex-shrink-0">
                          <img src={coverUrlInput} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                          <BookOpen className="w-6 h-6" />
                          <span className="text-[9px] mt-1">No Cover</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-950 hover:bg-green-900 text-white text-xs font-bold shadow-sm transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Pick Image From Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">or enter URL below</span>
                        </div>

                        <input
                          type="text"
                          placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                        />
                      </div>
                    </div>
                  </div>

                  {!editingBook && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <label className="block font-bold text-slate-800">
                      Type of Book Format *
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBookType('physical')}
                        className={`p-3 rounded-lg border text-left flex items-center space-x-2 transition ${
                          bookType === 'physical'
                            ? 'bg-green-900 border-green-900 text-white font-bold shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-lg">📖</span>
                        <div>
                          <span className="block text-xs">Physical Book</span>
                          <span className="text-[10px] opacity-80 font-normal">Physical copies with barcodes</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookType('ebook')}
                        className={`p-3 rounded-lg border text-left flex items-center space-x-2 transition ${
                          bookType === 'ebook'
                            ? 'bg-indigo-900 border-indigo-900 text-white font-bold shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-lg">💻</span>
                        <div>
                          <span className="block text-xs">E-Book (Digital)</span>
                          <span className="text-[10px] opacity-80 font-normal">Free public PDF digital asset</span>
                        </div>
                      </button>
                    </div>

                    {/* Conditional Fields for Physical Books: Copies & Shelf Location */}
                    {bookType === 'physical' && (
                      <div className="space-y-3 pt-2">
                        {/* Physical Copies & Shelf Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 text-xs">
                              Number of Physical Copies
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={numberOfCopies}
                              onChange={(e) => setNumberOfCopies(e.target.value)}
                              required
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-green-800"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-semibold text-slate-700 mb-1 text-xs">
                              Call Number & Shelf Location
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Call Number (e.g. QA76.73)"
                                value={callNumberInput}
                                onChange={(e) => setCallNumberInput(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                              />
                              <input
                                type="text"
                                placeholder="Location (e.g. Shelf CS-01)"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Original Book Replacement Price (MMK) - Optional */}
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                          <label className="block font-bold text-emerald-900 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <Banknote className="w-4 h-4 text-emerald-700" />
                              <span>Original Book Price (MMK) — Optional</span>
                            </span>
                            <span className="text-[10px] font-normal text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              POS Replacement Fee
                            </span>
                          </label>
                          <div className="flex rounded-lg border border-emerald-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700">
                            <input
                              type="number"
                              placeholder="e.g. 25000"
                              value={originalPriceInput}
                              onChange={(e) => setOriginalPriceInput(e.target.value)}
                              className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                            />
                            <span className="inline-flex items-center px-3 text-xs font-bold text-emerald-800 bg-emerald-100/70 border-l border-emerald-200 select-none whitespace-nowrap">
                              MMK
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-800">
                            If a member loses or damages this physical book, this price will be used for POS replacement fee billing.
                          </p>
                        </div>

                        {/* Rent Duration & Overdue Fine Rate Configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Maximum Rent Days */}
                          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                            <div>
                              <label className="block font-bold text-amber-950 flex items-center gap-1.5 text-xs mb-1">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>Maximum Rent Days (Default 7) *</span>
                              </label>
                              <div className="flex rounded-lg border border-amber-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-600">
                                <input
                                  type="number"
                                  min="1"
                                  max="90"
                                  value={maxRentDaysInput}
                                  onChange={(e) => setMaxRentDaysInput(e.target.value)}
                                  required={bookType === 'physical'}
                                  className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-extrabold focus:outline-none"
                                />
                                <span className="inline-flex items-center px-3 text-xs font-bold text-amber-900 bg-amber-100 border-l border-amber-200 select-none whitespace-nowrap">
                                  Days
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-amber-800">
                              Default loan duration allowed before this book is marked overdue.
                            </p>
                          </div>

                          {/* Overdue Book Fine Amount (MMK / Day) */}
                          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                            <div>
                              <label className="block font-bold text-rose-950 flex items-center gap-1.5 text-xs mb-1">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Overdue Fine Amount (MMK / Day) *</span>
                              </label>
                              <div className="flex rounded-lg border border-rose-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-rose-600">
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  placeholder="e.g. 500"
                                  value={dailyFineRateInput}
                                  onChange={(e) => setDailyFineRateInput(e.target.value)}
                                  required={bookType === 'physical'}
                                  className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-extrabold focus:outline-none"
                                />
                                <span className="inline-flex items-center px-3 text-xs font-bold text-rose-800 bg-rose-100 border-l border-rose-200 select-none whitespace-nowrap">
                                  MMK / day
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-rose-800">
                              Calculates fine for all overdue days: <strong>Overdue Days × {dailyFineRateInput || 0} MMK</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields for E-Books: Upload PDF from computer or enter URL */}
                    {bookType === 'ebook' && (
                      <div className="pt-2 space-y-3">
                        <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-700" />
                          <span>PDF File (Upload from Device or enter URL) *</span>
                        </label>

                        {/* File Upload from Computer Button */}
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition ${
                              pdfUploading
                                ? 'bg-indigo-300 text-white cursor-not-allowed'
                                : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{pdfUploading ? 'Uploading PDF from Computer...' : 'Upload PDF from Computer'}</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handlePdfFileUpload}
                              disabled={pdfUploading}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">or enter PDF URL / link below</span>
                        </div>

                        {/* Upload Status Card */}
                        {uploadedPdfName && (
                          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 truncate">
                                <span className="font-bold text-slate-900 truncate block">{uploadedPdfName}</span>
                                {uploadedPdfSize && (
                                  <span className="text-[10px] text-indigo-700 font-mono">
                                    {(uploadedPdfSize / (1024 * 1024)).toFixed(2)} MB • Uploaded & Ready
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-3 h-3" /> Uploaded
                            </span>
                          </div>
                        )}

                        {/* Direct URL input */}
                        <div>
                          <input
                            type="text"
                            placeholder="e.g. /uploads/ebooks/my-book.pdf or https://..."
                            value={pdfUrlInput}
                            onChange={(e) => {
                              setPdfUrlInput(e.target.value);
                              if (!e.target.value.startsWith('/uploads/')) {
                                setUploadedPdfName(null);
                                setUploadedPdfSize(null);
                              }
                            }}
                            required
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-700"
                          />
                        </div>

                        <p className="text-[10px] text-slate-500">
                          E-Books do not require copy counts or rental holds. Any public visitor can read it instantly via the built-in reader.
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Physical Book Rental & Fine Configuration inside Edit Modal */}
                  {editingBook && (!editingBook.eResources || editingBook.eResources.length === 0) && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      {/* Original Book Replacement Price (MMK) */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                        <label className="block font-bold text-emerald-900 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-700" />
                            <span>Original Book Price (MMK) — Optional</span>
                          </span>
                          <span className="text-[10px] font-normal text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            POS Replacement Fee
                          </span>
                        </label>
                        <div className="flex rounded-lg border border-emerald-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700">
                          <input
                            type="number"
                            placeholder="e.g. 25000"
                            value={originalPriceInput}
                            onChange={(e) => setOriginalPriceInput(e.target.value)}
                            className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                          />
                          <span className="inline-flex items-center px-3 text-xs font-bold text-emerald-800 bg-emerald-100/70 border-l border-emerald-200 select-none whitespace-nowrap">
                            MMK
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-800">
                          Used to calculate replacement fee billing if a member loses this book.
                        </p>
                      </div>

                      {/* Rent Duration & Overdue Fine Rate */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                          <div>
                            <label className="block font-bold text-amber-950 flex items-center gap-1.5 text-xs mb-1">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Maximum Rent Days (Default 7) *</span>
                            </label>
                            <div className="flex rounded-lg border border-amber-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-600">
                              <input
                                type="number"
                                min="1"
                                max="90"
                                value={maxRentDaysInput}
                                onChange={(e) => setMaxRentDaysInput(e.target.value)}
                                required
                                className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-extrabold focus:outline-none"
                              />
                              <span className="inline-flex items-center px-3 text-xs font-bold text-amber-900 bg-amber-100 border-l border-amber-200 select-none whitespace-nowrap">
                                Days
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                          <div>
                            <label className="block font-bold text-rose-950 flex items-center gap-1.5 text-xs mb-1">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>Overdue Fine Amount (MMK / Day) *</span>
                            </label>
                            <div className="flex rounded-lg border border-rose-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-rose-600">
                              <input
                                type="number"
                                min="0"
                                step="50"
                                placeholder="e.g. 500"
                                value={dailyFineRateInput}
                                onChange={(e) => setDailyFineRateInput(e.target.value)}
                                required
                                className="w-full bg-white text-slate-900 px-3 py-2 text-xs font-mono font-extrabold focus:outline-none"
                              />
                              <span className="inline-flex items-center px-3 text-xs font-bold text-rose-800 bg-rose-100 border-l border-rose-200 select-none whitespace-nowrap">
                                MMK / day
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Physical Copies Overview inside Edit Modal */}
                  {editingBook && (!editingBook.eResources || editingBook.eResources.length === 0) && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-green-900" />
                          <span>Assigned Physical Barcodes ({editingBook.copies?.length || 0})</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBookForCopies(editingBook);
                          }}
                          className="text-xs text-green-800 hover:text-green-950 font-bold underline"
                        >
                          + Add More Copies
                        </button>
                      </div>
                      {editingBook.copies && editingBook.copies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          {editingBook.copies.map((copy: any) => (
                            <div
                              key={copy.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono shadow-xs"
                            >
                              <span className="font-bold text-slate-800">{copy.barcode}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold uppercase ${
                                  copy.status === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {copy.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">No physical copies registered yet.</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddBookModalOpen(false)}
                      className="px-3 py-2 rounded-lg text-slate-600 font-semibold hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-5 py-2 rounded-lg bg-green-950 hover:bg-green-900 text-white font-bold shadow-sm"
                    >
                      {formSubmitting
                        ? 'Saving...'
                        : editingBook
                        ? 'Update Bibliographic Record'
                        : 'Save Bibliographic Record'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Copies */}
          {selectedBookForCopies && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-green-900" />
                    <span>{t.cataloging.manageBarcodes}: {selectedBookForCopies.title}</span>
                  </h2>
                  <button onClick={() => setSelectedBookForCopies(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleAddCopy} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <h4 className="font-bold text-slate-800 mb-2">{t.cataloging.assignBarcode}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Barcode (e.g. BC-1005)"
                      value={copyBarcode}
                      onChange={(e) => setCopyBarcode(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Call Number"
                      value={copyCallNumber}
                      onChange={(e) => setCopyCallNumber(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={copyLocation}
                      onChange={(e) => setCopyLocation(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <button type="submit" className="mt-3 bg-green-950 hover:bg-green-900 text-white font-bold px-3 py-1.5 rounded">
                    {t.cataloging.addBarcodeBtn}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
