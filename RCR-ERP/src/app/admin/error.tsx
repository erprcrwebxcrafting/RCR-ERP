"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, LayoutDashboard, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleAction =
    error?.message?.toLowerCase().includes("server action") &&
    error?.message?.toLowerCase().includes("not found");

  useEffect(() => {
    console.error("Admin Section Error Caught:", error);
    if (isStaleAction) {
      const hasAutoReloaded = sessionStorage.getItem("admin_stale_action_auto_reloaded");
      if (!hasAutoReloaded) {
        sessionStorage.setItem("admin_stale_action_auto_reloaded", "true");
        window.location.reload();
      }
    }
  }, [error, isStaleAction]);

  const isNetwork =
    error?.message?.toLowerCase().includes("network") ||
    error?.message?.toLowerCase().includes("fetch") ||
    error?.message?.toLowerCase().includes("timeout") ||
    error?.message?.toLowerCase().includes("aborted");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center border shadow-inner ${
          isStaleAction
            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50"
            : isNetwork
            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
        }`}>
          {isStaleAction ? <RotateCcw className="h-7 w-7" /> : isNetwork ? <WifiOff className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isStaleAction ? "New Version Available" : isNetwork ? "Network Connection Interrupted" : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {isStaleAction
              ? "A fresh system update was just deployed on the server. Please click Reload Page to get the latest version."
              : isNetwork
              ? "Unable to fetch data from the server. This usually happens due to a temporary internet fluctuation or slow server response."
              : "An unexpected error occurred while loading this section."}
          </p>
          {error?.message && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300 text-left overflow-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => window.location.reload()}
            size="default"
            className="w-full sm:w-auto gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
          >
            <RotateCcw className="h-4 w-4" /> Reload Page
          </Button>
          <Button
            onClick={() => reset()}
            variant="outline"
            size="default"
            className="w-full sm:w-auto gap-2 font-semibold border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link href="/admin" className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1.5 transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" /> Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
