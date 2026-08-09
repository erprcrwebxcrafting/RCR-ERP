import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, CalendarCheck, ArrowRight, UserCheck, ClipboardList } from "lucide-react";

export default async function SupervisorHome() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  const userName = (session?.user as any)?.name as string;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [assignedSites, totalLabours, todayAttendances] = await Promise.all([
    prisma.siteSupervisor.findMany({
      where: { supervisorId: userId },
      include: { site: { include: { client: true } } },
    }),
    prisma.labour.count({
      where: { supervisorId: userId, active: true },
    }),
    prisma.attendance.count({
      where: {
        markedById: userId,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 sm:p-10 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-10 -mb-10 h-40 w-40 rounded-full bg-white/10 blur-2xl mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {userName?.split(' ')[0] || 'Supervisor'}! 👋
          </h1>
          <p className="text-blue-100 max-w-lg text-lg">
            Here's a quick overview of your sites and team for today. Ready to get things done?
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-950">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assigned Sites</p>
              <h2 className="text-4xl font-bold tracking-tight mt-1">{assignedSites.length}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-950">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">My Labours</p>
              <h2 className="text-4xl font-bold tracking-tight mt-1">{totalLabours}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-950">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="rounded-2xl bg-orange-50 p-4 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Attendances Today</p>
              <h2 className="text-4xl font-bold tracking-tight mt-1">{todayAttendances}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 pt-4">
        {/* Quick Actions */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" /> Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/supervisor/attendance" className="group">
              <Card className="h-full border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-indigo-500 dark:bg-zinc-950 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <UserCheck className="h-7 w-7 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-semibold">Mark Attendance</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/supervisor/labours" className="group">
              <Card className="h-full border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-emerald-500 dark:bg-zinc-950 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <Users className="h-7 w-7 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-semibold">Manage Labours</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* My Recent Sites */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" /> Active Sites
            </h2>
            <Link href="/supervisor/sites" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {assignedSites.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-2xl border border-dashed border-border text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">No sites assigned to you yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Please contact your Admin.</p>
              </div>
            ) : (
              assignedSites.slice(0, 4).map((a) => (
                <Link key={a.siteId} href={`/supervisor/sites/${a.siteId}`} className="block group">
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-border/40 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold group-hover:text-blue-600 transition-colors">{a.site.projectName}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{a.site.client.name}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-full opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
