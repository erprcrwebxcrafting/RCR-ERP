"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check } from "lucide-react";

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
  maxLimit = 10,
}: {
  labourId: string;
  defaultValue?: string;
  isLocked: boolean;
  maxLimit?: number;
}) {
  const defaultValStr = defaultValue !== undefined ? defaultValue : "1";
  
  const availableOptions = HAJARI_OPTIONS.filter(o => parseFloat(o.value) <= maxLimit);

  const [isCustom, setIsCustom] = useState(() => {
    return !availableOptions.some((o) => o.value === defaultValStr);
  });
  
  const [currentValue, setCurrentValue] = useState(defaultValStr);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Calculate position
      let top = rect.bottom + window.scrollY + 4;
      
      // Prevent going off screen at the bottom
      if (top + 250 > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - 254; // Render above
      }

      setDropdownStyle({
        position: 'absolute',
        top: top,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    function handleScroll(e: Event) {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
         setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true for capturing phase

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const selectClassName = "flex items-center justify-between h-11 w-full px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-400";
  const disabledSelectClassName = "flex items-center justify-between h-11 w-full px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-sm cursor-not-allowed opacity-80";
  const inputClassName = "h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all shadow-sm hover:border-indigo-400";

  const selectedLabel = HAJARI_OPTIONS.find((o) => o.value === currentValue)?.label || `${currentValue} Hajari (Custom)`;

  if (isLocked) {
    return (
      <div className="relative">
        <input type="hidden" name={`hajari__${labourId}`} value={currentValue} />
        <div className={disabledSelectClassName}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
    );
  }

  if (isCustom) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          max={maxLimit}
          name={`hajari__${labourId}`}
          defaultValue={currentValue}
          className={inputClassName}
          placeholder="e.g. 1.25"
          autoFocus
        />
        <button
          type="button"
          onClick={() => { setIsCustom(false); setCurrentValue("1"); }}
          className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap border border-indigo-200 dark:border-indigo-800"
          title="Back to List"
        >
          List
        </button>
      </div>
    );
  }

  return (
    <div>
      <input type="hidden" name={`hajari__${labourId}`} value={currentValue} />
      
      <div 
        ref={buttonRef}
        className={selectClassName} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="max-h-[250px] overflow-y-auto overscroll-contain flex flex-col py-1 custom-scrollbar">
            <button
              type="button"
              className="flex items-center px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border-b border-slate-100 dark:border-slate-800 text-left"
              onClick={() => { setIsCustom(true); setIsOpen(false); }}
            >
              + Custom Hajari Value...
            </button>
            {availableOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex items-center justify-between px-3 py-2.5 text-sm transition-colors text-left
                  ${currentValue === opt.value 
                    ? "bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100" 
                    : "font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                onClick={() => {
                  setCurrentValue(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
                {currentValue === opt.value && <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
