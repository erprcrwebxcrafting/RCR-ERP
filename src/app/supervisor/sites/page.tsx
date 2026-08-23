import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, User, ChevronRight, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function MySitesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  const assigned = await prisma.siteSupervisor.findMany({
    where: { supervisorId: userId },
    include: { site: { include: { client: true } } },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20 mb-4">
            <Briefcase className="h-3.5 w-3.5" />
            Active Assignments
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">My Assigned Sites</h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
            Manage your daily operations, view site details, and mark attendance for your workers across your assigned projects.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-16 -mr-16 text-white/5 opacity-50 pointer-events-none">
          <MapPin className="h-64 w-64" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assigned.map((a) => (
          <Link key={a.siteId} href={`/supervisor/sites/${a.siteId}`} className="group block">
            <Card className="h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" />
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 border border-blue-100 dark:border-blue-800/50">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-none font-bold">
                    Active
                  </Badge>
                </div>
                
                <h3 className="font-bold text-xl tracking-tight line-clamp-1 mb-2 text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {a.site.projectName}
                </h3>
                
                <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 gap-2">
                  <User className="h-4 w-4" />
                  <span className="line-clamp-1">{a.site.client.name}</span>
                </div>
              </CardContent>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/20 transition-colors">
                <span>View Operations</span>
                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
        {assigned.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Sites Assigned</h3>
            <p className="text-slate-500 font-medium mt-1">Please contact your administrator to get assigned to a project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
