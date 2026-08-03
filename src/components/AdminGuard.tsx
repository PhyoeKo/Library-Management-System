'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'ADMIN' || user.role === 'STAFF') {
          setAuthorized(true);
          return;
        }
      }
      setAuthorized(false);
    } catch (e) {
      setAuthorized(false);
    }
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Checking access permissions...
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">403 Access Denied</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            You do not have administrative privileges to access the Staff Cataloging, Circulation, or Fine Management Desk.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/patron"
              className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Patron Portal</span>
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Sign In as Staff / Officer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
