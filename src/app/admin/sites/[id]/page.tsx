import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SiteTabs } from "./site-tabs";
import { Badge } from "@/components/ui/badge";
import { TransferResourcesModal } from "./transfer-resources-modal";
import { SiteProgressEdit } from "./site-progress-edit";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      client: true,
      buildings: { orderBy: { order: "asc" }, include: { workItems: { orderBy: { order: "asc" } } } },
      workItems: { orderBy: { order: "asc" } },
      supplyLabourEntries: { orderBy: { date: "asc" } },
      labourCategories: { orderBy: { order: "asc" }, include: { labours: true } },
      supervisors: { include: { supervisor: true } },
      bills: { orderBy: { createdAt: "desc" }, include: { lines: true } },
      quotations: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
      labourEntries: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!site) notFound();

  const allSupervisors = await prisma.user.findMany({ where: { role: "SUPERVISOR" }, orderBy: { name: "asc" } });

  const allSites = await prisma.site.findMany({
    where: { active: true },
    select: {
      id: true,
      projectName: true,
      labourCategories: { select: { id: true, name: true } },
      supervisors: { select: { supervisorId: true, supervisor: { select: { name: true } } } }
    },
    orderBy: { projectName: "asc" }
  });

  // labourEntries doesn't have a direct relation to Labour name in the schema — resolve it here
  const labourIds = [...new Set(site.labourEntries.map((e) => e.labourId))];
  const labours = await prisma.labour.findMany({ where: { id: { in: labourIds } } });
  const labourById = new Map(labours.map((l) => [l.id, l]));
  const labourEntriesWithNames = site.labourEntries.map((e) => ({ ...e, labour: labourById.get(e.labourId) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{site.projectName}</h1>
          <p className="text-muted-foreground">{site.client.name}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <SiteProgressEdit siteId={site.id} initialProgress={site.progress} />
          <TransferResourcesModal 
            siteId={site.id} 
            allSites={allSites} 
            currentLabours={site.labourCategories.flatMap((c: any) => c.labours)}
            currentSupervisors={site.supervisors}
          />
          <Badge variant={site.active ? "secondary" : "outline"}>{site.active ? "Active" : "Closed"}</Badge>
        </div>
      </div>
      <SiteTabs site={{ ...site, labourEntries: labourEntriesWithNames }} allSupervisors={allSupervisors} />
    </div>
  );
}
