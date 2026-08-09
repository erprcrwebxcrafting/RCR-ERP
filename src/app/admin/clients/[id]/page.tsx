import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { EditClientForm } from "../edit-client-form";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: id },
    include: { sites: true },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">{client.address || "No address on file"}</p>
          </div>
        </div>
        <EditClientForm client={client} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">GST No.</CardTitle></CardHeader><CardContent>{client.gstNo || "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Contact</CardTitle></CardHeader><CardContent>{client.contactPerson || "—"} {client.phone ? `· ${client.phone}` : ""}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Email</CardTitle></CardHeader><CardContent>{client.email || "—"}</CardContent></Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Projects / Sites</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {client.sites.map((s) => (
            <Link key={s.id} href={`/admin/sites/${s.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{s.projectName}</p>
                    <p className="text-sm text-muted-foreground">{s.address}</p>
                  </div>
                  <Badge variant={s.active ? "secondary" : "outline"}>{s.active ? "Active" : "Closed"}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
          {client.sites.length === 0 && <p className="text-muted-foreground">No sites yet for this client.</p>}
        </div>
      </div>
    </div>
  );
}
