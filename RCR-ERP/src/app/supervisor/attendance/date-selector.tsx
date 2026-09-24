"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DateSelector({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [date, setDate] = React.useState(defaultDate);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync state if URL changes externally
  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  return (
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
          // Ignore if showPicker throws (e.g. cross-origin issues or unsupported)
        }
      }}
      className="h-9 w-full min-w-[140px] rounded border-0 bg-transparent px-2 text-sm text-slate-700 dark:text-slate-200 font-bold focus:ring-0 cursor-pointer outline-none"
      onChange={(e) => {
        setDate(e.target.value);
        if (e.target.value) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }
      }}
    />
  );
}
