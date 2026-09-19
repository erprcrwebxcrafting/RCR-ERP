export default function DocumentLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header */}
      <div className="h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
      
      {/* Action Bar */}
      <div className="flex gap-4 mt-4">
        <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Main Document Area */}
      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-10 min-h-[600px] shadow-sm space-y-8">
        {/* Doc Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-3">
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-900" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-900" />
          </div>
        </div>

        {/* Content rows */}
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-slate-50 dark:bg-slate-900/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
