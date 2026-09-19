export default function SiteDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Back button + header */}
      <div className="h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />

      {/* Tabs skeleton */}
      <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-white dark:bg-slate-900 px-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
