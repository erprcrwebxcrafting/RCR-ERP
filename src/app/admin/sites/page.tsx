import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Building2, HardHat, Pickaxe, MapPin, ChevronRight, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    select: {
      id: true,
      projectName: true,
      client: { select: { name: true } },
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { buildings: true, workItems: true, labours: true } },
      buildings: {
        select: {
          workItems: {
            select: { partAmount: true, buWork: true, rate: true, previousPct: true, previousAmt: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const sitesWithProgress = sites.map((s: any) => {
    let totalAllocatedValue = 0;
    let totalWorkDoneValue = 0;

    (s.buildings || []).forEach((b: any) => {
      (b.workItems || []).forEach((item: any) => {
        const partAmt = item.partAmount || (item.buWork && item.rate ? item.buWork * item.rate : item.rate || 0);
        const billedPct = item.previousPct || 0;
        const billedAmt = item.previousAmt || (partAmt * (billedPct / 100));

        totalAllocatedValue += partAmt;
        totalWorkDoneValue += billedAmt;
      });
    });

    const autoCalculatedProgress = totalAllocatedValue > 0 
      ? Math.min(100, Math.round((totalWorkDoneValue / totalAllocatedValue) * 100))
      : (s.progress || 0);

    return {
      ...s,
      displayProgress: autoCalculatedProgress
    };
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
              <Building2 className="h-3.5 w-3.5" />
              Project Portfolio
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Construction Sites</h1>
            <p className="text-blue-100 max-w-xl mb-6 text-sm sm:text-base font-medium">
              Manage all construction projects. Monitor building progress, work items, and labour force allocations in real-time.
            </p>
            <Link href="/admin/sites/new">
              <Button className="gap-2 rounded-xl text-sm font-bold transition-all bg-white text-indigo-600 shadow-xl shadow-indigo-900/20 hover:bg-white/90 hover:-translate-y-0.5 h-11 px-6 border-0">
                <Plus className="h-4 w-4" /> New Site
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <Activity className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {sitesWithProgress.map((s: any) => (
          <Card key={s.id} className="flex flex-col group hover:shadow-2xl transition-all duration-300 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:-translate-y-1">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {s.projectName}
                  </CardTitle>
                  <div className="flex items-center text-sm font-medium text-slate-500 mt-2">
                    <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                    {s.client.name}
                  </div>
                </div>
                <Badge className={s.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 shadow-sm"} variant="outline">
                  {s.active ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20">
                  <Building2 className="h-5 w-5 text-blue-500 mb-2" />
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">{s._count.buildings}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Buildings</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                  <Pickaxe className="h-5 w-5 text-indigo-500 mb-2" />
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">{s._count.workItems}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Work Items</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 transition-colors group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20">
                  <HardHat className="h-5 w-5 text-violet-500 mb-2" />
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">{s._count.labours}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Labours</span>
                </div>
              </div>
              
              <div className="px-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  <span>Progress Completion</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{s.displayProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${s.displayProgress}%` }} />
                </div>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button asChild className={`w-full h-11 rounded-xl font-bold gap-2 transition-all ${s.active ? "bg-slate-900 hover:bg-indigo-600 text-white dark:bg-slate-800 dark:hover:bg-indigo-500" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"}`} variant="default">
                <Link href={`/admin/sites/${s.id}`}>
                  Manage Site <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
        
        {sites.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-700">
            <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Sites Found</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 mb-6 max-w-md mx-auto">You haven't added any construction sites to the ERP yet. Create your first project to get started.</p>
            <Link href="/admin/sites/new">
              <Button className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                <Plus className="h-5 w-5 mr-2" />
                Create First Site
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
