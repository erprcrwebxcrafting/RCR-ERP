"use client";

import React, { useSyncExternalStore, useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, FileSpreadsheet, FileText, Sparkles } from "lucide-react";

export interface DownloadOptions {
  url: string;
  defaultFilename?: string;
  title?: string;
  fileType?: "excel" | "pdf" | "card";
}

interface DownloadState {
  isOpen: boolean;
  progress: number;
  statusText: string;
  isSuccess: boolean;
  error: string | null;
  title: string;
  fileType: "excel" | "pdf" | "card";
}

const initialState: DownloadState = {
  isOpen: false,
  progress: 10,
  statusText: "Initializing export...",
  isSuccess: false,
  error: null,
  title: "Creating Document...",
  fileType: "excel",
};

let globalState: DownloadState = { ...initialState };
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return globalState;
}

function updateState(partial: Partial<DownloadState>) {
  globalState = { ...globalState, ...partial };
  listeners.forEach((l) => l());
}

let activeInterval: NodeJS.Timeout | null = null;

export async function triggerRcrDownload({
  url,
  defaultFilename = "Export.xlsx",
  title: customTitle,
  fileType: customFileType = "excel",
}: DownloadOptions) {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  const title =
    customTitle ||
    (customFileType === "excel"
      ? "Creating Excel Ledger..."
      : customFileType === "card"
      ? "Generating Bulk Attendance Cards..."
      : "Creating PDF Document...");

  updateState({
    isOpen: true,
    progress: 15,
    statusText: "Connecting to server...",
    isSuccess: false,
    error: null,
    title,
    fileType: customFileType,
  });

  const steps =
    customFileType === "excel"
      ? [
          "Fetching worker attendance & pay records...",
          "Compiling Monthly Ledger Summary & Balances...",
          "Applying Excel formulas, grand totals & freeze panes...",
          "Generating high-speed .xlsx workbook...",
          "Finalizing download...",
        ]
      : customFileType === "card"
      ? [
          "Gathering site labour & supervisor records...",
          "Calculating exact hajaris & fraction cards...",
          "Formatting PDF card layouts & signatures...",
          "Compiling printable bulk cards...",
          "Finalizing PDF file...",
        ]
      : [
          "Fetching site records & balances...",
          "Building PDF document layout...",
          "Rendering tables and financial data...",
          "Compiling high-resolution PDF...",
          "Finalizing download...",
        ];

  let currentStep = 0;
  activeInterval = setInterval(() => {
    const nextProgress = Math.min(globalState.progress + Math.floor(Math.random() * 12) + 5, 92);
    currentStep = (currentStep + 1) % steps.length;
    updateState({
      progress: nextProgress,
      statusText: steps[currentStep],
    });
  }, 900);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(errText || `Server returned error (${response.status})`);
    }

    let filename = defaultFilename;
    const disposition = response.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, "").trim();
      }
    }

    const blob = await response.blob();

    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }

    updateState({
      progress: 100,
      isSuccess: true,
      statusText: "Download complete! Saving file...",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    setTimeout(() => {
      updateState({ isOpen: false });
    }, 950);
  } catch (err: any) {
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
    console.error("RCR Download Error:", err);
    updateState({
      error: err?.message || "Failed to download file. Please try again.",
    });
  }
}

export function closeRcrDownload() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  updateState({ isOpen: false, error: null });
}

const StableNull = () => null;

// Hook for backward compatibility in components (avoids re-rendering parent components)
export function useRcrDownload() {
  return {
    downloadFile: triggerRcrDownload,
    DownloadModal: StableNull,
  };
}

// Global Overlay Component to place in RootLayout (rendered via portal directly to document.body)
export function RcrDownloadOverlay() {
  const [mounted, setMounted] = useState(false);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initialState);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !state.isOpen) return null;

  const { isSuccess, error, title, statusText, progress, fileType } = state;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 transition-all duration-300 animate-in fade-in">
      <div className="relative max-w-[350px] w-[92vw] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close button if error */}
        {error && (
          <button
            onClick={closeRcrDownload}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Top Brand Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-bold tracking-wider uppercase mb-3 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          <span>RCR Enterprises • ERP</span>
        </div>

        {/* Circular Animation Section */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-1.5">
          {error ? (
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center shadow-md shadow-rose-900/20">
              <AlertCircle className="w-10 h-10 text-rose-500 animate-bounce" />
            </div>
          ) : isSuccess ? (
            <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in zoom-in-75 duration-300">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping opacity-50" />
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-in zoom-in" />
            </div>
          ) : (
            <>
              {/* Layer 1: Ambient Pulsing Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/30 via-cyan-400/20 to-emerald-500/30 blur-sm animate-pulse" />

              {/* Layer 2: Outer Counter-Rotating Dashed Track */}
              <div className="absolute -inset-1.5 rounded-full border border-dashed border-blue-400/30 animate-[spin_7s_linear_infinite_reverse]" />

              {/* Layer 3: Dynamic Circular SVG Spinning Gradient Ring */}
              <svg className="w-full h-full animate-spin [animation-duration:2.2s]" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="rcrSpinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="35%" stopColor="#06b6d4" />
                    <stop offset="70%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  stroke="#1e293b"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  stroke="url(#rcrSpinnerGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray="170 105"
                  fill="none"
                />
              </svg>

              {/* Layer 4: Inner Reverse Glow Ring */}
              <div className="absolute inset-2.5 rounded-full border border-dashed border-emerald-400/40 animate-[spin_4.5s_linear_infinite_reverse]" />

              {/* Layer 5: Center Core Emblem with RCR Logo & RCR Text */}
              <div className="absolute inset-4 sm:inset-5 rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-slate-700/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-1.5 z-10 overflow-hidden">
                <img
                  src="/rcr-logo.png"
                  alt="RCR Logo"
                  className="w-7 h-5 sm:w-8 sm:h-5.5 object-contain drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-[11px] sm:text-[12px] font-black tracking-widest bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent drop-shadow leading-tight">
                  RCR
                </span>
              </div>
            </>
          )}
        </div>

        {/* Heading */}
        <div className="mt-2 mb-0.5">
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            {error ? "Export Failed" : isSuccess ? "Ready! Downloaded" : title}
          </h3>
        </div>

        {/* Status Text / Steps */}
        <p className="text-xs font-medium text-slate-300 min-h-[18px] flex items-center justify-center gap-1 px-1 line-clamp-1">
          {!error && !isSuccess && <Sparkles className="w-3 h-3 text-amber-400 shrink-0 animate-spin" />}
          <span className="truncate">{error ? error : statusText}</span>
        </p>

        {/* Sleek Animated Progress Bar */}
        {!error && (
          <div className="w-full mt-3">
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/60 p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Progress percentage & status */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium mt-1.5 px-0.5">
              <span>{progress}% Completed</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                {isSuccess ? (
                  "✓ File Saved"
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Its creating...
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Error Dismiss Button */}
        {error && (
          <button
            onClick={closeRcrDownload}
            className="mt-4 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all shadow-md"
          >
            Dismiss
          </button>
        )}

        {/* Footer note */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 w-full text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          {fileType === "excel" ? (
            <FileSpreadsheet className="w-3 h-3 text-emerald-500 shrink-0" />
          ) : (
            <FileText className="w-3 h-3 text-rose-500 shrink-0" />
          )}
          <span>RCR Secure Export • 100% Accurate Data</span>
        </div>

      </div>
    </div>
  );
}
