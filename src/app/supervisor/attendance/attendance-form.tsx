"use client";

import { useTransition, useState, FormEvent } from "react";
import { saveAttendance } from "./actions";
import { CheckCircle2, Lock, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function AttendanceForm({ siteId, allLocked, hasExisting, headerControls, children }: { siteId: string, allLocked: boolean, hasExisting: boolean, headerControls: React.ReactNode, children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(!hasExisting);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (allLocked) return;
    
    const formData = new FormData(e.currentTarget);

    // Custom Validation for Hajari Input
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("hajari__")) {
        const numValue = parseFloat(value as string);
        if (numValue < 0) {
          toast.warning("Invalid Hajari", { description: "Hajari value cannot be negative." });
          return;
        }
        if (numValue > 10) {
          toast.warning("Invalid Hajari", { description: "Hajari value cannot be greater than 10." });
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const res = await saveAttendance(siteId, formData);
        
        if (res && res.error) {
          toast.error("Validation Error", {
            description: res.error,
          });
          return;
        }

        toast.success("Attendance saved successfully!", {
          description: "Worker hajari and daily shift records updated.",
        });
        setIsEditing(false);
      } catch (err: any) {
        toast.error("Failed to save attendance", {
          description: err?.message || "Please check network connection and retry.",
        });
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-2xl">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent shadow-lg"></div>
          </div>
        )}
        
        {/* Control Bar */}
        <Card className="p-3 md:p-4 border-slate-200 dark:border-slate-800/60 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-4 z-20 rounded-2xl">
          <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-between gap-4">
            {headerControls}
            
            {allLocked ? (
              <Button type="button" onClick={() => toast.error("Attendance cannot be edited after 24 hours of creation.")} size="lg" className="w-full md:w-auto h-12 px-6 rounded-xl gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold opacity-80 border border-slate-200 dark:border-slate-700">
                <Lock className="h-4 w-4" />
                Locked (Past 24h)
              </Button>
            ) : (
              (hasExisting && !isEditing) ? (
                <Button type="button" onClick={(e) => { e.preventDefault(); setIsEditing(true); }} size="lg" className="w-full md:w-auto h-12 px-8 rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xl shadow-indigo-900/20 transition-all font-bold hover:-translate-y-0.5 border-0">
                  <Edit className="h-4 w-4" />
                  Edit Attendance
                </Button>
              ) : (
                <Button type="submit" size="lg" className="w-full md:w-auto h-12 px-8 rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl shadow-emerald-900/20 transition-all font-bold hover:-translate-y-0.5 border-0" disabled={isPending}>
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving Data..." : "Save Attendance"}
                </Button>
              )
            )}
          </div>
        </Card>

        <fieldset disabled={hasExisting && !isEditing} className="space-y-6 min-w-0">
          {children}
        </fieldset>
      </form>
    </>
  );
}
