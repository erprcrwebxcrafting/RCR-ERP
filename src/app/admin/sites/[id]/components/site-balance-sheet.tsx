"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { recordClientPaymentAction, updateSiteTaxSettingsAction } from "../bill-actions";
import { CircleDollarSign, Plus, ArrowDownLeft, Banknote, ShieldAlert, Settings2, Percent } from "lucide-react";

export function SiteBalanceSheet({ site }: { site: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const payments = site.payments || [];
  const bills = site.bills || [];

  const retentionPct = site.retentionPct ?? 2;
  const cgstPct = site.cgstPct ?? 9;
  const sgstPct = site.sgstPct ?? 9;
  const tdsPct = site.tdsPct ?? 1;

  const totalPaymentsReceived = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Build unified chronological ledger (Bills + Payments)
  const ledgerTimeline: any[] = [];

  bills.forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const bRetPct = b.retentionPct ?? retentionPct;
    const bTdsPct = b.tdsPct ?? tdsPct;
    const bCgst = b.cgstPct ?? cgstPct;
    const bSgst = b.sgstPct ?? sgstPct;

    const bRetAmt = gross * (bRetPct / 100);
    const bNetAmt = gross - bRetAmt;
    const bTdsAmt = gross * (bTdsPct / 100);
    const bGstAmt = gross * ((bCgst + bSgst) / 100);

    ledgerTimeline.push({
      id: b.id,
      type: "BILL",
      date: new Date(b.billDate || b.createdAt),
      refName: `BILL NO.${b.billNo || "01"} (${b.periodLabel || site.projectName || "Site"})`,
      grossAmount: gross,
      retentionAmt: bRetAmt,
      netBilledAmt: bNetAmt,
      accountCredited: "—",
      paymentRecd: 0,
      tdsAmt: bTdsAmt,
      gstAmt: bGstAmt,
      rawObj: b,
    });
  });

  payments.forEach((p: any) => {
    ledgerTimeline.push({
      id: p.id,
      type: "PAYMENT",
      date: new Date(p.date || p.createdAt),
      refName: p.remarks || `CLIENT PAYMENT (${p.mode})`,
      grossAmount: 0,
      retentionAmt: 0,
      netBilledAmt: 0,
      accountCredited: p.accountCredited || p.mode || "BANK",
      paymentRecd: p.amount || 0,
      tdsAmt: 0,
      gstAmt: 0,
      rawObj: p,
    });
  });

  // Sort chronologically ascending
  ledgerTimeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningCumNetBilled = 0;
  let runningCumRecd = 0;
  let runningCumTds = 0;
  let runningCumGst = 0;
  let runningCumGross = 0;
  let runningCumRet = 0;

  const calculatedRows = ledgerTimeline.map((item) => {
    if (item.type === "BILL") {
      runningCumNetBilled += item.netBilledAmt;
      runningCumTds += item.tdsAmt;
      runningCumGst += item.gstAmt;
      runningCumGross += item.grossAmount;
      runningCumRet += item.retentionAmt;
    } else {
      runningCumRecd += item.paymentRecd;
    }

    const cumAdvanceTotal = runningCumRecd + runningCumTds;
    const runningBal = runningCumNetBilled - cumAdvanceTotal;
    const balanceWithGst = runningBal + runningCumGst;

    return {
      ...item,
      runningCumGross,
      runningCumRet,
      runningCumNetBilled,
      runningCumRecd,
      runningCumTds,
      runningCumGst,
      cumAdvanceTotal,
      runningBal,
      balanceWithGst,
    };
  });

  // Now we reconstruct the array to insert "TOTAL AMOUNT" rows after each bill
  // or at the end if there are trailing payments.
  const displayRows: any[] = [];
  let blockHasItems = false;

  calculatedRows.forEach((row) => {
    displayRows.push(row);
    blockHasItems = true;

    if (row.type === "BILL") {
      displayRows.push({
        type: "TOTAL_ROW",
        id: `total-${row.id}`,
        grossAmount: row.runningCumGross,
        retentionAmt: row.runningCumRet,
        netBilledAmt: row.runningCumNetBilled,
        paymentRecd: row.runningCumRecd,
        tdsAmt: row.runningCumTds,
        cumAdvanceTotal: row.cumAdvanceTotal,
        runningBal: row.runningBal,
        gstAmt: row.runningCumGst,
        balanceWithGst: row.balanceWithGst,
      });
      blockHasItems = false;
    }
  });

  if (blockHasItems) {
    const lastRow = calculatedRows[calculatedRows.length - 1];
    displayRows.push({
      type: "TOTAL_ROW",
      id: `total-final`,
      grossAmount: lastRow.runningCumGross,
      retentionAmt: lastRow.runningCumRet,
      netBilledAmt: lastRow.runningCumNetBilled,
      paymentRecd: lastRow.runningCumRecd,
      tdsAmt: lastRow.runningCumTds,
      cumAdvanceTotal: lastRow.cumAdvanceTotal,
      runningBal: lastRow.runningBal,
      gstAmt: lastRow.runningCumGst,
      balanceWithGst: lastRow.balanceWithGst,
    });
  }

  // Calculate grand totals for footer and top cards based strictly on Generated Bills
  const totalGrossBills = runningCumGross;
  const totalRetentionHeld = runningCumRet;
  const totalNetBilled = runningCumNetBilled;
  const totalTdsDeducted = runningCumTds;
  const totalGstAmount = runningCumGst;

  // Variables for the top Summary Cards
  const grossBilledTotal = totalGrossBills;
  const retentionAmt = totalRetentionHeld;
  const netOutstandingBalance = totalNetBilled - totalPaymentsReceived;

  return (
    <div className="space-y-6">
      {/* Top Tax Settings Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-4 rounded-lg border">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Percent className="h-4 w-4 text-indigo-500" />
            Tax & Deduction Rates for {site.projectName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Default Deductions: Retention = <strong>{retentionPct}%</strong> | TDS = <strong>{tdsPct}%</strong> | CGST = <strong>{cgstPct}%</strong> | SGST = <strong>{sgstPct}%</strong>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditingSettings(!isEditingSettings)}
          className="gap-1.5 text-xs"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {isEditingSettings ? "Close Settings" : "Configure GST / TDS / Retention"}
        </Button>
      </div>

      {/* Tax Settings Form Modal/Panel */}
      {isEditingSettings && (
        <form
          action={async (formData) => {
            await updateSiteTaxSettingsAction(site.id, formData);
            setIsEditingSettings(false);
          }}
          className="p-4 bg-background border rounded-lg space-y-4 shadow-sm"
        >
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Configure Default Site Rates</h4>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Retention (%)</label>
              <Input name="retentionPct" type="number" step="0.1" defaultValue={retentionPct} required />
              <p className="text-[10px] text-muted-foreground mt-1">Default: 2% or 2.5%</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">1% TDS (%)</label>
              <Input name="tdsPct" type="number" step="0.1" defaultValue={tdsPct} required />
              <p className="text-[10px] text-muted-foreground mt-1">Income Tax Sec 194C (Default: 1%)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">CGST (%)</label>
              <Input name="cgstPct" type="number" step="0.1" defaultValue={cgstPct} required />
              <p className="text-[10px] text-muted-foreground mt-1">Central GST (Default: 9%)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">SGST (%)</label>
              <Input name="sgstPct" type="number" step="0.1" defaultValue={sgstPct} required />
              <p className="text-[10px] text-muted-foreground mt-1">State GST (Default: 9%)</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingSettings(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">Save Rates</Button>
          </div>
        </form>
      )}

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

        <Card className={netOutstandingBalance > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Outstanding Balance</CardTitle>
            <CircleDollarSign className={`h-4 w-4 ${netOutstandingBalance > 0 ? "text-rose-500" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netOutstandingBalance > 0 ? "text-rose-500" : "text-emerald-500"}`}>
              {formatINR(netOutstandingBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netOutstandingBalance > 0 ? "🔴 Pending Dues from Client" : "🟢 Balance Cleared / Advance Received"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-indigo-500" />
              Site Ledger & Client Balance Sheet (Full Statement View)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete statement tracking RA Bills, Retention ({retentionPct}%), Net Amount, Payments Received, 1% TDS, Advance, GST, and Running Balance.
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

          {/* Full 12-Column Statement Table matching Excel & PDF */}
          {displayRows.length > 0 ? (
            <div className="overflow-x-auto border rounded-md">
              <Table className="text-xs table-fixed w-full">
                <THead className="bg-muted/70">
                  <TR>
                    <TH className="py-2.5 font-bold w-12 text-center">SR.</TH>
                    <TH className="py-2.5 font-bold w-24">DATE</TH>
                    <TH className="py-2.5 font-bold w-48">RA BILLS / REMARKS</TH>
                    <TH className="py-2.5 font-bold text-right w-24">BILL AMOUNT</TH>
                    <TH className="py-2.5 font-bold text-right w-24">RETENTION</TH>
                    <TH className="py-2.5 font-bold text-right w-24">AMOUNT</TH>
                    <TH className="py-2.5 font-bold text-right w-24">A/C CREDITED</TH>
                    <TH className="py-2.5 font-bold text-right w-20">1% TDS</TH>
                    <TH className="py-2.5 font-bold text-right w-24">ADVANCE</TH>
                    <TH className="py-2.5 font-bold text-right w-24">BALANCE</TH>
                    <TH className="py-2.5 font-bold text-right w-24">GST AMOUNT</TH>
                    <TH className="py-2.5 font-bold text-right w-24">BALANCE+GST</TH>
                  </TR>
                </THead>
                <TBody>
                  {displayRows.map((row, idx) => {
                    if (row.type === "TOTAL_ROW") {
                      return (
                        <TR key={row.id} className="bg-indigo-500/10 font-bold border-y-2 border-primary/20">
                          <TD></TD>
                          <TD colSpan={2} className="uppercase tracking-wider">TOTAL AMOUNT</TD>
                          <TD className="font-mono text-right text-blue-600">{formatINR(row.grossAmount)}</TD>
                          <TD className="font-mono text-right text-orange-600">{formatINR(row.retentionAmt)}</TD>
                          <TD className="font-mono text-right">{formatINR(row.netBilledAmt)}</TD>
                          <TD className="font-mono text-right text-emerald-600">{formatINR(row.paymentRecd)}</TD>
                          <TD className="font-mono text-right text-indigo-600">{formatINR(row.tdsAmt)}</TD>
                          <TD className="font-mono text-right text-emerald-600">{formatINR(row.cumAdvanceTotal)}</TD>
                          <TD className={`font-mono text-right ${row.runningBal > 0 ? "text-rose-500" : "text-emerald-500"}`}>{formatINR(row.runningBal)}</TD>
                          <TD className="font-mono text-right text-muted-foreground">{formatINR(row.gstAmt)}</TD>
                          <TD className={`font-mono text-right ${row.balanceWithGst > 0 ? "text-rose-500" : "text-emerald-500"}`}>{formatINR(row.balanceWithGst)}</TD>
                        </TR>
                      );
                    }

                    const isBill = row.type === "BILL";
                    return (
                      <TR key={row.id} className={isBill ? "bg-amber-500/5" : ""}>
                        <TD className="font-mono text-center font-medium text-muted-foreground">{!isBill ? (displayRows.filter(r => r.type === "PAYMENT").indexOf(row) + 1) : ""}</TD>
                        <TD className="font-mono whitespace-nowrap">{formatDate(row.date)}</TD>
                        <TD className="font-semibold text-muted-foreground">
                          {isBill ? (
                            <span className="text-foreground">{row.refName}</span>
                          ) : (
                            <span>{row.accountCredited === "NEFT" ? "NEFT" : row.accountCredited} - {row.refName}</span>
                          )}
                        </TD>

                        <TD className="font-mono text-right">
                          {isBill ? formatINR(row.grossAmount) : ""}
                        </TD>

                        <TD className="font-mono text-right">
                          {isBill ? formatINR(row.retentionAmt) : ""}
                        </TD>

                        <TD className="font-mono text-right font-medium">
                          {isBill ? formatINR(row.netBilledAmt) : ""}
                        </TD>

                        <TD className="font-mono text-right font-medium text-emerald-600">
                          {!isBill ? formatINR(row.paymentRecd) : ""}
                        </TD>

                        <TD className="font-mono text-right">
                          {isBill ? formatINR(row.tdsAmt) : ""}
                        </TD>

                        <TD></TD>
                        <TD></TD>

                        <TD className="font-mono text-right">
                          {isBill ? formatINR(row.gstAmt) : ""}
                        </TD>

                        <TD></TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              <CircleDollarSign className="h-9 w-9 mx-auto mb-2 opacity-40 text-indigo-500" />
              <p className="font-medium text-sm">No RA bills or client payments recorded yet for this site.</p>
              <p className="text-xs mt-1">Generate a Running Bill or click "Record Client Payment" to populate the Balance Sheet statement.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
