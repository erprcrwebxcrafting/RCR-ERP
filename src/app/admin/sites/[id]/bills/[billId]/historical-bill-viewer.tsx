"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import { SiteBalanceSheet } from "../../components/site-balance-sheet";
import { sendBillEmailAction, sendBillWhatsAppAction } from "./actions";
import { Receipt, FileSpreadsheet, Printer, Download, Mail, MessageCircle } from "lucide-react";

function BillHeaderBanner({ site, bill, sheetTitle }: { site: any; bill: any; sheetTitle?: string }) {
  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider">{sheetTitle || "RA Bill Document"}</h2>
          <p className="text-xs text-muted-foreground">RCR ENTERPRISES / SSHIVAAY CONSTRUCTIONS</p>
        </div>
        <div className="text-right font-mono text-xs">
          <p><span className="text-muted-foreground">Invoice No:</span> <span className="font-bold">{bill?.billNo}</span></p>
          <p><span className="text-muted-foreground">Date:</span> {formatDate(bill?.billDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 text-xs gap-4 bg-muted/20 p-4 rounded-lg">
        <div className="space-y-1">
          <p className="font-semibold text-muted-foreground">To,</p>
          <p className="font-bold text-sm text-foreground">{site.client?.name}</p>
          <p className="text-muted-foreground">{site.address}</p>
          {site.gstNo && <p className="font-mono text-[11px] pt-1">GST No: {site.gstNo}</p>}
        </div>
        <div className="text-right space-y-1">
          <p><span className="font-semibold text-muted-foreground">Ref No:</span> <span className="font-semibold">{bill?.refNo || "01"}</span></p>
          <p><span className="font-semibold text-muted-foreground">W.O. No:</span> <span className="font-mono text-xs">{site.workOrderNo}</span></p>
        </div>
        <div className="col-span-2 pt-2 border-t flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
          <p>Name of Work: <span className="font-normal text-muted-foreground">Reinforcement & Concrete Construction Work</span></p>
          <p>Name of Project: <span className="font-bold text-indigo-500">{site.projectName}</span></p>
        </div>
      </div>
    </div>
  );
}

export function HistoricalBillViewer({ bill }: { bill: any }) {
  const { site, lines, supplyLabourEntries } = bill;
  const [activeSheetTab, setActiveSheetTab] = useState<"sheet1" | "sheet2" | "towers" | "supply" | "balance">("sheet1");
  const [selectedTowerId, setSelectedTowerId] = useState<string>(site.buildings[0]?.id || "");

  const taxPcts = {
    cgstPct: bill.cgstPct ?? site.cgstPct ?? 9,
    sgstPct: bill.sgstPct ?? site.sgstPct ?? 9,
    retentionPct: bill.retentionPct ?? site.retentionPct ?? 2,
    tdsPct: bill.tdsPct ?? site.tdsPct ?? 1,
  };

  // 1. Identify previous bills in the timeline to accurately calculate past quantities
  const currentBillIndex = (site.bills || []).findIndex((b: any) => b.id === bill.id);
  const previousBills = currentBillIndex > 0 ? site.bills.slice(0, currentBillIndex) : [];
  const previousBillIds = previousBills.map((b: any) => b.id);

  // Reconstruct towers array with full state fidelity (including 0 qty items) for this snapshot
  const mockBuildings = (site.buildings || []).map((b: any) => {
    return {
      ...b,
      workItems: (b.workItems || []).map((item: any) => {
        // Find this item in the current bill's lines
        const currentLine = lines.find((l: any) => l.workItemId === item.id);
        
        // Sum previous quantities from previous bills
        let prevQty = 0;
        let prevAmt = 0;
        
        previousBills.forEach((pb: any) => {
          const pbLine = pb.lines?.find((l: any) => l.workItemId === item.id);
          if (pbLine) {
            prevQty += (pbLine.currentQty || 0);
            prevAmt += (pbLine.currentAmount || 0);
          }
        });

        const currQty = currentLine?.currentQty || 0;
        const currAmt = currentLine?.currentAmount || 0;

        return {
          id: item.id,
          name: item.name || "Work Item",
          unit: item.unit || "%",
          previousAmt: prevAmt,
          currentAmt: currAmt,
          cumulativeAmt: prevAmt + currAmt,
          previousQty: prevQty,
          currentQty: currQty,
          cumulativeQty: prevQty + currQty,
          rate: item.rate,
          partAmount: item.partAmount || 0,
        };
      })
    };
  });

  const totalTowerWork = mockBuildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + (item.currentAmt || 0), 0);
  }, 0);

  const totalSupplyWork = (supplyLabourEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);
  
  // Calculate true historical previous supply work
  const previousSupplyWork = (site.supplyLabourEntries || [])
    .filter((se: any) => previousBillIds.includes(se.runningBillId))
    .reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);

  const grossBillTotal = totalTowerWork + totalSupplyWork;

  const cgst = grossBillTotal * (taxPcts.cgstPct / 100);
  const sgst = grossBillTotal * (taxPcts.sgstPct / 100);
  const retention = grossBillTotal * (taxPcts.retentionPct / 100);
  const tds = grossBillTotal * (taxPcts.tdsPct / 100);
  const netPayable = grossBillTotal + cgst + sgst - retention - tds;

  const handleDownloadExcel = () => {
    window.open(`/api/bills/${bill.id}/excel`, "_blank");
  };

  const handleDownloadPdfPackage = () => {
    window.open(`/api/bills/${bill.id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/40 p-4 rounded-xl border print:hidden">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-500" />
            Historical RA Bill Package ({bill.billNo})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full snapshot statement view. Contains Sheet 1 (Invoice), Sheet 2 (Abstract), Tower Sheets, Supply Sheet & Balance Sheet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleDownloadExcel} variant="outline" className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10">
            <FileSpreadsheet className="h-4 w-4" /> Download Complete Excel (.xlsx)
          </Button>

          <Button onClick={handleDownloadPdfPackage} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="h-4 w-4" /> Download Official PDF Package (.pdf)
          </Button>

          <form action={sendBillEmailAction.bind(null, bill.id)}>
            <Button variant="secondary" className="gap-2 border"><Mail className="h-4 w-4" /> Email</Button>
          </form>

          <form action={sendBillWhatsAppAction.bind(null, bill.id)}>
            <Button variant="secondary" className="gap-2 text-green-600 border-green-600"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          </form>
        </div>
      </div>

      <div className="border-b flex items-center gap-2 overflow-x-auto pb-2">
        <Button variant={activeSheetTab === "sheet1" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("sheet1")}>Sheet 1: Tax Invoice</Button>
        <Button variant={activeSheetTab === "sheet2" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("sheet2")}>Sheet 2: Abstract Summary</Button>
        <Button variant={activeSheetTab === "towers" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("towers")}>Tower Work Sheets ({mockBuildings.length || 0})</Button>
        <Button variant={activeSheetTab === "supply" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("supply")}>Supply Sheet</Button>
        <Button variant={activeSheetTab === "balance" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("balance")}>Balance Sheet</Button>
      </div>

      {/* TAB CONTENT: SHEET 1 (TAX INVOICE) */}
      {activeSheetTab === "sheet1" && (
        <Card className="max-w-4xl mx-auto shadow-md border p-6 bg-background space-y-6">
          <BillHeaderBanner site={site} bill={bill} sheetTitle="TAX INVOICE" />

          <div className="border rounded-md overflow-hidden">
            <Table>
              <THead className="bg-muted/60">
                <TR>
                  <TH className="w-16">Sr. No.</TH>
                  <TH>Particulars / Work Description</TH>
                  <TH className="text-right">Amount (₹)</TH>
                </TR>
              </THead>
              <TBody>
                {mockBuildings.map((b: any, idx: number) => {
                  const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => s + (i.currentAmt || 0), 0);
                  return (
                    <TR key={b.id}>
                      <TD>{idx + 1}</TD>
                      <TD className="font-medium">
                        <span className="font-bold text-foreground">{site.projectName} — {b.name}</span> Reinforcement & Construction Work Done
                      </TD>
                      <TD className="text-right font-mono font-semibold">{formatINR(towerWorkAmt)}</TD>
                    </TR>
                  );
                })}

                {totalSupplyWork > 0 && (
                  <TR>
                    <TD>{mockBuildings.length + 1}</TD>
                    <TD className="font-medium">
                      <span className="font-bold text-indigo-500">Departmental Extra Labour Supply</span> (Fitters & Helpers Log Billed)
                    </TD>
                    <TD className="text-right font-mono font-semibold text-indigo-500">{formatINR(totalSupplyWork)}</TD>
                  </TR>
                )}

                <TR className="border-t bg-muted/30 font-bold text-sm">
                  <TD></TD>
                  <TD className="uppercase tracking-wider">Total Taxable Amount</TD>
                  <TD className="text-right font-mono text-base">{formatINR(grossBillTotal)}</TD>
                </TR>

                <TR>
                  <TD></TD>
                  <TD className="text-xs text-muted-foreground">Add CGST @ {taxPcts.cgstPct}%</TD>
                  <TD className="text-right font-mono text-xs">{formatINR(cgst)}</TD>
                </TR>
                <TR>
                  <TD></TD>
                  <TD className="text-xs text-muted-foreground">Add SGST @ {taxPcts.sgstPct}%</TD>
                  <TD className="text-right font-mono text-xs">{formatINR(sgst)}</TD>
                </TR>
                <TR className="border-t-2 bg-emerald-500/10 font-bold text-base">
                  <TD></TD>
                  <TD className="text-emerald-700 dark:text-emerald-400">NET PAYABLE INVOICE AMOUNT</TD>
                  <TD className="text-right font-mono text-emerald-600 dark:text-emerald-400 text-lg font-black">{formatINR(grossBillTotal + cgst + sgst)}</TD>
                </TR>
              </TBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t text-xs">
            <div className="space-y-1">
              <p className="font-bold text-sm">BANK DETAILS FOR PAYMENT:</p>
              <p><span className="font-semibold">NAME:</span> RCR ENTERPRISES</p>
              <p><span className="font-semibold">A/C NO:</span> 088405500559</p>
              <p><span className="font-semibold">IFSC:</span> ICIC0000884</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <p className="font-bold">FOR RCR ENTERPRISES</p>
              <p className="font-bold text-muted-foreground uppercase tracking-wider border-t pt-2 mt-12">AUTHORISED SIGNATORY</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: SHEET 2 (CONSOLIDATED ABSTRACT) */}
      {activeSheetTab === "sheet2" && (
        <Card className="p-6 overflow-x-auto space-y-6 bg-background">
          <BillHeaderBanner site={site} bill={bill} sheetTitle="Sheet 2: Consolidated Abstract Summary" />

          <Table className="border">
            <THead className="bg-muted/60">
              <TR>
                <TH>Sr. No</TH>
                <TH>Description</TH>
                <TH>Unit</TH>
                <TH>W.O. Qty</TH>
                <TH>Rate (₹)</TH>
                <TH>Previous Qty</TH>
                <TH>This Bill Qty</TH>
                <TH>Cumulative Qty</TH>
                <TH>Previous Amt</TH>
                <TH>This Bill Amt</TH>
                <TH>Cumulative Amt</TH>
              </TR>
            </THead>
            <TBody>
              {mockBuildings.map((b: any, idx: number) => {
                const prevA = (b.workItems || []).reduce((s: number, i: any) => s + (i.previousAmt || 0), 0);
                const currA = (b.workItems || []).reduce((s: number, i: any) => s + (i.currentAmt || 0), 0);
                return (
                  <TR key={b.id}>
                    <TD>{idx + 1}</TD>
                    <TD className="font-bold">{b.name} Reinforcement Work Done.</TD>
                    <TD>Sft.</TD>
                    <TD>{(b.approxArea || 0).toLocaleString()}</TD>
                    <TD>₹{b.contractRate || 0}</TD>
                    <TD>{prevA > 0 ? (prevA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono text-emerald-500 font-semibold">{currA > 0 ? (currA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{(prevA + currA) > 0 ? ((prevA + currA) / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{formatINR(prevA)}</TD>
                    <TD className="font-mono text-emerald-500 font-bold">{formatINR(currA)}</TD>
                    <TD className="font-mono font-bold">{formatINR(prevA + currA)}</TD>
                  </TR>
                );
              })}

              {totalSupplyWork > 0 && (
                <TR>
                  <TD>{mockBuildings.length + 1}</TD>
                  <TD className="font-bold">Extra Labour Supply Billed</TD>
                  <TD>Nos/Hrs</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD className="font-mono">{formatINR(previousSupplyWork)}</TD>
                  <TD className="font-mono text-emerald-500 font-bold">{formatINR(totalSupplyWork)}</TD>
                  <TD className="font-mono font-bold">{formatINR(previousSupplyWork + totalSupplyWork)}</TD>
                </TR>
              )}

              <TR className="bg-muted/80 font-bold border-t-2">
                <TD colSpan={8} className="text-right">TOTAL AMOUNT</TD>
                <TD className="font-mono">₹0.00</TD>
                <TD className="font-mono text-emerald-500">{formatINR(grossBillTotal)}</TD>
                <TD className="font-mono">{formatINR(grossBillTotal)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs">ADD CGST @ {taxPcts.cgstPct}%</TD>
                <TD></TD>
                <TD className="font-mono text-xs">{formatINR(cgst)}</TD>
                <TD className="font-mono text-xs">{formatINR(cgst)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs">ADD SGST @ {taxPcts.sgstPct}%</TD>
                <TD></TD>
                <TD className="font-mono text-xs">{formatINR(sgst)}</TD>
                <TD className="font-mono text-xs">{formatINR(sgst)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs text-orange-500">LESS RETENTION @ {taxPcts.retentionPct}%</TD>
                <TD></TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(retention)}</TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(retention)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs text-orange-500">LESS TDS @ {taxPcts.tdsPct}%</TD>
                <TD></TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(tds)}</TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(tds)}</TD>
              </TR>
              <TR className="bg-emerald-500/10 font-bold text-base border-t-2">
                <TD colSpan={8} className="text-right">NET PAYABLE AMOUNT</TD>
                <TD></TD>
                <TD className="font-mono text-emerald-500">{formatINR(netPayable)}</TD>
                <TD className="font-mono text-emerald-500">{formatINR(netPayable)}</TD>
              </TR>
            </TBody>
          </Table>
        </Card>
      )}

      {/* TAB CONTENT: TOWER SHEETS */}
      {activeSheetTab === "towers" && (
        <Card className="p-6 space-y-6 bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            {mockBuildings.map((b: any) => (
              <Button key={b.id} variant={b.id === selectedTowerId ? "default" : "outline"} size="sm" onClick={() => setSelectedTowerId(b.id)}>
                {b.name}
              </Button>
            ))}
          </div>

          {(() => {
            const b = mockBuildings.find((x: any) => x.id === selectedTowerId) || mockBuildings[0];
            if (!b) return <div>No tower selected</div>;

            const approxArea = b.approxArea || 0;
            const contractRate = b.contractRate || 0;
            const totalVal = approxArea * contractRate;

            const items = b.workItems || [];
            let totPrevQ = 0;
            let totCurrQ = 0;
            let totCumQ = 0;
            let totPrevA = 0;
            let totCurrA = 0;
            let totCumA = 0;

            items.forEach((item: any) => {
              const prevQ = item.previousQty || 0;
              const currQ = item.currentQty || 0;
              const cumQ = item.cumulativeQty || (prevQ + currQ);
              const prevA = item.previousAmt || 0;
              const currA = item.currentAmt || 0;
              const cumA = item.cumulativeAmt || (prevA + currA);

              totPrevQ += prevQ;
              totCurrQ += currQ;
              totCumQ += cumQ;
              totPrevA += prevA;
              totCurrA += currA;
              totCumA += cumA;
            });

            return (
              <div className="space-y-6">
                <BillHeaderBanner site={site} bill={bill} sheetTitle={`BUA Building Sheet - ${b.name}`} />

                <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
                  <span className="text-indigo-400">CIVIL WORK (BUA)</span>
                  <span>Approx Area: <span className="font-bold font-mono">{approxArea.toLocaleString()} Sft</span></span>
                  <span>Contract Rate: <span className="font-bold font-mono">₹{contractRate}/Sft</span></span>
                  <span>Tower Contract Value: <span className="font-bold font-mono text-emerald-500">{formatINR(totalVal)}</span></span>
                </div>

                <Table className="border">
                  <THead className="bg-muted/60">
                    <TR>
                      <TH>#</TH>
                      <TH>Particulars of Item</TH>
                      <TH>Unit</TH>
                      <TH className="text-center">Previous Qty (%)</TH>
                      <TH className="text-center">This Bill Qty (%)</TH>
                      <TH className="text-center">Cumulative Qty (%)</TH>
                      <TH className="text-right">Previous Amt (₹)</TH>
                      <TH className="text-right">This Bill Amt (₹)</TH>
                      <TH className="text-right">Cumulative Amt (₹)</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {items.map((item: any, i: number) => (
                      <TR key={item.id}>
                        <TD>{i + 1}</TD>
                        <TD className="font-medium">{item.name}</TD>
                        <TD>{item.unit}</TD>
                        <TD className="font-mono text-center">{item.previousQty}%</TD>
                        <TD className="font-mono text-emerald-500 font-semibold text-center">{item.currentQty}%</TD>
                        <TD className="font-mono text-center font-bold">{item.cumulativeQty || (item.previousQty + item.currentQty)}%</TD>
                        <TD className="font-mono text-right">{formatINR(item.previousAmt)}</TD>
                        <TD className="font-mono text-emerald-500 font-bold text-right">{formatINR(item.currentAmt)}</TD>
                        <TD className="font-mono font-bold text-right">{formatINR(item.cumulativeAmt || (item.previousAmt + item.currentAmt))}</TD>
                      </TR>
                    ))}

                    <TR className="bg-muted/80 font-bold border-t-2 text-xs">
                      <TD colSpan={3} className="text-right uppercase tracking-wider">TOTAL {b.name.toUpperCase()} AMOUNT</TD>
                      <TD className="text-center font-mono">{totPrevQ}%</TD>
                      <TD className="text-center font-mono text-emerald-500">{totCurrQ}%</TD>
                      <TD className="text-center font-mono font-bold">{totCumQ}%</TD>
                      <TD className="text-right font-mono">{formatINR(totPrevA)}</TD>
                      <TD className="text-right font-mono text-emerald-500 font-black text-sm">{formatINR(totCurrA)}</TD>
                      <TD className="text-right font-mono font-black text-sm">{formatINR(totCumA)}</TD>
                    </TR>
                  </TBody>
                </Table>
              </div>
            );
          })()}
        </Card>
      )}

      {activeSheetTab === "supply" && (
        <Card className="p-6 space-y-6 bg-background">
          <BillHeaderBanner site={site} bill={bill} sheetTitle="Sheet 5: Client Extra Supply Labour Log" />

          {(() => {
            const entries = supplyLabourEntries || [];
            let totFitterHrs = 0;
            let totHelperHrs = 0;

            entries.forEach((se: any) => {
              totFitterHrs += (se.fitterQty || 0) * (se.fitterHours || 8);
              totHelperHrs += (se.helperQty || 0) * (se.helperHours || 8);
            });

            const fitterDays = Math.round((totFitterHrs / 8) * 100) / 100;
            const helperDays = Math.round((totHelperHrs / 8) * 100) / 100;
            const fitterAmt = fitterDays * 1100;
            const helperAmt = helperDays * 800;

            return (
              <div className="border rounded-md overflow-hidden">
                <Table className="text-xs">
                  <THead className="bg-muted/70">
                    <TR>
                      <TH className="py-2.5 font-bold">Date</TH>
                      <TH className="py-2.5 font-bold">Challan No.</TH>
                      <TH className="py-2.5 font-bold">Work Description</TH>
                      <TH className="py-2.5 font-bold text-center">Fitter Count</TH>
                      <TH className="py-2.5 font-bold text-center">Hours</TH>
                      <TH className="py-2.5 font-bold text-center">Total Fitter Hrs</TH>
                      <TH className="py-2.5 font-bold text-center">Fitter Helper</TH>
                      <TH className="py-2.5 font-bold text-center">Hours</TH>
                      <TH className="py-2.5 font-bold text-center">Total Helper Hrs</TH>
                      <TH className="py-2.5 font-bold text-right">Amount (₹)</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {entries.map((se: any) => {
                      const fHrs = (se.fitterQty || 0) * (se.fitterHours || 8);
                      const hHrs = (se.helperQty || 0) * (se.helperHours || 8);

                      return (
                        <TR key={se.id}>
                          <TD className="font-mono text-xs whitespace-nowrap">{formatDate(se.date)}</TD>
                          <TD className="font-mono text-xs font-semibold">{se.challanNo || "—"}</TD>
                          <TD className="font-medium">{se.description}</TD>
                          <TD className="font-mono text-center">{se.fitterQty || 0}</TD>
                          <TD className="font-mono text-center">{se.fitterHours || 8}h</TD>
                          <TD className="font-mono text-center font-semibold text-blue-600">{fHrs}h</TD>
                          <TD className="font-mono text-center">{se.helperQty || 0}</TD>
                          <TD className="font-mono text-center">{se.helperHours || 8}h</TD>
                          <TD className="font-mono text-center font-semibold text-purple-600">{hHrs}h</TD>
                          <TD className="font-mono font-bold text-emerald-600 text-right">{formatINR(se.totalAmount)}</TD>
                        </TR>
                      );
                    })}

                    {/* Excel Sheet Summary Rows */}
                    <TR className="bg-muted/40 font-bold border-t border-b">
                      <TD colSpan={3} className="text-right uppercase tracking-wider text-xs">Total Hours</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">{totFitterHrs} Hrs</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">{totHelperHrs} Hrs</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-muted/30 font-semibold border-b">
                      <TD colSpan={3} className="text-right text-xs">Total Days (Nos = Hrs / 8)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">{fitterDays} Nos</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">{helperDays} Nos</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-muted/30 font-semibold border-b">
                      <TD colSpan={3} className="text-right text-xs">Rate (₹)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">₹1,100 /day</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">₹800 /day</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-emerald-500/10 font-bold text-sm border-t-2 border-emerald-500/30">
                      <TD colSpan={3} className="text-right uppercase tracking-wider text-emerald-800 dark:text-emerald-300">TOTAL SUPPLY AMOUNT (₹)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">{formatINR(fitterAmt)}</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">{formatINR(helperAmt)}</TD>
                      <TD className="font-mono text-emerald-600 dark:text-emerald-400 text-right text-base font-black">{formatINR(totalSupplyWork)}</TD>
                    </TR>
                  </TBody>
                </Table>
              </div>
            );
          })()}
        </Card>
      )}

      {activeSheetTab === "balance" && (
        <div className="space-y-6">
          <BillHeaderBanner site={site} bill={bill} sheetTitle="Sheet 6: Client Ledger & Balance Sheet" />
          <SiteBalanceSheet site={site} hidePaymentForm={true} />
        </div>
      )}

    </div>
  );
}
