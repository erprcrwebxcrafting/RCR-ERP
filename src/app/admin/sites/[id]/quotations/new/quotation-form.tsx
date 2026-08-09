"use client";

import { useState } from "react";
import { createQuotation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type WorkItem = { id: string; name: string; unit: string; rate: number };

export function QuotationForm({
  siteId, workItems, defaultTerms, defaultExclusions,
}: { siteId: string; workItems: WorkItem[]; defaultTerms: string; defaultExclusions: string }) {
  const [items, setItems] = useState(
    workItems.length
      ? workItems.map((w) => ({ description: `Labour for ${w.name}`, unit: w.unit, rate: String(w.rate) }))
      : [{ description: "", unit: "Sft", rate: "" }]
  );

  return (
    <form action={createQuotation.bind(null, siteId)} className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="space-y-1">
            <Label>Subject *</Label>
            <Input name="subject" required placeholder="Quotation for Reinforcement Work (Labour Basis)" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rate Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input className="col-span-6" name="itemDescription[]" placeholder="Description" value={it.description}
                onChange={(e) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))} />
              <Input className="col-span-2" name="itemUnit[]" placeholder="Unit" value={it.unit}
                onChange={(e) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, unit: e.target.value } : x)))} />
              <Input className="col-span-3" name="itemRate[]" type="number" step="0.01" placeholder="Rate" value={it.rate}
                onChange={(e) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, rate: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setItems((arr) => [...arr, { description: "", unit: "Sft", rate: "" }])}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms & Conditions</CardTitle><p className="text-sm text-muted-foreground">One per line — pre-filled from your standard template, edit freely.</p></CardHeader>
        <CardContent>
          <textarea name="terms" defaultValue={defaultTerms} rows={10} className="w-full rounded-md border border-input bg-card p-3 text-sm" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Exclusions</CardTitle></CardHeader>
        <CardContent>
          <textarea name="exclusions" defaultValue={defaultExclusions} rows={4} className="w-full rounded-md border border-input bg-card p-3 text-sm" />
        </CardContent>
      </Card>

      <Button type="submit" size="lg">Create Quotation</Button>
    </form>
  );
}
