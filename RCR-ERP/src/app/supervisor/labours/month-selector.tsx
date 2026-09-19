"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function MonthSelector({ defaultMonth }: { defaultMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative sm:w-48">
      <input
        type="month"
        defaultValue={defaultMonth}
        onChange={(e) => {
          startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
              params.set("month", e.target.value);
            } else {
              params.delete("month");
            }
            router.push(`${pathname}?${params.toString()}`);
          });
        }}
        className={`h-10 w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isPending ? 'opacity-70' : ''}`}
      />
    </div>
  );
}
