export default function AttendanceLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      {/* Header skeleton */}
      <div className="h-40 rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-900/50 dark:to-indigo-900/50" />

      {/* Tabs */}
      <div className="h-12 w-80 rounded-2xl bg-slate-100 dark:bg-slate-800" />

      {/* Filters */}
      <div className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 px-6 flex items-center gap-4">
              <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-40 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
