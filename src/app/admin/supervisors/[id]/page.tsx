import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { AttendanceCalendar } from "./attendance-calendar";
import { PaymentSlipAction } from "@/components/ui/payment-slip-actions";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  History,
  ArrowRightLeft,
  CreditCard,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Building2,
  Landmark,
  User,
  MapPin,
  Calendar,
  Hash,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupervisorPaymentForm } from "./payment-form";
import { EditSupervisorForm } from "../edit-supervisor-form";
import { Pagination } from "@/components/ui/pagination";
import { DownloadSalarySlip } from "./download-salary-slip";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { AadharUpload } from "@/components/ui/aadhar-upload";
import { toggleSupervisorActive } from "../actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SupervisorLedgerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payoutPage?: string; transferPage?: string; wageHistoryPage?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const payoutPage = Math.max(1, parseInt(resolvedSearchParams.payoutPage || "1", 10));
  const transferPage = Math.max(1, parseInt(resolvedSearchParams.transferPage || "1", 10));
  const wageHistoryPage = Math.max(1, parseInt(resolvedSearchParams.wageHistoryPage || "1", 10));
  const PAGE_SIZE = 5;

  const [supervisor, allSites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: resolvedParams.id, role: "SUPERVISOR" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        monthlySalary: true,
        dateOfJoining: true,
        address: true,
        // ✅ Safe bank details only (needed for ledger display)
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        bankBranch: true,
        aadharNumber: true,
        aadharCardUrl: true,
        // ✅ NO passwordHash sent to browser
        supervisorPayments: {
          select: { id: true, amount: true, date: true, transactionId: true, reason: true },
          orderBy: { date: "desc" }
        },
        assignedSites: {
          where: {
            site: { active: true }
          },
          select: {
            siteId: true,
            site: { select: { id: true, projectName: true } }
          }
        },
        supervisorTransfers: {
          select: {
            id: true,
            transferDate: true,
            laboursTransferred: true,
            fromSite: { select: { projectName: true } },
            toSite: { select: { projectName: true } },
          },
          orderBy: { transferDate: "desc" }
        },
        supervisorAttendances: {
          select: { id: true, date: true, status: true, earnedAmount: true, dailyRate: true },
          orderBy: { date: "desc" }
        },
        // @ts-ignore
        wageHistory: {
          orderBy: { effectiveDate: "desc" }
        },
      },
    }),
    prisma.site.findMany({
      where: { active: true },
      select: { id: true, projectName: true },
      orderBy: { projectName: "asc" },
    }),
  ]);

  const sv = supervisor as any;
  if (!sv) return notFound();

  const monthlySalary = sv.monthlySalary || 0;
  const standardDailyRate = Math.round((monthlySalary / 30) * 100) / 100;

  // Attendance calculations
  const attendances = sv.supervisorAttendances || [];
  const presentDays = attendances.filter((a: any) => a.status === "PRESENT").length;
  const halfDays = attendances.filter((a: any) => a.status === "HALF_DAY").length;
  const totalDaysEquivalent = presentDays + (halfDays * 0.5);

  // Total earned strictly based on attendance marked
  const totalEarned = attendances.reduce((sum: number, a: any) => sum + (a.earnedAmount || 0), 0);
  const totalPaid = (sv.supervisorPayments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  const totalPayments = (sv.supervisorPayments || []).length;
  const paginatedPayments = (sv.supervisorPayments || []).slice((payoutPage - 1) * PAGE_SIZE, payoutPage * PAGE_SIZE);

  const totalTransfers = sv.supervisorTransfers.length;
  const paginatedTransfers = sv.supervisorTransfers.slice((transferPage - 1) * PAGE_SIZE, transferPage * PAGE_SIZE);

  const totalWageHistory = sv.wageHistory?.length || 0;
  const paginatedWageHistory = (sv.wageHistory || []).slice((wageHistoryPage - 1) * PAGE_SIZE, wageHistoryPage * PAGE_SIZE);

  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/supervisors"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <Wallet className="h-3.5 w-3.5" />
              Supervisor Profile & Ledger
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {sv.name}
              </h1>
              <Badge variant={sv.active ? "default" : "destructive"} className={`text-[10px] uppercase font-bold shadow-none ${sv.active ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                {sv.active ? "Active" : "Inactive"}
              </Badge>
              <div className="ml-1">
                <ActiveToggle id={sv.id} active={sv.active} entityName={sv.name} onToggle={toggleSupervisorActive} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-2.5 font-medium text-xs sm:text-sm break-words">
              Assigned Sites: {sv.assignedSites.map((a: any) => a.site.projectName).join(", ") || "No active sites"}
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 mt-4 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
            <div className="flex-1 sm:flex-none [&>button]:w-full"><DownloadSalarySlip supervisorId={sv.id} /></div>
            <div className="flex-1 sm:flex-none [&>button]:w-full"><EditSupervisorForm supervisor={sv} allSites={allSites} /></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Monthly Salary</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{monthlySalary.toLocaleString("en-IN")}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Daily Rate: ₹{standardDailyRate}/day (÷ 30)</p>
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Attendance Earned</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">
              ₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
              For {totalDaysEquivalent} days present ({presentDays} full, {halfDays} half)
            </p>
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
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{totalPaid.toLocaleString("en-IN")}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Across {sv.supervisorPayments.length} payout(s)</p>
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
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${balance > 0 ? "text-rose-600 dark:text-rose-500" : "text-slate-800 dark:text-slate-100"}`}>
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs font-medium mt-1 ${balance > 0 ? "text-rose-500/70 dark:text-rose-400/70" : "text-slate-400"}`}>
              {balance > 0 ? "Pending salary payout" : "Balance fully cleared"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor Details Grid (Personal, Bank, Assigned Sites) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Details */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <User className="h-4 w-4 text-blue-500" /> Personal Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{sv.phone || "No phone number"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{sv.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{sv.address || "No address on file"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Aadhar: {sv.aadharNumber || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Joined: {sv.dateOfJoining ? formatDate(sv.dateOfJoining) : formatDate(sv.createdAt)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
              <AadharUpload type="supervisor" id={sv.id} currentUrl={sv.aadharCardUrl} />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Landmark className="h-4 w-4 text-emerald-500" /> Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Account Number</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{sv.accountNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">IFSC Code</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{sv.ifscCode || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Bank & Branch</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{[sv.bankName, sv.bankBranch].filter(Boolean).join(", ") || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Sites & Attendance Summary */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Building2 className="h-4 w-4 text-indigo-500" /> Assigned Sites ({sv.assignedSites.length})
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600">
              <Link href={`/admin/supervisors/${sv.id}/attendance`}>View Calendar →</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {sv.assignedSites.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sv.assignedSites.map((a: any, index: number) => (
                  <span
                    key={a.id || index}
                    className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {a.site.projectName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No site assignments</p>
            )}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Attendance Summary:</p>
              <p>● Full Days: <strong className="text-emerald-600">{presentDays}</strong></p>
              <p>● Half Days: <strong className="text-amber-600">{halfDays}</strong></p>
              <p>● Total Attendance Recorded: <strong>{attendances.length} days</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AttendanceCalendar supervisor={sv} initialAttendances={attendances} />

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
        {/* Payment History Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <History className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Payout History</h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <PaymentSlipAction entityId={sv.id} entityType="SUPERVISOR" variant="statement" />
              <SupervisorPaymentForm supervisorId={sv.id} />
            </div>
          </div>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TR>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Amount</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Details</TH>
                    <TH className="text-right font-semibold text-slate-600 dark:text-slate-300">Slip</TH>
                  </TR>
                </THead>
                <TBody>
                  {paginatedPayments.map((p: any) => (
                    <TR key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{formatDate(p.date)}</TD>
                      <TD className="whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">- ₹{p.amount.toLocaleString("en-IN")}</TD>
                      <TD>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.reason || "Payout"}</div>
                        {p.transactionId && <div className="text-xs text-slate-500 mt-0.5 font-mono">Tx: {p.transactionId}</div>}
                      </TD>
                      <TD className="text-right">
                        <PaymentSlipAction entityId={sv.id} entityType="SUPERVISOR" paymentId={p.id} />
                      </TD>
                    </TR>
                  ))}
                  {totalPayments === 0 && (
                    <TR>
                      <TD colSpan={4} className="py-12 text-center">
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
          <Pagination 
            currentPage={payoutPage} 
            totalPages={Math.ceil(totalPayments / PAGE_SIZE)} 
            totalItems={totalPayments} 
            pageSize={PAGE_SIZE} 
            pageParam="payoutPage"
          />
        </div>

        {/* Transfer History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Transfer History</h2>
          </div>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TR>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Date</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Transfer Details</TH>
                  </TR>
                </THead>
                <TBody>
                  {paginatedTransfers.map((t: any) => (
                    <TR key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 align-top pt-4">{formatDate(t.transferDate)}</TD>
                      <TD>
                        <div className="flex flex-col space-y-2 py-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 w-10">From:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{t.fromSite?.projectName || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 w-10">To:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{t.toSite.projectName}</span>
                          </div>
                          <div className="inline-flex items-center mt-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 w-max">
                            {t.laboursTransferred} labours transferred
                          </div>
                        </div>
                      </TD>
                    </TR>
                  ))}
                  {totalTransfers === 0 && (
                    <TR>
                      <TD colSpan={2} className="py-12 text-center">
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
          <Pagination 
            currentPage={transferPage} 
            totalPages={Math.ceil(totalTransfers / PAGE_SIZE)} 
            totalItems={totalTransfers} 
            pageSize={PAGE_SIZE} 
            pageParam="transferPage"
          />
        </div>

        {/* Rate History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Rate History</h2>
          </div>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-md">
            <div className="overflow-x-auto -mx-1">
              <Table>
                <THead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TR>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Effective Date</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Recorded On</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Monthly Salary</TH>
                    <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Daily Rate</TH>
                  </TR>
                </THead>
                <TBody>
                  {paginatedWageHistory.map((w: any) => (
                    <TR key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{formatDate(w.effectiveDate)}</TD>
                      <TD className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{formatDate(w.createdAt)}</TD>
                      <TD className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs sm:text-sm">₹{w.monthlySalary?.toLocaleString("en-IN")}</TD>
                      <TD className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-xs sm:text-sm">₹{w.dailyWage}</TD>
                    </TR>
                  ))}
                  {totalWageHistory === 0 && (
                    <TR>
                      <TD colSpan={4} className="py-12 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <TrendingUp className="h-8 w-8 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No rate changes recorded.</p>
                        </div>
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
          <Pagination 
            currentPage={wageHistoryPage} 
            totalPages={Math.ceil(totalWageHistory / PAGE_SIZE)} 
            totalItems={totalWageHistory} 
            pageSize={PAGE_SIZE} 
            pageParam="wageHistoryPage"
          />
        </div>
      </div>
    </div>
  );
}
