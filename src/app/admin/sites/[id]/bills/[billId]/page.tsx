import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { SendButtons } from "./send-buttons";

export default async function RunningBillDetailPage({ params }: { params: Promise<{ id: string; billId: string }> }) {
  const { id, billId } = await params;
  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: {
      site: { include: { client: true } },
      lines: { include: { building: true, workItem: true, labourCategory: true } },
    },
  });
  if (!bill) notFound();

  const buildingTotals = new Map<string, { name: string; prevAmt: number; curAmt: number; cumAmt: number }>();
  for (const l of bill.lines) {
    if (!l.buildingId || !l.building) continue;
    const cur = buildingTotals.get(l.buildingId) || { name: l.building.name, prevAmt: 0, curAmt: 0, cumAmt: 0 };
    cur.prevAmt += l.previousAmount; cur.curAmt += l.currentAmount; cur.cumAmt += l.cumulativeAmount;
    buildingTotals.set(l.buildingId, cur);
  }
  const labourLines = bill.lines.filter((l) => l.labourCategoryId);
  const totalCurrent = bill.lines.reduce((s, l) => s + l.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Running Bill {bill.billNo}</h1>
          <p className="text-muted-foreground">{bill.site.projectName} · {bill.site.client.name} · {formatDate(bill.billDate)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a href={`/api/bills/${bill.id}/excel`} target="_blank">
            <Button className="gap-2"><Download className="h-4 w-4" /> Download Full Package (Excel)</Button>
          </a>
          <SendButtons billId={bill.id} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Summary by Building</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Building</TH><TH>Previous Amount</TH><TH>This Bill Amount</TH><TH>Cumulative Amount</TH></TR></THead>
            <TBody>
              {[...buildingTotals.values()].map((b) => (
                <TR key={b.name}><TD className="font-medium">{b.name}</TD><TD>{formatINR(b.prevAmt)}</TD><TD>{formatINR(b.curAmt)}</TD><TD>{formatINR(b.cumAmt)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Departmental Labour Supply</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Category</TH><TH>This Bill Qty</TH><TH>This Bill Amount</TH></TR></THead>
            <TBody>
              {labourLines.map((l) => (
                <TR key={l.id}><TD>{l.labourCategory?.name}</TD><TD>{l.currentQty}</TD><TD>{formatINR(l.currentAmount)}</TD></TR>
              ))}
              {labourLines.length === 0 && <TR><TD colSpan={3} className="py-6 text-center text-muted-foreground">No labour supply entered.</TD></TR>}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-muted-foreground">This Bill — Gross Amount</span>
          <span className="text-2xl font-semibold text-secondary">{formatINR(totalCurrent)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
