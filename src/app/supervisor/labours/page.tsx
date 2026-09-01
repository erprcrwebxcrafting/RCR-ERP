import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { HardHat, Phone, Users, IndianRupee, UserPlus, UserCheck, UserX, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { toggleLabourActiveSupervisor } from "./[id]/actions";

export default async function SupervisorLaboursPage({ searchParams }: { searchParams: Promise<{ showInactive?: string; q?: string }> }) {
  const resolvedParams = await searchParams;
  const showInactive = resolvedParams.showInactive === "1";
  const q = resolvedParams.q || "";
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  const assigned = await prisma.siteSupervisor.findMany({ where: { supervisorId: userId }, select: { siteId: true } });
  const siteIds = assigned.map((a) => a.siteId);

  const labours = await prisma.labour.findMany({
    where: { 
      siteId: { in: siteIds }, 
      ...(showInactive ? {} : { active: true }),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    },
    include: { labourCategory: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <Users className="h-3.5 w-3.5" />
              Workforce Directory
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Labours</h1>
            <p className="text-blue-100 max-w-xl mb-6 text-sm sm:text-base font-medium">
              Directory of all active labourers across your assigned sites. View their categories, daily wages, and contact information.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <form method="GET" action="/supervisor/labours" className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search labourers..."
                  className="h-11 w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
                {showInactive && <input type="hidden" name="showInactive" value="1" />}
              </form>
              <a href="/supervisor/labours/add" className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all bg-white text-indigo-600 shadow-xl shadow-indigo-900/20 hover:bg-white/90 hover:-translate-y-0.5 h-11 px-6 w-full sm:w-auto shrink-0">
                <UserPlus className="h-4 w-4" /> Add Labourer
              </a>
              <Link
                href={showInactive ? (q ? `/supervisor/labours?q=${q}` : "/supervisor/labours") : `/supervisor/labours?showInactive=1${q ? `&q=${q}` : ''}`}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-colors h-11 shrink-0 ${
                  showInactive
                    ? "bg-amber-500/20 text-amber-100 border-amber-300/30 hover:bg-amber-500/30"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {showInactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                {showInactive ? "Showing All" : "Show Inactive"}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <HardHat className="h-64 w-64" />
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-xl bg-white dark:bg-slate-900">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[800px]">
            <THead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <TR>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Labourer Profile</TH>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Category</TH>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">1 Hajari Rate</TH>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Contact</TH>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Status</TH>
                <TH className="py-5 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Actions</TH>
              </TR>
            </THead>
            <TBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {labours.map((l) => {
                const colors = ['bg-blue-50 text-blue-600 border-blue-200', 'bg-emerald-50 text-emerald-600 border-emerald-200', 'bg-purple-50 text-purple-600 border-purple-200', 'bg-amber-50 text-amber-600 border-amber-200', 'bg-rose-50 text-rose-600 border-rose-200'];
                const colorClass = colors[l.name.charCodeAt(0) % colors.length];

                return (
                  <TR key={l.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TD className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${colorClass} border dark:bg-slate-800 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform`}>
                          {l.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{l.name}</span>
                      </div>
                    </TD>
                    <TD className="px-6">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm font-bold">
                        {l.labourCategory.name}
                      </Badge>
                    </TD>
                    <TD className="px-6">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <IndianRupee className="h-4 w-4 mr-1 text-emerald-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(l.dailyWage ?? l.labourCategory.dailyWage).replace('₹', '')}</span>
                      </div>
                    </TD>
                    <TD className="px-6">
                      {l.phone ? (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Phone className="h-3.5 w-3.5 text-indigo-500" />
                          {l.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm italic font-medium">Not provided</span>
                      )}
                    </TD>
                    <TD className="px-6 text-center">
                      <div className="flex justify-center">
                        <ActiveToggle id={l.id} active={l.active} entityName={l.name} onToggle={toggleLabourActiveSupervisor} size="sm" />
                      </div>
                    </TD>
                    <TD className="px-6 text-right">
                      <a href={`/supervisor/labours/${l.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">
                        Profile
                      </a>
                    </TD>
                  </TR>
                );
              })}
              {labours.length === 0 && (
                <TR>
                  <TD colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-700" />
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Labourers Found</h3>
                      <p className="font-medium text-sm">No active labourers found in your assigned sites.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
