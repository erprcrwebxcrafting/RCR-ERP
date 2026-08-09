import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { Building2, MapPin, HardHat, Receipt, ArrowUpRight, ArrowDownRight, Wallet, Users, PlusCircle, Activity } from "lucide-react";
import { DashboardChart } from "./dashboard-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function AdminDashboard() {
  const [clients, sites, supervisors, labours, bills, payments] = await Promise.all([
    prisma.client.count(),
    prisma.site.count({ where: { active: true } }),
    prisma.user.count({ where: { role: "SUPERVISOR" } }),
    prisma.labour.count({ where: { active: true } }),
    prisma.runningBill.findMany({ include: { lines: true, site: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  const totalBilled = bills.reduce(
    (sum, b) => sum + b.lines.reduce((s, l) => s + l.currentAmount, 0),
    0
  );

  const totalReceived = payments._sum.amount || 0;
  const outstanding = totalBilled - totalReceived;

  const bySite = new Map<string, number>();
  for (const b of bills) {
    const amt = b.lines.reduce((s, l) => s + l.currentAmount, 0);
    bySite.set(b.site.projectName, (bySite.get(b.site.projectName) || 0) + amt);
  }
  const chartData = [...bySite.entries()].map(([name, amount]) => ({ name, amount }));

  const currentDate = format(new Date(), "EEEE, MMMM do, yyyy");

  const statCards = [
    { label: "Clients", value: clients, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Sites", value: sites, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Supervisors", value: supervisors, icon: HardHat, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Active Labours", value: labours, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin 👋</h1>
            <p className="mt-2 text-slate-300">Here's what's happening across your projects today.</p>
            <p className="mt-1 text-sm text-slate-400">{currentDate}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md transition-all" asChild>
              <Link href="/admin/quotations/new"><PlusCircle className="h-4 w-4" /> New Quotation</Link>
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 shadow-lg transition-all" asChild>
              <Link href="/admin/sites/new"><MapPin className="h-4 w-4" /> Add Site</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level Financials */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Billed */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <Receipt className="h-4 w-4" />
              </div>
              Total Billed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{formatINR(totalBilled)}</h2>
            </div>
            <p className="mt-2 flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              Across {bills.length} running bills
            </p>
          </CardContent>
        </Card>

        {/* Total Received */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              Total Received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{formatINR(totalReceived)}</h2>
            </div>
            <p className="mt-2 flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              Payments collected
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <div className="rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Activity className="h-4 w-4" />
              </div>
              Outstanding Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{formatINR(outstanding)}</h2>
            </div>
            <p className="mt-2 flex items-center text-xs text-muted-foreground">
              <ArrowDownRight className="mr-1 h-3 w-3 text-amber-500" />
              Pending collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="group transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold tracking-tight">{c.value}</p>
              </div>
              <div className={`rounded-full p-3 transition-transform group-hover:scale-110 ${c.bg}`}>
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Revenue by Site
          </CardTitle>
          <CardDescription>Billed amounts distributed across active projects</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
