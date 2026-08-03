'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import {
  ShoppingBag,
  Building2,
  FileSpreadsheet,
  Globe,
  Share2,
  CheckCircle,
  Plus,
  ArrowUpRight,
  Bookmark,
} from 'lucide-react';

export default function AcquisitionsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
            <span>Acquisitions, ERM & Enterprise Koha Modules</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vendor management, budget tracking, electronic resource licenses, serials subscriptions, and interlibrary loans (ILL).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendor Directory & Purchase Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Vendor Directory & Acquisitions</span>
              </h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                1 Active Vendor
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Oxford University Press / Global Books
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Code: OUP-01</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Partner
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>Email: orders@oup-distrib.com</div>
                  <div>Phone: +1-800-555-6871</div>
                  <div>Address: 198 Madison Ave, New York, NY</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Purchase Orders
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">PO-2026-001</span>
                    <span className="text-slate-400 block">Total Budget: $1,250.00</span>
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-semibold">
                    ORDERED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ERM (Electronic Resource Management) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span>ERM & Digital License Management</span>
              </h2>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30">
                1 E-Resource
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      OPEN ACCESS
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">
                      The C Programming Language (Digital Reference Guide)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Format: PDF</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>License: Academic Open Access</span>
                  <span className="text-indigo-400">Total Downloads: 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Serials & Interlibrary Loan (ILL) Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Serials Subscriptions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <span>Serials & Periodical Subscriptions</span>
            </h2>

            <div className="space-y-3">
              {[
                { title: 'ACM Transactions on Programming Languages', issn: '0164-0925', freq: 'MONTHLY' },
                { title: 'IEEE Software Magazine', issn: '0740-7459', freq: 'BI-MONTHLY' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{item.title}</span>
                    <span className="font-mono text-slate-500">ISSN: {item.issn}</span>
                  </div>
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                    {item.freq}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interlibrary Loan (ILL) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span>Interlibrary Loan (ILL) System</span>
            </h2>

            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    Designing Data-Intensive Applications
                  </span>
                  <span className="text-slate-400">Partner: MIT Central Library System</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                  IN TRANSIT
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
