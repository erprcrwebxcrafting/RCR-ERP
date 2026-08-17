export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      {/* Header skeleton */}
      <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />

      {/* Recent activity skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
