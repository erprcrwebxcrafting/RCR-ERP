"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { addSupplyLabourEntryAction, deleteSupplyLabourEntryAction } from "../bill-actions";
import { Users, Plus, Trash2, Calendar, FileText, DollarSign } from "lucide-react";

export function SupplyLabourManager({ site }: { site: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const supplyEntries = site.supplyLabourEntries || [];

  const totalSupplyAmount = supplyEntries.reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);
  const totalFitterHours = supplyEntries.reduce((sum: number, e: any) => sum + (e.fitterQty * e.fitterHours), 0);
  const totalHelperHours = supplyEntries.reduce((sum: number, e: any) => sum + (e.helperQty * e.helperHours), 0);

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
            <p className="text-xs text-muted-foreground mt-1">Rate: ₹1,100 / day</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Helper Hours</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHelperHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Rate: ₹800 / day</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Client Billed Supply Labours Log (Sheet `supply`)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track extra fitters/helpers provided on contract basis (challan-wise) to be billed directly to the client.
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-1">
            <Plus className="h-4 w-4" /> Log Supply Labour
          </Button>
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
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
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

          {/* Supply Entries Table */}
          {supplyEntries.length > 0 ? (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <THead className="bg-muted/50">
                  <TR>
                    <TH>Date</TH>
                    <TH>Challan No.</TH>
                    <TH>Description Contract Basis Work</TH>
                    <TH>Fitter Count</TH>
                    <TH>Fitter Hours</TH>
                    <TH>Total Fitter Hrs</TH>
                    <TH>Helper Count</TH>
                    <TH>Helper Hours</TH>
                    <TH>Total Helper Hrs</TH>
                    <TH>Amount (₹)</TH>
                    <TH className="text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {supplyEntries.map((e: any) => {
                    const fTotalHrs = e.fitterQty * e.fitterHours;
                    const hTotalHrs = e.helperQty * e.helperHours;

                    return (
                      <TR key={e.id}>
                        <TD className="font-mono text-xs whitespace-nowrap">{formatDate(e.date)}</TD>
                        <TD className="font-mono text-xs font-semibold">{e.challanNo || "—"}</TD>
                        <TD className="font-medium">{e.description}</TD>
                        <TD className="font-mono text-xs">{e.fitterQty}</TD>
                        <TD className="font-mono text-xs">{e.fitterHours}</TD>
                        <TD className="font-mono text-xs font-semibold text-blue-500">{fTotalHrs}</TD>
                        <TD className="font-mono text-xs">{e.helperQty}</TD>
                        <TD className="font-mono text-xs">{e.helperHours}</TD>
                        <TD className="font-mono text-xs font-semibold text-purple-500">{hTotalHrs}</TD>
                        <TD className="font-mono font-bold text-emerald-500">{formatINR(e.totalAmount)}</TD>
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

                  <TR className="bg-muted/80 font-bold border-t-2">
                    <TD colSpan={5} className="text-right uppercase tracking-wider text-xs">Total Supply Summary</TD>
                    <TD className="font-mono text-blue-500">{totalFitterHours} hrs</TD>
                    <TD colSpan={2}></TD>
                    <TD className="font-mono text-purple-500">{totalHelperHours} hrs</TD>
                    <TD className="font-mono text-emerald-500 text-base">{formatINR(totalSupplyAmount)}</TD>
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
        </CardContent>
      </Card>
    </div>
  );
}
