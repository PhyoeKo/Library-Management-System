'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import EBookReaderModal from '@/components/EBookReaderModal';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  FileText,
  Bookmark,
  Check,
  X,
  Globe,
  Sparkles,
  Clock,
  Users,
  CheckCircle,
  Lock,
  LogIn,
  BookmarkCheck,
  ExternalLink,
  Flame,
  Rocket,
  Award,
  Layers,
  Landmark,
  Laptop,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
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
  holds?: any[];
  earliestDueDate?: string | null;
  pendingHoldsCount: number;
  isTrending?: boolean;
  trendingRank?: number | null;
  isLatest?: boolean;
  totalLoansCount?: number;
  activeLoansCount?: number;
  popularityScore?: number;
}

export default function OPACPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(''); // '' (All), 'physical', 'ebook'
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('default');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);
  const [collectionCounts, setCollectionCounts] = useState<{
    all: number;
    trending: number;
    latest: number;
    most_borrowed: number;
    myanmar_classics: number;
    tech: number;
  }>({
    all: 0,
    trending: 0,
    latest: 0,
    most_borrowed: 0,
    myanmar_classics: 0,
    tech: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reservingBookId, setReservingBookId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Login Required Modal State
  const [loginModal, setLoginModal] = useState<{
    isOpen: boolean;
    bookTitle: string;
  }>({
    isOpen: false,
    bookTitle: '',
  });

  const loadUser = () => {
    try {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    const handleAuthChange = () => loadUser();
    window.addEventListener('lms-auth-change', handleAuthChange);
    return () => window.removeEventListener('lms-auth-change', handleAuthChange);
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/books?q=${encodeURIComponent(searchQuery)}&genre=${encodeURIComponent(
          selectedGenre
        )}&format=${encodeURIComponent(selectedFormat)}&collection=${encodeURIComponent(
          selectedCollection
        )}&sort=${encodeURIComponent(selectedSort)}`
      );
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
        if (data.genres) setAvailableGenres(data.genres);
        if (data.totalCatalogCount !== undefined) setTotalCatalogCount(data.totalCatalogCount);
        if (data.collectionCounts) setCollectionCounts(data.collectionCounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedGenre, selectedFormat, selectedCollection, selectedSort]);

  const handlePlaceHold = async (book: Book) => {
    if (!currentUser) {
      setLoginModal({
        isOpen: true,
        bookTitle: book.title,
      });
      return;
    }

    // Check if user already rented this book
    const activeLoan = book.copies?.flatMap((c) => c.loans || []).find((l: any) => l.userId === currentUser.id);
    if (activeLoan) {
      alert(
        lang === 'my'
          ? 'ဤစာအုပ်ကို သင့်အကောင့်ဖြင့် လက်ရှိငှားရမ်းထားပြီးဖြစ်ပါသည်။ ၁ ဦးလျှင် ၁ အုပ်သာ ငှားရမ်း/မှာယူခွင့်ရှိပါသည်။'
          : 'You currently have an active borrowed copy of this book. Each member account can only rent or hold one copy.'
      );
      return;
    }

    // Check if user already placed a hold on this book
    const existingHold = book.holds?.find((h: any) => h.userId === currentUser.id && (h.status === 'PENDING' || h.status === 'APPROVED'));
    if (existingHold) {
      alert(
        lang === 'my'
          ? 'ဤစာအုပ်ကို သင့်အကောင့်ဖြင့် ကြိုတင်မှာယူထားပြီးဖြစ်ပါသည်။ ၁ ဦးလျှင် ၁ အုပ်သာ ငှားရမ်း/မှာယူခွင့်ရှိပါသည်။'
          : 'You already have an active hold on this book. Each member account can only rent or hold one copy.'
      );
      return;
    }

    setReservingBookId(book.id);
    try {
      const patronBarcode = currentUser.barcode || '';
      const patronEmail = currentUser.email || '';

      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          patronBarcode,
          patronEmail,
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
        alert(data.error || 'Failed to place reservation.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReservingBookId(null);
    }
  };

  // Derive top spotlight books when viewing all
  const trendingSpotlight = books
    .filter((b) => b.isTrending)
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, 5);

  const latestSpotlight = [...books]
    .filter((b) => b.publicationYear)
    .sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0))
    .slice(0, 5);

  const isBrowsingAll =
    selectedCollection === 'all' &&
    searchQuery.trim() === '' &&
    selectedGenre === '' &&
    selectedFormat === '';

  const renderBookCard = (book: Book, isSpotlight = false) => {
    const totalCopies = book.copies?.length || 0;
    const availableCopies =
      book.copies?.filter((c) => c.status === 'AVAILABLE').length || 0;
    const isCheckedOut = totalCopies > 0 && availableCopies === 0;
    const hasEResource = book.eResources && book.eResources.length > 0;
    const eResource = hasEResource ? book.eResources[0] : null;

    // Member loan / hold status for this book
    const activeUserLoan = currentUser
      ? book.copies?.flatMap((c) => c.loans || []).find((l: any) => l.userId === currentUser.id)
      : null;
    const userHoldIndex = currentUser && book.holds
      ? book.holds.findIndex(
          (h: any) =>
            h.userId === currentUser.id && (h.status === 'PENDING' || h.status === 'APPROVED')
        )
      : -1;
    const userHold = userHoldIndex !== -1 ? book.holds![userHoldIndex] : null;
    const userHoldPosition = userHoldIndex !== -1 ? userHoldIndex + 1 : null;

    return (
      <div
        key={book.id}
        className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition relative overflow-hidden ${
          isSpotlight ? 'w-72 sm:w-80 flex-shrink-0' : ''
        }`}
      >
        <div>
          <div className="flex gap-3.5 mb-3">
            <div className="w-16 h-22 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-6 h-6 text-slate-400" />
              )}
              {book.trendingRank && book.trendingRank <= 5 && (
                <span className="absolute top-1 left-1 bg-amber-500 text-white font-black text-[9px] px-1 py-0.2 rounded shadow">
                  #{book.trendingRank}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider block truncate max-w-[130px]">
                  {book.genre || 'General'}
                </span>
                {book.isTrending && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                    {book.trendingRank ? `#${book.trendingRank} TRENDING` : 'TRENDING'}
                  </span>
                )}
                {book.isLatest && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-200 flex items-center gap-0.5">
                    <Rocket className="w-2.5 h-2.5 text-sky-600" />
                    {book.publicationYear ? `${book.publicationYear}` : 'NEW'}
                  </span>
                )}
                {hasEResource && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> FREE E-BOOK
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-0.5" title={book.title}>
                {book.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 truncate">by {book.author}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                <span>ISBN: {book.isbn}</span>
                {book.publicationYear && (
                  <span className="text-slate-400">· {book.publicationYear}</span>
                )}
              </div>
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
            ) : activeUserLoan ? (
              /* USER CURRENTLY HAS THIS BOOK RENTED */
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-emerald-900 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'my' ? 'လက်ရှိ ငှားရမ်းထားသည်' : 'Currently Borrowed by You'}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase">
                    {activeUserLoan.status === 'OVERDUE'
                      ? (lang === 'my' ? 'ရက်လွန်' : 'OVERDUE')
                      : (lang === 'my' ? 'ငှားရမ်းဆဲ' : 'ACTIVE LOAN')}
                  </span>
                </div>
                {activeUserLoan.dueDate && (
                  <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>
                      {lang === 'my' ? 'ပြန်အပ်ရမည့်ရက်: ' : 'Your Due Date: '}
                      {new Date(activeUserLoan.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : userHold ? (
              /* USER CURRENTLY HAS AN ACTIVE HOLD ON THIS BOOK */
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'my' ? 'သင့်အကောင့်ဖြင့် မှာယူထားပြီး' : 'Hold Placed by You'}</span>
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">
                    {userHold.status === 'APPROVED'
                      ? (lang === 'my' ? 'ထုတ်ယူနိုင်ပါပြီ' : 'READY FOR PICKUP')
                      : (lang === 'my' ? `တန်းစီ #${userHoldPosition}` : `Queue #${userHoldPosition}`)}
                  </span>
                </div>
                <div className="text-[10px] text-amber-800 font-medium">
                  {userHold.status === 'APPROVED'
                    ? (lang === 'my'
                        ? 'စာကြည့်တိုက်ကောင်တာတွင် လာရောက်ထုတ်ယူနိုင်ပါပြီ'
                        : 'Approved! Ready for collection at library circulation desk.')
                    : (lang === 'my'
                        ? 'အကောင့်တစ်ခုလျှင် ၁ ကြိမ်သာ ငှားရမ်း/မှာယူခွင့်ရှိပါသည်'
                        : 'Active hold on account (Limit 1 per account).')}
                </div>
              </div>
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
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-green-900 hover:bg-green-800 text-white text-xs font-bold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>{t.opac.readPdf} (Instant Read)</span>
              </button>
            ) : !currentUser ? (
              /* GUEST USER / NOT LOGGED IN */
              <button
                onClick={() => handlePlaceHold(book)}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'my' ? 'စာအုပ်ငှားရန် အကောင့်ဝင်ပါ' : 'Sign in to Rent / Hold'}</span>
              </button>
            ) : activeUserLoan ? (
              /* CURRENTLY RENTED BY MEMBER */
              <button
                disabled
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold cursor-not-allowed shadow-none"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {lang === 'my'
                    ? 'လက်ရှိ ငှားရမ်းထားပြီး (၁ ဦးလျှင် ၁ အုပ်သာ)'
                    : 'Already Borrowed (Limit 1 Copy)'}
                </span>
              </button>
            ) : userHold ? (
              /* HOLD PLACED BY MEMBER */
              <button
                disabled
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-not-allowed shadow-none"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {userHold.status === 'APPROVED'
                    ? (lang === 'my' ? 'ထုတ်ယူရန် အဆင်သင့်ဖြစ်ပါပြီ' : 'Ready for Pickup at Desk')
                    : (lang === 'my'
                        ? `မှာယူထားပြီးဖြစ်ပါသည် (တန်းစီ #${userHoldPosition})`
                        : `Already on Hold (Queue #${userHoldPosition})`)}
                </span>
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
                className="w-full flex items-center justify-center space-x-1 py-2.5 px-4 rounded-lg bg-green-950 hover:bg-green-900 text-white text-xs font-bold shadow-sm transition"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Rent / Hold Physical Copy</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Header & Search Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 text-center">
          {/* Approved Government Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-[2px] shadow-lg mb-4 hover:scale-105 transition-transform">
            <img
              src="/mocht-logo.png"
              alt="Ministry of Culture, Hotels and Tourism Official Seal"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-900 text-xs font-bold mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Open-Access E-Books & Physical Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.opac.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.opac.subtitle}
          </p>

          {/* National Library E-Book Resource External Link */}
          <div className="mt-4 flex justify-center">
            <a
              href="https://eresource.nlm.gov.mm/metadata/s?sw=&q="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300 hover:border-emerald-400 text-emerald-900 text-xs sm:text-sm font-bold shadow-sm transition hover:shadow group"
            >
              <BookOpen className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                {lang === 'my'
                  ? 'အမျိုးသားစာကြည့်တိုက် E-Book အရင်းအမြစ်'
                  : 'National Library E-Book Resource'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
            </a>
          </div>

          {/* Search & Filter Inputs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-4xl mx-auto">
            {/* Search query input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.opac.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white max-w-[200px]"
            >
              <option value="">{t.opac.allCategories}</option>
              {availableGenres.length > 0 ? (
                availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))
              ) : (
                <>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Myanmar History">Myanmar History & Culture</option>
                  <option value="Classic Literature">Classic Literature</option>
                  <option value="Historical Fiction">Historical Fiction</option>
                </>
              )}
            </select>

            {/* Format Filter (Physical vs E-Book) */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
            >
              <option value="">{t.opac.allFormats}</option>
              <option value="physical">📖 {t.opac.physicalOnly}</option>
              <option value="ebook">💻 {t.opac.ebookOnly}</option>
            </select>

            {/* Sort Selector */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
            >
              <option value="default">{t.opac.sortDefault}</option>
              <option value="trending">{t.opac.sortTrending}</option>
              <option value="latest">{t.opac.sortNewest}</option>
              <option value="oldest">{t.opac.sortOldest}</option>
              <option value="title_asc">{t.opac.sortTitle}</option>
            </select>
          </div>

          {/* Curated Collection Categories Navigation Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* All Collections */}
            <button
              type="button"
              onClick={() => setSelectedCollection('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'all'
                  ? 'bg-green-900 text-white shadow-green-900/20'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.opac.allCollections}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCollection === 'all'
                    ? 'bg-green-800 text-green-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {collectionCounts.all || totalCatalogCount || books.length}
              </span>
            </button>

            {/* Trending Now */}
            <button
              type="button"
              onClick={() => setSelectedCollection('trending')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'trending'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-amber-600/30 ring-2 ring-amber-400/40'
                  : 'bg-amber-50/70 border border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{t.opac.trending}</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCollection === 'trending'
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {collectionCounts.trending || 'HOT'}
              </span>
            </button>

            {/* Latest Release */}
            <button
              type="button"
              onClick={() => setSelectedCollection('latest')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'latest'
                  ? 'bg-gradient-to-r from-sky-700 to-indigo-700 text-white shadow-sky-700/30 ring-2 ring-sky-400/40'
                  : 'bg-sky-50/70 border border-sky-200 text-sky-950 hover:bg-sky-100 hover:border-sky-300'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.opac.latestRelease}</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCollection === 'latest'
                    ? 'bg-sky-800 text-sky-100'
                    : 'bg-sky-200/80 text-sky-900'
                }`}
              >
                {collectionCounts.latest || 'NEW'}
              </span>
            </button>

            {/* Most Borrowed */}
            <button
              type="button"
              onClick={() => setSelectedCollection('most_borrowed')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'most_borrowed'
                  ? 'bg-green-900 text-white shadow-green-900/20'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.opac.mostBorrowed}</span>
            </button>

            {/* Myanmar Classics */}
            <button
              type="button"
              onClick={() => setSelectedCollection('myanmar_classics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'myanmar_classics'
                  ? 'bg-green-900 text-white shadow-green-900/20'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.opac.myanmarClassics}</span>
            </button>

            {/* Tech & CS */}
            <button
              type="button"
              onClick={() => setSelectedCollection('tech')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                selectedCollection === 'tech'
                  ? 'bg-green-900 text-white shadow-green-900/20'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.opac.tech}</span>
            </button>
          </div>

            {/* National Library E-Book Resource */}
            <div className="mt-4 flex justify-center">
              <a
                href="https://eresource.nlm.gov.mm/metadata/s?sw=&q="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 cursor-pointer group"
              >
                <BookOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>National Library E-Book Resource</span>
                <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
        </div>
      </section>

      {/* Main Catalog Body */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Curated Spotlight Sections (Displayed when on "All" view with no active search) */}
        {isBrowsingAll && !loading && (
          <div className="space-y-8">
            {/* 1. Trending Books Showcase Rail */}
            {trendingSpotlight.length > 0 && (
              <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-amber-950 font-extrabold text-sm sm:text-base">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>{t.opac.spotlightTrendingTitle}</span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      {t.opac.spotlightTrendingSubtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection('trending')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition w-fit cursor-pointer"
                  >
                    <span>{t.opac.viewAll} ({collectionCounts.trending || trendingSpotlight.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                  {trendingSpotlight.map((book) => renderBookCard(book, true))}
                </div>
              </section>
            )}

            {/* 2. Latest Releases Showcase Rail */}
            {latestSpotlight.length > 0 && (
              <section className="bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-sky-950 font-extrabold text-sm sm:text-base">
                      <Rocket className="w-4 h-4 text-sky-600" />
                      <span>{t.opac.spotlightLatestTitle}</span>
                    </div>
                    <p className="text-xs text-sky-900/80 mt-0.5">
                      {t.opac.spotlightLatestSubtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection('latest')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-950 hover:text-sky-800 bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-lg border border-sky-300 transition w-fit cursor-pointer"
                  >
                    <span>{t.opac.viewAll} ({collectionCounts.latest || latestSpotlight.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                  {latestSpotlight.map((book) => renderBookCard(book, true))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Section Header & Active Collection Indicator */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                {selectedCollection === 'trending' ? (
                  <span className="inline-flex items-center gap-2 text-amber-900">
                    <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
                    <span>{t.opac.spotlightTrendingTitle}</span>
                  </span>
                ) : selectedCollection === 'latest' ? (
                  <span className="inline-flex items-center gap-2 text-sky-950">
                    <Rocket className="w-5 h-5 text-sky-600" />
                    <span>{t.opac.spotlightLatestTitle}</span>
                  </span>
                ) : selectedCollection === 'most_borrowed' ? (
                  <span className="inline-flex items-center gap-2 text-emerald-950">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>{t.opac.mostBorrowed}</span>
                  </span>
                ) : selectedCollection === 'myanmar_classics' ? (
                  <span className="inline-flex items-center gap-2 text-slate-900">
                    <Landmark className="w-5 h-5 text-amber-600" />
                    <span>{t.opac.myanmarClassics}</span>
                  </span>
                ) : selectedCollection === 'tech' ? (
                  <span className="inline-flex items-center gap-2 text-slate-900">
                    <Laptop className="w-5 h-5 text-blue-600" />
                    <span>{t.opac.tech}</span>
                  </span>
                ) : (
                  <span>All Catalog Records</span>
                )}
              </span>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                {books.length} {t.opac.booksCount}
              </span>
            </div>

            {selectedCollection !== 'all' && (
              <button
                onClick={() => setSelectedCollection('all')}
                className="text-xs text-green-900 font-bold hover:underline self-start sm:self-auto cursor-pointer"
              >
                ← Return to All Collections
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500">Loading catalog...</div>
          ) : books.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">
              No books found matching criteria in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => renderBookCard(book, false))}
            </div>
          )}
        </div>
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
              className="w-full py-2.5 bg-green-950 hover:bg-green-900 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {loginModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {lang === 'my' ? 'စာအုပ်ငှားရန် အကောင့်ဝင်ပါ' : 'Sign In Required to Rent / Hold'}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {lang === 'my' ? (
                  <>
                    <span className="font-bold text-slate-800">"{loginModal.bookTitle}"</span> စာအုပ်ကို ငှားရမ်းရန် သို့မဟုတ် ကြိုတင်မှာယူရန် အဖွဲ့ဝင်အကောင့်ဖြင့် အရင်ဝင်ရောက်ရန် လိုအပ်ပါသည်။
                  </>
                ) : (
                  <>
                    To rent or place a hold reservation for <span className="font-bold text-slate-800">"{loginModal.bookTitle}"</span>, please sign in to your library member account.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{lang === 'my' ? 'စာကြည့်တိုက်အဖွဲ့ဝင်များ စာအုပ်ငှားခွင့် ရရှိမည်' : 'Registered members can borrow physical books'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{lang === 'my' ? 'ဒစ်ဂျစ်တယ် E-Book များကို အကောင့်မလိုဘဲ ဖတ်ရှုနိုင်သည်' : 'Open-access E-Books can be read without signing in'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLoginModal({ isOpen: false, bookTitle: '' })}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
              >
                {lang === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-green-900 hover:bg-green-800 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === 'my' ? 'အကောင့်ဝင်မည်' : 'Sign In Now'}</span>
              </button>
            </div>
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
