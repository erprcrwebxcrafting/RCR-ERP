import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, CheckCircle2, XCircle, Clock, Building, FileText, FileSpreadsheet, MapPin, CalendarDays, Filter, UserCheck, Banknote, Wallet } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getFinancialYearDates } from "@/lib/get-fy";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { AttendanceFilterForm } from "./attendance-filter-form";
import { unstable_cache } from "next/cache";

const PAGE_SIZE = 10;

async function fetchAttendanceData(
  clampedStartDateStr: string,
  clampedEndDateStr: string,
  siteId: string,
  q: string,
  page: number
) {
  const startDate = new Date(clampedStartDateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(clampedEndDateStr);
  endDate.setHours(23, 59, 59, 999);

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

  const paymentWhereClause: any = {
    date: { gte: startDate, lte: endDate },
  };
  if (siteId) paymentWhereClause.labour = { siteId };
  if (q) {
    paymentWhereClause.labour = {
      ...paymentWhereClause.labour,
      name: { contains: q, mode: "insensitive" }
    };
  }

  let supervisorUserIds: string[] = [];
  if (siteId) {
    const siteSupervisors = await prisma.siteSupervisor.findMany({ where: { siteId } });
    supervisorUserIds = siteSupervisors.map(ss => ss.supervisorId);
  }

  const [total, presentAgg, absentAgg, hajariAgg, attendanceForEarned, paymentAgg, attendance, supCountAgg, supEarnedAgg, supPayAgg] = await Promise.all([
    prisma.attendance.count({ where: whereClause }),
    prisma.attendance.count({ where: { ...whereClause, hajari: { gt: 0 } } }),
    prisma.attendance.count({ where: { ...whereClause, hajari: 0 } }),
    prisma.attendance.aggregate({
      where: { ...whereClause, hajari: { gt: 0 } },
      _sum: { hajari: true },
    }),
    prisma.attendance.findMany({
      where: { ...whereClause, hajari: { gt: 0 } },
      select: { hajari: true, hajariRate: true, labour: { select: { dailyWage: true } } }
    }),
    prisma.labourPayment.aggregate({
      where: paymentWhereClause,
      _sum: { amount: true }
    }),
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
    supervisorUserIds.length > 0 ? prisma.supervisorAttendance.aggregate({
      where: { supervisorId: { in: supervisorUserIds }, date: { gte: startDate, lte: endDate }, status: { not: "ABSENT" } },
      _count: { id: true }
    }) : { _count: { id: 0 } },
    supervisorUserIds.length > 0 ? prisma.supervisorAttendance.aggregate({
      where: { supervisorId: { in: supervisorUserIds }, date: { gte: startDate, lte: endDate } },
      _sum: { earnedAmount: true }
    }) : { _sum: { earnedAmount: 0 } },
    supervisorUserIds.length > 0 ? prisma.supervisorPayment.aggregate({
      where: { supervisorId: { in: supervisorUserIds }, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true }
    }) : { _sum: { amount: 0 } }
  ]);

  const pageLabourIds = Array.from(new Set(attendance.map((a: any) => a.labourId)));
  const pagePayments = await prisma.labourPayment.findMany({
    where: {
      labourId: { in: pageLabourIds },
      date: { gte: startDate, lte: endDate }
    }
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const totalHajari = (hajariAgg._sum.hajari ?? 0) + (supCountAgg._count.id || 0);

  let grossEarned = supEarnedAgg._sum.earnedAmount || 0;
  for (const a of attendanceForEarned) {
    const rate = a.hajariRate || a.labour?.dailyWage || 0;
    grossEarned += a.hajari * rate;
  }
  const totalAdvance = (paymentAgg._sum.amount || 0) + (supPayAgg._sum.amount || 0);
  const netPayable = grossEarned - totalAdvance;

  return {
    total,
    attendance,
    pagePayments,
    totalPages,
    totalHajari,
    grossEarned,
    totalAdvance,
    netPayable
  };
}

const getCachedAttendanceData = (start: string, end: string, siteId: string, q: string, page: number) => {
  return unstable_cache(
    () => fetchAttendanceData(start, end, siteId, q, page),
    ['admin-attendance-labours-v1', start, end, siteId, q, page.toString()],
    { revalidate: false, tags: ['reports-data'] }
  )();
};

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ q?: string; siteId?: string; startDate?: string; endDate?: string; page?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const siteId = resolvedParams.siteId || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Default to the 1st of the current month so the table isn't empty by default
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfMonthStr = format(firstOfMonth, 'yyyy-MM-dd');

  const startDateStr = resolvedParams.startDate || firstOfMonthStr;
  const endDateStr = resolvedParams.endDate || todayStr;

  const { startDate: fyStart, endDate: fyEnd } = await getFinancialYearDates();

  const sites = await prisma.site.findMany({
    where: { active: true },
    orderBy: { projectName: "asc" },
    select: { id: true, projectName: true },
  });

  const {
    total,
    attendance,
    pagePayments,
    totalPages,
    totalHajari,
    grossEarned,
    totalAdvance,
    netPayable
  } = await getCachedAttendanceData(clampedStartDateStr, clampedEndDateStr, siteId, q, page);

  const exportUrlParams = new URLSearchParams({ siteId, startDate: startDateStr, endDate: endDateStr });
  if (q) exportUrlParams.set("q", q);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams({ siteId, startDate: startDateStr, endDate: endDateStr, q, page: String(p) });
    return `/admin/attendance/labours?${params.toString()}`;
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
              View, filter, and export attendance and payment ledgers across all sites. Track worker hajaris and payments centrally.
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
                  <FileSpreadsheet className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> Excel Ledger
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                disabled={!siteId}
                className={!siteId ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5" : "border-transparent bg-white hover:bg-white/90 text-rose-600 shadow-xl shadow-rose-900/10 transition-all font-bold h-10 rounded-xl px-5"}
              >
                <a href={`/api/attendance/export?format=pdf&${exportUrlParams.toString()}`} target="_blank" rel="noreferrer">
                  <FileText className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> PDF Ledger
                </a>
              </Button>
            </div>
            {!siteId && <span className="text-[11px] text-white/90 font-bold px-3 py-1.5 bg-black/20 rounded-full backdrop-blur-md border border-white/10 shadow-inner">Select a site to enable export</span>}
          </div>
        </div>
      </div>

      {/* Top Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        <Link href="/admin/attendance/labours" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm">
          <Users className="h-4 w-4" />
          Labour Attendance Explorer
        </Link>
        <Link href="/admin/attendance/supervisors" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <UserCheck className="h-4 w-4" />
          Supervisor Attendance Hub
        </Link>
      </div>

      {/* Filters Bar */}
      <AttendanceFilterForm
        startDateStr={clampedStartDateStr}
        endDateStr={clampedEndDateStr}
        siteId={siteId}
        q={q}
        sites={sites}
        wasClamped={wasClamped}
      />

      {/* KPI Cards — powered by DB aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-500/10 blur-2xl" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Logs</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{total.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Hajaris</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-blue-600 dark:text-blue-500">{totalHajari.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Gross Wages</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">₹{Math.round(grossEarned).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-600/80 dark:text-rose-400/80 mb-1">Total Paid</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-500">₹{Math.round(totalAdvance).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20 col-span-2">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600/80 dark:text-indigo-400/80 mb-1">Net Balance</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-500">₹{Math.round(netPayable).toLocaleString("en-IN")}</p>
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
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Status &amp; Payment</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">OT Hrs</TH>
                <TH className="font-semibold text-slate-600 dark:text-slate-300">Remarks</TH>
              </TR>
            </THead>
            <TBody>
              {attendance.map((a: any) => {
                const colors = ['bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'];
                const colorClass = colors[a.labour.name.charCodeAt(0) % colors.length];
                
                // Find payments on this specific date for this labour
                const aDateStr = format(new Date(a.date), 'yyyy-MM-dd');
                const dayPayments = pagePayments.filter((p: any) => p.labourId === a.labourId && format(new Date(p.date), 'yyyy-MM-dd') === aDateStr);
                const dayPaid = dayPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

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
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge className={`${a.hajari > 0 ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-500/20"} shadow-none font-bold`}>
                          {a.hajari > 0 ? `${a.hajari} Hajari` : "Absent"}
                        </Badge>
                        {dayPaid > 0 && (
                          <div className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/50 flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> ₹{dayPaid.toLocaleString("en-IN")} Paid
                          </div>
                        )}
                      </div>
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
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No logs found</h3>
                      <p className="text-slate-500 font-medium mt-1">No attendance or payment records found for these filters.</p>
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
