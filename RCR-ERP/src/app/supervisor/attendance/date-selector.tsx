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
    <div className="relative w-full flex-1 flex items-center">
      <style dangerouslySetInnerHTML={{__html: `
        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}} />
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
        className="h-9 w-full rounded border-0 bg-transparent px-1 text-sm text-slate-700 dark:text-slate-200 font-bold focus:ring-0 cursor-pointer outline-none relative z-10"
        onChange={(e) => {
          setDate(e.target.value);
          if (e.target.value) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", e.target.value);
            router.push(`${pathname}?${params.toString()}`);
          }
        }}
      />
    </div>
  );
}
