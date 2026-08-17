import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/app/admin/labours/[id]/payment-form";
import Link from "next/link";
import { ArrowLeft, User, Phone, Calendar, CreditCard, Building, WalletCards, History, TrendingUp, IndianRupee, ArrowRightLeft, FileText, AlertCircle } from "lucide-react";
import { LabourForm } from "../labour-form";
import { LabourCalendar } from "./labour-calendar";

export default async function LabourLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const labourRaw = await prisma.labour.findUnique({
    where: { id: resolvedParams.id },
    include: {
      site: true,
      labourCategory: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
      payments: { orderBy: { date: "desc" } },
      transferHistory: { include: { fromSite: true, toSite: true }, orderBy: { transferDate: "desc" } },
    } as any,
  });

  const labour = labourRaw as any;

  if (!labour) return notFound();

  const sites = await prisma.site.findMany({
    where: { active: true },
    select: {
      id: true,
      projectName: true,
      labourCategories: { select: { id: true, name: true } },
      // ✅ Only safe supervisor fields
      supervisors: {
        select: { supervisor: { select: { id: true, name: true } } }
      },
    }
  });

  const dailyWage = labour.dailyWage || 0;
  const overtimeRate = labour.overtimeRate || 0;

  // ✅ Use DB aggregate for KPIs instead of JS loops
  const [attendanceAgg, presentAgg, allAttendance] = await Promise.all([
    prisma.attendance.aggregate({
      where: { labourId: labour.id, hajari: { gt: 0 } },
      _sum: { hajari: true },
    }),
    prisma.attendance.count({ where: { labourId: labour.id, hajari: { gt: 0 } } }),
    // Fetch actual records for the calendar component
    prisma.attendance.findMany({ 
      where: { labourId: labour.id },
      orderBy: { date: "desc" }
    })
  ]);

  let totalEarned = 0;
  const presentDays = attendanceAgg._sum.hajari ?? 0;

  // Approximate earned using current daily wage (exact per-record rate not needed for summary)
  totalEarned = presentDays * dailyWage;


  const totalPaid = labour.payments.reduce((sum: any, p: any) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/labours" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <User className="h-3.5 w-3.5" />
              Labour Ledger
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              {labour.name}
              <Badge variant={labour.active ? "default" : "destructive"} className={`text-[10px] uppercase font-bold shadow-none ${labour.active ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                {labour.active ? "Active" : "Inactive"}
              </Badge>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
              <Building className="h-4 w-4 shrink-0 text-indigo-500" />
              {labour.site.projectName} <span className="text-slate-300 dark:text-slate-700">•</span> {labour.labourCategory.name}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 flex-1 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-500" /> Phone</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.phone || "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Joined Date</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.joiningDate ? formatDate(labour.joiningDate) : "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-violet-500" /> Aadhar</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.aadharNumber || "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-emerald-500" /> Bank Name</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.bankName || "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><WalletCards className="h-3.5 w-3.5 text-amber-500" /> Account No.</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.accountNumber || "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-rose-500" /> IFSC Code</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.ifscCode || "—"}</div>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">Bank Branch</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{labour.bankBranch || "—"}</div>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">Address</div>
                  <div className="font-medium text-slate-700 dark:text-slate-300">{labour.address || "—"}</div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center md:items-start justify-end w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-6">
               <LabourForm sites={sites as any} labour={labour} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Hajari Rate</p>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{dailyWage}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Per Hajari</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Earned</p>
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">₹{totalEarned.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">From {presentDays} Hajaris</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <History className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Paid</p>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{totalPaid.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Across {labour.payments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${balance > 0 ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900"}`}>
          <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-all duration-500 ${balance > 0 ? "bg-rose-500/10 group-hover:bg-rose-500/20" : "bg-slate-500/10 group-hover:bg-slate-500/20"}`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${balance > 0 ? "bg-rose-500/10 border border-rose-500/20" : "bg-slate-500/10 border border-slate-500/20"}`}>
                <AlertCircle className={`h-5 w-5 ${balance > 0 ? "text-rose-600" : "text-slate-500"}`} />
              </div>
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${balance > 0 ? "text-rose-600/80 dark:text-rose-400/80" : "text-slate-500 dark:text-slate-400"}`}>Outstanding Balance</p>
            <p className={`text-3xl font-black tracking-tight ${balance > 0 ? "text-rose-600 dark:text-rose-500" : "text-slate-800 dark:text-slate-100"}`}>
              ₹{balance.toLocaleString("en-IN")}
            </p>
            <p className={`text-xs font-medium mt-1 ${balance > 0 ? "text-rose-500/70 dark:text-rose-400/70" : "text-slate-400"}`}>Amount to be cleared</p>
          </CardContent>
        </Card>
      </div>

      <LabourCalendar attendances={allAttendance as any} payments={labour.payments} />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Payouts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <History className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payment History</h2>
            </div>
            <PaymentForm labourId={labour.id} />
          </div>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TR>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Amount</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Details</TH>
                  </TR>
                </THead>
                <TBody>
                  {labour.payments.map((p: any) => (
                    <TR key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{formatDate(p.date)}</TD>
                      <TD className="whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">- ₹{p.amount.toLocaleString("en-IN")}</TD>
                      <TD>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.reason || "Payout"}</div>
                        {p.transactionId && <div className="text-xs text-slate-500 mt-0.5 font-mono">Tx: {p.transactionId}</div>}
                      </TD>
                    </TR>
                  ))}
                  {labour.payments.length === 0 && (
                    <TR>
                      <TD colSpan={3} className="py-12 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <History className="h-8 w-8 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No payments recorded yet.</p>
                        </div>
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Recent Attendance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recent Attendance</h2>
          </div>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TR>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Status</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Earned</TH>
                  </TR>
                </THead>
                <TBody>
                  {labour.attendances.map((a: any) => {
                    const appliedRate = a.hajariRate || dailyWage;
                    const dayEarned = (a.hajari || 0) * appliedRate;

                    return (
                      <TR key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{formatDate(a.date)}</TD>
                        <TD>
                          <Badge className={`${a.hajari > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 border-rose-500/20"} shadow-none font-bold`}>
                            {a.hajari > 0 ? `${a.hajari} Hajari` : "Absent"}
                          </Badge>
                        </TD>
                        <TD className="text-emerald-600 font-bold">
                          {dayEarned > 0 ? `+ ₹${dayEarned}` : "—"}
                        </TD>
                      </TR>
                    );
                  })}
                  {labour.attendances.length === 0 && (
                    <TR>
                      <TD colSpan={3} className="py-12 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <Calendar className="h-8 w-8 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No attendance marked yet.</p>
                        </div>
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Transfer History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Transfer History</h2>
        </div>
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <TR>
                  <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                  <TH className="font-semibold text-slate-600 dark:text-slate-300">From Site</TH>
                  <TH className="font-semibold text-slate-600 dark:text-slate-300">To Site</TH>
                  <TH className="font-semibold text-slate-600 dark:text-slate-300">Wage Change</TH>
                </TR>
              </THead>
              <TBody>
                {labour.transferHistory?.map((t: any) => (
                  <TR key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{formatDate(t.transferDate)}</TD>
                    <TD className="font-medium text-slate-700 dark:text-slate-300">{t.fromSite?.projectName || "—"}</TD>
                    <TD className="font-bold text-slate-800 dark:text-slate-100">{t.toSite.projectName}</TD>
                    <TD>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                        <span>₹{t.previousDailyWage}</span>
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>₹{t.newDailyWage}</span>
                      </div>
                    </TD>
                  </TR>
                ))}
                {(!labour.transferHistory || labour.transferHistory.length === 0) && (
                  <TR>
                    <TD colSpan={4} className="py-12 text-center">
                      <div className="inline-flex flex-col items-center justify-center">
                        <ArrowRightLeft className="h-8 w-8 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No transfers recorded.</p>
                      </div>
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
