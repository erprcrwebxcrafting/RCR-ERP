import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AllBillsPage() {
  const bills = await prisma.runningBill.findMany({
    include: { site: { include: { client: true } }, lines: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
        <p className="text-muted-foreground">Running bills generated across all sites.</p>
      </div>
      <Table>
        <THead><TR><TH>Bill No.</TH><TH>Site</TH><TH>Client</TH><TH>Date</TH><TH>Amount</TH><TH>Status</TH><TH></TH></TR></THead>
        <TBody>
          {bills.map((b) => (
            <TR key={b.id}>
              <TD className="font-medium">{b.billNo}</TD><TD>{b.site.projectName}</TD><TD>{b.site.client.name}</TD>
              <TD>{formatDate(b.billDate)}</TD><TD>{formatINR(b.lines.reduce((s, l) => s + l.currentAmount, 0))}</TD>
              <TD><Badge variant="secondary">{b.status}</Badge></TD>
              <TD><Link className="text-primary underline-offset-4 hover:underline" href={`/admin/sites/${b.siteId}/bills/${b.id}`}>Open →</Link></TD>
            </TR>
          ))}
          {bills.length === 0 && <TR><TD colSpan={7} className="py-6 text-center text-muted-foreground">No bills generated yet. Open a Site → Bills tab → Generate Running Bill.</TD></TR>}
        </TBody>
      </Table>
    </div>
  );
}
