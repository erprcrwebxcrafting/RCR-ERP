"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, Home, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RootErrorBoundary({
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
    console.error("Root Application Error Caught:", error);
    if (isStaleAction) {
      const hasAutoReloaded = sessionStorage.getItem("stale_action_auto_reloaded");
      if (!hasAutoReloaded) {
        sessionStorage.setItem("stale_action_auto_reloaded", "true");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className={`h-16 w-16 rounded-2xl mx-auto flex items-center justify-center border shadow-inner ${
          isStaleAction
            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50"
            : isNetwork
            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
        }`}>
          {isStaleAction ? <RotateCcw className="h-8 w-8 animate-spin-slow" /> : isNetwork ? <WifiOff className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {isStaleAction ? "New Version Available" : isNetwork ? "Network Connection Interrupted" : "Something went wrong"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {isStaleAction
              ? "A fresh system update was just deployed on the server. Please click Reload Page to get the latest version."
              : isNetwork
              ? "Unable to reach the server. This happens when internet fluctuates, a connection drops, or a server request times out. Please reload the page."
              : "The page encountered an unexpected issue while loading data. You can try refreshing the page or head back to the dashboard."}
          </p>
          {error?.message && (
            <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300 text-left overflow-auto max-h-32">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="w-full sm:w-auto gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20"
          >
            <RotateCcw className="h-4 w-4" /> Reload Page
          </Button>
          <Button
            onClick={() => reset()}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 font-semibold border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full gap-2 font-semibold border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <Home className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
