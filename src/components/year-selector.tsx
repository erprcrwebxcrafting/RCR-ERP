"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";

export function YearSelector() {
  const router = useRouter();
  const [selectedFy, setSelectedFy] = useState("current");

  useEffect(() => {
    // Read initial value from cookie if exists
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
    router.refresh(); // Refresh the page to fetch new server data
  };

  const currentYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-slate-500" />
      <select 
        value={selectedFy} 
        onChange={handleYearChange}
        className="w-[160px] h-9 px-2 text-xs font-semibold bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="current">FY {currentYear}-{currentYear + 1} (Current)</option>
        <option value={(currentYear - 1).toString()}>FY {currentYear - 1}-{currentYear}</option>
        <option value={(currentYear - 2).toString()}>FY {currentYear - 2}-{currentYear - 1}</option>
        <option value={(currentYear - 3).toString()}>FY {currentYear - 3}-{currentYear - 2}</option>
        <option value="all">All Time</option>
      </select>
    </div>
  );
}
