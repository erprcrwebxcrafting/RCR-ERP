"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import {
  addSupplyLabourEntryAction,
  deleteSupplyLabourEntryAction,
  updateSupplyLabourEntriesAction,
} from "../bill-actions";
import { Users, Plus, Trash2, DollarSign, Save } from "lucide-react";

export function SupplyLabourManager({ site }: { site: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const rawEntries = site.supplyLabourEntries || [];

  // Local state for editable table rows
  const [entriesState, setEntriesState] = useState<
    Record<
      string,
      {
        date: string;
        challanNo: string;
        description: string;
        fitterQty: number;
        fitterHours: number;
        fitterRate: number;
        helperQty: number;
        helperHours: number;
        helperRate: number;
        totalAmount: number;
      }
    >
  >(() => {
    const initialState: any = {};
    rawEntries.forEach((e: any) => {
      initialState[e.id] = {
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
        challanNo: e.challanNo || "",
        description: e.description || "",
        fitterQty: e.fitterQty || 0,
        fitterHours: e.fitterHours || 0,
        fitterRate: e.fitterRate || 1100,
        helperQty: e.helperQty || 0,
        helperHours: e.helperHours || 0,
        helperRate: e.helperRate || 800,
        totalAmount: e.totalAmount || 0,
      };
    });
    return initialState;
  });

  const handleFieldChange = (entryId: string, field: string, value: any) => {
    setEntriesState((prev) => {
      const current = prev[entryId] || {};
      const updated = { ...current, [field]: value };

      // Auto-recalculate totalAmount if quantities, hours or rates are edited
      if (
        field === "fitterQty" ||
        field === "fitterHours" ||
        field === "fitterRate" ||
        field === "helperQty" ||
        field === "helperHours" ||
        field === "helperRate"
      ) {
        const fQty = updated.fitterQty || 0;
        const fHrs = updated.fitterHours || 0;
        const fRate = updated.fitterRate || 1100;
        const fTotal = fHrs > 0 ? (fQty * fHrs / 8) * fRate : fQty * fRate;

        const hQty = updated.helperQty || 0;
        const hHrs = updated.helperHours || 0;
        const hRate = updated.helperRate || 800;
        const hTotal = hHrs > 0 ? (hQty * hHrs / 8) * hRate : hQty * hRate;

        updated.totalAmount = Math.round((fTotal + hTotal) * 100) / 100;
      }

      return {
        ...prev,
        [entryId]: updated,
      };
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updates = rawEntries.map((e: any) => {
      const state = entriesState[e.id] || {};
      return {
        id: e.id,
        date: state.date,
        challanNo: state.challanNo,
        description: state.description,
        fitterQty: state.fitterQty,
        fitterHours: state.fitterHours,
        fitterRate: state.fitterRate,
        helperQty: state.helperQty,
        helperHours: state.helperHours,
        helperRate: state.helperRate,
        totalAmount: state.totalAmount,
      };
    });

    await updateSupplyLabourEntriesAction(site.id, updates);
    setIsSaving(false);
  };

  // Live stat totals from state
  let totalSupplyAmount = 0;
  let totalFitterHours = 0;
  let totalHelperHours = 0;

  rawEntries.forEach((e: any) => {
    const st = entriesState[e.id] || e;
    totalSupplyAmount += st.totalAmount || 0;
    totalFitterHours += (st.fitterQty || 0) * (st.fitterHours || 0);
    totalHelperHours += (st.helperQty || 0) * (st.helperHours || 0);
  });

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Supply Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatINR(totalSupplyAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Billed to client in RA Bill</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fitter Hours</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFitterHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Standard Rate: ₹1,100 / day (8 hrs)</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Helper Hours</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHelperHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Standard Rate: ₹800 / day (8 hrs)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Client Billed Supply Labours Log (Sheet `supply`)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track extra fitters/helpers provided on contract basis (challan-wise). All fields are directly editable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {rawEntries.length > 0 && (
              <Button onClick={handleSaveAll} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Supply Log Progress"}
              </Button>
            )}
            <Button onClick={() => setIsAdding(!isAdding)} className="gap-1">
              <Plus className="h-4 w-4" /> Log Supply Labour
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Supply Entry Form */}
          {isAdding && (
            <form
              action={async (formData) => {
                await addSupplyLabourEntryAction(site.id, formData);
                setIsAdding(false);
              }}
              className="p-4 bg-muted/40 rounded-lg space-y-4 border mb-4"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Date *</label>
                  <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Challan No.</label>
                  <Input name="challanNo" placeholder="e.g. 9" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Work Description *</label>
                  <Input name="description" placeholder="15th slab covering and slab checking work" required />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 bg-muted/60 p-3 rounded-md">
                <div className="md:col-span-3 font-semibold text-xs text-blue-500 uppercase tracking-wider">Fitter Details</div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Fitter Count (Nos)</label>
                  <Input name="fitterQty" type="number" step="0.01" placeholder="2" defaultValue="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hours / Day</label>
                  <Input name="fitterHours" type="number" step="0.5" placeholder="8" defaultValue="8" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Fitter Rate (₹)</label>
                  <Input name="fitterRate" type="number" step="1" defaultValue="1100" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 bg-muted/60 p-3 rounded-md">
                <div className="md:col-span-3 font-semibold text-xs text-purple-500 uppercase tracking-wider">Fitter Helper Details</div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Helper Count (Nos)</label>
                  <Input name="helperQty" type="number" step="0.01" placeholder="1" defaultValue="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hours / Day</label>
                  <Input name="helperHours" type="number" step="0.5" placeholder="8" defaultValue="8" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Helper Rate (₹)</label>
                  <Input name="helperRate" type="number" step="1" defaultValue="800" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit">Save Supply Entry</Button>
              </div>
            </form>
          )}

          {/* Fully Editable Supply Entries Table */}
          {rawEntries.length > 0 ? (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <THead className="bg-muted/50">
                  <TR>
                    <TH className="w-32">Date</TH>
                    <TH className="w-20">Challan</TH>
                    <TH className="min-w-[180px]">Work Description</TH>
                    <TH className="w-16">Fitter</TH>
                    <TH className="w-16">F. Hrs</TH>
                    <TH className="w-20">F. Rate</TH>
                    <TH className="w-16 text-blue-500">Tot F.Hrs</TH>
                    <TH className="w-16">Helper</TH>
                    <TH className="w-16">H. Hrs</TH>
                    <TH className="w-20">H. Rate</TH>
                    <TH className="w-16 text-purple-500">Tot H.Hrs</TH>
                    <TH className="w-28 text-right">Amount (₹)</TH>
                    <TH className="w-12 text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {rawEntries.map((e: any) => {
                    const st = entriesState[e.id] || {};
                    const fTotalHrs = (st.fitterQty || 0) * (st.fitterHours || 0);
                    const hTotalHrs = (st.helperQty || 0) * (st.helperHours || 0);

                    return (
                      <TR key={e.id}>
                        {/* Date */}
                        <TD>
                          <Input
                            type="date"
                            value={st.date || ""}
                            onChange={(ev) => handleFieldChange(e.id, "date", ev.target.value)}
                            className="h-8 text-xs font-mono w-32"
                          />
                        </TD>
                        {/* Challan No */}
                        <TD>
                          <Input
                            value={st.challanNo || ""}
                            onChange={(ev) => handleFieldChange(e.id, "challanNo", ev.target.value)}
                            className="h-8 text-xs font-mono font-semibold w-20"
                          />
                        </TD>
                        {/* Description */}
                        <TD>
                          <Input
                            value={st.description || ""}
                            onChange={(ev) => handleFieldChange(e.id, "description", ev.target.value)}
                            className="h-8 text-xs font-medium min-w-[180px]"
                          />
                        </TD>
                        {/* Fitter Qty */}
                        <TD>
                          <Input
                            type="number"
                            step="0.1"
                            value={st.fitterQty}
                            onChange={(ev) => handleFieldChange(e.id, "fitterQty", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-16"
                          />
                        </TD>
                        {/* Fitter Hours */}
                        <TD>
                          <Input
                            type="number"
                            step="0.5"
                            value={st.fitterHours}
                            onChange={(ev) => handleFieldChange(e.id, "fitterHours", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-16"
                          />
                        </TD>
                        {/* Fitter Rate */}
                        <TD>
                          <Input
                            type="number"
                            step="1"
                            value={st.fitterRate}
                            onChange={(ev) => handleFieldChange(e.id, "fitterRate", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-20 text-blue-600 font-semibold"
                          />
                        </TD>
                        {/* Calculated Fitter Total Hrs */}
                        <TD className="font-mono text-xs font-semibold text-blue-500 align-middle">
                          {fTotalHrs}h
                        </TD>
                        {/* Helper Qty */}
                        <TD>
                          <Input
                            type="number"
                            step="0.1"
                            value={st.helperQty}
                            onChange={(ev) => handleFieldChange(e.id, "helperQty", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-16"
                          />
                        </TD>
                        {/* Helper Hours */}
                        <TD>
                          <Input
                            type="number"
                            step="0.5"
                            value={st.helperHours}
                            onChange={(ev) => handleFieldChange(e.id, "helperHours", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-16"
                          />
                        </TD>
                        {/* Helper Rate */}
                        <TD>
                          <Input
                            type="number"
                            step="1"
                            value={st.helperRate}
                            onChange={(ev) => handleFieldChange(e.id, "helperRate", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono w-20 text-purple-600 font-semibold"
                          />
                        </TD>
                        {/* Calculated Helper Total Hrs */}
                        <TD className="font-mono text-xs font-semibold text-purple-500 align-middle">
                          {hTotalHrs}h
                        </TD>
                        {/* Total Amount (Auto-Calculated or Manual Editable) */}
                        <TD>
                          <Input
                            type="number"
                            step="0.01"
                            value={st.totalAmount}
                            onChange={(ev) => handleFieldChange(e.id, "totalAmount", parseFloat(ev.target.value) || 0)}
                            className="h-8 text-xs font-mono font-bold text-emerald-600 text-right bg-emerald-500/10 border-emerald-500/30 w-28"
                          />
                        </TD>
                        {/* Actions */}
                        <TD className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (confirm("Delete this supply entry?")) {
                                await deleteSupplyLabourEntryAction(site.id, e.id);
                              }
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TD>
                      </TR>
                    );
                  })}

                  {/* Summary Rows matching Excel Format step-by-step */}
                  {/* Row 1: Total Hours */}
                  <TR className="bg-muted/40 font-semibold border-t-2">
                    <TD colSpan={6} className="text-right uppercase tracking-wider text-xs text-muted-foreground">Total Hours (Sum)</TD>
                    <TD className="font-mono text-blue-600 font-bold text-xs">{totalFitterHours} hrs</TD>
                    <TD colSpan={3}></TD>
                    <TD className="font-mono text-purple-600 font-bold text-xs">{totalHelperHours} hrs</TD>
                    <TD colSpan={2}></TD>
                  </TR>

                  {/* Row 2: Equivalent Days (Hours / 8) */}
                  <TR className="bg-muted/40 font-semibold">
                    <TD colSpan={6} className="text-right uppercase tracking-wider text-xs text-muted-foreground">Equivalent Days (Nos = Hrs ÷ 8)</TD>
                    <TD className="font-mono text-blue-600 font-bold text-xs">{(totalFitterHours / 8).toFixed(2)} Nos</TD>
                    <TD colSpan={3}></TD>
                    <TD className="font-mono text-purple-600 font-bold text-xs">{(totalHelperHours / 8).toFixed(2)} Nos</TD>
                    <TD colSpan={2}></TD>
                  </TR>

                  {/* Row 3: Rate */}
                  <TR className="bg-muted/40 font-semibold">
                    <TD colSpan={6} className="text-right uppercase tracking-wider text-xs text-muted-foreground">Standard Rate (@ ₹)</TD>
                    <TD className="font-mono text-blue-600 text-xs">₹1,100 /day</TD>
                    <TD colSpan={3}></TD>
                    <TD className="font-mono text-purple-600 text-xs">₹800 /day</TD>
                    <TD colSpan={2}></TD>
                  </TR>

                  {/* Row 4: Category Amount Subtotals */}
                  <TR className="bg-muted/70 font-bold border-t">
                    <TD colSpan={6} className="text-right uppercase tracking-wider text-xs">Calculated Subtotals</TD>
                    <TD className="font-mono text-blue-600 text-xs font-bold">{formatINR((totalFitterHours / 8) * 1100)}</TD>
                    <TD colSpan={3}></TD>
                    <TD className="font-mono text-purple-600 text-xs font-bold">{formatINR((totalHelperHours / 8) * 800)}</TD>
                    <TD className="font-mono text-emerald-600 text-right text-xs font-bold">{formatINR(totalSupplyAmount)}</TD>
                    <TD></TD>
                  </TR>

                  {/* Row 5: Grand Total */}
                  <TR className="bg-emerald-500/10 font-bold border-t-2 border-emerald-500/30 text-sm">
                    <TD colSpan={11} className="text-right uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      TOTAL SUPPLY AMOUNT BILLED TO CLIENT (SHEET `supply`)
                    </TD>
                    <TD className="font-mono text-emerald-600 dark:text-emerald-400 text-right text-base font-black">
                      {formatINR(totalSupplyAmount)}
                    </TD>
                    <TD></TD>
                  </TR>
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No extra supply labour entries logged yet. Click "Log Supply Labour" to add challan entries.
            </div>
          )}

          {/* Visual Step-by-step Excel Formula Explanation Box */}
          {rawEntries.length > 0 && (
            <div className="p-4 bg-muted/30 border rounded-lg space-y-2 mt-4 text-xs font-mono">
              <div className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>Excel Step-by-Step Calculation Formula Breakdown</span>
                <Badge variant="outline" className="font-mono text-[10px]">1 Day = 8 Hours</Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-2 pt-1">
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md space-y-1">
                  <span className="font-bold text-blue-600 uppercase text-[11px] block">1. Fitter Amount Calculation:</span>
                  <p className="text-muted-foreground">Total Hours = <span className="font-bold text-foreground">{totalFitterHours} hrs</span></p>
                  <p className="text-muted-foreground">Days (Nos) = {totalFitterHours} ÷ 8 = <span className="font-bold text-foreground">{(totalFitterHours / 8).toFixed(2)} Nos</span></p>
                  <p className="text-muted-foreground">Amount = {(totalFitterHours / 8).toFixed(2)} Nos × ₹1,100 = <span className="font-bold text-blue-600">{formatINR((totalFitterHours / 8) * 1100)}</span></p>
                </div>

                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-md space-y-1">
                  <span className="font-bold text-purple-600 uppercase text-[11px] block">2. Helper Amount Calculation:</span>
                  <p className="text-muted-foreground">Total Hours = <span className="font-bold text-foreground">{totalHelperHours} hrs</span></p>
                  <p className="text-muted-foreground">Days (Nos) = {totalHelperHours} ÷ 8 = <span className="font-bold text-foreground">{(totalHelperHours / 8).toFixed(2)} Nos</span></p>
                  <p className="text-muted-foreground">Amount = {(totalHelperHours / 8).toFixed(2)} Nos × ₹800 = <span className="font-bold text-purple-600">{formatINR((totalHelperHours / 8) * 800)}</span></p>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span>Grand Total = Fitter Amt ({formatINR((totalFitterHours / 8) * 1100)}) + Helper Amt ({formatINR((totalHelperHours / 8) * 800)})</span>
                <span className="text-base">{formatINR(totalSupplyAmount)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
