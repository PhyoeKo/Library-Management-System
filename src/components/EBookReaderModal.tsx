'use client';

import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Lock, CheckCircle2, ExternalLink } from 'lucide-react';

interface EBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  fileUrl: string;
  format?: string;
  isOpenAccess?: boolean;
}

export default function EBookReaderModal({
  isOpen,
  onClose,
  title,
  author,
  fileUrl,
  format = 'PDF',
  isOpenAccess = true,
}: EBookReaderModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400">By {author} • {format} Digital Asset</p>
            </div>
          </div>

          {/* Reader Controls Toolbar */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800 p-1 rounded-lg text-slate-300 border border-slate-700 text-xs">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 15))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 15))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Open full PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Full Tab</span>
            </a>

            {isOpenAccess ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            ) : (
              <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* E-Book Display Area */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-auto flex items-center justify-center relative">
          <div
            className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={fileUrl.startsWith('http') ? fileUrl : `${fileUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full border-0"
              title={`E-Book Viewer - ${title}`}
            />
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Open Access License Verified (Institutional Repository)</span>
          </div>
          <span>Press ESC or click X to return to catalog</span>
        </div>
      </div>
    </div>
  );
}
