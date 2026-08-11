"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSiteProgress } from "../actions";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Percent, RefreshCw } from "lucide-react";

export function SiteProgressEdit({
  siteId,
  siteProgress,
  autoProgress,
}: {
  siteId: string;
  siteProgress?: number;
  autoProgress: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const activeProgress = (siteProgress !== undefined && siteProgress !== null && siteProgress >= 0)
    ? siteProgress
    : autoProgress;

  const [progress, setProgress] = useState(activeProgress.toString());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    let p = parseFloat(progress);
    if (isNaN(p)) p = 0;
    if (p < 0) p = 0;
    if (p > 100) p = 100;

    setLoading(true);
    try {
      await updateSiteProgress(siteId, p);
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert("Failed to update progress.");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
        <div className="relative w-24">
          <Input 
            type="number" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={(e) => setProgress(e.target.value)} 
            className="pr-6 h-8 text-xs font-mono font-bold"
          />
          <Percent className="h-3 w-3 absolute right-2 top-2.5 text-muted-foreground" />
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setProgress(autoProgress.toString())}
          className="h-8 text-[11px] gap-1 px-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
          title="Use Auto Calculated Progress"
        >
          <RefreshCw className="h-3 w-3" /> Auto ({autoProgress}%)
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave} disabled={loading}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { setIsEditing(false); setProgress(activeProgress.toString()); }} disabled={loading}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const isManual = siteProgress !== undefined && siteProgress !== null && siteProgress !== autoProgress;

  return (
    <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
      <div className="flex flex-col gap-1 w-28">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground flex items-center gap-1">
            Progress
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isManual ? "text-amber-500" : "text-emerald-500"}`}>
              ({isManual ? "Manual" : "Auto"})
            </span>
          </span>
          <span className="font-bold font-mono">{activeProgress}%</span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${isManual ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${activeProgress}%` }} />
        </div>
      </div>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Edit or override progress manually" onClick={() => { setProgress(activeProgress.toString()); setIsEditing(true); }}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
