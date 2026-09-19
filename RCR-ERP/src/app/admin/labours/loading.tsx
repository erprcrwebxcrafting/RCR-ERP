export default function LaboursLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      <div className="h-44 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900/50 dark:to-orange-900/50" />
      <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
}
