import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SiteTabs } from "./site-tabs";
import { Badge } from "@/components/ui/badge";
import { TransferResourcesModal } from "./transfer-resources-modal";
import { SiteProgressEdit } from "./site-progress-edit";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

import { unstable_cache } from "next/cache";

const getCachedSiteData = unstable_cache(
  async (id: string) => {
    return Promise.all([
      prisma.site.findUnique({
        where: { id },
        include: {
          client: true,
          buildings: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], include: { workItems: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } } },
          workItems: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          supplyLabourEntries: { orderBy: { date: "asc" } },
          labourCategories: { orderBy: { order: "asc" }, include: { labours: { include: { payments: { orderBy: { date: "desc" } }, attendances: { select: { hajari: true } }, supervisor: { select: { name: true } } } } } },
          supervisors: { 
            select: { 
              supervisorId: true,
              supervisor: { select: { id: true, name: true, email: true, phone: true } }
            } 
          },
          bills: { orderBy: { createdAt: "desc" }, include: { lines: { orderBy: { order: "asc" } }, supplyLabourEntries: { orderBy: { date: "asc" } } } },
          quotations: { orderBy: { createdAt: "desc" } },
          payments: { orderBy: { date: "desc" } },
          labourEntries: { orderBy: { createdAt: "desc" } },
          expenses: { orderBy: { date: "desc" } },
        },
      }),
      prisma.user.findMany({ 
        where: { role: "SUPERVISOR" }, 
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { name: "asc" } 
      }),
      prisma.site.findMany({
        where: { active: true },
        select: {
          id: true,
          projectName: true,
          labourCategories: { select: { id: true, name: true } },
          supervisors: { select: { supervisorId: true, supervisor: { select: { name: true } } } }
        },
        orderBy: { projectName: "asc" }
      }),
    ]);
  },
  ['site-detail-cache'],
  { tags: ['site-detail'] } // Allows clearing via revalidateTag('site-detail')
);

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [site, allSupervisors, allSites] = await getCachedSiteData(id);

  if (!site) notFound();

  // labourEntries doesn't have a direct relation to Labour name in the schema — resolve it here
  const labourIds = [...new Set(site.labourEntries.map((e: any) => e.labourId))];
  const labours = await prisma.labour.findMany({ where: { id: { in: labourIds } } });
  const labourById = new Map(labours.map((l) => [l.id, l]));
  const labourEntriesWithNames = site.labourEntries.map((e: any) => ({ ...e, labour: labourById.get(e.labourId) }));

  // Dynamic Auto Progress calculation based on completed stage work values vs total contract value
  let totalAllocatedValue = 0;
  let totalWorkDoneValue = 0;

  site.buildings.forEach((b: any) => {
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
    : (site.progress || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <Link href="/admin/sites" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 mr-2 transition-colors">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back to Sites
      </Link>

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-3 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <Building2 className="h-3.5 w-3.5" />
              Site Details
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{site.projectName}</h1>
            <div className="flex items-center gap-2 text-blue-100 text-sm sm:text-base font-medium bg-white/10 backdrop-blur-sm w-fit px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="h-4 w-4" />
              {site.client.name}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
            <SiteProgressEdit autoProgress={autoCalculatedProgress} />
            <TransferResourcesModal 
              siteId={site.id} 
              allSites={allSites} 
              currentLabours={site.labourCategories.flatMap((c: any) => c.labours)}
              currentSupervisors={site.supervisors}
            />
            <Badge className={`px-4 py-1.5 text-xs font-bold rounded-xl shadow-lg border ${site.active ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30" : "bg-slate-800/40 text-slate-300 border-slate-700"}`}>
              {site.active ? "● ACTIVE SITE" : "CLOSED SITE"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-xl overflow-hidden p-1">
        <SiteTabs site={{ ...site, labourEntries: labourEntriesWithNames }} allSupervisors={allSupervisors} />
      </div>
    </div>
  );
}
