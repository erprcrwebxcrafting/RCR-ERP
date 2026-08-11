"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { recordClientPaymentAction } from "../bill-actions";
import { CircleDollarSign, Plus, ArrowUpRight, ArrowDownLeft, Banknote, Calendar, ShieldAlert } from "lucide-react";

export function SiteBalanceSheet({ site }: { site: any }) {
  const [isRecording, setIsRecording] = useState(false);

  const payments = site.payments || [];
  const latestBill = (site.bills || [])[0] || null;

  // Calculate live tower + supply total
  const totalTowerWork = site.buildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + (item.currentQty * item.rate), 0);
  }, 0);
  const totalSupplyWork = (site.supplyLabourEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);
  const grossBilledTotal = totalTowerWork + totalSupplyWork;

  const retentionPct = site.retentionPct || 2;
  const retentionAmt = grossBilledTotal * (retentionPct / 100);
  const tdsAmt = grossBilledTotal * 0.01;
  const netBilledAmt = grossBilledTotal - retentionAmt - tdsAmt;

  const totalPaymentsReceived = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const netOutstandingBalance = netBilledAmt - totalPaymentsReceived;

  return (
    <div className="space-y-6">
      {/* Balance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced Amount</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(grossBilledTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all towers & supply</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Retention ({retentionPct}%)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{formatINR(retentionAmt)}</div>
            <p className="text-xs text-muted-foreground mt-1">Held until project completion</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payments Received</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatINR(totalPaymentsReceived)}</div>
            <p className="text-xs text-muted-foreground mt-1">{payments.length} transactions recorded</p>
          </CardContent>
        </Card>

        <Card className={netOutstandingBalance > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Outstanding Balance</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netOutstandingBalance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              {formatINR(netOutstandingBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Client pending balance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-indigo-500" />
              Site Ledger & Client Balance Sheet (Sheet `Balance sheet`)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track bill-by-bill client payments received, retention held, TDS deducted, and running balance.
            </p>
          </div>
          <Button onClick={() => setIsRecording(!isRecording)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Record Client Payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Record Payment Form */}
          {isRecording && (
            <form
              action={async (formData) => {
                await recordClientPaymentAction(site.id, formData);
                setIsRecording(false);
              }}
              className="p-4 bg-muted/40 rounded-lg space-y-4 border mb-4"
            >
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Payment Date *</label>
                  <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount Received (₹) *</label>
                  <Input name="amount" type="number" step="0.01" placeholder="15000" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Payment Mode</label>
                  <select name="mode" className="w-full h-9 rounded-md border bg-background px-3 text-xs">
                    <option value="NEFT">NEFT / Bank Transfer</option>
                    <option value="ONLINE">Online / UPI</option>
                    <option value="CASH">CASH ANSAT</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Account Credited</label>
                  <Input name="accountCredited" placeholder="e.g. SANDIP ONLINE, ICICI 0884" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Remarks / Reference</label>
                <Input name="remarks" placeholder="BILL NO.01 VIKHROLI PARK SITE" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsRecording(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save Payment</Button>
              </div>
            </form>
          )}

          {/* Payment Ledger Table */}
          {payments.length > 0 ? (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <THead className="bg-muted/50">
                  <TR>
                    <TH>#</TH>
                    <TH>Date</TH>
                    <TH>Description / Reference</TH>
                    <TH>Payment Mode</TH>
                    <TH>Account Credited</TH>
                    <TH>Amount Received (₹)</TH>
                    <TH>Running Outstanding Balance</TH>
                  </TR>
                </THead>
                <TBody>
                  {(() => {
                    let runningBal = netBilledAmt;
                    return payments.map((p: any, idx: number) => {
                      runningBal -= p.amount;
                      return (
                        <TR key={p.id}>
                          <TD className="font-mono text-xs">{idx + 1}</TD>
                          <TD className="font-mono text-xs">{formatDate(p.date)}</TD>
                          <TD className="font-medium">{p.remarks || "Client Payment"}</TD>
                          <TD><Badge variant="outline">{p.mode}</Badge></TD>
                          <TD className="font-mono text-xs">{p.accountCredited || "—"}</TD>
                          <TD className="font-mono font-bold text-emerald-500">{formatINR(p.amount)}</TD>
                          <TD className={`font-mono font-bold ${runningBal > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                            {formatINR(runningBal)}
                          </TD>
                        </TR>
                      );
                    });
                  })()}

                  <TR className="bg-muted/80 font-bold border-t-2">
                    <TD colSpan={5} className="text-right uppercase tracking-wider text-xs">Total Payments Received</TD>
                    <TD className="font-mono text-emerald-500 text-base">{formatINR(totalPaymentsReceived)}</TD>
                    <TD className="font-mono text-amber-500 text-base">{formatINR(netOutstandingBalance)}</TD>
                  </TR>
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CircleDollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No client payments recorded yet. Click "Record Client Payment" to add payments.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
