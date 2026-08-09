import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { HardHat, Phone, Users, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SupervisorLaboursPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  const assigned = await prisma.siteSupervisor.findMany({ where: { supervisorId: userId }, select: { siteId: true } });
  const siteIds = assigned.map((a) => a.siteId);

  const labours = await prisma.labour.findMany({
    where: { siteId: { in: siteIds }, active: true },
    include: { labourCategory: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border border-indigo-500/10 p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-1 mb-4 text-sm font-medium text-indigo-500 dark:text-indigo-400">
            <Users className="h-4 w-4" />
            Workforce
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Labours</h1>
          <p className="text-muted-foreground max-w-xl mb-6">
            Directory of all active labourers across your assigned sites. View their categories, rates, and contact information.
          </p>
          <a href="/supervisor/labours/add" className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-indigo-600 text-white shadow hover:bg-indigo-700 h-10 px-6">
            <Users className="h-4 w-4" /> Add Labourer
          </a>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-indigo-500/5">
          <HardHat className="h-64 w-64" />
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <THead className="bg-muted/30">
              <TR>
                <TH className="py-4">Labourer Profile</TH>
                <TH>Category</TH>
                <TH>1 Hajari Rate</TH>
                <TH>Contact</TH>
              </TR>
            </THead>
            <TBody>
              {labours.map((l) => (
                <TR key={l.id} className="group hover:bg-muted/20 transition-colors">
                  <TD className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 font-semibold group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        {l.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{l.name}</span>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant="outline" className="bg-background text-muted-foreground border-border/60">
                      {l.labourCategory.name}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5 mr-1 opacity-70" />
                      <span className="font-medium text-foreground">{formatINR(l.labourCategory.dailyWage).replace('₹', '')}</span>
                    </div>
                  </TD>
                  <TD>
                    {l.phone ? (
                      <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-indigo-500 transition-colors">
                        <Phone className="h-3.5 w-3.5" />
                        {l.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm italic">Not provided</span>
                    )}
                  </TD>
                </TR>
              ))}
              {labours.length === 0 && (
                <TR>
                  <TD colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="h-10 w-10 mb-3 opacity-20" />
                      <p>No labourers found in your assigned sites.</p>
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
