import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NewClientDialog } from "./new-client-dialog";
import { EditClientForm } from "./edit-client-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, User2, Phone, Mail, FileText } from "lucide-react";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

  const clients = await prisma.client.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { contactPerson: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { gstNo: { contains: q, mode: "insensitive" } },
      ]
    } : {},
    include: { _count: { select: { sites: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalClients = clients.length;
  const totalSites = clients.reduce((acc, c) => acc + c._count.sites, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients Dashboard</h1>
          <p className="text-muted-foreground">Manage your clients and view their independent projects/sites.</p>
        </div>
        <NewClientDialog />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-muted/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            <User2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalClients}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sites Managed</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{totalSites}</div></CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-border/50 bg-muted/10">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="q" placeholder="Search by name, contact, phone, email, or GST..." defaultValue={q} className="pl-9 w-full" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="submit" className="w-full sm:w-auto">Search</Button>
            {q && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="/admin/clients">Clear</a>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((c) => (
          <Card key={c.id} className="flex flex-col group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {c.name}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1.5 font-medium">
                    <User2 className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    {c.contactPerson ? <span className="text-blue-700">{c.contactPerson}</span> : "No Contact Person"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 pb-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2 opacity-70" />
                  {c.phone || "No phone number"}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2 opacity-70" />
                  {c.email || "No email address"}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2 opacity-70" />
                  GST: {c.gstNo || "N/A"}
                </div>
              </div>
              
              <div className="pt-2 border-t border-dashed">
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" /> Projects ({c._count.sites})
                </div>
                {c._count.sites > 0 ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
                    {c._count.sites} Active Sites
                  </Badge>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No active projects</div>
                )}
              </div>
            </CardContent>
            <div className="p-4 pt-0 flex gap-2">
              <Button asChild className="flex-1" variant="outline">
                <Link href={`/admin/clients/${c.id}`}>
                  View Details →
                </Link>
              </Button>
              <EditClientForm client={c} />
            </div>
          </Card>
        ))}
        {clients.length === 0 && (
          <div className="col-span-full py-16 text-center border rounded-xl bg-muted/10 border-dashed">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No clients found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">You haven't added any clients to the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
