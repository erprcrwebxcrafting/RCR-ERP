import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, History, ArrowRightLeft, CreditCard, AlertCircle } from "lucide-react";
import { SupervisorPaymentForm } from "./payment-form";
import { EditSupervisorForm } from "../edit-supervisor-form";

export default async function SupervisorLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supervisor = await prisma.user.findUnique({
    where: { id: resolvedParams.id, role: "SUPERVISOR" },
    include: {
      supervisorPayments: { orderBy: { date: "desc" } },
      assignedSites: { include: { site: true } },
      supervisorTransfers: { include: { fromSite: true, toSite: true }, orderBy: { transferDate: "desc" } },
    } as any,
  });

  const sv = supervisor as any;
  if (!sv) return notFound();

  const monthlySalary = sv.monthlySalary || 0;
  
  // Calculate months worked based on createdAt
  const startDate = new Date(sv.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // E.g., if they worked 45 days, it's ~1.5 months
  const monthsWorked = diffDays / 30.44; 
  
  const totalEarned = monthlySalary > 0 ? (monthsWorked * monthlySalary) : 0;
  
  const totalPaid = sv.supervisorPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/supervisors" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <Wallet className="h-3.5 w-3.5" />
              Supervisor Ledger
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {sv.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Assigned to: {sv.assignedSites.map((a: any) => a.site.projectName).join(", ") || "No active sites"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <EditSupervisorForm supervisor={sv} />
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
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{monthlySalary.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Fixed Pay / Month</p>
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
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">₹{totalEarned.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Based on ~{monthsWorked.toFixed(1)} months worked</p>
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
            <p className="text-xs text-slate-400 font-medium mt-1">Across {sv.supervisorPayments.length} transactions</p>
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
              ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-xs font-medium mt-1 ${balance > 0 ? "text-rose-500/70 dark:text-rose-400/70" : "text-slate-400"}`}>Amount to be cleared</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Payment History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <History className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payment History</h2>
            </div>
            <SupervisorPaymentForm supervisorId={sv.id} />
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
                  {sv.supervisorPayments.map((p: any) => (
                    <TR key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TD className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{formatDate(p.date)}</TD>
                      <TD className="whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">- ₹{p.amount.toLocaleString("en-IN")}</TD>
                      <TD>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.reason || "Payout"}</div>
                        {p.transactionId && <div className="text-xs text-slate-500 mt-0.5 font-mono">Tx: {p.transactionId}</div>}
                      </TD>
                    </TR>
                  ))}
                  {sv.supervisorPayments.length === 0 && (
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
                    <TH className="font-semibold text-slate-600 dark:text-slate-300">Transfer Details</TH>
                  </TR>
                </THead>
                <TBody>
                  {sv.supervisorTransfers?.map((t: any) => (
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
                  {(!sv.supervisorTransfers || sv.supervisorTransfers.length === 0) && (
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
        </div>
      </div>
    </div>
  );
}
