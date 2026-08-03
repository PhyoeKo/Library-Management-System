'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, CreditCard, Repeat, UserCheck, Users, LogIn, LogOut, Globe } from 'lucide-react';
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

  const handleLogout = () => {
    localStorage.removeItem('lms_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('lms-auth-change'));
    router.push('/login');
  };

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  const allNavLinks = [
    { href: '/', label: t.nav.catalog, icon: BookOpen, requiresAdmin: false },
    { href: '/patron', label: t.nav.patronPortal, icon: UserCheck, requiresAdmin: false },
    { href: '/admin/patrons', label: t.nav.patrons || 'Members', icon: Users, requiresAdmin: true },
    { href: '/admin/catalog', label: t.nav.cataloging, icon: BookOpen, requiresAdmin: true },
    { href: '/admin/circulation', label: t.nav.circulation, icon: Repeat, requiresAdmin: true },
    { href: '/admin/fines', label: t.nav.fines, icon: CreditCard, requiresAdmin: true },
  ];

  const visibleNavLinks = allNavLinks.filter(
    (link) => !link.requiresAdmin || isStaffOrAdmin
  );

  const displayRoleLabel = (role: string) => {
    if (role === 'PATRON') return 'MEMBER';
    return role;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Skylark Library</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher & Auth */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('my')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  lang === 'my'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                မြန်မာ (MY)
              </button>
            </div>

            {/* Auth Session */}
            {currentUser ? (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-white block text-xs truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-blue-300 block uppercase font-mono font-bold">
                      {displayRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.nav.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
