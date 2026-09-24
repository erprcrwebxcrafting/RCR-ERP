"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AttendanceSearch() {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    
    // Filter rows
    const rows = document.querySelectorAll('.labour-row');
    rows.forEach((row) => {
      const text = (row as HTMLElement).dataset.search?.toLowerCase() || '';
      if (text.includes(val)) {
        (row as HTMLElement).style.display = '';
      } else {
        (row as HTMLElement).style.display = 'none';
      }
    });
    
    // Hide/Show category headers based on whether they have visible rows
    const headers = document.querySelectorAll('.category-header');
    headers.forEach((header) => {
      const catId = (header as HTMLElement).dataset.category;
      if (catId) {
        const catRows = document.querySelectorAll(`.labour-row[data-category="${catId}"]`);
        const hasVisible = Array.from(catRows).some(r => (r as HTMLElement).style.display !== 'none');
        (header as HTMLElement).style.display = hasVisible ? '' : 'none';
      }
    });
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input 
        placeholder="Search labourers by name..." 
        className="pl-9 h-11 w-full bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm focus:border-indigo-500 transition-colors"
        onChange={handleSearch}
      />
    </div>
  );
}
