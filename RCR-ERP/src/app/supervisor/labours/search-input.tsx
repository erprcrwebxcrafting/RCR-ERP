"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function LabourSearchInput({ defaultQ, showInactive }: { defaultQ: string, showInactive: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultQ);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== defaultQ) {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString());
          if (query) {
            params.set("q", query);
          } else {
            params.delete("q");
          }
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams, defaultQ]);

  return (
    <div className="relative flex-1 sm:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search labourers by name..."
        className="h-10 w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      />
      {showInactive && <input type="hidden" name="showInactive" value="1" />}
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
