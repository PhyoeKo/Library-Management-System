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

      <main className="max-w-lg mx-auto px-4 py-10 sm:py-14">
        {/* Official Government Seal & Ministry Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-[2.5px] shadow-xl hover:scale-105 transition-transform">
              <img
                src="/mocht-logo.png"
                alt="Ministry of Culture, Hotels and Tourism Government Approved Seal"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow">
              MOCHT
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Digital Library Access Catalogue
            </h1>
          </div>
        </div>

        {/* Portal Selection Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white p-1 rounded-t-2xl shadow-sm">
          <button
            onClick={() => {
              setActivePortal('patron');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 rounded-t-xl transition ${
              activePortal === 'patron'
                ? 'border-green-800 text-green-900 bg-green-50/70 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-green-800" />
            <span>{t.login.patronTab}</span>
          </button>

          <button
            onClick={() => {
              setActivePortal('staff');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 rounded-t-xl transition ${
              activePortal === 'staff'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/70 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>{t.login.staffTab}</span>
          </button>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-slate-200 rounded-b-2xl rounded-t-sm p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl mb-5 text-xs bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl mb-5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  {t.login.emailOrBarcode}
                </label>
                <span className="text-[10px] text-green-800 font-semibold">
                  {activePortal === 'patron' ? 'Barcode / Email / Phone' : 'Staff Barcode / Email'}
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activePortal === 'staff'
                      ? 'admin@library.edu သို့မဟုတ် STAFF-001'
                      : 'alex.rivera@student.edu သို့မဟုတ် PAT-88401'
                  }
                  value={emailOrBarcode}
                  onChange={(e) => setEmailOrBarcode(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white font-sans"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                စာကြည့်တိုက် ဘားကုဒ်၊ အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ဝင်ရောက်နိုင်ပါသည်
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {t.login.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-800 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white text-xs font-extrabold shadow-md flex items-center justify-center space-x-2 transition ${
                activePortal === 'staff'
                  ? 'bg-emerald-800 hover:bg-emerald-700'
                  : 'bg-green-900 hover:bg-green-800'
              }`}
            >
              <span>{loading ? 'အတည်ပြုနေပါသည်...' : t.login.signIn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-600 mb-2.5 flex items-center justify-between">
              <span>{t.login.quickDemo}</span>
              <span className="text-[10px] font-normal text-slate-400">Demo Testing</span>
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLoginPreset('admin@library.edu', 'staff')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex justify-between items-center text-slate-800 text-left transition"
              >
                <div>
                  <span className="font-bold block">ဒေါ် Eleanor Vance (Chief Librarian)</span>
                  <span className="text-[10px] text-slate-500 font-mono">STAFF-001 · admin@library.edu</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {t.login.staffRole}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginPreset('alex.rivera@student.edu', 'patron')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex justify-between items-center text-slate-800 text-left transition"
              >
                <div>
                  <span className="font-bold block">ကို Alex Rivera (မြန်မာနိုင်ငံသား အဖွဲ့ဝင်)</span>
                  <span className="text-[10px] text-slate-500 font-mono">PAT-88401 · alex.rivera@student.edu</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-900">
                  {t.login.patronRole}
                </span>
              </button>
            </div>
          </div>

          {/* Ministry Regional Verification Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              ယဉ်ကျေးမှု၊ ဟိုတယ်နှင့် ခရီးသွားလာရေး ဝန်ကြီးဌာန (MOCHT) တရားဝင် လုံခြုံရေး စနစ်ဖြင့် စစ်ဆေးထားပါသည်
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
