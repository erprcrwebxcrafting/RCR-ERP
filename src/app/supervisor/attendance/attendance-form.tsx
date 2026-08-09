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
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-bold text-lg">Data saved successfully!</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {/* Control Bar */}
        <Card className="p-2 md:p-4 border-border/60 shadow-sm bg-card/50 backdrop-blur-sm sticky top-4 z-20">
          <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-between gap-4">
            {headerControls}
            
            {allLocked ? (
              <Button type="button" disabled size="lg" className="w-full md:w-auto gap-2 bg-muted text-muted-foreground opacity-80 cursor-not-allowed border border-border">
                <Lock className="h-4 w-4" />
                Locked (Past 24h)
              </Button>
            ) : (
              (hasExisting && !isEditing) ? (
                <Button type="button" onClick={(e) => { e.preventDefault(); setIsEditing(true); }} size="lg" className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  <Edit className="h-4 w-4" />
                  Edit Attendance
                </Button>
              ) : (
                <Button type="submit" size="lg" className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95" disabled={isPending}>
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Attendance"}
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
