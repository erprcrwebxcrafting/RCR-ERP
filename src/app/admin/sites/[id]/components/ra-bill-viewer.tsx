"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { generateRunningBillAction } from "../bill-actions";
import { Receipt, FileSpreadsheet, Printer, Plus, CheckCircle2, Building2, Users, DollarSign } from "lucide-react";

export function RABillViewer({ site }: { site: any }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<"sheet1" | "sheet2" | "towers" | "supply" | "balance">("sheet1");
  const [selectedTowerId, setSelectedTowerId] = useState<string>(site.buildings[0]?.id || "");

  const bills = site.bills || [];
  const latestBill = bills[0] || null;

  // Calculate live site totals
  const totalTowerWork = site.buildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + (item.currentQty * item.rate), 0);
  }, 0);

  const totalSupplyWork = (site.supplyLabourEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);
  const grossBillTotal = totalTowerWork + totalSupplyWork;

  const cgst = grossBillTotal * 0.09;
  const sgst = grossBillTotal * 0.09;
  const retention = grossBillTotal * 0.02;
  const tds = grossBillTotal * 0.01;
  const netPayable = grossBillTotal + cgst + sgst - retention - tds;

  const handleDownloadExcel = () => {
    window.open(`/api/sites/${site.id}/export-excel`, "_blank");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/40 p-4 rounded-xl border">
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

          <Button onClick={handlePrintPDF} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print / Export PDF Package
          </Button>

          <Button onClick={() => setIsGenerating(!isGenerating)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Generate New RA Bill
          </Button>
        </div>
      </div>

      {/* Generate Bill Form */}
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
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ref No.</label>
                <Input name="refNo" defaultValue="01" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Period Label</label>
                <Input name="periodLabel" defaultValue={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Retention %</label>
                <Input name="retentionPct" type="number" step="0.5" defaultValue="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">CGST %</label>
                <Input name="cgstPct" type="number" step="0.5" defaultValue="9" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">SGST %</label>
                <Input name="sgstPct" type="number" step="0.5" defaultValue="9" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">TDS %</label>
                <Input name="tdsPct" type="number" step="0.5" defaultValue="1" />
              </div>
              <div className="flex items-end justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsGenerating(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Snapshot & Create Bill</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Multi-Sheet Viewer Sub-Tabs */}
      <div className="border-b flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeSheetTab === "sheet1" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSheetTab("sheet1")}
        >
          Sheet 1: Tax Invoice
        </Button>
        <Button
          variant={activeSheetTab === "sheet2" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSheetTab("sheet2")}
        >
          Sheet 2: Abstract Summary
        </Button>
        <Button
          variant={activeSheetTab === "towers" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSheetTab("towers")}
        >
          Tower Work Sheets ({site.buildings?.length || 0})
        </Button>
        <Button
          variant={activeSheetTab === "supply" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSheetTab("supply")}
        >
          Supply Sheet
        </Button>
        <Button
          variant={activeSheetTab === "balance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSheetTab("balance")}
        >
          Balance Sheet
        </Button>
      </div>

      {/* TAB CONTENT: SHEET 1 (TAX INVOICE) */}
      {activeSheetTab === "sheet1" && (
        <Card className="max-w-4xl mx-auto shadow-md border p-6 bg-background space-y-6">
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-black tracking-wider uppercase text-foreground">TAX INVOICE</h1>
            <p className="text-xs text-muted-foreground mt-1">RCR ENTERPRISES / SSHIVAAY CONSTRUCTIONS</p>
          </div>

          <div className="grid grid-cols-2 text-sm gap-4 border-b pb-4">
            <div>
              <p className="font-semibold text-muted-foreground">To,</p>
              <p className="font-bold text-base">{site.client?.name || "Client Name"}</p>
              <p className="text-xs text-muted-foreground">{site.address || "Client Address"}</p>
              {site.gstNo && <p className="text-xs font-mono mt-1">GST No: {site.gstNo}</p>}
            </div>
            <div className="text-right">
              <p><span className="font-semibold text-muted-foreground">Invoice No:</span> <span className="font-bold">{latestBill?.billNo || "007/2026-27"}</span></p>
              <p><span className="font-semibold text-muted-foreground">Date:</span> {formatDate(latestBill?.billDate || new Date())}</p>
              <p><span className="font-semibold text-muted-foreground">Ref No:</span> {latestBill?.refNo || "01"}</p>
              <p className="text-xs text-muted-foreground mt-1">W.O. No: {site.workOrderNo || "PARKSITE/SSHIVAAY/2026-27"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Name of Work: <span className="font-normal">Reinforcement & Concrete Construction Work</span></p>
            <p className="text-sm font-semibold">Project Name: <span className="font-normal">{site.projectName}</span></p>
          </div>

          {/* Invoice Summary Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <THead className="bg-muted/60">
                <TR>
                  <TH className="w-16">Sr. No.</TH>
                  <TH>Description</TH>
                  <TH className="text-right">Amount (₹)</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TD>1</TD>
                  <TD className="font-medium">{site.projectName} Construction Work Done</TD>
                  <TD className="text-right font-mono font-semibold">{formatINR(grossBillTotal)}</TD>
                </TR>
                <TR className="border-t bg-muted/20 font-semibold">
                  <TD></TD>
                  <TD>Taxable Amount</TD>
                  <TD className="text-right font-mono">{formatINR(grossBillTotal)}</TD>
                </TR>
                <TR>
                  <TD></TD>
                  <TD className="text-xs text-muted-foreground">Add CGST @ 9%</TD>
                  <TD className="text-right font-mono text-xs">{formatINR(cgst)}</TD>
                </TR>
                <TR>
                  <TD></TD>
                  <TD className="text-xs text-muted-foreground">Add SGST @ 9%</TD>
                  <TD className="text-right font-mono text-xs">{formatINR(sgst)}</TD>
                </TR>
                <TR className="border-t-2 bg-emerald-500/10 font-bold text-base">
                  <TD></TD>
                  <TD>Net Payable Amount</TD>
                  <TD className="text-right font-mono text-emerald-500">{formatINR(grossBillTotal + cgst + sgst)}</TD>
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
        <Card className="p-4 overflow-x-auto">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Sheet 2: Consolidated Bill Abstract</CardTitle>
          </CardHeader>
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
              {/* Render tower totals */}
              {site.buildings.map((b: any, idx: number) => {
                const prevA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.previousQty || 0) * i.rate), 0);
                const currA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.currentQty || 0) * i.rate), 0);

                return (
                  <TR key={b.id}>
                    <TD>{idx + 1}</TD>
                    <TD className="font-bold">{b.name} Reinforcement Work Done.</TD>
                    <TD>Sft.</TD>
                    <TD>314,554</TD>
                    <TD>₹53</TD>
                    <TD>0</TD>
                    <TD className="font-mono text-emerald-500 font-semibold">{currA > 0 ? (currA / 53).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{currA > 0 ? (currA / 53).toFixed(0) : 0}</TD>
                    <TD className="font-mono">{formatINR(prevA)}</TD>
                    <TD className="font-mono text-emerald-500 font-bold">{formatINR(currA)}</TD>
                    <TD className="font-mono font-bold">{formatINR(prevA + currA)}</TD>
                  </TR>
                );
              })}

              {/* Supply Labours */}
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

              {/* Summary Calculations */}
              <TR className="bg-muted/80 font-bold border-t-2">
                <TD colSpan={8} className="text-right">TOTAL AMOUNT</TD>
                <TD className="font-mono">₹0.00</TD>
                <TD className="font-mono text-emerald-500">{formatINR(grossBillTotal)}</TD>
                <TD className="font-mono">{formatINR(grossBillTotal)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs">ADD CGST @ 9%</TD>
                <TD></TD>
                <TD className="font-mono text-xs">{formatINR(cgst)}</TD>
                <TD className="font-mono text-xs">{formatINR(cgst)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs">ADD SGST @ 9%</TD>
                <TD></TD>
                <TD className="font-mono text-xs">{formatINR(sgst)}</TD>
                <TD className="font-mono text-xs">{formatINR(sgst)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs text-orange-500">LESS RETENTION @ 2%</TD>
                <TD></TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(retention)}</TD>
                <TD className="font-mono text-xs text-orange-500">-{formatINR(retention)}</TD>
              </TR>
              <TR>
                <TD colSpan={8} className="text-right text-xs text-orange-500">LESS TDS @ 1%</TD>
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
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            {site.buildings.map((b: any) => (
              <Button
                key={b.id}
                variant={b.id === selectedTowerId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTowerId(b.id)}
              >
                {b.name}
              </Button>
            ))}
          </div>

          {(() => {
            const b = site.buildings.find((x: any) => x.id === selectedTowerId) || site.buildings[0];
            if (!b) return <div>No tower selected</div>;

            return (
              <Table className="border">
                <THead className="bg-muted/60">
                  <TR>
                    <TH>#</TH>
                    <TH>Particulars of Item</TH>
                    <TH>Unit</TH>
                    <TH>Previous Qty</TH>
                    <TH>This Bill Qty</TH>
                    <TH>Cumulative Qty</TH>
                    <TH>Previous Amt</TH>
                    <TH>This Bill Amt</TH>
                    <TH>Cumulative Amt</TH>
                  </TR>
                </THead>
                <TBody>
                  {(b.workItems || []).map((item: any, i: number) => {
                    const prevQ = item.previousQty || 0;
                    const currQ = item.currentQty || 0;
                    const prevA = prevQ * item.rate;
                    const currA = currQ * item.rate;

                    return (
                      <TR key={item.id}>
                        <TD>{i + 1}</TD>
                        <TD className="font-medium">{item.name}</TD>
                        <TD>{item.unit}</TD>
                        <TD className="font-mono">{prevQ}</TD>
                        <TD className="font-mono text-emerald-500 font-semibold">{currQ}</TD>
                        <TD className="font-mono">{prevQ + currQ}</TD>
                        <TD className="font-mono">{formatINR(prevA)}</TD>
                        <TD className="font-mono text-emerald-500 font-bold">{formatINR(currA)}</TD>
                        <TD className="font-mono font-bold">{formatINR(prevA + currA)}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            );
          })()}
        </Card>
      )}

      {/* TAB CONTENT: SUPPLY SHEET */}
      {activeSheetTab === "supply" && (
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Sheet 5: Extra Labour Supply Log</CardTitle>
          </CardHeader>
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
                <TH>Total Amount (₹)</TH>
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
                  <TD className="font-mono font-bold text-emerald-500">{formatINR(se.totalAmount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* TAB CONTENT: BALANCE SHEET */}
      {activeSheetTab === "balance" && (
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Sheet 6: Site Payment & Balance Sheet</CardTitle>
          </CardHeader>
          <Table className="border">
            <THead className="bg-muted/60">
              <TR>
                <TH>#</TH>
                <TH>Date</TH>
                <TH>Payment Mode</TH>
                <TH>Account Credited</TH>
                <TH>Remarks</TH>
                <TH>Amount Received (₹)</TH>
              </TR>
            </THead>
            <TBody>
              {(site.payments || []).map((p: any, i: number) => (
                <TR key={p.id}>
                  <TD>{i + 1}</TD>
                  <TD className="font-mono text-xs">{formatDate(p.date)}</TD>
                  <TD><Badge variant="outline">{p.mode}</Badge></TD>
                  <TD className="font-mono text-xs">{p.accountCredited || "—"}</TD>
                  <TD className="font-medium">{p.remarks || "Client Payment"}</TD>
                  <TD className="font-mono font-bold text-emerald-500">{formatINR(p.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
