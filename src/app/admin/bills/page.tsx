import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, Receipt, Building } from "lucide-react";

export default async function AllBillsPage() {
  // Fetch all sites with their bills
  const sites = await prisma.site.findMany({
    include: {
      client: true,
      bills: {
        include: { lines: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Only show sites that have at least one bill
  const sitesWithBills = sites.filter((s) => s.bills.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site-wise Bills</h1>
        <p className="text-muted-foreground">Manage and track running bills categorized by sites.</p>
      </div>

      <div className="space-y-4">
        {sitesWithBills.map((site) => (
          <details
            key={site.id}
            className="group border rounded-lg bg-card text-card-foreground shadow-sm [&_summary::-webkit-details-marker]:hidden open:ring-1 open:ring-border overflow-hidden"
          >
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-muted/30 transition-colors group-open:border-b">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/10 rounded-md">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold">{site.projectName}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Client: {site.client.name} &nbsp;•&nbsp; <span className="font-semibold text-foreground">{site.bills.length}</span> Bills Generated
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-full hover:bg-muted">
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </div>
            </summary>
            
            <div className="p-5 bg-muted/10">
              <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                <Table>
                  <THead className="bg-muted/50">
                    <TR>
                      <TH className="w-40">Bill No.</TH>
                      <TH className="w-32">Date</TH>
                      <TH className="w-40 text-right">Amount (₹)</TH>
                      <TH className="w-32 text-center">Status</TH>
                      <TH className="text-right">Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {site.bills.map((b) => (
                      <TR key={b.id} className="hover:bg-muted/30">
                        <TD className="font-bold">{b.billNo}</TD>
                        <TD className="font-mono text-muted-foreground text-sm">{formatDate(b.billDate)}</TD>
                        <TD className="text-right font-mono font-semibold text-emerald-600">
                          {formatINR(b.lines.reduce((s, l) => s + l.currentAmount, 0))}
                        </TD>
                        <TD className="text-center">
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                            {b.status}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <Link
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-2"
                            href={`/admin/bills/${b.id}`}
                          >
                            <Receipt className="h-4 w-4 text-primary" /> Open Bill
                          </Link>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>
          </details>
        ))}

        {sitesWithBills.length === 0 && (
          <div className="text-center p-12 border rounded-lg border-dashed">
            <Building className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No Bills Found</h3>
            <p className="text-muted-foreground mt-1">You haven't generated any bills for your sites yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
