"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate, formatRefNo, formatInvoiceNo } from "@/lib/utils";
import { generateRunningBillAction } from "../bill-actions";
import { SiteBalanceSheet } from "./site-balance-sheet";
import { HistoricalBillViewer } from "../bills/[billId]/historical-bill-viewer";
import {
  Receipt,
  FileSpreadsheet,
  Printer,
  Plus,
  CheckCircle2,
  Building2,
  Users,
  DollarSign,
  Loader2,
  History,
  Lock,
  ArrowLeft,
} from "lucide-react";


function BillHeaderBanner({ site, latestBill, sheetTitle }: { site: any; latestBill: any; sheetTitle?: string }) {
  return (
    <div className="space-y-3 border-b pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-foreground">{sheetTitle || "RA Bill Document"}</h2>
          <p className="text-xs text-muted-foreground font-medium leading-tight mt-0.5">RCR ENTERPRISES / SSHIVAAY CONSTRUCTIONS</p>
        </div>
        <div className="text-left sm:text-right font-mono text-xs flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 px-2 py-0.5 font-bold">
            Invoice: {latestBill?.billNo || "Draft"}
          </Badge>
          <p className="text-muted-foreground text-[11px]">Date: {formatDate(latestBill?.billDate || new Date())}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 text-xs gap-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-950/20 p-3.5 rounded-lg border border-indigo-500/20 shadow-xs">
        <div className="space-y-1 pr-2">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Billed To / Client</span>
          <p className="font-bold text-sm text-foreground">{site.client?.name || "Client Name"}</p>
          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">Project: <span className="text-indigo-600 dark:text-indigo-400">{site.projectName}</span></p>
          {site.address && <p className="text-muted-foreground text-[11px] leading-tight">{site.address}</p>}
          {site.gstNo && <p className="font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400 pt-0.5">GSTIN: {site.gstNo}</p>}
        </div>
        <div className="space-y-1.5 md:border-l md:pl-3.5 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-muted-foreground">Invoice No:</span>
            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{latestBill?.billNo || "001"}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Work Order No:</span>
            <span className="font-semibold font-mono text-foreground">{site.workOrderNo || "—"}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Ref No:</span>
            <span className="font-semibold text-foreground">{latestBill?.refNo || "01"}</span>
          </div>
          {latestBill?.periodLabel && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Bill Period:</span>
              <span className="font-semibold text-foreground">{latestBill.periodLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RABillViewer({ site }: { site: any }) {
  const [selectedBillMode, setSelectedBillMode] = useState<string>("live");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const unbilledSupply = (site.supplyLabourEntries || []).filter((se: any) => !se.runningBillId);
  const previouslyBilledSupply = (site.supplyLabourEntries || []).filter((se: any) => se.runningBillId);
  
  const totalSupplyWork = unbilledSupply.reduce((sum: number, se: any) => sum + se.totalAmount, 0);
  const previousSupplyWork = previouslyBilledSupply.reduce((sum: number, se: any) => sum + se.totalAmount, 0);

  const previousTowerWork = site.buildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + ((item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : ((item.previousQty || 0) * item.rate)), 0);
  }, 0);

  const grossBillTotal = totalTowerWork + totalSupplyWork;
  const previousBillTotal = previousTowerWork + previousSupplyWork;
  const cumulativeBillTotal = previousBillTotal + grossBillTotal;

  const totalContractValue = site.buildings.reduce((sum: number, b: any) => sum + (b.approxArea || 0) * (b.contractRate || 0), 0);

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

  const selectedHistoricalBill = selectedBillMode !== "live" ? bills.find((b: any) => b.id === selectedBillMode) : null;

  return (
    <div className="space-y-6">
      {/* Bill History & Snapshot Mode Switcher Toolbar */}
      {bills.length > 0 && (
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold flex items-center gap-1.5 text-foreground pr-1">
              <History className="h-4 w-4 text-indigo-500" />
              Bill View:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={selectedBillMode === "live" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBillMode("live")}
                className={`h-8 text-xs font-semibold gap-1.5 ${
                  selectedBillMode === "live" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Current Work (Draft RA Bill)
              </Button>
              {bills.map((b: any) => (
                <Button
                  key={b.id}
                  variant={selectedBillMode === b.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBillMode(b.id)}
                  className={`h-8 text-xs font-medium gap-1.5 ${
                    selectedBillMode === b.id ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  Bill {b.billNo} ({formatDate(b.billDate)})
                </Button>
              ))}
            </div>
          </div>

          {selectedBillMode !== "live" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBillMode("live")}
              className="h-8 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Live Draft
            </Button>
          )}
        </div>
      )}

      {selectedHistoricalBill ? (
        <HistoricalBillViewer bill={{ ...selectedHistoricalBill, site }} />
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/40 p-4 rounded-xl border print:hidden">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-500" />
                Live RA Bill Generator & Full Multi-Sheet Package
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

              <Button onClick={() => setIsGenerating(!isGenerating)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" /> Generate New RA Bill
              </Button>
            </div>
          </div>

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                {successMessage}
              </div>
              <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700/50 hover:text-emerald-700 dark:hover:text-emerald-300">✕</button>
            </div>
          )}

      {isGenerating && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base font-bold text-emerald-600">Generate Official Running Account (RA) Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs font-bold flex items-center justify-between">
                <span>⚠️ {formError}</span>
                <button type="button" onClick={() => setFormError(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
            )}

            <form
              action={async (formData) => {
                setFormError(null);
                const inputBillNo = (formData.get("billNo") as string || "").trim();
                const pStartStr = formData.get("periodStart") as string;
                const pEndStr = formData.get("periodEnd") as string;

                // Frontend validation 1: Check duplicate billNo
                const existing = (site.bills || []).find((b: any) => b.billNo.trim().toLowerCase() === inputBillNo.toLowerCase());
                if (existing) {
                  setFormError(`Duplicate Bill Number! Bill "${inputBillNo}" already exists for this site. Please enter a unique Bill No.`);
                  return;
                }

                // Frontend validation 2: Date range start <= end
                if (pStartStr && pEndStr && new Date(pStartStr) > new Date(pEndStr)) {
                  setFormError("Invalid Period Date Range! Start Date cannot be after End Date.");
                  return;
                }

                // Frontend validation 3: Chronological Order Check
                const billDateInput = formData.get("billDate") as string;
                const sortedExistingBills = [...(site.bills || [])].sort(
                  (a: any, b: any) => new Date(b.billDate || b.createdAt).getTime() - new Date(a.billDate || a.createdAt).getTime()
                );
                const latestBill = sortedExistingBills[0];

                if (latestBill && billDateInput) {
                  const lastBillDate = new Date(latestBill.billDate || latestBill.createdAt);
                  const newBillDate = new Date(billDateInput);
                  if (newBillDate.setHours(0, 0, 0, 0) < lastBillDate.setHours(0, 0, 0, 0)) {
                    setFormError(
                      `Chronology Error! New bill date (${formatDate(newBillDate)}) cannot be earlier than the previous bill (${latestBill.billNo}) date (${formatDate(lastBillDate)}). Bills must be generated in chronological sequence.`
                    );
                    return;
                  }
                }

                // Frontend validation 4: Check for sequential stage execution (Item 2 cannot be billed if Item 1 has 0% progress)
                for (const b of site.buildings || []) {
                  const items = b.workItems || [];
                  for (let i = 0; i < items.length; i++) {
                    const curPct = items[i].currentPct ?? 0;
                    const curQty = items[i].currentQty ?? 0;
                    const prevPct = items[i].previousPct ?? 0;
                    const prevQty = items[i].previousQty ?? 0;
                    const cumPct = prevPct + curPct;
                    const cumQty = prevQty + curQty;

                    if (curPct > 0 || curQty > 0 || cumPct > 0 || cumQty > 0) {
                      for (let j = 0; j < i; j++) {
                        const priorPrev = items[j].previousPct ?? 0;
                        const priorCur = items[j].currentPct ?? 0;
                        const priorCum = priorPrev + priorCur;

                        const priorPrevQty = items[j].previousQty ?? 0;
                        const priorCurQty = items[j].currentQty ?? 0;
                        const priorCumQty = priorPrevQty + priorCurQty;

                        if (priorCum <= 0 && priorCumQty <= 0) {
                          setFormError(
                            `Sequence Error in "${b.name}"! Item #${i + 1} ("${items[i].name}") has progress (${curPct > 0 ? curPct + "%" : cumPct > 0 ? cumPct + "%" : curQty > 0 ? curQty + " Sft" : cumQty + " Sft"}), but earlier stage Item #${j + 1} ("${items[j].name}") has 0 completion! Work items must be executed in order.`
                          );
                          return;
                        }
                      }
                    }
                  }
                }

                setIsSubmitting(true);
                try {
                  const result = await generateRunningBillAction(site.id, formData);
                  if (result?.error) {
                    setFormError(result.error);
                  } else {
                    setIsGenerating(false);
                    setSuccessMessage("RA Bill generated successfully! You can view the complete snapshot in the Bill Viewer sidebar.");
                    setTimeout(() => setSuccessMessage(null), 5000);
                  }
                } catch (err: any) {
                  setFormError(err.message || "Failed to generate RA Bill. Please check input details.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {(() => {
                const nextBillCount = (site.bills || []).length + 1;
                const autoInvoiceNo = formatInvoiceNo(nextBillCount);
                const autoRefNo = formatRefNo(nextBillCount);

                return (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Invoice / Bill No. *</label>
                      <Input name="billNo" defaultValue={autoInvoiceNo} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Bill Date *</label>
                      <Input name="billDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Ref No.</label>
                      <Input name="refNo" defaultValue={autoRefNo} />
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-4 md:grid-cols-3 pt-2 border-t border-emerald-500/20">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Bill Period Start Date</label>
                  <Input name="periodStart" type="date" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Bill Period End Date</label>
                  <Input name="periodEnd" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Period Label</label>
                  <Input name="periodLabel" defaultValue={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} />
                </div>
              </div>

              <div className="flex items-end justify-end gap-2 pt-2 border-t border-emerald-500/20">
                <Button type="button" variant="ghost" onClick={() => { setIsGenerating(false); setFormError(null); }} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting ? "Generating..." : "Snapshot & Create Bill"}
                </Button>
              </div>
            </form>
            
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 border border-emerald-500/20">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">Generating Official RA Bill...</p>
                <p className="text-xs text-muted-foreground mt-1">Please wait while snapshots are created.</p>
              </div>
            )}
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
                    <TD>{prevA > 0 ? (prevA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono text-emerald-500 font-semibold">{currA > 0 ? (currA / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{(prevA + currA) > 0 ? ((prevA + currA) / (b.contractRate || 1)).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{formatINR(prevA)}</TD>
                    <TD className="font-mono text-emerald-500 font-bold">{formatINR(currA)}</TD>
                    <TD className="font-mono font-bold">{formatINR(prevA + currA)}</TD>
                  </TR>
                );
              })}

              {(totalSupplyWork > 0 || previousSupplyWork > 0) && (
                <TR>
                  <TD>{site.buildings.length + 1}</TD>
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
                <TD colSpan={8} className="text-right uppercase">Total Value of Work Done (Cumulative)</TD>
                <TD className="font-mono">{formatINR(previousBillTotal)}</TD>
                <TD className="font-mono text-emerald-500">{formatINR(grossBillTotal)}</TD>
                <TD className="font-mono">{formatINR(cumulativeBillTotal)}</TD>
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
              <TR className="bg-muted/30 font-bold text-xs border-t">
                <TD colSpan={8} className="text-right">GROSS CONTRACT AMOUNT</TD>
                <TD colSpan={3} className="text-right font-mono pr-4">{formatINR(totalContractValue)}</TD>
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
                    {(() => {
                      const isQty = b.calculationMethod === "QUANTITY";
                      return (
                        <TR>
                          <TH>#</TH>
                          <TH>Particulars of Item</TH>
                          <TH>Unit</TH>
                          <TH className="text-right">{isQty ? "Item Amount (₹) / Area" : "Item Amount (₹)"}</TH>
                          <TH className="text-center">Previous Qty ({isQty ? "Sft" : "%"})</TH>
                          <TH className="text-center">This Bill Qty ({isQty ? "Sft" : "%"})</TH>
                          <TH className="text-center">Cumulative Qty ({isQty ? "Sft" : "%"})</TH>
                          <TH className="text-right">Previous Amt (₹)</TH>
                          <TH className="text-right">This Bill Amt (₹)</TH>
                          <TH className="text-right">Cumulative Amt (₹)</TH>
                        </TR>
                      );
                    })()}
                  </THead>
                  <TBody>
                    {items.map((item: any, i: number) => {
                      const isQty = b.calculationMethod === "QUANTITY" || item.unit === "Sft";
                      const itemRate = item.rate || b.contractRate || 0;

                      const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (item.previousPct > 0 ? (item.partAmount * item.previousPct / 100) : item.previousQty * item.rate);
                      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (item.currentPct > 0 ? (item.partAmount * item.currentPct / 100) : item.currentQty * item.rate);
                      const cumA = item.cumulativeAmt ?? (prevA + currA);

                      let prevQ = item.previousPct > 0 ? item.previousPct : item.previousQty ?? 0;
                      if (isQty && prevQ === 0 && (prevA || 0) > 0 && itemRate > 0) {
                        prevQ = Math.round(prevA / itemRate);
                      }

                      let currQ = item.currentPct > 0 ? item.currentPct : item.currentQty ?? 0;
                      if (isQty && currQ === 0 && (currA || 0) > 0 && itemRate > 0) {
                        currQ = Math.round(currA / itemRate);
                      }

                      const cumQ = isQty ? (prevQ + currQ) : (item.cumulativePct > 0 ? item.cumulativePct : (prevQ + currQ));
                      return (
                        <TR key={item.id}>
                          <TD>{i + 1}</TD>
                          <TD className="font-medium">{item.name}</TD>
                          <TD>{item.unit || (isQty ? "Sft" : "%")}</TD>
                          <TD className="font-mono text-right font-semibold text-muted-foreground">{isQty && b.contractRate ? (item.partAmount / b.contractRate).toFixed(2) : formatINR(item.partAmount || (item.buWork && item.rate ? item.buWork * item.rate : item.rate || 0))}</TD>
                          <TD className="font-mono text-center">{isQty ? prevQ.toFixed(2) : prevQ + "%"}</TD>
                          <TD className="font-mono text-emerald-500 font-semibold text-center">{isQty ? currQ.toFixed(2) : currQ + "%"}</TD>
                          <TD className="font-mono text-center font-bold">{isQty ? cumQ.toFixed(2) : cumQ + "%"}</TD>
                          <TD className="font-mono text-right">{formatINR(prevA)}</TD>
                          <TD className="font-mono text-emerald-500 font-bold text-right">{formatINR(currA)}</TD>
                          <TD className="font-mono font-bold text-right">{formatINR(cumA)}</TD>
                        </TR>
                      );
                    })}

                    {/* Prominent TOTAL Row at the bottom of Tower Sheet */}
                    {(() => {
                      const isQty = b.calculationMethod === "QUANTITY";
                      return (
                        <TR className="bg-muted/80 font-bold border-t-2 text-xs">
                          <TD colSpan={4} className="text-right uppercase tracking-wider">TOTAL {b.name.toUpperCase()} AMOUNT</TD>
                          <TD className="text-center font-mono">{isQty ? totPrevQ.toFixed(2) + " Sft" : totPrevQ + "%"}</TD>
                          <TD className="text-center font-mono text-emerald-500">{isQty ? totCurrQ.toFixed(2) + " Sft" : totCurrQ + "%"}</TD>
                          <TD className="text-center font-mono font-bold">{isQty ? totCumQ.toFixed(2) + " Sft" : totCumQ + "%"}</TD>
                          <TD className="text-right font-mono">{formatINR(totPrevA)}</TD>
                          <TD className="text-right font-mono text-emerald-500 font-black text-sm">{formatINR(totCurrA)}</TD>
                          <TD className="text-right font-mono font-black text-sm">{formatINR(totCumA)}</TD>
                        </TR>
                      );
                    })()}
                    <TR className="bg-muted/30 font-bold text-xs border-t">
                      <TD colSpan={7} className="text-right">GROSS CONTRACT AMOUNT FOR {b.name.toUpperCase()}</TD>
                      <TD colSpan={3} className="text-right font-mono pr-4">{formatINR(totalVal)}</TD>
                    </TR>
                    <TR className="bg-red-500/10 text-red-700 font-bold text-xs">
                      <TD colSpan={7} className="text-right">BALANCE AMOUNT TO BE BILLED FOR {b.name.toUpperCase()}</TD>
                      <TD colSpan={3} className="text-right font-mono pr-4">{formatINR(totalVal - totCumA)}</TD>
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

          {(() => {
            const entries = site.supplyLabourEntries || [];
            let totFitterHrs = 0;
            let totForemanHrs = 0;
            let totHelperHrs = 0;

            entries.forEach((se: any) => {
              totFitterHrs += (se.fitterQty || 0) * (se.fitterHours || 8);
              totForemanHrs += (se.fitterForemanQty || 0) * (se.fitterForemanHours || 8);
              totHelperHrs += (se.helperQty || 0) * (se.helperHours || 8);
            });

            const fitterDays = Math.round((totFitterHrs / 8) * 100) / 100;
            const foremanDays = Math.round((totForemanHrs / 8) * 100) / 100;
            const helperDays = Math.round((totHelperHrs / 8) * 100) / 100;
            const fitterAmt = fitterDays * 1100;
            const foremanAmt = foremanDays * 1500;
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
                      <TH className="py-2.5 font-bold text-center text-orange-600">Foreman Count</TH>
                      <TH className="py-2.5 font-bold text-center text-orange-600">Hours</TH>
                      <TH className="py-2.5 font-bold text-center text-orange-600">Total Foreman Hrs</TH>
                      <TH className="py-2.5 font-bold text-center">Fitter Helper</TH>
                      <TH className="py-2.5 font-bold text-center">Hours</TH>
                      <TH className="py-2.5 font-bold text-center">Total Helper Hrs</TH>
                      <TH className="py-2.5 font-bold text-right">Amount (₹)</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {entries.map((se: any) => {
                      const fHrs = (se.fitterQty || 0) * (se.fitterHours || 8);
                      const fmHrs = (se.fitterForemanQty || 0) * (se.fitterForemanHours || 8);
                      const hHrs = (se.helperQty || 0) * (se.helperHours || 8);

                      return (
                        <TR key={se.id}>
                          <TD className="font-mono text-xs whitespace-nowrap">{formatDate(se.date)}</TD>
                          <TD className="font-mono text-xs font-semibold">{se.challanNo || "—"}</TD>
                          <TD className="font-medium break-all whitespace-pre-wrap">{se.description}</TD>
                          <TD className="font-mono text-center">{se.fitterQty || 0}</TD>
                          <TD className="font-mono text-center">{se.fitterHours || 8}h</TD>
                          <TD className="font-mono text-center font-semibold text-blue-600">{fHrs}h</TD>
                          <TD className="font-mono text-center text-orange-600 bg-orange-50/50">{se.fitterForemanQty || 0}</TD>
                          <TD className="font-mono text-center text-orange-600 bg-orange-50/50">{se.fitterForemanHours || 8}h</TD>
                          <TD className="font-mono text-center font-semibold text-orange-600 bg-orange-50/50">{fmHrs}h</TD>
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
                      <TD className="text-center font-mono text-orange-600 font-bold">{totForemanHrs} Hrs</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">{totHelperHrs} Hrs</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-muted/30 font-semibold border-b">
                      <TD colSpan={3} className="text-right text-xs">Total Days (Nos = Hrs / 8)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">{fitterDays} Nos</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-orange-600 font-bold">{foremanDays} Nos</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">{helperDays} Nos</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-muted/30 font-semibold border-b">
                      <TD colSpan={3} className="text-right text-xs">Rate (₹)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">₹1,100 /day</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-orange-600 font-bold">₹1,500 /day</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-purple-600 font-bold">₹800 /day</TD>
                      <TD></TD>
                    </TR>
                    <TR className="bg-emerald-500/10 font-bold text-sm border-t-2 border-emerald-500/30">
                      <TD colSpan={3} className="text-right uppercase tracking-wider text-emerald-800 dark:text-emerald-300">TOTAL SUPPLY AMOUNT (₹)</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-blue-600 font-bold">{formatINR(fitterAmt)}</TD>
                      <TD colSpan={2}></TD>
                      <TD className="text-center font-mono text-orange-600 font-bold">{formatINR(foremanAmt)}</TD>
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
          <BillHeaderBanner site={site} latestBill={latestBill} sheetTitle="Sheet 6: Client Ledger & Balance Sheet" />
          <SiteBalanceSheet site={site} hidePaymentForm={true} />
        </div>
      )}
        </>
      )}
    </div>
  );
}
