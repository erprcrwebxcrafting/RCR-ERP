"use client";

export function SiteProgressEdit({
  siteId,
  initialProgress,
  autoProgress,
}: {
  siteId?: string;
  initialProgress?: number;
  autoProgress?: number;
}) {
  // Pure auto-calculated progress percentage
  const progress = autoProgress ?? initialProgress ?? 0;

  return (
    <div className="flex items-center gap-3 bg-muted/30 px-3.5 py-2 rounded-lg border border-border/50 shadow-sm">
      <div className="flex flex-col gap-1 w-32">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-bold font-mono text-emerald-500">{progress}%</span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
