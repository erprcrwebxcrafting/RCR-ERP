"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";

export function YearSelector({ earliestYear }: { earliestYear?: number }) {
  const router = useRouter();
  const [selectedFy, setSelectedFy] = useState("current");

  useEffect(() => {
    const match = document.cookie.match(/(^| )selected_fy=([^;]+)/);
    if (match && match[2]) {
      setSelectedFy(match[2]);
    } else {
      setSelectedFy("current");
    }
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedFy(val);
    document.cookie = `selected_fy=${val}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  const currentYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  // Only show years that have data — from earliestYear to currentYear
  // If no earliestYear (no data), only show the current FY
  const startYear = earliestYear ?? currentYear;
  const years: number[] = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y);
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-slate-500" />
      <select
        value={selectedFy}
        onChange={handleYearChange}
        className="w-[200px] h-9 px-2 text-xs font-semibold bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map((y, i) => (
          <option key={y} value={i === 0 ? "current" : y.toString()}>
            FY {y}-{y + 1}{i === 0 ? " (Current)" : ""}
          </option>
        ))}
        <option value="all">All Time</option>
      </select>
    </div>
  );
}
