"use client";

import { useState } from "react";
import { createSite } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type Client = { id: string; name: string };

export function SiteForm({ clients }: { clients: Client[] }) {
  const [buildings, setBuildings] = useState<string[]>(["Tower A"]);
  const [workItems, setWorkItems] = useState([{ name: "Column", unit: "Sft", rate: "", buWork: "" }]);
  const [labourCats, setLabourCats] = useState([{ name: "Fitter", wage: "1100", ot: "0" }]);

  return (
    <form action={createSite} className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Project Name *</Label>
            <Input name="projectName" required placeholder="e.g. Park Site" />
          </div>
          <div className="space-y-1">
            <Label>Client *</Label>
            <select name="clientId" required className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input name="address" placeholder="Site address" />
          </div>
          <div className="space-y-1">
            <Label>GST No.</Label>
            <Input name="gstNo" />
          </div>
          <div className="space-y-1">
            <Label>Retention %</Label>
            <Input name="retentionPct" type="number" step="0.1" defaultValue="2" />
          </div>
          <div className="space-y-1">
            <Label>Work Order No.</Label>
            <Input name="workOrderNo" placeholder="e.g. PARKSITE/SSHIVAAY/2026-27" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Remarks</Label>
            <Input name="remarks" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buildings</CardTitle>
          <p className="text-sm text-muted-foreground">Fully dynamic — Tower A/B/C, S1/S2/S3, Club House, Parking, etc.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {buildings.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input
                name="buildingName[]"
                value={b}
                onChange={(e) => setBuildings((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="Building name"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setBuildings((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setBuildings((arr) => [...arr, ""])}>
            <Plus className="h-4 w-4" /> Add Building
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Items & Rates</CardTitle>
          <p className="text-sm text-muted-foreground">Column, Beam, 16th Slab … 40th Slab, Terrace, OHWT, LMR — whatever this site needs.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {workItems.map((w, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input className="col-span-4" name="workItemName[]" placeholder="Work item (e.g. 16th Slab)" value={w.name}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              <Input className="col-span-2" name="workItemUnit[]" placeholder="Unit" value={w.unit}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, unit: e.target.value } : x)))} />
              <Input className="col-span-2" name="workItemRate[]" placeholder="Rate" type="number" step="0.01" value={w.rate}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, rate: e.target.value } : x)))} />
              <Input className="col-span-3" name="workItemBuWork[]" placeholder="Approx. W.O. Qty" type="number" step="0.01" value={w.buWork}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, buWork: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setWorkItems((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2"
            onClick={() => setWorkItems((arr) => [...arr, { name: "", unit: "Sft", rate: "", buWork: "" }])}>
            <Plus className="h-4 w-4" /> Add Work Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labour Categories</CardTitle>
          <p className="text-sm text-muted-foreground">Fitter, Helper, Carpenter, Mason, Electrician, Welder — configurable per site.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {labourCats.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input className="col-span-5" name="labourName[]" placeholder="Category (e.g. Fitter)" value={l.name}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              <Input className="col-span-3" name="labourWage[]" placeholder="1 Hajari Rate" type="number" step="0.01" value={l.wage}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, wage: e.target.value } : x)))} />
              <Input className="col-span-3" name="labourOT[]" placeholder="Overtime Rate" type="number" step="0.01" value={l.ot}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, ot: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setLabourCats((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2"
            onClick={() => setLabourCats((arr) => [...arr, { name: "", wage: "", ot: "0" }])}>
            <Plus className="h-4 w-4" /> Add Labour Category
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" size="lg">Create Site</Button>
    </form>
  );
}
