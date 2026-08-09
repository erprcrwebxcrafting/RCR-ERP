import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, User, ClipboardCheck, ArrowLeft, Layers, MapPin } from "lucide-react";

export default async function SupervisorSiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: { buildings: true, client: true },
  });
  
  if (!site) notFound();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Back navigation */}
      <Link href="/supervisor/sites" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to Sites
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-card border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" /> Site Details
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{site.projectName}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 opacity-70" />
                <span>{site.client?.name || "No Client Assigned"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 opacity-70" />
                <span>{site.buildings.length} Buildings</span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0">
            <Link href={`/supervisor/attendance?siteId=${site.id}`}>
              <Button size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-all gap-2 group">
                <ClipboardCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Mark Daily Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-border/60">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Site Buildings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {site.buildings.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {site.buildings.map((b) => (
                  <span 
                    key={b.id} 
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border/50 shadow-sm hover:bg-secondary/80 transition-colors"
                  >
                    <Building2 className="h-4 w-4 mr-2 opacity-50" />
                    {b.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No buildings added to this site yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar quick actions or info */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
              <p className="text-sm text-muted-foreground mb-4">Jump directly to attendance for this specific site.</p>
              <Link href={`/supervisor/attendance?siteId=${site.id}`}>
                <Button variant="outline" className="w-full justify-start gap-2 bg-background/50 hover:bg-background">
                  <ClipboardCheck className="h-4 w-4" /> Go to Attendance
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
