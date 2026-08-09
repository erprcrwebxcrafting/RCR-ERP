"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSiteProgress } from "../actions";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Percent } from "lucide-react";

export function SiteProgressEdit({ siteId, initialProgress }: { siteId: string; initialProgress: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(initialProgress.toString());
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
      setProgress(p.toString());
      router.refresh();
    } catch (e) {
      alert("Failed to update progress.");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-24">
          <Input 
            type="number" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={(e) => setProgress(e.target.value)} 
            className="pr-6 h-8 text-sm"
          />
          <Percent className="h-3 w-3 absolute right-2 top-2.5 text-muted-foreground" />
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave} disabled={loading}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { setIsEditing(false); setProgress(initialProgress.toString()); }} disabled={loading}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
      <div className="flex flex-col gap-1 w-24">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Progress</span>
          <span>{initialProgress}%</span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full transition-all" style={{ width: `${initialProgress}%` }} />
        </div>
      </div>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
