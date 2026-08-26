'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Shield, UserCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activePortal, setActivePortal] = useState<'patron' | 'staff'>('patron');
  const [emailOrBarcode, setEmailOrBarcode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrBarcode,
          password,
          targetRole: activePortal === 'staff' ? 'STAFF' : 'PATRON',
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('lms_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('lms-auth-change'));

        setSuccessMsg(`Welcome, ${data.user.name}!`);
        setTimeout(() => {
          if (activePortal === 'staff') {
            router.push('/admin');
          } else {
            router.push('/patron');
          }
        }, 800);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg('Login request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginPreset = (email: string, portal: 'patron' | 'staff') => {
    setActivePortal(portal);
    setEmailOrBarcode(email);
    setPassword('demo12345');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t.login.title}</h1>
          <p className="text-xs text-slate-600 mt-1">
            {t.login.subtitle}
          </p>
        </div>

        {/* Minimalist Portal Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white p-1 rounded-t-xl">
          <button
            onClick={() => {
              setActivePortal('patron');
              setErrorMsg('');
            }}
            className={`flex-1 pb-2.5 pt-2 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activePortal === 'patron'
                ? 'border-green-900 text-green-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.login.patronTab}</span>
          </button>

          <button
            onClick={() => {
              setActivePortal('staff');
              setErrorMsg('');
            }}
            className={`flex-1 pb-2.5 pt-2 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activePortal === 'staff'
                ? 'border-emerald-700 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.login.staffTab}</span>
          </button>
        </div>

        {/* Simple Form Container */}
        <div className="bg-white border border-slate-200 rounded-b-xl rounded-t-sm p-6 shadow-sm">
          {errorMsg && (
            <div className="p-3 rounded-lg mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg mb-4 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.login.emailOrBarcode}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activePortal === 'staff'
                      ? 'admin@library.edu'
                      : 'alex.rivera@student.edu'
                  }
                  value={emailOrBarcode}
                  onChange={(e) => setEmailOrBarcode(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.login.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition ${
                activePortal === 'staff'
                  ? 'bg-emerald-800 hover:bg-emerald-700'
                  : 'bg-green-950 hover:bg-green-900'
              }`}
            >
              <span>{loading ? 'Authenticating...' : t.login.signIn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2">
              {t.login.quickDemo}
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLoginPreset('admin@library.edu', 'staff')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex justify-between items-center text-slate-800 text-left transition"
              >
                <span className="font-medium">Eleanor Vance (Staff / Admin)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {t.login.staffRole}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginPreset('alex.rivera@student.edu', 'patron')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex justify-between items-center text-slate-800 text-left transition"
              >
                <span className="font-medium">Alex Rivera (Student Member)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-900">
                  {t.login.patronRole}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
