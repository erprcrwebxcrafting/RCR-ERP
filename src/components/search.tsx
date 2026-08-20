"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Search({ placeholder = "Search..." }: { placeholder?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const initialSearch = searchParams.get("q")?.toString() || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      // Don't trigger if it hasn't actually changed from URL state
      if (searchTerm === searchParams.get("q")?.toString() && searchTerm !== "") return;
      if (searchTerm === "" && !searchParams.has("q")) return;

      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
        params.delete("page"); // Reset pagination on new search
      } else {
        params.delete("q");
      }

      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm, pathname, replace, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all pr-10"
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-spin" />
        )}
      </div>
      {searchTerm && (
        <Button 
          variant="outline" 
          onClick={() => setSearchTerm("")}
          className="h-12 px-5 rounded-xl border-slate-200 dark:border-slate-700 font-semibold transition-all hover:-translate-y-0.5"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
