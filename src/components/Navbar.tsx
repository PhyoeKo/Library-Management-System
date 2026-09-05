'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  CreditCard,
  Repeat,
  UserCheck,
  Users,
  LayoutDashboard,
  LogIn,
  LogOut,
  Globe,
  BookMarked,
  BarChart3,
  Layers,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  category?: string;
  barcode?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click or route change
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('lms_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('lms-auth-change'));
    router.push('/login');
  };

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';
  const isPatron = currentUser?.role === 'PATRON';

  // Primary navigation links shown directly in the bar
  const primaryNavLinks = [
    { href: '/', label: t.nav.catalog, icon: BookOpen, requiresAdmin: false, requiresPatron: false },
    { href: '/patron', label: t.nav.patronPortal, icon: UserCheck, requiresAdmin: false, requiresPatron: true },
    { href: '/admin', label: t.nav.dashboard, icon: LayoutDashboard, requiresAdmin: true, requiresPatron: false },
    { href: '/admin/circulation', label: t.nav.circulation, icon: Repeat, requiresAdmin: true, requiresPatron: false },
    { href: '/admin/holds', label: (t.nav as any).holds || 'Holds Queue', icon: BookMarked, requiresAdmin: true, requiresPatron: false },
    { href: '/admin/catalog', label: t.nav.cataloging, icon: Layers, requiresAdmin: true, requiresPatron: false },
    { href: '/admin/patrons', label: t.nav.patrons || 'Members', icon: Users, requiresAdmin: true, requiresPatron: false },
  ];

  // Secondary administrative tools grouped under "More" dropdown
  const secondaryNavLinks = [
    {
      href: '/admin/fines',
      label: t.nav.fines,
      icon: CreditCard,
      description: lang === 'my' ? 'ဒဏ်ကြေးနှင့် POS ငွေကောက်ခံမှု' : 'Fines, Overdues & POS Billing',
    },
    {
      href: '/admin/reports',
      label: (t.nav as any).reports || 'Reports',
      icon: BarChart3,
      description: lang === 'my' ? 'စာရင်းအင်းနှင့် အစီရင်ခံစာများ' : 'Analytics & Circulation Logs',
    },
  ];

  const visiblePrimaryLinks = primaryNavLinks.filter(
    (link) => (!link.requiresAdmin || isStaffOrAdmin) && (!link.requiresPatron || isPatron)
  );

  const isMoreActive = secondaryNavLinks.some((l) => pathname === l.href);

  const displayRoleLabel = (role: string) => {
    if (role === 'PATRON') return 'MEMBER';
    return role;
  };

  return (
    <header className="bg-green-900 border-b border-green-800 sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-3">
          {/* Official Government Ministry Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group py-1 flex-shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-[1.5px] shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/mocht-logo.png"
                alt="MOCHT Government Approved Seal"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-[10px] text-amber-300 font-bold tracking-tight leading-none whitespace-nowrap">
                {lang === 'my' ? 'ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်' : 'Govt. of Myanmar · MOCHT'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                {lang === 'my' ? 'အမျိုးသားစာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ်' : 'National Library Management System'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 flex-nowrap flex-shrink-0">
            {visiblePrimaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                    isActive
                      ? 'bg-green-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-green-100 hover:text-white hover:bg-green-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}

            {/* "More Tools" Dropdown for Secondary Admin Links */}
            {isStaffOrAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isMoreActive
                      ? 'bg-green-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-green-100 hover:text-white hover:bg-green-800'
                  }`}
                >
                  <span>{(t.nav as any).more || 'More'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {moreOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === 'my' ? 'နောက်ထပ် စီမံခန့်ခွဲမှု ကဏ္ဍများ' : 'Additional Management Tools'}
                    </div>
                    {secondaryNavLinks.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${
                            active
                              ? 'bg-green-50 text-green-900 font-bold border-l-3 border-green-700'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              active ? 'bg-green-200 text-green-900' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.label}</div>
                            {item.description && (
                              <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Language Switcher, Auth Session & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-green-950 p-1 rounded-lg border border-green-800 text-xs flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-green-300 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'text-green-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('my')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  lang === 'my'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'text-green-300 hover:text-white'
                }`}
              >
                မြန်မာ
              </button>
            </div>

            {/* Auth Session */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-green-800 border border-green-700 px-2.5 py-1 rounded-lg text-xs flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-semibold text-white block text-xs truncate max-w-[90px] xl:max-w-[130px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-green-300 block uppercase font-mono font-bold leading-none">
                      {displayRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-green-800 hover:bg-rose-600 hover:text-white text-green-100 text-xs font-medium border border-green-700 transition cursor-pointer flex-shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.nav.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-sm transition flex-shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-green-800 hover:bg-green-700 text-green-100 hover:text-white border border-green-700 cursor-pointer transition flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-green-800 bg-green-950 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider px-2">
            {lang === 'my' ? 'ပင်မ စာမျက်နှာများ' : 'Main Navigation'}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {visiblePrimaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-green-100 hover:bg-green-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {isStaffOrAdmin && (
            <>
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider px-2 pt-2 border-t border-green-900">
                {lang === 'my' ? 'နောက်ထပ် စီမံခန့်ခွဲမှုများ' : 'More Management'}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {secondaryNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-green-100 hover:bg-green-900 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
