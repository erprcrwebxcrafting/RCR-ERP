"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DateSelector({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [date, setDate] = React.useState(defaultDate);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = React.useTransition();

  // Sync state if URL changes externally
  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  return (
    <div className="relative w-full flex-1 flex items-center">
      <input 
        ref={inputRef}
        type="date" 
        name="date" 
        value={date} 
        required 
        onClick={() => {
          try {
            if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
              inputRef.current.showPicker();
            }
          } catch (e) {
            // Ignore if showPicker throws
          }
        }}
        className={`h-9 w-full rounded border-0 bg-transparent px-1 text-sm font-bold focus:ring-0 cursor-pointer outline-none relative z-10 transition-opacity ${
          isPending ? "opacity-50" : "opacity-100"
        } text-slate-700 dark:text-slate-200`}
        onChange={(e) => {
          const newDate = e.target.value;
          setDate(newDate);
          if (newDate) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", newDate);
            startTransition(() => {
              router.push(`${pathname}?${params.toString()}`);
            });
          }
        }}
      />
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-blue-500">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}
