import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import { FileBarChart2, Clock, Users, Receipt, Banknote, Building2 } from "lucide-react";

export default async function ReportsPage() {
  const attendances = await prisma.attendance.findMany({ include: { site: true, labour: true }, orderBy: { date: "desc" }, take: 100 });
  const labourEntries = await prisma.labourEntry.findMany({ include: { site: true, labour: true }, orderBy: { periodStart: "desc" } });
  const bills = await prisma.runningBill.findMany({ include: { site: true, lines: true }, orderBy: { billDate: "desc" } });
  const payments = await prisma.payment.findMany({ include: { site: true }, orderBy: { date: "desc" } });
  const clients = await prisma.client.findMany({ include: { sites: true } });
  const sites = await prisma.site.findMany({ include: { client: true, payments: true, bills: { include: { lines: true } } } });

  const siteReports = sites.map(s => {
    const totalBilled = s.bills.reduce((sum, b) => sum + b.lines.reduce((s2, l) => s2 + l.currentAmount, 0), 0);
    const totalPaid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return { ...s, totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
  });

  const tabTrigger = "flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-colors hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <FileBarChart2 className="h-3.5 w-3.5" />
              Analytics & Insights
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Comprehensive Reports</h1>
            <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
              Detailed analytical reports across all modules. Track attendance, labour payments, running bills, and site-wise outstanding balances in real-time.
            </p>
          </div>
        </div>
        
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <FileBarChart2 className="h-64 w-64" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-xl overflow-hidden p-1">
        <Tabs.Root defaultValue="attendance">
          <Tabs.List className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-2">
            <Tabs.Trigger className={tabTrigger} value="attendance"><Clock className="h-4 w-4" /> Attendance Report</Tabs.Trigger>
            <Tabs.Trigger className={tabTrigger} value="labour"><Users className="h-4 w-4" /> Labour Payment Report</Tabs.Trigger>
            <Tabs.Trigger className={tabTrigger} value="bills"><Receipt className="h-4 w-4" /> Running Bill Report</Tabs.Trigger>
            <Tabs.Trigger className={tabTrigger} value="outstanding"><Banknote className="h-4 w-4" /> Outstanding / Site Report</Tabs.Trigger>
          </Tabs.List>

          <div className="p-4 md:p-6">
            <Tabs.Content value="attendance" className="space-y-4 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Clock className="h-5 w-5 text-indigo-500" /> Recent Attendance (Last 100)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <Table>
                      <THead className="bg-slate-50 dark:bg-slate-900/50"><TR><TH className="font-bold text-slate-600 dark:text-slate-400">Date</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Site</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Labourer</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Status</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Overtime</TH></TR></THead>
                      <TBody>
                        {attendances.map(a => (
                          <TR key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-medium text-slate-700 dark:text-slate-300">{formatDate(a.date)}</TD>
                            <TD><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {a.site.projectName}</div></TD>
                            <TD className="font-semibold text-slate-800 dark:text-slate-200">{a.labour.name}</TD>
                            <TD><Badge variant="outline" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">{a.status}</Badge></TD>
                            <TD className="font-medium text-slate-600 dark:text-slate-400">{a.overtimeHrs} hrs</TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="labour" className="space-y-4 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Users className="h-5 w-5 text-emerald-500" /> Labour Payment Runs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <Table>
                      <THead className="bg-slate-50 dark:bg-slate-900/50"><TR><TH className="font-bold text-slate-600 dark:text-slate-400">Period</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Site</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Labourer</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Days</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Amount</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Status</TH></TR></THead>
                      <TBody>
                        {labourEntries.map(e => (
                          <TR key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-medium text-slate-700 dark:text-slate-300">{formatDate(e.periodStart)} - {formatDate(e.periodEnd)}</TD>
                            <TD><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {e.site.projectName}</div></TD>
                            <TD className="font-semibold text-slate-800 dark:text-slate-200">{e.labour.name}</TD>
                            <TD className="font-bold text-slate-600 dark:text-slate-400">{e.presentDays}</TD>
                            <TD className="font-bold text-emerald-600 dark:text-emerald-500">{formatINR(e.grossAmount)}</TD>
                            <TD><Badge variant="outline" className={e.approved ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"}>{e.approved ? "Approved" : "Pending"}</Badge></TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="bills" className="space-y-4 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Receipt className="h-5 w-5 text-blue-500" /> All Generated Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <Table>
                      <THead className="bg-slate-50 dark:bg-slate-900/50"><TR><TH className="font-bold text-slate-600 dark:text-slate-400">Date</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Bill No</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Site</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Status</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Amount</TH></TR></THead>
                      <TBody>
                        {bills.map(b => (
                          <TR key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-medium text-slate-700 dark:text-slate-300">{formatDate(b.billDate)}</TD>
                            <TD className="font-semibold text-slate-800 dark:text-slate-200">{b.billNo}</TD>
                            <TD><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {b.site.projectName}</div></TD>
                            <TD><Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">{b.status}</Badge></TD>
                            <TD className="font-bold text-blue-600 dark:text-blue-500">{formatINR(b.lines.reduce((s, l) => s + l.currentAmount, 0))}</TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="outstanding" className="space-y-4 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Banknote className="h-5 w-5 text-rose-500" /> Site-wise Outstanding Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <Table>
                      <THead className="bg-slate-50 dark:bg-slate-900/50"><TR><TH className="font-bold text-slate-600 dark:text-slate-400">Client</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Site</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Total Billed</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Total Received</TH><TH className="font-bold text-slate-600 dark:text-slate-400">Outstanding Balance</TH></TR></THead>
                      <TBody>
                        {siteReports.map(s => (
                          <TR key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-semibold text-slate-800 dark:text-slate-200">{s.client.name}</TD>
                            <TD><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {s.projectName}</div></TD>
                            <TD className="font-medium text-slate-700 dark:text-slate-300">{formatINR(s.totalBilled)}</TD>
                            <TD className="font-medium text-emerald-600 dark:text-emerald-500">{formatINR(s.totalPaid)}</TD>
                            <TD className={`font-bold ${s.outstanding > 0 ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500"}`}>{formatINR(s.outstanding)}</TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
}
