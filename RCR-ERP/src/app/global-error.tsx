"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <p className="text-sm text-slate-500">
            A critical system error occurred. Please refresh the page.
          </p>
          {error?.message && (
            <div className="p-3 bg-slate-100 rounded text-xs font-mono text-left overflow-auto max-h-32">
              {error.message}
            </div>
          )}
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}

