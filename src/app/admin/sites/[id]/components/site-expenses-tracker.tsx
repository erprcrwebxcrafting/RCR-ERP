"use client";

import { useState, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import { recordSiteExpenseAction, deleteSiteExpenseAction } from "../expense-actions";
import { Banknote, Plus, Printer, Download, TrendingUp, Trash2, CircleDollarSign, Users, HardHat, FileCheck } from "lucide-react";
import { toast } from "sonner";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export function SiteExpensesTracker({ site }: { site: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 1. Revenue Calculations (RA Bills)
  const bills = site.bills || [];
  let totalRevenue = 0;
  const billSummaries = bills.map((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const retPct = b.retentionPct ?? site.retentionPct ?? 2;
    const tdsPct = b.tdsPct ?? site.tdsPct ?? 1;
    const cgstPct = b.cgstPct ?? site.cgstPct ?? 9;
    const sgstPct = b.sgstPct ?? site.sgstPct ?? 9;

    const retAmt = gross * (retPct / 100);
    const netAmt = gross - retAmt;
    const tdsAmt = gross * (tdsPct / 100);
    const gstAmt = gross * ((cgstPct + sgstPct) / 100);

    const finalBillAmount = netAmt + gstAmt; // Actual receivable value
    totalRevenue += netAmt; // Or you could use finalBillAmount, but typically Net Amt is revenue

    return {
      id: b.id,
      billNo: b.billNo,
      date: b.createdAt,
      grossAmount: gross,
      netAmount: netAmt,
      totalTax: gstAmt + tdsAmt,
    };
  });

  // 2. Manual Expenses
  const manualExpenses = site.expenses || [];
  const manualExpensesTotal = manualExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  // 3. Labour Payments
  let labourPaymentsTotal = 0;
  const allLabourPayments: any[] = [];
  (site.labourCategories || []).forEach((cat: any) => {
    (cat.labours || []).forEach((labour: any) => {
      (labour.payments || []).forEach((payment: any) => {
        labourPaymentsTotal += payment.amount;
        allLabourPayments.push({
          ...payment,
          labourName: labour.name,
          categoryName: cat.name
        });
      });
    });
  });
  allLabourPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 4. Supply Labour Costs
  const supplyEntries = site.supplyLabourEntries || [];
  const supplyLabourTotal = supplyEntries.reduce((sum: number, entry: any) => sum + (entry.totalAmount || 0), 0);

  // Totals
  const totalExpenses = manualExpensesTotal + labourPaymentsTotal + supplyLabourTotal;
  const netProfit = totalRevenue - totalExpenses;

  const handlePrintPDF = async () => {
    toast.loading("Generating High-Quality PDF...", { id: "pdf-toast" });
    try {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
      
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      // @ts-ignore
      pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5], color: '#333333' },
          tableHeader: { bold: true, fontSize: 11, color: 'white', fillColor: '#4f46e5', alignment: 'left' },
          tableHeaderRight: { bold: true, fontSize: 11, color: 'white', fillColor: '#4f46e5', alignment: 'right' },
          tableCell: { margin: [0, 5, 0, 5], fontSize: 10 },
          tableCellRight: { margin: [0, 5, 0, 5], fontSize: 10, alignment: 'right' },
          totalRow: { bold: true, fontSize: 11, margin: [0, 5, 0, 5] },
          totalRowRight: { bold: true, fontSize: 11, margin: [0, 5, 0, 5], alignment: 'right' }
        },
        content: [
          { text: `Financial Ledger - ${site.projectName}`, style: 'header' },
          { text: `Generated on: ${formatDate(new Date())}`, fontSize: 10, color: 'gray', margin: [0, 0, 0, 20] },
          
          { text: 'Financial Summary', style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Metric', style: 'tableHeader' }, 
                  { text: 'Amount (Rs)', style: 'tableHeaderRight' }
                ],
                [
                  { text: 'Total Revenue (RA Bills Net)', style: 'tableCell' }, 
                  { text: formatINR(totalRevenue), style: 'tableCellRight' }
                ],
                [
                  { text: 'Total Deductions & Expenses', style: 'tableCell' }, 
                  { text: formatINR(totalExpenses), style: 'tableCellRight' }
                ],
                [
                  { text: 'Net Savings / Profit', style: 'totalRow', color: netProfit >= 0 ? '#059669' : '#e11d48' }, 
                  { text: formatINR(netProfit), style: 'totalRowRight', color: netProfit >= 0 ? '#059669' : '#e11d48' }
                ]
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ]
      };

      // Add RA Bills
      if (billSummaries.length > 0) {
        docDefinition.content.push({ text: 'RA Bills Revenue', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              [
                { text: 'Date', style: 'tableHeader', fillColor: '#10b981' }, 
                { text: 'Bill No.', style: 'tableHeader', fillColor: '#10b981' }, 
                { text: 'Gross Amount', style: 'tableHeaderRight', fillColor: '#10b981' }, 
                { text: 'Net Amount', style: 'tableHeaderRight', fillColor: '#10b981' }
              ],
              ...billSummaries.map((b: any) => [
                { text: formatDate(b.date), style: 'tableCell' },
                { text: b.billNo, style: 'tableCell' },
                { text: formatINR(b.grossAmount), style: 'tableCellRight' },
                { text: formatINR(b.netAmount), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL REVENUE', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(totalRevenue), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add Labour Payments
      if (allLabourPayments.length > 0) {
        docDefinition.content.push({ text: 'Internal Labour Payments', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto'],
            body: [
              [
                { text: 'Date', style: 'tableHeader', fillColor: '#6366f1' }, 
                { text: 'Labour Name', style: 'tableHeader', fillColor: '#6366f1' }, 
                { text: 'Category', style: 'tableHeader', fillColor: '#6366f1' }, 
                { text: 'Amount Paid', style: 'tableHeaderRight', fillColor: '#6366f1' }
              ],
              ...allLabourPayments.map((p: any) => [
                { text: formatDate(p.date), style: 'tableCell' },
                { text: p.labourName, style: 'tableCell' },
                { text: p.categoryName, style: 'tableCell' },
                { text: formatINR(p.amount), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL LABOUR PAYMENTS', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(labourPaymentsTotal), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add Supply Labours
      if (supplyEntries.length > 0) {
        docDefinition.content.push({ text: 'Extra Supply Labours', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto'],
            body: [
              [
                { text: 'Date', style: 'tableHeader', fillColor: '#f97316' }, 
                { text: 'Description', style: 'tableHeader', fillColor: '#f97316' }, 
                { text: 'Total Cost', style: 'tableHeaderRight', fillColor: '#f97316' }
              ],
              ...supplyEntries.map((s: any) => [
                { text: formatDate(s.date), style: 'tableCell' },
                { text: s.description, style: 'tableCell' },
                { text: formatINR(s.totalAmount), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL SUPPLY LABOUR', style: 'totalRow', colSpan: 2 }, {},
                { text: formatINR(supplyLabourTotal), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add Manual Expenses
      if (manualExpenses.length > 0) {
        docDefinition.content.push({ text: 'Manual & Petty Expenses', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto'],
            body: [
              [
                { text: 'Date', style: 'tableHeader', fillColor: '#e11d48' }, 
                { text: 'Paid To', style: 'tableHeader', fillColor: '#e11d48' }, 
                { text: 'Purpose / Reason', style: 'tableHeader', fillColor: '#e11d48' }, 
                { text: 'Amount', style: 'tableHeaderRight', fillColor: '#e11d48' }
              ],
              ...manualExpenses.map((e: any) => [
                { text: formatDate(e.date), style: 'tableCell' },
                { text: e.paidTo, style: 'tableCell' },
                { text: e.description, style: 'tableCell' },
                { text: formatINR(e.amount), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL MANUAL EXPENSES', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(manualExpensesTotal), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // @ts-ignore
      pdfMake.createPdf(docDefinition).download(`${site.projectName}_Ledger_Report.pdf`);
      toast.success("PDF Downloaded successfully!", { id: "pdf-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.", { id: "pdf-toast" });
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RCR ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Ledger Report");
    
    // Set general column widths
    sheet.getColumn("A").width = 20; // Date / Metric
    sheet.getColumn("B").width = 30; // Detail / Name
    sheet.getColumn("C").width = 35; // Purpose / Category
    sheet.getColumn("D").width = 25; // Amount

    const addSectionTitle = (title: string) => {
      const row = sheet.addRow([title]);
      row.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
      sheet.mergeCells(`A${row.number}:D${row.number}`);
    };

    const addHeaderRow = (headers: string[]) => {
      const row = sheet.addRow(headers);
      row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    };

    // 1. SUMMARY
    addSectionTitle("FINANCIAL SUMMARY");
    addHeaderRow(["Metric", "", "", "Amount (Rs)"]);
    sheet.addRow(["Total Revenue (RA Bills Net)", "", "", totalRevenue]);
    sheet.addRow(["Total Deductions & Expenses", "", "", totalExpenses]);
    const netRow = sheet.addRow(["Net Savings / Profit", "", "", netProfit]);
    netRow.font = { bold: true, color: { argb: netProfit >= 0 ? "FF059669" : "FFE11D48" } };
    sheet.addRow([]);
    sheet.addRow([]);

    // 2. RA BILLS
    addSectionTitle("RA BILLS GENERATED");
    addHeaderRow(["Date", "Bill No", "Gross Amount", "Net Amount"]);
    if (billSummaries.length === 0) sheet.addRow(["No RA Bills found", "", "", ""]);
    billSummaries.forEach((b: any) => sheet.addRow([formatDate(b.date), b.billNo, b.grossAmount, b.netAmount]));
    sheet.addRow(["TOTAL REVENUE", "", "", totalRevenue]).font = { bold: true };
    sheet.addRow([]);
    sheet.addRow([]);

    // 3. LABOUR PAYMENTS
    addSectionTitle("LABOUR PAYMENTS");
    addHeaderRow(["Date", "Labour Name", "Category", "Amount Paid"]);
    if (allLabourPayments.length === 0) sheet.addRow(["No Labour Payments found", "", "", ""]);
    allLabourPayments.forEach((p: any) => sheet.addRow([formatDate(p.date), p.labourName, p.categoryName, p.amount]));
    sheet.addRow(["TOTAL LABOUR PAYMENTS", "", "", labourPaymentsTotal]).font = { bold: true };
    sheet.addRow([]);
    sheet.addRow([]);

    // 4. SUPPLY LABOURS
    addSectionTitle("EXTRA SUPPLY LABOURS");
    addHeaderRow(["Date", "Description", "", "Total Cost"]);
    if (supplyEntries.length === 0) sheet.addRow(["No Supply Labours found", "", "", ""]);
    supplyEntries.forEach((s: any) => sheet.addRow([formatDate(s.date), s.description, "", s.totalAmount]));
    sheet.addRow(["TOTAL SUPPLY LABOUR", "", "", supplyLabourTotal]).font = { bold: true };
    sheet.addRow([]);
    sheet.addRow([]);

    // 5. MANUAL EXPENSES
    addSectionTitle("MANUAL & PETTY EXPENSES");
    addHeaderRow(["Date", "Paid To", "Purpose / Reason", "Amount"]);
    if (manualExpenses.length === 0) sheet.addRow(["No Manual Expenses found", "", "", ""]);
    manualExpenses.forEach((e: any) => sheet.addRow([formatDate(e.date), e.paidTo, e.description, e.amount]));
    sheet.addRow(["TOTAL MANUAL EXPENSES", "", "", manualExpensesTotal]).font = { bold: true };

    // Format Amount column (D) and Gross Amount (C in RA Bills)
    sheet.getColumn("D").numFmt = '"₹"#,##0.00';
    
    // Download the file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${site.projectName}_Ledger_Report.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end print:hidden gap-2">
        <Button onClick={handleExportExcel} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto">
          <Download className="h-4 w-4" /> Download Excel
        </Button>
        <Button onClick={handlePrintPDF} variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto">
          <Printer className="h-4 w-4" /> Print Full Ledger
        </Button>
      </div>

      {/* Wrapping the content for PDF generation */}
      <div id="pdf-content" className="p-4 bg-white dark:bg-slate-950 rounded-lg">
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-3xl font-bold">{site.projectName} - Financial Ledger</h1>
          <p className="text-muted-foreground mt-2">Generated on {formatDate(new Date())}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-emerald-500/10 border-emerald-500/30 print:border print:bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Revenue (Net Bills)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {billSummaries.length} RA Bills</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/10 border-rose-500/30 print:border print:bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Deductions & Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-500 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatINR(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Labours + Supply + Manual</p>
          </CardContent>
        </Card>

        <Card className={netProfit >= 0 ? "bg-blue-500/10 border-blue-500/30 print:border print:bg-transparent" : "bg-orange-500/10 border-orange-500/30 print:border print:bg-transparent"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Savings / Profit</CardTitle>
            <CircleDollarSign className={`h-4 w-4 ${netProfit >= 0 ? "text-blue-500" : "text-orange-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
              {formatINR(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Revenue - Expenses)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start print:block print:space-y-6 max-w-full">
        
        {/* REVENUE SECTION */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-500" />
              RA Bills Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap">Bill No.</TH>
                    <TH className="whitespace-nowrap">Date</TH>
                    <TH className="text-right whitespace-nowrap">Net Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {billSummaries.length === 0 ? (
                    <TR><TD colSpan={3} className="text-center text-muted-foreground py-4">No RA Bills generated.</TD></TR>
                  ) : (
                    billSummaries.map((b: any) => (
                      <TR key={b.id}>
                        <TD className="font-medium whitespace-nowrap">{b.billNo}</TD>
                        <TD className="text-muted-foreground whitespace-nowrap">{formatDate(b.date)}</TD>
                        <TD className="text-right font-bold text-emerald-600 whitespace-nowrap">{formatINR(b.netAmount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* INTERNAL LABOUR PAYMENTS */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Internal Labour Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto print:max-h-none print:overflow-visible">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap">Date</TH>
                    <TH className="whitespace-nowrap">Labour Name</TH>
                    <TH className="text-right whitespace-nowrap">Amount Paid</TH>
                  </TR>
                </THead>
                <TBody>
                  {allLabourPayments.length === 0 ? (
                    <TR><TD colSpan={3} className="text-center text-muted-foreground py-4">No payments recorded.</TD></TR>
                  ) : (
                    allLabourPayments.map((p: any) => (
                      <TR key={p.id}>
                        <TD className="text-muted-foreground whitespace-nowrap">{formatDate(p.date)}</TD>
                        <TD className="font-medium whitespace-nowrap">{p.labourName}</TD>
                        <TD className="text-right font-bold text-rose-600 whitespace-nowrap">{formatINR(p.amount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {labourPaymentsTotal > 0 && (
              <div className="mt-4 pt-3 border-t text-right font-bold text-lg text-rose-600">
                Total: {formatINR(labourPaymentsTotal)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SUPPLY LABOURS */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <HardHat className="h-5 w-5 text-orange-500" />
              Extra Supply Labours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto print:max-h-none print:overflow-visible">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap">Date</TH>
                    <TH className="whitespace-nowrap">Description</TH>
                    <TH className="text-right whitespace-nowrap">Total Cost</TH>
                  </TR>
                </THead>
                <TBody>
                  {supplyEntries.length === 0 ? (
                    <TR><TD colSpan={3} className="text-center text-muted-foreground py-4">No supply entries.</TD></TR>
                  ) : (
                    supplyEntries.map((s: any) => (
                      <TR key={s.id}>
                        <TD className="text-muted-foreground whitespace-nowrap">{formatDate(s.date)}</TD>
                        <TD className="font-medium break-all min-w-[150px] max-w-[250px]">{s.description}</TD>
                        <TD className="text-right font-bold text-rose-600 whitespace-nowrap">{formatINR(s.totalAmount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {supplyLabourTotal > 0 && (
              <div className="mt-4 pt-3 border-t text-right font-bold text-lg text-rose-600">
                Total: {formatINR(supplyLabourTotal)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MANUAL EXPENSES */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-rose-500 shrink-0" />
              <span>Manual & Petty Expenses</span>
            </CardTitle>
            <Button onClick={() => setIsRecording(!isRecording)} size="sm" className="gap-1 bg-rose-600 hover:bg-rose-700 print:hidden shrink-0 w-full sm:w-auto">
              <Plus className="h-4 w-4 shrink-0" /> Add Expense
            </Button>
          </CardHeader>
          <CardContent>
            {isRecording && (
              <form
                className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg space-y-4 border mb-4 print:hidden animate-in fade-in"
                action={(formData) => {
                  startTransition(async () => {
                    try {
                      await recordSiteExpenseAction(site.id, formData);
                      toast.success("Expense recorded successfully!");
                      setIsRecording(false);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to record expense");
                    }
                  });
                }}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Date *</label>
                    <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (₹) *</label>
                    <IndianNumberInput name="amount" placeholder="e.g. 5,000" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Paid To (Kisko diya) *</label>
                    <Input name="paidTo" placeholder="e.g. Ram Transport, Supplier" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Purpose / Item (Kyu diya) *</label>
                    <Input name="description" placeholder="e.g. Cement, Transport, Tea" required />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsRecording(false)}>Cancel</Button>
                  <Button type="submit" disabled={isPending} className="bg-rose-600 hover:bg-rose-700">
                    {isPending ? "Saving..." : "Save Expense"}
                  </Button>
                </div>
              </form>
            )}

            <div className="max-h-[300px] overflow-auto print:max-h-none print:overflow-visible">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap">Date</TH>
                    <TH className="whitespace-nowrap">Details</TH>
                    <TH className="text-right whitespace-nowrap">Amount</TH>
                    <TH className="w-10 print:hidden whitespace-nowrap"></TH>
                  </TR>
                </THead>
                <TBody>
                  {manualExpenses.length === 0 ? (
                    <TR><TD colSpan={4} className="text-center text-muted-foreground py-4">No manual expenses.</TD></TR>
                  ) : (
                    manualExpenses.map((e: any) => (
                      <TR key={e.id}>
                        <TD className="text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</TD>
                        <TD className="min-w-[150px] max-w-[250px]">
                          <div className="font-medium break-words">{e.paidTo}</div>
                          <div className="text-xs text-muted-foreground break-words">{e.description}</div>
                        </TD>
                        <TD className="text-right font-bold text-rose-600 whitespace-nowrap">{formatINR(e.amount)}</TD>
                        <TD className="text-right print:hidden">
                          <form action={deleteSiteExpenseAction.bind(null, site.id, e.id)}>
                            <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </form>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {manualExpensesTotal > 0 && (
              <div className="mt-4 pt-3 border-t text-right font-bold text-lg text-rose-600">
                Total: {formatINR(manualExpensesTotal)}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      </div>
    </div>
  );
}
