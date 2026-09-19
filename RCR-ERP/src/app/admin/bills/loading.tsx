export default function BillsLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      <div className="h-44 rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 dark:from-rose-900/50 dark:to-pink-900/50" />
      <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-slate-900 px-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-40 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
