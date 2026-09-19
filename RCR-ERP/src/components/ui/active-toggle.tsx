"use client";
import { useState, useTransition } from "react";

interface ActiveToggleProps {
  id: string;
  active: boolean;
  entityName: string;
  onToggle: (id: string, active: boolean) => Promise<void>;
  size?: "sm" | "md";
}

export function ActiveToggle({ id, active, entityName, onToggle, size = "md" }: ActiveToggleProps) {
  const [optimisticActive, setOptimisticActive] = useState(active);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    const newActive = !optimisticActive;
    const action = newActive ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} "${entityName}"? ${newActive ? "They will appear on attendance lists." : "They will be hidden from attendance lists."}`)) return;

    setOptimisticActive(newActive);
    startTransition(async () => {
      try {
        await onToggle(id, newActive);
      } catch {
        // Revert on error
        setOptimisticActive(!newActive);
      }
    });
  }

  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-${isSmall ? "2" : "3"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={optimisticActive}
        aria-label={`${optimisticActive ? "Deactivate" : "Activate"} ${entityName}`}
        disabled={isPending}
        onClick={handleChange}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          isSmall ? "h-5 w-9" : "h-6 w-11"
        } ${optimisticActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
            isSmall ? "h-4 w-4" : "h-5 w-5"
          } ${optimisticActive ? (isSmall ? "translate-x-4" : "translate-x-5") : "translate-x-0"}`}
        />
      </button>
      <span
        className={`font-semibold select-none ${isSmall ? "text-xs" : "text-sm"} ${
          optimisticActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {isPending ? "Saving…" : optimisticActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
