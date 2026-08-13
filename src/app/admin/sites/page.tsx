import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Building2, HardHat, Pickaxe, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    include: { 
      client: true, 
      buildings: { include: { workItems: true } },
      _count: { select: { buildings: true, workItems: true, labours: true } } as any
    } as any,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">Every site has its own dynamic work items, rates & labour categories.</p>
        </div>
        <Link href="/admin/sites/new"><Button className="gap-2"><Plus className="h-4 w-4" /> New Site</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sitesWithProgress.map((s: any) => (
          <Card key={s.id} className="flex flex-col group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {s.projectName}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1.5">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {s.client.name}
                  </div>
                </div>
                <Badge variant={s.active ? "secondary" : "outline"} className="shrink-0">
                  {s.active ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 pb-2">
              <div className="grid grid-cols-3 gap-2 divide-x">
                <div className="flex flex-col items-center justify-center p-2">
                  <Building2 className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{s._count.buildings}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Buildings</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2">
                  <Pickaxe className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{s._count.workItems}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Work Items</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2">
                  <HardHat className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{s._count.labours}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Labours</span>
                </div>
              </div>
              <div className="mt-4 px-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{s.displayProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all" style={{ width: `${s.displayProgress}%` }} />
                </div>
              </div>
            </CardContent>
            <div className="pt-2 pb-4 px-6 flex items-center p-6">
              <Button asChild className="w-full" variant={s.active ? "default" : "secondary"}>
                <Link href={`/admin/sites/${s.id}`}>
                  Manage Site →
                </Link>
              </Button>
            </div>
          </Card>
        ))}
        {sites.length === 0 && (
          <div className="col-span-full py-16 text-center border rounded-xl bg-muted/10 border-dashed">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No sites found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">You haven't added any construction sites yet.</p>
            <Button asChild><Link href="/admin/sites/new">Create First Site</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
