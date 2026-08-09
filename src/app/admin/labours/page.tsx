import { prisma } from "@/lib/prisma";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LabourForm } from "./labour-form";
import { deleteLabour } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2, Search, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function LaboursPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

  const sites = await prisma.site.findMany({
    where: { active: true },
    include: {
      labourCategories: true,
      supervisors: { include: { supervisor: true } },
      labours: {
        include: {
          labourCategory: true,
          supervisor: true,
        },
        where: q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ]
        } : undefined,
        orderBy: { createdAt: "desc" }
      }
    } as any,
    orderBy: { projectName: "asc" },
  });

  const filteredSites = q ? (sites as any[]).filter(s => s.labours.length > 0) : (sites as any[]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Labours & Site Management</h1>
          <p className="text-muted-foreground">
            Manage labourers organized by their respective sites and view supervisor details.
          </p>
        </div>
        <LabourForm sites={sites as any} />
      </div>
      <div className="flex items-center justify-between">
        <form method="GET" className="flex items-center gap-2 w-full max-w-sm">
          <Input name="q" placeholder="Search by labour name or phone..." defaultValue={q} />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4 mr-2" /> Search</Button>
          {q && <Button variant="outline" asChild><a href="/admin/labours">Clear</a></Button>}
        </form>
      </div>

      <div className="space-y-8">
        {filteredSites.map((site: any) => (
          <details key={site.id} suppressHydrationWarning className="group overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm mb-4 transition-all">
            <summary className="flex cursor-pointer items-center justify-between bg-muted/20 p-5 hover:bg-muted/40 list-none [&::-webkit-details-marker]:hidden">
              <div className="flex-1">
                <h3 className="text-lg font-semibold leading-none tracking-tight">{site.projectName}</h3>
                <div className="text-sm text-muted-foreground mt-2 font-normal flex gap-4">
                  <span>
                    <strong>Supervisors:</strong>{" "}
                    {site.supervisors.length > 0
                      ? site.supervisors.map((s: any) => s.supervisor.name).join(", ")
                      : "None assigned"}
                  </span>
                  <span>
                    <strong>Total Labourers:</strong> {site.labours.length}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {/* Supervisor Ledger Buttons */}
                <div className="flex gap-2">
                  {site.supervisors.map((s: any) => (
                    <Button key={s.id} variant="outline" size="sm" asChild>
                      <a href={`/admin/supervisors/${s.supervisor.id}`}>
                        {s.supervisor.name} Ledger
                      </a>
                    </Button>
                  ))}
                </div>
                <div className="bg-background border rounded-full p-1 shadow-sm">
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:-rotate-180" />
                </div>
              </div>
            </summary>
            <div className="p-0 border-t bg-card animate-in slide-in-from-top-2">
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Category</TH>
                    <TH>Contact & Info</TH>
                    <TH>Status</TH>
                    <TH className="w-[100px]"></TH>
                  </TR>
                </THead>
                <TBody>
                  {site.labours.map((l: any) => (
                    <TR key={l.id}>
                      <TD className="font-medium">
                        <Link href={`/admin/labours/${l.id}`} className="hover:underline text-primary">
                          {l.name}
                        </Link>
                        {l.joiningDate && (
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">
                            Joined: {l.joiningDate.toLocaleDateString()}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <div>{l.labourCategory.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {l.dailyWage && `₹${l.dailyWage}/day`}
                          {l.overtimeRate && ` • ₹${l.overtimeRate}/hr OT`}
                        </div>
                      </TD>
                      <TD>
                        <div className="text-sm font-medium">{l.phone || "No Phone"}</div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div><span className="font-medium">Aadhar:</span> {l.aadharNumber || "—"}</div>
                          <div>
                            <span className="font-medium">Bank:</span> {l.bankName || "—"} 
                            {l.accountNumber ? ` (A/C: ${l.accountNumber})` : ""}
                            {l.ifscCode ? ` (IFSC: ${l.ifscCode})` : ""}
                            {l.bankBranch ? ` [${l.bankBranch}]` : ""}
                          </div>
                          <div><span className="font-medium">Address:</span> {l.address ? (l.address.length > 30 ? l.address.substring(0, 30) + "..." : l.address) : "—"}</div>
                        </div>
                      </TD>
                      <TD>
                        <Badge variant={l.active ? "secondary" : "outline"}>
                          {l.active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/admin/labours/${l.id}`}>Ledger</a>
                          </Button>
                          <LabourForm sites={sites as any} labour={l as any} />
                          <form
                            action={async () => {
                              "use server";
                              await deleteLabour(l.id);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TD>
                    </TR>
                  ))}
                  {site.labours.length === 0 && (
                    <TR>
                      <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                        No labourers assigned to this site.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </details>
        ))}
        {filteredSites.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            {q ? "No labourers found matching your search." : "No active sites found."}
          </div>
        )}
      </div>
    </div>
  );
}
