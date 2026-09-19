import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { Building2, MapPin, HardHat, Receipt, ArrowUpRight, ArrowDownRight, Wallet, Users, PlusCircle, Activity } from "lucide-react";
import { DashboardChart } from "./dashboard-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getFinancialYearDates } from "@/lib/get-fy";

export default async function AdminDashboard() {
  const { startDate, endDate } = await getFinancialYearDates();

  const [clients, sites, supervisors, labours, billAmountAgg, payments, recentBills, totalBillsCount] = await Promise.all([
    prisma.client.count({ where: { createdAt: { lte: endDate } } }),
    prisma.site.count({ where: { active: true, createdAt: { lte: endDate } } }),
    prisma.user.count({ where: { role: "SUPERVISOR", createdAt: { lte: endDate } } }),
    prisma.labour.count({ where: { active: true, createdAt: { lte: endDate } } }),
    // DB-level sum
    prisma.billLine.aggregate({ 
      where: { runningBill: { billDate: { gte: startDate, lte: endDate } } },
      _sum: { currentAmount: true } 
    }),
    prisma.payment.aggregate({ 
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { amount: true } 
    }),
    prisma.runningBill.findMany({
      where: { billDate: { gte: startDate, lte: endDate } },
      select: { id: true, billDate: true, lines: { select: { currentAmount: true } }, site: { select: { projectName: true } } },
      orderBy: { billDate: "desc" },
      take: 50,
    }),
    prisma.runningBill.count({ where: { billDate: { gte: startDate, lte: endDate } } }),
  ]);

  const totalBilled = billAmountAgg._sum.currentAmount ?? 0;
  const totalReceived = payments._sum.amount || 0;
  const outstanding = totalBilled - totalReceived;

  const bySite = new Map<string, number>();
  for (const b of recentBills) {
    const amt = b.lines.reduce((s, l) => s + l.currentAmount, 0);
    bySite.set(b.site.projectName, (bySite.get(b.site.projectName) || 0) + amt);
  }
  const chartData = [...bySite.entries()].map(([name, amount]) => ({ name, amount }));

  const currentDate = format(new Date(), "EEEE, MMMM do, yyyy");

  const statCards = [
    { label: "Total Clients", value: clients, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Active Sites", value: sites, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Supervisors", value: supervisors, icon: HardHat, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Active Labours", value: labours, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-12 text-white shadow-2xl shadow-blue-500/20 border border-blue-400/20">
        {/* Dynamic Background Effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_1.5px,transparent_1.5px)] bg-[length:24px_24px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-md shadow-sm border border-white/20">
              <span className="relative flex h-2.5 w-2.5 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              Live Dashboard Overview
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                Welcome back, Admin 👋
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-2xl font-medium leading-relaxed drop-shadow-sm">
                <span className="text-white/80">{currentDate}</span> • Here's what's happening across your projects today. Keep up the great work!
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-2 lg:mt-0">
            <Button className="h-12 px-6 gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl" asChild>
              <Link href="/admin/quotations/new"><PlusCircle className="h-5 w-5" /> New Quotation</Link>
            </Button>
            <Button className="h-12 px-6 gap-2 bg-white text-blue-600 hover:bg-slate-50 font-bold text-base shadow-xl shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-xl" asChild>
              <Link href="/admin/sites/new"><MapPin className="h-5 w-5" /> Add Site</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level Financials */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Billed */}
        <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-all duration-500 group-hover:bg-blue-500/20" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="flex items-center justify-between font-semibold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider text-xs">Total Billed</span>
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-4 w-4" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{formatINR(totalBilled)}</h2>
            </div>
            <div className="mt-4 flex items-center inline-flex bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
              Across {totalBillsCount} running bills
            </div>
          </CardContent>
        </Card>

        {/* Total Received */}
        <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/20" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="flex items-center justify-between font-semibold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider text-xs">Total Received</span>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-4 w-4" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{formatINR(totalReceived)}</h2>
            </div>
            <div className="mt-4 flex items-center inline-flex bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
              Payments collected
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl transition-all duration-500 group-hover:bg-rose-500/20" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="flex items-center justify-between font-semibold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider text-xs">Outstanding Balance</span>
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-4 w-4" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-500">{formatINR(outstanding)}</h2>
            </div>
            <div className="mt-4 flex items-center inline-flex bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-500/20">
              <ArrowDownRight className="mr-1 h-3.5 w-3.5" />
              Pending collection
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, i) => (
          <Card key={c.label} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ color: 'inherit' }} />
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</p>
                <p className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{c.value}</p>
              </div>
              <div className={`rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border ${c.bg} ${c.border}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="overflow-hidden shadow-lg border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-500 hover:shadow-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pb-6 px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
                  <Activity className="h-5 w-5" />
                </div>
                Revenue Distribution by Site
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm font-medium">Visual breakdown of billed amounts across active projects</CardDescription>
            </div>
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time Data
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-6 px-6 sm:px-8">
          <div className="h-[350px] w-full">
            <DashboardChart data={chartData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

