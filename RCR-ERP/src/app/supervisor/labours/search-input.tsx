"use client";

import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function LabourSearchInput({ defaultQ, showInactive }: { defaultQ: string, showInactive: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQ);

  useEffect(() => {
    // We update the URL silently for bookmarkability
    const timer = setTimeout(() => {
      if (query !== defaultQ || query === "") {
        const params = new URLSearchParams(searchParams.toString());
        if (query) params.set("q", query);
        else params.delete("q");
        const newUrl = `${pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
    }, 100);

    // Instant DOM filtering
    const qLower = query.toLowerCase();
    const rows = document.querySelectorAll('.labour-row');
    let visibleCount = 0;

    rows.forEach((row) => {
      const name = row.getAttribute('data-name') || '';
      if (name.includes(qLower)) {
        (row as HTMLElement).style.display = '';
        visibleCount++;
      } else {
        (row as HTMLElement).style.display = 'none';
      }
    });

    // Handle empty state
    const emptyRow = document.getElementById('empty-labour-row');
    if (emptyRow) {
      if (visibleCount === 0 && rows.length > 0) {
        emptyRow.style.display = '';
      } else if (visibleCount > 0) {
        emptyRow.style.display = 'none';
      }
    }

    return () => clearTimeout(timer);
  }, [query, pathname, searchParams, defaultQ]);

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
    </div>
  );
}
