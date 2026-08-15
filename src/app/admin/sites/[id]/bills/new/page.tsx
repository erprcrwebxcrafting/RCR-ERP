import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { generateRunningBill } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatInvoiceNo, formatRefNo } from "@/lib/utils";

export default async function NewRunningBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id: id },
    include: {
      buildings: { orderBy: { order: "asc" } },
      workItems: { orderBy: { order: "asc" } },
      labourCategories: { orderBy: { order: "asc" } },
    },
  });
  if (!site) notFound();

  const count = await prisma.runningBill.count({ where: { siteId: site.id } });
  const nextInvoiceNo = formatInvoiceNo(count + 1);
  const nextRefNo = formatRefNo(count + 1);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Running Bill</h1>
        <p className="text-muted-foreground">Enter this bill&apos;s quantities — previous & cumulative figures are pulled automatically from the last bill in the database.</p>
      </div>

      <form action={generateRunningBill.bind(null, site.id)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Invoice / Bill No.</Label>
              <Input name="billNo" defaultValue={nextInvoiceNo} required />
            </div>
            <div className="space-y-1">
              <Label>Period Label</Label>
              <Input name="periodLabel" placeholder="e.g. May 2026" />
            </div>
            <div className="space-y-1">
              <Label>Ref No.</Label>
              <Input name="refNo" defaultValue={nextRefNo} />
            </div>
          </CardContent>
        </Card>

        {site.buildings.map((b) => (
          <Card key={b.id}>
            <CardHeader><CardTitle>{b.name}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {site.workItems.map((w) => (
                <div key={w.id} className="grid grid-cols-12 items-center gap-2">
                  <Label className="col-span-6 font-normal">{w.name} <span className="text-muted-foreground">({w.unit} · ₹{w.rate})</span></Label>
                  <Input className="col-span-3" name={`qty__${b.id}__${w.id}`} type="number" step="0.01" placeholder="This bill qty" defaultValue="0" />
                </div>
              ))}
              {site.workItems.length === 0 && <p className="text-sm text-muted-foreground">No work items configured for this site yet.</p>}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader><CardTitle>Departmental Labour Supply</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {site.labourCategories.map((l) => (
              <div key={l.id} className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-6 font-normal">{l.name} <span className="text-muted-foreground">(Nos · ₹{l.dailyWage})</span></Label>
                <Input className="col-span-3" name={`labour__${l.id}`} type="number" step="0.01" placeholder="This bill qty" defaultValue="0" />
              </div>
            ))}
            {site.labourCategories.length === 0 && <p className="text-sm text-muted-foreground">No labour categories configured for this site yet.</p>}
          </CardContent>
        </Card>

        <Button type="submit" size="lg">Generate Bill</Button>
      </form>
    </div>
  );
}
