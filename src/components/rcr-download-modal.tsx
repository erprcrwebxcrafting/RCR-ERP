"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, X, FileSpreadsheet, FileText, Sparkles } from "lucide-react";

export interface DownloadOptions {
  url: string;
  defaultFilename?: string;
  title?: string;
  fileType?: "excel" | "pdf" | "card";
}

export function useRcrDownload() {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState("Initializing export...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Creating Document...");
  const [fileType, setFileType] = useState<"excel" | "pdf" | "card">("excel");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadFile = async ({
    url,
    defaultFilename = "Export.xlsx",
    title: customTitle,
    fileType: customFileType = "excel",
  }: DownloadOptions) => {
    setFileType(customFileType);
    setTitle(
      customTitle ||
        (customFileType === "excel"
          ? "Creating Excel Ledger..."
          : customFileType === "card"
          ? "Generating Bulk Attendance Cards..."
          : "Creating PDF Document...")
    );
    setError(null);
    setIsSuccess(false);
    setProgress(15);
    setStatusText("Connecting to server...");
    setIsOpen(true);

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
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          const next = prev + Math.floor(Math.random() * 12) + 5;
          return Math.min(next, 92);
        }
        return prev;
      });

      currentStep = (currentStep + 1) % steps.length;
      setStatusText(steps[currentStep]);
    }, 900);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Server returned error (${response.status})`);
      }

      // Extract filename from Content-Disposition header if available
      let filename = defaultFilename;
      const disposition = response.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "").trim();
        }
      }

      const blob = await response.blob();

      // Trigger success state
      clearInterval(interval);
      setProgress(100);
      setIsSuccess(true);
      setStatusText("Download complete! Saving file...");

      // Trigger browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Auto close after brief delay
      setTimeout(() => {
        setIsOpen(false);
      }, 950);
    } catch (err: any) {
      clearInterval(interval);
      console.error("RCR Download Error:", err);
      setError(err?.message || "Failed to download file. Please try again.");
    }
  };

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  const DownloadModal = () => {
    if (!mounted || !isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 transition-all duration-300 animate-in fade-in">
        <div className="relative max-w-md w-full bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-700/60 rounded-3xl p-7 sm:p-8 shadow-[0_0_60px_rgba(37,99,235,0.25)] flex flex-col items-center text-center overflow-hidden">
          
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button if error */}
          {error && (
            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Brand Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-bold tracking-wider uppercase mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>RCR Enterprises • ERP System</span>
          </div>

          {/* Mast Circular Animation Section */}
          <div className="relative w-36 h-36 flex items-center justify-center my-3">
            {error ? (
              <div className="w-28 h-28 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center shadow-lg shadow-rose-900/20">
                <AlertCircle className="w-14 h-14 text-rose-500 animate-bounce" />
              </div>
            ) : isSuccess ? (
              <div className="relative w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in-75 duration-300">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping opacity-50" />
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in" />
              </div>
            ) : (
              <>
                {/* Layer 1: Ambient Pulsing Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/30 via-cyan-400/20 to-emerald-500/30 blur-md animate-pulse" />

                {/* Layer 2: Outer Counter-Rotating Dashed Track */}
                <div className="absolute -inset-2.5 rounded-full border border-dashed border-blue-400/30 animate-[spin_7s_linear_infinite_reverse]" />

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
                <div className="absolute inset-3.5 rounded-full border border-dashed border-emerald-400/40 animate-[spin_4.5s_linear_infinite_reverse]" />

                {/* Layer 5: Center Core Emblem with RCR Logo & RCR Text */}
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-slate-700/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-2 z-10 overflow-hidden">
                  <img
                    src="/rcr-logo.png"
                    alt="RCR Logo"
                    className="w-9 h-6 object-contain drop-shadow"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-[14px] font-black tracking-widest bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent drop-shadow leading-tight mt-0.5">
                    RCR
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Heading */}
          <div className="mt-3 mb-1">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {error ? "Export Failed" : isSuccess ? "Ready! Downloaded" : title}
            </h3>
          </div>

          {/* Status Text / Steps */}
          <p className="text-sm font-medium text-slate-300 min-h-[22px] flex items-center justify-center gap-1.5 px-2">
            {!error && !isSuccess && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            <span>{error ? error : statusText}</span>
          </p>

          {/* Sleek Animated Progress Bar */}
          {!error && (
            <div className="w-full mt-4">
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Progress percentage & status */}
              <div className="flex justify-between items-center text-[12px] text-slate-400 font-medium mt-2 px-1">
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
              onClick={close}
              className="mt-5 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 transition-all shadow-md"
            >
              Dismiss
            </button>
          )}

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-[11px] text-slate-500 flex items-center justify-center gap-2">
            {fileType === "excel" ? (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>RCR Secure Export • 100% Accurate Data</span>
          </div>

        </div>
      </div>,
      document.body
    );
  };

  return { downloadFile, DownloadModal, isOpen, isSuccess, error };
}
