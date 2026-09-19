export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      {/* Header */}
      <div className="h-44 rounded-2xl bg-gradient-to-br from-violet-200 to-purple-300 dark:from-violet-900/50 dark:to-purple-900/50" />

      {/* Filter bar */}
      <div className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      </div>
    </div>
  );
}
