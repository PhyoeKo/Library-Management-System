'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import EBookReaderModal from '@/components/EBookReaderModal';
import { Search, BookOpen, FileText, Bookmark, Check, X, Globe, Sparkles, Clock, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

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
  copies: any[];
  eResources: any[];
  earliestDueDate?: string | null;
  pendingHoldsCount: number;
}

export default function OPACPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(''); // '' (All), 'physical', 'ebook'
  const [loading, setLoading] = useState(true);
  const [reservingBookId, setReservingBookId] = useState<string | null>(null);

  // E-Book Reader Modal State
  const [readerState, setReaderState] = useState<{
    isOpen: boolean;
    title: string;
    author: string;
    fileUrl: string;
  }>({
    isOpen: false,
    title: '',
    author: '',
    fileUrl: '',
  });

  // Hold Reservation Modal State
  const [holdModal, setHoldModal] = useState<{
    isOpen: boolean;
    bookTitle: string;
    queuePosition: number;
    dueDate?: string | null;
    message: string;
  }>({
    isOpen: false,
    bookTitle: '',
    queuePosition: 1,
    dueDate: null,
    message: '',
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/books?q=${encodeURIComponent(searchQuery)}&genre=${encodeURIComponent(
          selectedGenre
        )}&format=${encodeURIComponent(selectedFormat)}`
      );
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedGenre, selectedFormat]);

  const handlePlaceHold = async (book: Book) => {
    setReservingBookId(book.id);
    try {
      let patronBarcode = '';
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        const u = JSON.parse(stored);
        patronBarcode = u.barcode || '';
      }

      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          patronBarcode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setHoldModal({
          isOpen: true,
          bookTitle: book.title,
          queuePosition: data.queuePosition,
          dueDate: book.earliestDueDate,
          message: data.message,
        });
        fetchBooks();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReservingBookId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Header & Search Banner */}
      <section className="bg-white border-b border-slate-200 py-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Open-Access E-Books & Physical Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.opac.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.opac.subtitle}
          </p>

          {/* Search & Filter Inputs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto">
            {/* Search query input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.opac.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              <option value="">{t.opac.allCategories}</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
            </select>

            {/* Format Filter (Physical vs E-Book) */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              <option value="">{t.opac.allFormats}</option>
              <option value="physical">📖 {t.opac.physicalOnly}</option>
              <option value="ebook">💻 {t.opac.ebookOnly}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading catalog...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No books found matching criteria.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const totalCopies = book.copies?.length || 0;
              const availableCopies =
                book.copies?.filter((c) => c.status === 'AVAILABLE').length || 0;
              const isCheckedOut = totalCopies > 0 && availableCopies === 0;
              const hasEResource = book.eResources && book.eResources.length > 0;
              const eResource = hasEResource ? book.eResources[0] : null;

              return (
                <div
                  key={book.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition relative overflow-hidden"
                >
                  <div>
                    <div className="flex gap-4 mb-3">
                      <div className="w-16 h-22 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                            {book.genre || 'General'}
                          </span>
                          {hasEResource && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> FREE E-BOOK
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-0.5">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 truncate">by {book.author}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ISBN: {book.isbn}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                      {book.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Status / Due Date / Queuing Info */}
                    <div className="flex flex-col text-xs gap-1">
                      {hasEResource ? (
                        <span className="text-indigo-900 font-bold text-[11px] flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 w-full justify-center">
                          <Globe className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Public Open Access (No Rent Needed)</span>
                        </span>
                      ) : availableCopies > 0 ? (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{availableCopies} / {totalCopies} {t.opac.available}</span>
                        </span>
                      ) : isCheckedOut ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold">
                            <span className="flex items-center gap-1">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Checked Out (0 / {totalCopies})</span>
                            </span>
                            {book.pendingHoldsCount > 0 && (
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                                Queue: {book.pendingHoldsCount} waiting
                              </span>
                            )}
                          </div>
                          {book.earliestDueDate && (
                            <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>
                                Expected Due: {new Date(book.earliestDueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div>
                      {hasEResource ? (
                        <button
                          onClick={() =>
                            setReaderState({
                              isOpen: true,
                              title: book.title,
                              author: book.author,
                              fileUrl: eResource.fileUrl,
                            })
                          }
                          className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{t.opac.readPdf} (Instant Read)</span>
                        </button>
                      ) : isCheckedOut ? (
                        /* RESERVED QUEUE BUTTON FOR RENTED PHYSICAL BOOKS */
                        <button
                          onClick={() => handlePlaceHold(book)}
                          disabled={reservingBookId === book.id}
                          className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>
                            {reservingBookId === book.id
                              ? 'Reserving...'
                              : `Reserve & Join Queue (Position #${book.pendingHoldsCount + 1})`}
                          </span>
                        </button>
                      ) : (
                        /* REGULAR AVAILABLE RENT BUTTON */
                        <button
                          onClick={() => handlePlaceHold(book)}
                          disabled={reservingBookId === book.id}
                          className="w-full flex items-center justify-center space-x-1 py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold shadow-sm transition"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Rent / Hold Physical Copy</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reservation Queue Confirmation Modal */}
      {holdModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <Bookmark className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Hold Reserved & Queued!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                You have joined the hold queue for <span className="font-bold text-slate-900">"{holdModal.bookTitle}"</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Queue Position:</span>
                <span className="font-bold text-amber-700 text-sm bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Position #{holdModal.queuePosition}
                </span>
              </div>
              {holdModal.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Current Borrower Due Date:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(holdModal.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              You will receive a notification as soon as the current borrower returns the book to the circulation desk.
            </p>

            <button
              onClick={() => setHoldModal({ ...holdModal, isOpen: false })}
              className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      <EBookReaderModal
        isOpen={readerState.isOpen}
        onClose={() => setReaderState({ ...readerState, isOpen: false })}
        title={readerState.title}
        author={readerState.author}
        fileUrl={readerState.fileUrl}
      />
    </div>
  );
}
