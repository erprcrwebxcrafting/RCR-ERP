"use client";

import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LabourErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Failed to Load Labour Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {error?.message || "An unexpected error occurred while loading this labourer."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="outline"
            size="sm"
            className="gap-2 font-semibold"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Link href="/supervisor/labours">
            <Button size="sm" className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4" /> Workforce Directory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

