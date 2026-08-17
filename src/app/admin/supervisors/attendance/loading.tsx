export default function SupervisorAttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="h-44 rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-900/50 dark:to-teal-900/50" />

      {/* Tabs */}
      <div className="h-12 w-72 rounded-2xl bg-slate-100 dark:bg-slate-800" />

      {/* Controls */}
      <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />

      {/* Supervisor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
}
