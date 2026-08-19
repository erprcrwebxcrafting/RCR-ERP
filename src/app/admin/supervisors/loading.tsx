export default function SupervisorsLoading() {
  return (
    <div className="space-y-8 pb-10 animate-pulse">
      {/* Page Header Banner */}
      <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800" />

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60" />
      </div>

      {/* Search / Filter Bar */}
      <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60" />

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60" />
        ))}
      </div>
    </div>
  );
}
