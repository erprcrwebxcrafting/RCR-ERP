export default function SupervisorAttendancePageLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="h-36 rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-900/50 dark:to-indigo-900/50" />

      {/* Date nav + controls */}
      <div className="flex gap-3">
        <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Labour attendance cards */}
      <div className="grid grid-cols-1 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
}
