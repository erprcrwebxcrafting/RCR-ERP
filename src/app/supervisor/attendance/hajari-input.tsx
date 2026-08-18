"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

const HAJARI_OPTIONS = [
  { value: "0", label: "Absent (0 Hajari)" },
  { value: "0.5", label: "0.5 Hajari (Half Day)" },
  { value: "1", label: "1.0 Hajari (Full Day)" },
  { value: "1.5", label: "1.5 Hajari (1.5 Shifts)" },
  { value: "2", label: "2.0 Hajari (Double Shift)" },
  { value: "2.5", label: "2.5 Hajari (2.5 Shifts)" },
  { value: "3", label: "3.0 Hajari (Triple Shift)" },
  { value: "3.5", label: "3.5 Hajari" },
  { value: "4", label: "4.0 Hajari" },
  { value: "4.5", label: "4.5 Hajari" },
  { value: "5", label: "5.0 Hajari" },
  { value: "5.5", label: "5.5 Hajari" },
  { value: "6", label: "6.0 Hajari" },
  { value: "6.5", label: "6.5 Hajari" },
  { value: "7", label: "7.0 Hajari" },
  { value: "7.5", label: "7.5 Hajari" },
  { value: "8", label: "8.0 Hajari" },
  { value: "8.5", label: "8.5 Hajari" },
  { value: "9", label: "9.0 Hajari" },
  { value: "9.5", label: "9.5 Hajari" },
  { value: "10", label: "10.0 Hajari" },
];

export function HajariInput({
  labourId,
  defaultValue,
  isLocked,
}: {
  labourId: string;
  defaultValue?: string;
  isLocked: boolean;
}) {
  const defaultValStr = defaultValue !== undefined ? defaultValue : "1";
  
  const [isCustom, setIsCustom] = useState(() => {
    return !HAJARI_OPTIONS.some((o) => o.value === defaultValStr);
  });

  const selectClassName = "h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-400";
  const disabledSelectClassName = "h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-sm cursor-not-allowed opacity-80";
  const inputClassName = "h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all shadow-sm hover:border-indigo-400";

  if (isLocked) {
    return (
      <>
        <input type="hidden" name={`hajari__${labourId}`} value={defaultValStr} />
        <select className={disabledSelectClassName} disabled value={isCustom ? "custom" : defaultValStr}>
          {HAJARI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {isCustom && <option value="custom">{defaultValStr} Hajari (Custom)</option>}
        </select>
      </>
    );
  }

  if (isCustom) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="10"
          name={`hajari__${labourId}`}
          defaultValue={defaultValStr}
          className={inputClassName}
          placeholder="e.g. 1.25"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setIsCustom(false)}
          className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap border border-indigo-200 dark:border-indigo-800"
          title="Back to List"
        >
          List
        </button>
      </div>
    );
  }

  return (
    <select
      name={`hajari__${labourId}`}
      className={selectClassName}
      defaultValue={defaultValStr}
      onChange={(e) => {
        if (e.target.value === "custom") {
          setIsCustom(true);
        }
      }}
    >
      {HAJARI_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      <option value="custom" className="font-bold text-indigo-600">
        + Custom Value...
      </option>
    </select>
  );
}
