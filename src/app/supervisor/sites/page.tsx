import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function MySitesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  const assigned = await prisma.siteSupervisor.findMany({
    where: { supervisorId: userId },
    include: { site: { include: { client: true } } },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 mb-4 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4" />
            Active Assignments
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Sites</h1>
          <p className="text-muted-foreground max-w-xl">
            Here are the construction sites assigned to you. Select a site to view details or mark daily attendance for the labourers.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-16 -mr-16 text-primary/5">
          <MapPin className="h-64 w-64" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assigned.map((a) => (
          <Link key={a.siteId} href={`/supervisor/sites/${a.siteId}`} className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-primary/40 dark:hover:border-primary/30 group-hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/60 transform origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="font-normal opacity-80 group-hover:opacity-100 transition-opacity">
                    Active
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                  {a.site.projectName}
                </h3>
                
                <div className="flex items-center text-sm text-muted-foreground mt-4 gap-2">
                  <User className="h-4 w-4 opacity-70" />
                  <span className="line-clamp-1">{a.site.client.name}</span>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                <span>View Details</span>
                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
        {assigned.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No sites assigned</h3>
            <p className="text-muted-foreground text-sm mt-1">Contact the administrator to get assigned to a site.</p>
          </div>
        )}
      </div>
    </div>
  );
}
