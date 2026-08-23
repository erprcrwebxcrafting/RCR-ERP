"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DateSelector({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <input 
      type="date" 
      name="date" 
      defaultValue={defaultDate} 
      required 
      className="h-8 rounded border-0 bg-transparent text-sm text-gray-700 dark:text-slate-200 font-medium focus:ring-0 cursor-pointer outline-none"
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("date", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }
      }}
    />
  );
}
