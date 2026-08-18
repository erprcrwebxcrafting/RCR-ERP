import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, CheckCircle2, XCircle, Clock, Building, FileText, FileSpreadsheet, MapPin, CalendarDays, Filter, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getFinancialYearDates } from "@/lib/get-fy";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ q?: string; siteId?: string; startDate?: string; endDate?: string; page?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const siteId = resolvedParams.siteId || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const startDateStr = resolvedParams.startDate || todayStr;
  const endDateStr = resolvedParams.endDate || todayStr;

  const { startDate: fyStart, endDate: fyEnd } = await getFinancialYearDates();

  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59, 999);

  // If user hasn't explicitly filtered by date, default to today within FY
  // Note: Attendance page has its own date filter, which is fine, but we can constrain it to FY if needed.
  // Actually, since it defaults to `today`, it usually doesn't load much anyway.
  // We'll enforce that `startDate` cannot be before `fyStart`
  if (startDate < fyStart) {
    startDate.setTime(fyStart.getTime());
  }
  if (endDate > fyEnd) {
    endDate.setTime(fyEnd.getTime());
  }

  const sites = await prisma.site.findMany({
    where: { active: true },
    orderBy: { projectName: "asc" },
    select: { id: true, projectName: true },
  });

  const whereClause: any = {
    date: { gte: startDate, lte: endDate },
  };

  if (siteId) whereClause.siteId = siteId;

  if (q) {
    whereClause.OR = [
      { labour: { name: { contains: q, mode: "insensitive" } } },
      { site: { projectName: { contains: q, mode: "insensitive" } } },
    ];
  }

  // ✅ Run KPI aggregates + paginated data in parallel — no full scan in JS
  const [total, presentAgg, absentAgg, hajariAgg, attendance] = await Promise.all([
    // Total count for pagination
    prisma.attendance.count({ where: whereClause }),

    // Present count (hajari > 0) via DB
    prisma.attendance.count({ where: { ...whereClause, hajari: { gt: 0 } } }),

    // Absent count via DB
    prisma.attendance.count({ where: { ...whereClause, hajari: 0 } }),

    // Sum of all hajaris via DB
    prisma.attendance.aggregate({
      where: { ...whereClause, hajari: { gt: 0 } },
      _sum: { hajari: true },
    }),

    // ✅ Paginated — only 100 rows at a time!
    prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        date: true,
        hajari: true,
        overtimeHrs: true,
        remarks: true,
        labourId: true,
        labour: {
          select: {
            name: true,
            labourCategory: { select: { name: true } },
          },
        },
        site: { select: { projectName: true } },
        building: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const totalHajari = hajariAgg._sum.hajari ?? 0;

  const exportUrlParams = new URLSearchParams({ siteId, startDate: startDateStr, endDate: endDateStr });

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams({ siteId, startDate: startDateStr, endDate: endDateStr, q, page: String(p) });
    return `/admin/attendance?${params.toString()}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <CalendarDays className="h-3.5 w-3.5" />
              Logs &amp; Tracking
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Attendance Explorer</h1>
            <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
              View, filter, and export attendance records across all sites. Track worker hajaris and attendance status centrally.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                asChild
                disabled={!siteId}
                className={!siteId ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5" : "border-transparent bg-white hover:bg-white/90 text-emerald-600 shadow-xl shadow-emerald-900/10 transition-all font-bold h-10 rounded-xl px-5"}
              >
                <a href={`/api/attendance/export?format=excel&${exportUrlParams.toString()}`} target="_blank" rel="noreferrer">
                  <FileSpreadsheet className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> Excel
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                disabled={!siteId}
                className={!siteId ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5" : "border-transparent bg-white hover:bg-white/90 text-rose-600 shadow-xl shadow-rose-900/10 transition-all font-bold h-10 rounded-xl px-5"}
              >
                <a href={`/api/attendance/export?format=pdf&${exportUrlParams.toString()}`} target="_blank" rel="noreferrer">
                  <FileText className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> PDF
                </a>
              </Button>
            </div>
            {!siteId && <span className="text-[11px] text-white/90 font-bold px-3 py-1.5 bg-black/20 rounded-full backdrop-blur-md border border-white/10 shadow-inner">Select a site to enable export</span>}
          </div>
        </div>
      </div>

      {/* Top Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        <Link href="/admin/attendance" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm">
          <Users className="h-4 w-4" />
          Labour Attendance Explorer
        </Link>
        <Link href="/admin/supervisors/attendance" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <UserCheck className="h-4 w-4" />
          Supervisor Attendance Hub
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-20">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filter Attendance Records</h2>
        </div>
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">From Date</label>
            <input type="date" name="startDate" defaultValue={startDateStr} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full" />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">To Date</label>
            <input type="date" name="endDate" defaultValue={endDateStr} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full" />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Site</label>
            <select name="siteId" defaultValue={siteId} className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 px-3 cursor-pointer outline-none transition-all shadow-sm w-full appearance-none">
              <option value="">All Sites</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.projectName}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Search</label>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" name="q" defaultValue={q} placeholder="Search names..." className="h-11 w-full pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-sm" />
            </div>
          </div>

          <div className="flex items-end h-full pt-1.5">
            <Button type="submit" className="h-11 w-full rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all hover:-translate-y-0.5">
              Apply Filters
            </Button>
          </div>
        </form>
      </div>

      {/* KPI Cards — powered by DB aggregates, not JS loops */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-500/10 blur-2xl" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Logs</p>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{total.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Days Present</p>
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">{presentAgg.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Hajaris</p>
            <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-500">{totalHajari.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600/80 dark:text-rose-400/80 mb-1">Absent</p>
            <p className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-500">{absentAgg.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pagination Info Component */}
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        totalItems={total} 
        pageSize={PAGE_SIZE} 
      />

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead className="bg-slate-50/80 dark:bg-slate-900/80">
              <TR>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Site &amp; Building</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Worker</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Status</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">OT Hrs</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Remarks</TH>
              </TR>
            </THead>
            <TBody>
              {attendance.map((a: any) => {
                const colors = ['bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'];
                const colorClass = colors[a.labour.name.charCodeAt(0) % colors.length];
                return (
                  <TR key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TD className="align-top whitespace-nowrap">
                      <div className="font-bold text-slate-700 dark:text-slate-300">{format(new Date(a.date), 'MMM dd, yyyy')}</div>
                    </TD>
                    <TD className="align-top">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-500" /> {a.site.projectName}</div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 ml-5 flex items-center gap-1">
                        <Building className="h-3 w-3" /> {a.building?.name || 'General'}
                      </div>
                    </TD>
                    <TD className="align-top">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
                          {a.labour.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <Link href={`/admin/labours/${a.labourId}`} className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {a.labour.name}
                          </Link>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{a.labour.labourCategory.name}</span>
                        </div>
                      </div>
                    </TD>
                    <TD className="align-top">
                      <Badge className={`${a.hajari > 0 ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-500/20"} shadow-none font-bold`}>
                        {a.hajari > 0 ? `${a.hajari} Hajari` : "Absent"}
                      </Badge>
                    </TD>
                    <TD className="align-top text-slate-500 dark:text-slate-400 font-bold">
                      {a.overtimeHrs > 0 ? `${a.overtimeHrs}h` : '—'}
                    </TD>
                    <TD className="align-top text-slate-600 dark:text-slate-300 text-sm">
                      {a.remarks || '—'}
                    </TD>
                  </TR>
                );
              })}
              {attendance.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-16 text-center">
                    <div className="inline-flex flex-col items-center justify-center">
                      <CalendarDays className="h-10 w-10 text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No attendance logs</h3>
                      <p className="text-slate-500 font-medium mt-1">No attendance records found for these filters.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

      </div>
    </div>
  );
}
