"use client";
import { useState, useRef, useTransition } from "react";
import { Upload, Eye, Download, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AadharUploadProps {
  type: "labour" | "supervisor";
  id: string;
  currentUrl?: string | null;
}

export function AadharUpload({ type, id, currentUrl }: AadharUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      form.append("id", id);

      const res = await fetch("/api/upload-aadhar", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
      } else {
        setUrl(data.url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0">
          <FileText className="h-3.5 w-3.5 text-violet-600" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Aadhar Card Document
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Upload button */}
        <label
          htmlFor={`aadhar-upload-${id}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-150 select-none
            ${uploading
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700"
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
            }`}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
        </label>
        <input
          ref={fileRef}
          id={`aadhar-upload-${id}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          className="sr-only"
          disabled={uploading}
          onChange={handleFileChange}
        />

        {/* View button */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-900/30 transition-colors select-none"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </a>
        )}

        {/* Download button */}
        {url && (
          <a
            href={url}
            download={`aadhar-${type}-${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/30 transition-colors select-none"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aadhar card uploaded successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {!url && !uploading && (
        <p className="text-xs text-slate-400 dark:text-slate-500">No document uploaded yet. Supports JPG, PNG, WebP, PDF (max 5MB).</p>
      )}
    </div>
  );
}
