export default function SupervisorDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      <div className="h-44 rounded-2xl bg-gradient-to-br from-indigo-200 to-violet-300 dark:from-indigo-900/50 dark:to-violet-900/50" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
}
