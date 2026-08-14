"use client";

import { useState } from "react";
import { createSite } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Building2, Pickaxe, HardHat, FileText } from "lucide-react";

type Client = { id: string; name: string };

export function SiteForm({ clients }: { clients: Client[] }) {
  const [buildings, setBuildings] = useState<string[]>(["Tower A"]);
  const [workItems, setWorkItems] = useState([{ name: "Column", unit: "Sft", rate: "", buWork: "" }]);
  const [labourCats, setLabourCats] = useState([{ name: "Fitter", wage: "1100", ot: "0" }]);

  return (
    <form action={createSite} className="space-y-8">
      {/* 1. Basic Details */}
      <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            Basic Details
          </h3>
        </div>
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name *</Label>
              <Input name="projectName" required placeholder="e.g. Park Site" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client *</Label>
              <select name="clientId" required className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-all cursor-pointer">
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</Label>
              <Input name="address" placeholder="Site address" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST No.</Label>
              <Input name="gstNo" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retention %</Label>
              <Input name="retentionPct" type="number" step="0.1" defaultValue="2" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CGST %</Label>
              <Input name="cgstPct" type="number" step="0.1" defaultValue="9" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SGST %</Label>
              <Input name="sgstPct" type="number" step="0.1" defaultValue="9" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">TDS %</Label>
              <Input name="tdsPct" type="number" step="0.1" defaultValue="1" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Order No.</Label>
              <Input name="workOrderNo" placeholder="e.g. PARKSITE/SSHIVAAY/2026-27" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</Label>
              <Input name="remarks" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Buildings */}
      <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              Buildings & Towers
            </h3>
            <p className="text-sm text-slate-500 mt-1">Fully dynamic — Tower A/B/C, S1/S2/S3, Club House, Parking, etc.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => setBuildings((arr) => [...arr, ""])}>
            <Plus className="h-4 w-4" /> Add Building
          </Button>
        </div>
        <CardContent className="p-6 md:p-8 space-y-4">
          {buildings.map((b, i) => (
            <div key={i} className="flex gap-3">
              <Input
                name="buildingName[]"
                value={b}
                onChange={(e) => setBuildings((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="Building name"
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all flex-1"
              />
              <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" onClick={() => setBuildings((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Work Items */}
      <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Pickaxe className="h-5 w-5" />
              </div>
              Work Items & Rates
            </h3>
            <p className="text-sm text-slate-500 mt-1">Column, Beam, 16th Slab … 40th Slab, Terrace — whatever this site needs.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => setWorkItems((arr) => [...arr, { name: "", unit: "Sft", rate: "", buWork: "" }])}>
            <Plus className="h-4 w-4" /> Add Work Item
          </Button>
        </div>
        <CardContent className="p-6 md:p-8 space-y-4">
          {workItems.map((w, i) => (
            <div key={i} className="flex flex-wrap md:flex-nowrap gap-3">
              <Input className="w-full md:w-[35%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 shadow-sm transition-all" name="workItemName[]" placeholder="Work item (e.g. 16th Slab)" value={w.name}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              <Input className="w-[30%] md:w-[15%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 shadow-sm transition-all" name="workItemUnit[]" placeholder="Unit" value={w.unit}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, unit: e.target.value } : x)))} />
              <Input className="w-[30%] md:w-[20%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 shadow-sm transition-all" name="workItemRate[]" placeholder="Rate (₹)" type="number" step="0.01" value={w.rate}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, rate: e.target.value } : x)))} />
              <Input className="w-full md:w-[25%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 shadow-sm transition-all" name="workItemBuWork[]" placeholder="Approx. Qty" type="number" step="0.01" value={w.buWork}
                onChange={(e) => setWorkItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, buWork: e.target.value } : x)))} />
              <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" onClick={() => setWorkItems((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. Labour Categories */}
      <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400">
                <HardHat className="h-5 w-5" />
              </div>
              Labour Categories
            </h3>
            <p className="text-sm text-slate-500 mt-1">Fitter, Helper, Carpenter, Mason, Electrician — configurable per site.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30" onClick={() => setLabourCats((arr) => [...arr, { name: "", wage: "", ot: "0" }])}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>
        <CardContent className="p-6 md:p-8 space-y-4">
          {labourCats.map((l, i) => (
            <div key={i} className="flex flex-wrap md:flex-nowrap gap-3">
              <Input className="w-full md:flex-1 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 shadow-sm transition-all" name="labourName[]" placeholder="Category (e.g. Fitter)" value={l.name}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              <Input className="w-[45%] md:w-[25%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 shadow-sm transition-all" name="labourWage[]" placeholder="1 Hajari Rate (₹)" type="number" step="0.01" value={l.wage}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, wage: e.target.value } : x)))} />
              <Input className="w-[45%] md:w-[25%] h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 shadow-sm transition-all" name="labourOT[]" placeholder="Overtime Rate (₹)" type="number" step="0.01" value={l.ot}
                onChange={(e) => setLabourCats((arr) => arr.map((x, idx) => (idx === i ? { ...x, ot: e.target.value } : x)))} />
              <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" onClick={() => setLabourCats((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="pt-4 pb-12 flex justify-end">
        <Button type="submit" size="lg" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-900/20 transition-all font-bold hover:-translate-y-0.5 border-0 gap-2 h-14 px-10 rounded-2xl text-lg">
          <Building2 className="h-6 w-6" />
          Create New Site
        </Button>
      </div>
    </form>
  );
}
