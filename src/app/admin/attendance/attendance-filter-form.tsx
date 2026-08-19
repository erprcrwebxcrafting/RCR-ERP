"use client";

import React, { FormEvent } from "react";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AttendanceFilterForm({
  startDateStr,
  endDateStr,
  siteId,
  q,
  sites,
  wasClamped,
}: {
  startDateStr: string;
  endDateStr: string;
  siteId: string;
  q: string;
  sites: { id: string; projectName: string }[];
  wasClamped?: boolean;
}) {
  React.useEffect(() => {
    if (wasClamped) {
      toast.warning("Date range was automatically restricted to the active Financial Year.", {
        duration: 5000,
      });
    }
  }, [wasClamped]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const start = formData.get("startDate") as string;
    const end = formData.get("endDate") as string;

    if (start && end) {
      const diffTime = new Date(end).getTime() - new Date(start).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 90) {
        e.preventDefault();
        toast.error("Maximum 90 days allowed for date range selection.");
        return;
      }
      
      if (diffDays < 0) {
        e.preventDefault();
        toast.error("End date cannot be before start date.");
        return;
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-20">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filter Attendance Records</h2>
      </div>
      <form method="GET" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">From Date</label>
          <input type="date" name="startDate" defaultValue={startDateStr} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full" />
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">To Date</label>
          <input type="date" name="endDate" defaultValue={endDateStr} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full" />
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Site</label>
          <select name="siteId" defaultValue={siteId} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full appearance-none">
            <option value="">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.projectName} (ID: {s.id.slice(-4)})</option>)}
          </select>
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Search</label>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" name="q" defaultValue={q} placeholder="Search names..." className="h-11 w-full pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-sm" />
          </div>
        </div>

        <div className="flex items-end h-full pt-1.5">
          <Button type="submit" className="h-11 w-full rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all hover:-translate-y-0.5">
            Apply Filters
          </Button>
        </div>
      </form>
    </div>
  );
}
