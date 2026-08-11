"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { generateRunningBillAction } from "../bill-actions";
import { SiteBalanceSheet } from "./site-balance-sheet";
import { Receipt, FileSpreadsheet, Printer, Plus, CheckCircle2, Building2, Users, DollarSign } from "lucide-react";


function BillHeaderBanner({ site, latestBill, sheetTitle }: { site: any; latestBill: any; sheetTitle?: string }) {
  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider">{sheetTitle || "RA Bill Document"}</h2>
          <p className="text-xs text-muted-foreground">RCR ENTERPRISES / SSHIVAAY CONSTRUCTIONS</p>
        </div>
        <div className="text-right font-mono text-xs">
          <p><span className="text-muted-foreground">Invoice No:</span> <span className="font-bold">{latestBill?.billNo || "007/2026-27"}</span></p>
          <p><span className="text-muted-foreground">Date:</span> {formatDate(latestBill?.billDate || new Date())}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 text-xs gap-4 bg-muted/20 p-4 rounded-lg">
        <div className="space-y-1">
          <p className="font-semibold text-muted-foreground">To,</p>
          <p className="font-bold text-sm text-foreground">{site.client?.name || "Client Name"}</p>
          <p className="text-muted-foreground">{site.address || "Client Office Address"}</p>
          {site.gstNo && <p className="font-mono text-[11px] pt-1">GST No: {site.gstNo}</p>}
        </div>
        <div className="text-right space-y-1">
          <p><span className="font-semibold text-muted-foreground">Ref No:</span> <span className="font-semibold">{latestBill?.refNo || "01"}</span></p>
          <p><span className="font-semibold text-muted-foreground">W.O. No:</span> <span className="font-mono text-xs">{site.workOrderNo || "PARKSITE/SSHIVAAY/2026-27"}</span></p>
        </div>
        <div className="col-span-2 pt-2 border-t flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
          <p>Name of Work: <span className="font-normal text-muted-foreground">Reinforcement & Concrete Construction Work</span></p>
          <p>Name of Project: <span className="font-bold text-indigo-500">{site.projectName}</span></p>
        </div>
      </div>
    </div>
  );
}

export function RABillViewer({ site }: { site: any }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<"sheet1" | "sheet2" | "towers" | "supply" | "balance">("sheet1");
  const [selectedTowerId, setSelectedTowerId] = useState<string>(site.buildings[0]?.id || "");

  const bills = site.bills || [];
  const latestBill = bills[0] || null;

  const [taxPcts, setTaxPcts] = useState({
    cgstPct: site.cgstPct ?? 9,
    sgstPct: site.sgstPct ?? 9,
    retentionPct: site.retentionPct ?? 2,
    tdsPct: site.tdsPct ?? 1,
  });

  useEffect(() => {
    setTaxPcts({
      cgstPct: site.cgstPct ?? 9,
      sgstPct: site.sgstPct ?? 9,
      retentionPct: site.retentionPct ?? 2,
      tdsPct: site.tdsPct ?? 1,
    });
  }, [site.retentionPct, site.cgstPct, site.sgstPct, site.tdsPct]);


  const totalTowerWork = site.buildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + ((item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : ((item.currentQty || 0) * item.rate)), 0);
  }, 0);

  const totalSupplyWork = (site.supplyLabourEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);
  const grossBillTotal = totalTowerWork + totalSupplyWork;

  const cgst = grossBillTotal * (taxPcts.cgstPct / 100);
  const sgst = grossBillTotal * (taxPcts.sgstPct / 100);
  const retention = grossBillTotal * (taxPcts.retentionPct / 100);
  const tds = grossBillTotal * (taxPcts.tdsPct / 100);
  const netPayable = grossBillTotal + cgst + sgst - retention - tds;

  const handleDownloadExcel = () => {
    window.open(`/api/sites/${site.id}/export-excel`, "_blank");
  };

  const handleDownloadPdfPackage = () => {
    window.open(`/api/sites/${site.id}/export-pdf`, "_blank");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/40 p-4 rounded-xl border print:hidden">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-500" />
            RA Bill Generator & Full Multi-Sheet Package
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consolidates Sheet 1 (Tax Invoice), Sheet 2 (Abstract), Tower Sheets, Supply Sheet & Balance Sheet into one bill bundle.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleDownloadExcel} variant="outline" className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10">
            <FileSpreadsheet className="h-4 w-4" /> Download Complete Excel (.xlsx)
          </Button>

          <Button onClick={handleDownloadPdfPackage} variant="outline" className="gap-2 border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10">
            <Printer className="h-4 w-4" /> Download Official PDF Package (.pdf)
          </Button>

          <Button onClick={handlePrintPDF} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Quick Print
          </Button>


          <Button onClick={() => setIsGenerating(!isGenerating)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Generate New RA Bill
          </Button>
        </div>
      </div>

      {isGenerating && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base font-bold text-emerald-600">Generate Official Running Account (RA) Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                await generateRunningBillAction(site.id, formData);
                setIsGenerating(false);
              }}
              className="grid gap-4 md:grid-cols-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Invoice / Bill No. *</label>
                <Input name="billNo" defaultValue={`007/${new Date().getFullYear()}-${(new Date().getFullYear()+1).toString().slice(2)}`} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Bill Date *</label>
                <Input name="billDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ref No.</label>
                <Input name="refNo" defaultValue="01" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Period Label</label>
                <Input name="periodLabel" defaultValue={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Retention %</label>
                <Input name="retentionPct" type="number" step="0.5" value={taxPcts.retentionPct} onChange={(e) => setTaxPcts(p => ({ ...p, retentionPct: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">CGST %</label>
                <Input name="cgstPct" type="number" step="0.5" value={taxPcts.cgstPct} onChange={(e) => setTaxPcts(p => ({ ...p, cgstPct: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">SGST %</label>
                <Input name="sgstPct" type="number" step="0.5" value={taxPcts.sgstPct} onChange={(e) => setTaxPcts(p => ({ ...p, sgstPct: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">TDS %</label>
                <Input name="tdsPct" type="number" step="0.5" value={taxPcts.tdsPct} onChange={(e) => setTaxPcts(p => ({ ...p, tdsPct: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-end justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsGenerating(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Snapshot & Create Bill</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="border-b flex items-center gap-2 overflow-x-auto pb-2">
        <Button variant={activeSheetTab === "sheet1" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("sheet1")}>Sheet 1: Tax Invoice</Button>
        <Button variant={activeSheetTab === "sheet2" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("sheet2")}>Sheet 2: Abstract Summary</Button>
        <Button variant={activeSheetTab === "towers" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("towers")}>Tower Work Sheets ({site.buildings?.length || 0})</Button>
        <Button variant={activeSheetTab === "supply" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("supply")}>Supply Sheet</Button>
        <Button variant={activeSheetTab === "balance" ? "default" : "ghost"} size="sm" onClick={() => setActiveSheetTab("balance")}>Balance Sheet</Button>
      </div>

      {/* TAB CONTENT: SHEET 1 (TAX INVOICE) */}
      {activeSheetTab === "sheet1" && (
        <Card className="max-w-4xl mx-auto shadow-md border p-6 bg-background space-y-6">
          <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle="TAX INVOICE" />

          {/* Invoice Itemized Work Description Table */}
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
                {/* Itemize each tower's work done amount */}
                {site.buildings.map((b: any, idx: number) => {
                  const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
                    return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * i.rate));
                  }, 0);

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

                {/* Itemize Extra Supply Labour if present */}
                {totalSupplyWork > 0 && (
                  <TR>
                    <TD>{site.buildings.length + 1}</TD>
                    <TD className="font-medium">
                      <span className="font-bold text-indigo-500">Departmental Extra Labour Supply</span> (Fitters & Helpers Log Billed)
                    </TD>
                    <TD className="text-right font-mono font-semibold text-indigo-500">{formatINR(totalSupplyWork)}</TD>
                  </TR>
                )}

                {/* Subtotal / Taxable Amount */}
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

          {/* Bank Details & Authorized Signatory */}
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
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between flex-wrap gap-3 border-b pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Sheet 2: Consolidated Bill Abstract</CardTitle>
            </div>
            <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border text-xs flex-wrap">
              <span className="font-bold text-muted-foreground uppercase tracking-wider">Live Tax & Deductions Edit:</span>
              <label className="flex items-center gap-1 font-semibold">
                CGST %:
                <Input type="number" step="0.5" value={taxPcts.cgstPct} onChange={(e) => setTaxPcts((p) => ({ ...p, cgstPct: parseFloat(e.target.value) || 0 }))} className="w-16 h-7 text-xs font-mono bg-background" />
              </label>
              <label className="flex items-center gap-1 font-semibold">
                SGST %:
                <Input type="number" step="0.5" value={taxPcts.sgstPct} onChange={(e) => setTaxPcts((p) => ({ ...p, sgstPct: parseFloat(e.target.value) || 0 }))} className="w-16 h-7 text-xs font-mono bg-background" />
              </label>
              <label className="flex items-center gap-1 font-semibold text-orange-600">
                Retention %:
                <Input type="number" step="0.5" value={taxPcts.retentionPct} onChange={(e) => setTaxPcts((p) => ({ ...p, retentionPct: parseFloat(e.target.value) || 0 }))} className="w-16 h-7 text-xs font-mono bg-background text-orange-600 border-orange-300" />
              </label>
              <label className="flex items-center gap-1 font-semibold text-orange-600">
                TDS %:
                <Input type="number" step="0.5" value={taxPcts.tdsPct} onChange={(e) => setTaxPcts((p) => ({ ...p, tdsPct: parseFloat(e.target.value) || 0 }))} className="w-16 h-7 text-xs font-mono bg-background text-orange-600 border-orange-300" />
              </label>
            </div>
          </CardHeader>

          <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle="Sheet 2: Consolidated Abstract Summary" />

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
              {site.buildings.map((b: any, idx: number) => {
                const prevA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.previousAmt !== undefined && i.previousAmt !== null) ? i.previousAmt : ((i.previousQty || 0) * i.rate)), 0);
                const currA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * i.rate)), 0);
                return (
                  <TR key={b.id}>
                    <TD>{idx + 1}</TD>
                    <TD className="font-bold">{b.name} Reinforcement Work Done.</TD>
                    <TD>Sft.</TD>
                    <TD>{(b.approxArea || 0).toLocaleString()}</TD>
                    <TD>₹{b.contractRate || 0}</TD>
                    <TD>0</TD>
                    <TD className="font-mono text-emerald-500 font-semibold">{currA > 0 ? (currA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{currA > 0 ? (currA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{formatINR(prevA)}</TD>
                    <TD className="font-mono text-emerald-500 font-bold">{formatINR(currA)}</TD>
                    <TD className="font-mono font-bold">{formatINR(prevA + currA)}</TD>
                  </TR>
                );
              })}

              {totalSupplyWork > 0 && (
                <TR>
                  <TD>{site.buildings.length + 1}</TD>
                  <TD className="font-bold">Extra Labour Supply Billed</TD>
                  <TD>Nos/Hrs</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD>0</TD>
                  <TD>1</TD>
                  <TD>1</TD>
                  <TD>₹0.00</TD>
                  <TD className="font-mono text-emerald-500 font-bold">{formatINR(totalSupplyWork)}</TD>
                  <TD className="font-mono font-bold">{formatINR(totalSupplyWork)}</TD>
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
            {site.buildings.map((b: any) => (
              <Button key={b.id} variant={b.id === selectedTowerId ? "default" : "outline"} size="sm" onClick={() => setSelectedTowerId(b.id)}>
                {b.name}
              </Button>
            ))}
          </div>

          {(() => {
            const b = site.buildings.find((x: any) => x.id === selectedTowerId) || site.buildings[0];
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
              const prevQ = item.previousPct ?? item.previousQty ?? 0;
              const currQ = item.currentPct ?? item.currentQty ?? 0;
              const cumQ = item.cumulativePct ?? (prevQ + currQ);
              const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (prevQ > 0 ? (item.partAmount * prevQ / 100) : 0);
              const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (currQ > 0 ? (item.partAmount * currQ / 100) : 0);
              const cumA = item.cumulativeAmt ?? (prevA + currA);

              totPrevQ += prevQ;
              totCurrQ += currQ;
              totCumQ += cumQ;
              totPrevA += prevA;
              totCurrA += currA;
              totCumA += cumA;
            });

            return (
              <div className="space-y-6">
                <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle={`BUA Building Sheet - ${b.name}`} />

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
                    {items.map((item: any, i: number) => {
                      const prevQ = item.previousPct ?? item.previousQty ?? 0;
                      const currQ = item.currentPct ?? item.currentQty ?? 0;
                      const cumQ = item.cumulativePct ?? (prevQ + currQ);
                      const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (prevQ > 0 ? (item.partAmount * prevQ / 100) : 0);
                      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (currQ > 0 ? (item.partAmount * currQ / 100) : 0);
                      const cumA = item.cumulativeAmt ?? (prevA + currA);
                      return (
                        <TR key={item.id}>
                          <TD>{i + 1}</TD>
                          <TD className="font-medium">{item.name}</TD>
                          <TD>{item.unit || "%"}</TD>
                          <TD className="font-mono text-center">{prevQ}%</TD>
                          <TD className="font-mono text-emerald-500 font-semibold text-center">{currQ}%</TD>
                          <TD className="font-mono text-center font-bold">{cumQ}%</TD>
                          <TD className="font-mono text-right">{formatINR(prevA)}</TD>
                          <TD className="font-mono text-emerald-500 font-bold text-right">{formatINR(currA)}</TD>
                          <TD className="font-mono font-bold text-right">{formatINR(cumA)}</TD>
                        </TR>
                      );
                    })}

                    {/* Prominent TOTAL Row at the bottom of Tower Sheet */}
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
          <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle="Sheet 5: Client Extra Supply Labour Log" />

          <Table className="border">
            <THead className="bg-muted/60">
              <TR>
                <TH>Date</TH>
                <TH>Challan No.</TH>
                <TH>Work Description</TH>
                <TH>Fitter Count</TH>
                <TH>Fitter Hours</TH>
                <TH>Helper Count</TH>
                <TH>Helper Hours</TH>
                <TH className="text-right">Total Amount (₹)</TH>
              </TR>
            </THead>
            <TBody>
              {(site.supplyLabourEntries || []).map((se: any) => (
                <TR key={se.id}>
                  <TD className="font-mono text-xs">{formatDate(se.date)}</TD>
                  <TD className="font-mono text-xs font-semibold">{se.challanNo || "—"}</TD>
                  <TD className="font-medium">{se.description}</TD>
                  <TD className="font-mono text-xs">{se.fitterQty}</TD>
                  <TD className="font-mono text-xs">{se.fitterHours}</TD>
                  <TD className="font-mono text-xs">{se.helperQty}</TD>
                  <TD className="font-mono text-xs">{se.helperHours}</TD>
                  <TD className="font-mono font-bold text-emerald-500 text-right">{formatINR(se.totalAmount)}</TD>
                </TR>
              ))}

              <TR className="bg-emerald-500/10 font-bold text-base border-t-2">
                <TD colSpan={7} className="text-right uppercase tracking-wider text-xs">Total Extra Supply Amount</TD>
                <TD className="font-mono text-emerald-500 text-right font-black">{formatINR(totalSupplyWork)}</TD>
              </TR>
            </TBody>
          </Table>
        </Card>
      )}

      {activeSheetTab === "balance" && (
        <div className="space-y-6">
          <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle="Sheet 6: Client Ledger & Balance Sheet" />
          <SiteBalanceSheet site={site} />
        </div>
      )}

    </div>
  );
}
