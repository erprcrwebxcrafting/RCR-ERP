export default function SitesLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      <div className="h-44 rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-900/50 dark:to-teal-900/50" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
}
