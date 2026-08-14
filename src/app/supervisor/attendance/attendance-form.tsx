"use client";

import { useTransition, useState, FormEvent } from "react";
import { saveAttendance } from "./actions";
import { CheckCircle2, Lock, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AttendanceForm({ siteId, allLocked, hasExisting, headerControls, children }: { siteId: string, allLocked: boolean, hasExisting: boolean, headerControls: React.ReactNode, children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const [isEditing, setIsEditing] = useState(!hasExisting);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (allLocked) return;
    
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveAttendance(siteId, formData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  return (
    <>
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 font-medium tracking-wide">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-bold text-lg">Attendance Saved!</span>
        </div>
      )}
      
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
              <Button type="button" disabled size="lg" className="w-full md:w-auto h-12 px-6 rounded-xl gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold opacity-80 cursor-not-allowed border border-slate-200 dark:border-slate-700">
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
