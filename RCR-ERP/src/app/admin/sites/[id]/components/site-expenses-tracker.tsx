"use client";

import { useState, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import { recordSiteExpenseAction, deleteSiteExpenseAction } from "../expense-actions";
import {
  Banknote,
  Plus,
  Printer,
  Download,
  TrendingUp,
  Trash2,
  CircleDollarSign,
  Users,
  HardHat,
  FileCheck,
  Percent,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Helper to determine if a Labour was active at targetSiteId on a given date
function isLabourAtSiteOnDate(labour: any, targetSiteId: string, pDate: Date, siteAttendances: any[]): boolean {
  // 1. Direct Attendance on target site on that date
  const py = pDate.getFullYear();
  const pm = pDate.getMonth();
  const pd = pDate.getDate();
  const hasAttOnSite = (siteAttendances || []).some((a: any) => {
    const aId = a.labourId || a.labour?.id;
    if (aId !== labour.id) return false;
    const ad = new Date(a.date);
    return ad.getFullYear() === py && ad.getMonth() === pm && ad.getDate() === pd;
  });
  if (hasAttOnSite) return true;

  // 2. Transfer history timeline
  const transfers = [...(labour.transferHistory || [])].sort(
    (a: any, b: any) => new Date(a.transferDate).getTime() - new Date(b.transferDate).getTime()
  );

  if (transfers.length === 0) {
    return (labour.siteId === targetSiteId) || (!labour.siteId && labour.categoryName !== undefined);
  }

  const pTime = pDate.getTime();
  const firstTransferTime = new Date(transfers[0].transferDate).getTime();
  if (pTime < firstTransferTime) {
    if (transfers[0].fromSiteId) return transfers[0].fromSiteId === targetSiteId;
    return (labour.siteId === targetSiteId) || (!labour.siteId && labour.categoryName !== undefined);
  }
  let activeSiteId = transfers[0].toSiteId;
  for (const t of transfers) {
    if (new Date(t.transferDate).getTime() <= pTime) {
      activeSiteId = t.toSiteId;
    } else {
      break;
    }
  }
  return activeSiteId === targetSiteId;
}

// Helper to determine if a Supervisor was active at targetSiteId on a given date
function isSupervisorAtSiteOnDate(supervisor: any, targetSiteId: string, pDate: Date, isCurrentlyAssigned: boolean): boolean {
  const transfers = [...(supervisor.supervisorTransfers || [])].sort(
    (a: any, b: any) => new Date(a.transferDate).getTime() - new Date(b.transferDate).getTime()
  );

  if (transfers.length === 0) {
    return isCurrentlyAssigned;
  }

  const pTime = pDate.getTime();
  const firstTransferTime = new Date(transfers[0].transferDate).getTime();
  if (pTime < firstTransferTime) {
    if (transfers[0].fromSiteId) return transfers[0].fromSiteId === targetSiteId;
    return isCurrentlyAssigned;
  }
  let activeSiteId = transfers[0].toSiteId;
  for (const t of transfers) {
    if (new Date(t.transferDate).getTime() <= pTime) {
      activeSiteId = t.toSiteId;
    } else {
      break;
    }
  }
  return activeSiteId === targetSiteId;
}

interface ManpowerWorker {
  id: string;
  name: string;
  type: "LABOUR" | "SUPERVISOR";
  roleName: string;
  rate: number;
  totalHajari: number;
  earnedAmount: number;
  advancePaid: number;
  paymentsCount: number;
  netBalance: number;
  datesWorked: string[];
  wagesByDate: Record<string, number>;
  paymentDetails: string[];
}

function formatDateToInput(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getEarliestSiteDate(site: any): Date {
  let earliest: Date | null = null;

  if (site.startDate) earliest = new Date(site.startDate);

  (site.attendances || []).forEach((a: any) => {
    if (a.date && (a.hajari || 0) > 0) {
      const d = new Date(a.date);
      if (!earliest || d < earliest) earliest = d;
    }
  });

  (site.bills || []).forEach((b: any) => {
    const d = new Date(b.billDate || b.createdAt);
    if (!earliest || d < earliest) earliest = d;
  });

  (site.expenses || []).forEach((e: any) => {
    if (e.date) {
      const d = new Date(e.date);
      if (!earliest || d < earliest) earliest = d;
    }
  });

  (site.supplyLabourEntries || []).forEach((s: any) => {
    if (s.date) {
      const d = new Date(s.date);
      if (!earliest || d < earliest) earliest = d;
    }
  });

  (site.labourCategories || []).forEach((c: any) => {
    (c.labours || []).forEach((l: any) => {
      (l.payments || []).forEach((p: any) => {
        if (p.date) {
          const d = new Date(p.date);
          if (!earliest || d < earliest) earliest = d;
        }
      });
    });
  });

  if (!earliest && site.createdAt) {
    earliest = new Date(site.createdAt);
  }

  return earliest || new Date();
}

function getLatestSiteDate(site: any): Date {
  let latest = new Date();

  (site.attendances || []).forEach((a: any) => {
    if (a.date) {
      const d = new Date(a.date);
      if (d > latest) latest = d;
    }
  });

  (site.bills || []).forEach((b: any) => {
    const d = new Date(b.billDate || b.createdAt);
    if (d > latest) latest = d;
  });

  (site.expenses || []).forEach((e: any) => {
    if (e.date) {
      const d = new Date(e.date);
      if (d > latest) latest = d;
    }
  });

  return latest;
}

export function SiteExpensesTracker({ site }: { site: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Date Filter State - defaults to all-time active work range on this site
  const defaultStartDate = getEarliestSiteDate(site);
  const defaultEndDate = getLatestSiteDate(site);
  
  const [startDateStr, setStartDateStr] = useState(formatDateToInput(defaultStartDate));
  const [endDateStr, setEndDateStr] = useState(formatDateToInput(defaultEndDate));
  
  // Safe local date boundaries (prevents UTC offset dropping early/late day records)
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);

  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
  const endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

  // 1. Revenue Calculations (RA Bills)
  const bills = (site.bills || []).filter((b: any) => {
    const bDate = new Date(b.billDate || b.createdAt);
    return bDate >= startDate && bDate <= endDate;
  });
  let totalRevenue = 0;
  let totalGstExpense = 0;

  const billSummaries = bills.map((b: any) => {
    let grossAmount = 0;
    (b.lines || []).forEach((line: any) => {
      grossAmount += (line.currentAmount || 0);
    });
    const cgst = grossAmount * ((b.cgstPct || 9) / 100);
    const sgst = grossAmount * ((b.sgstPct || 9) / 100);
    const gstTotal = cgst + sgst;
    const invoiceAmount = grossAmount + gstTotal;
    
    totalRevenue += invoiceAmount;
    totalGstExpense += gstTotal;

    return {
      id: b.id,
      billNo: b.billNo,
      date: b.billDate || b.createdAt,
      grossAmount,
      gstAmount: gstTotal,
      invoiceAmount,
    };
  });

  // 2. Manual Expenses
  const manualExpenses = (site.expenses || []).filter((e: any) => new Date(e.date) >= startDate && new Date(e.date) <= endDate);
  const manualExpensesTotal = manualExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  // Generate Date Columns for the grid
  const dateColumns: string[] = [];
  let d = new Date(startDate);
  while (d <= endDate) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateColumns.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }

  // 3. Manpower Calculations (Labours & Supervisors)
  const manpowerMap = new Map<string, ManpowerWorker>();

  // Collect all unique labours
  const allLabourEntities = new Map<string, any>();
  (site.labourCategories || []).forEach((cat: any) => {
    (cat.labours || []).forEach((l: any) => {
      allLabourEntities.set(l.id, { ...l, categoryName: cat.name });
    });
  });
  (site.attendances || []).forEach((a: any) => {
    if (a.labour && !allLabourEntities.has(a.labour.id)) {
      allLabourEntities.set(a.labour.id, {
        ...a.labour,
        categoryName: a.labour.labourCategory?.name || "General"
      });
    }
  });

  // Labour Attendances (strictly on this site)
  (site.attendances || []).forEach((a: any) => {
    const aDate = new Date(a.date);
    if (aDate >= startDate && aDate <= endDate && (a.hajari || 0) > 0) {
      const labourId = a.labourId || a.labour?.id;
      const labourEntity = allLabourEntities.get(labourId);
      const labourName = a.labour?.name || labourEntity?.name || "Labour";
      const categoryName = a.labour?.labourCategory?.name || labourEntity?.categoryName || "General";
      const rate = a.hajariRate || a.labour?.dailyWage || labourEntity?.dailyWage || a.labour?.labourCategory?.dailyWage || labourEntity?.labourCategory?.dailyWage || 0;
      const dayWages = (a.hajari || 0) * rate;

      const py = aDate.getFullYear();
      const pm = String(aDate.getMonth() + 1).padStart(2, '0');
      const pd = String(aDate.getDate()).padStart(2, '0');
      const dateStr = `${py}-${pm}-${pd}`;

      if (!manpowerMap.has(labourId)) {
        manpowerMap.set(labourId, {
          id: labourId,
          name: labourName,
          type: "LABOUR",
          roleName: categoryName,
          rate,
          totalHajari: 0,
          earnedAmount: 0,
          advancePaid: 0,
          paymentsCount: 0,
          netBalance: 0,
          datesWorked: [],
          wagesByDate: {},
          paymentDetails: []
        });
      }

      const worker = manpowerMap.get(labourId)!;
      worker.totalHajari += (a.hajari || 0);
      worker.earnedAmount += dayWages;
      worker.wagesByDate[dateStr] = (worker.wagesByDate[dateStr] || 0) + dayWages;
      const formattedD = formatDate(a.date);
      if (!worker.datesWorked.includes(formattedD)) {
        worker.datesWorked.push(formattedD);
      }
    }
  });

  // Labour Advances & Payments (checked against site timeline)
  allLabourEntities.forEach((labour) => {
    (labour.payments || []).forEach((p: any) => {
      const pDate = new Date(p.date);
      if (pDate >= startDate && pDate <= endDate) {
        if (isLabourAtSiteOnDate(labour, site.id, pDate, site.attendances || [])) {
          if (!manpowerMap.has(labour.id)) {
            manpowerMap.set(labour.id, {
              id: labour.id,
              name: labour.name || "Labour",
              type: "LABOUR",
              roleName: labour.categoryName || "General",
              rate: labour.dailyWage || labour.labourCategory?.dailyWage || 0,
              totalHajari: 0,
              earnedAmount: 0,
              advancePaid: 0,
              paymentsCount: 0,
              netBalance: 0,
              datesWorked: [],
              wagesByDate: {},
              paymentDetails: []
            });
          }
          const worker = manpowerMap.get(labour.id)!;
          worker.advancePaid += p.amount;
          worker.paymentsCount++;
          worker.paymentDetails.push(`${formatDate(p.date).split(' ')[0]} (₹${p.amount})`);
        }
      }
    });
  });

  // Supervisors (Assigned + Transferred)
  const allSupervisorsMap = new Map<string, { supervisor: any; isCurrentlyAssigned: boolean }>();
  (site.supervisors || []).forEach((s: any) => {
    if (s.supervisor) allSupervisorsMap.set(s.supervisor.id, { supervisor: s.supervisor, isCurrentlyAssigned: true });
  });
  (site.supervisorTransfersFrom || []).forEach((st: any) => {
    if (st.supervisor && !allSupervisorsMap.has(st.supervisor.id)) {
      allSupervisorsMap.set(st.supervisor.id, { supervisor: st.supervisor, isCurrentlyAssigned: false });
    }
  });
  (site.supervisorTransfersTo || []).forEach((st: any) => {
    if (st.supervisor && !allSupervisorsMap.has(st.supervisor.id)) {
      allSupervisorsMap.set(st.supervisor.id, { supervisor: st.supervisor, isCurrentlyAssigned: false });
    }
  });

  allSupervisorsMap.forEach(({ supervisor, isCurrentlyAssigned }, supId) => {
    // 1. Attendance earned on this site
    (supervisor.supervisorAttendances || []).forEach((sa: any) => {
      const saDate = new Date(sa.date);
      if (saDate >= startDate && saDate <= endDate) {
        if (isSupervisorAtSiteOnDate(supervisor, site.id, saDate, isCurrentlyAssigned)) {
          const isPresent = sa.status === "PRESENT";
          const isHalfDay = sa.status === "HALF_DAY";
          if (isPresent || isHalfDay) {
            const hajari = isPresent ? 1 : 0.5;
            const dailyRate = sa.dailyRate || (supervisor.monthlySalary ? Math.round(supervisor.monthlySalary / 30) : 0);
            const earned = sa.earnedAmount !== undefined && sa.earnedAmount !== null ? sa.earnedAmount : (dailyRate * hajari);

            const py = saDate.getFullYear();
            const pm = String(saDate.getMonth() + 1).padStart(2, '0');
            const pd = String(saDate.getDate()).padStart(2, '0');
            const dateStr = `${py}-${pm}-${pd}`;

            if (!manpowerMap.has(supId)) {
              manpowerMap.set(supId, {
                id: supId,
                name: supervisor.name || "Supervisor",
                type: "SUPERVISOR",
                roleName: "Supervisor",
                rate: dailyRate,
                totalHajari: 0,
                earnedAmount: 0,
                advancePaid: 0,
                paymentsCount: 0,
                netBalance: 0,
                datesWorked: [],
                wagesByDate: {},
                paymentDetails: []
              });
            }

            const worker = manpowerMap.get(supId)!;
            worker.totalHajari += hajari;
            worker.earnedAmount += earned;
            worker.wagesByDate[dateStr] = (worker.wagesByDate[dateStr] || 0) + earned;
            const formattedD = formatDate(sa.date);
            if (!worker.datesWorked.includes(formattedD)) {
              worker.datesWorked.push(formattedD);
            }
          }
        }
      }
    });

    // 2. Supervisor payments on this site
    (supervisor.supervisorPayments || []).forEach((p: any) => {
      const pDate = new Date(p.date);
      if (pDate >= startDate && pDate <= endDate) {
        if (isSupervisorAtSiteOnDate(supervisor, site.id, pDate, isCurrentlyAssigned)) {
          if (!manpowerMap.has(supId)) {
            const dailyRate = supervisor.monthlySalary ? Math.round(supervisor.monthlySalary / 30) : 0;
            manpowerMap.set(supId, {
              id: supId,
              name: supervisor.name || "Supervisor",
              type: "SUPERVISOR",
              roleName: "Supervisor",
              rate: dailyRate,
              totalHajari: 0,
              earnedAmount: 0,
              advancePaid: 0,
              paymentsCount: 0,
              netBalance: 0,
              datesWorked: [],
              wagesByDate: {},
              paymentDetails: []
            });
          }
          const worker = manpowerMap.get(supId)!;
          worker.advancePaid += p.amount;
          worker.paymentsCount++;
          worker.paymentDetails.push(`${formatDate(p.date).split(' ')[0]} (₹${p.amount})`);
        }
      }
    });
  });

  // Calculate Net Balances and Totals
  let totalManpowerEarned = 0;
  let totalAdvancesPaid = 0;

  manpowerMap.forEach((w) => {
    w.netBalance = w.earnedAmount - w.advancePaid;
    totalManpowerEarned += w.earnedAmount;
    totalAdvancesPaid += w.advancePaid;
  });

  const totalNetDue = totalManpowerEarned - totalAdvancesPaid;

  const allWorkers = Array.from(manpowerMap.values());
  // Card 1 list: Active working with earned wages > 0
  const earnedWorkersList = allWorkers.filter(w => w.earnedAmount > 0).sort((a, b) => b.earnedAmount - a.earnedAmount);
  // Card 2 list: Workers with advances paid OR earned wages
  const advancesWorkersList = allWorkers.filter(w => w.advancePaid > 0 || w.earnedAmount > 0).sort((a, b) => b.advancePaid - a.advancePaid || b.earnedAmount - a.earnedAmount);

  // Totals: Site Manpower Wages + Manual Expenses + GST
  const siteExpensesTotal = manualExpensesTotal + totalManpowerEarned;
  const totalExpenses = siteExpensesTotal + totalGstExpense;
  const netProfit = totalRevenue - totalExpenses;

  const dateRangeStr = (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear())
    ? startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : `${startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} to ${endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

  const handlePrintPDF = async () => {
    toast.info("Generating PDF report...", { id: "pdf-toast" });
    try {
      // Dynamic imports for pdfmake
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      
      const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
      const vfs = (pdfFontsModule as any).pdfMake?.vfs 
        || (pdfFontsModule as any).default?.pdfMake?.vfs 
        || (pdfFontsModule as any).default 
        || pdfFontsModule;

      if (pdfMake.addVirtualFileSystem) {
        pdfMake.addVirtualFileSystem(vfs);
      }
      (pdfMake as any).vfs = vfs;

      const safeProjectName = (site.projectName || "Site").trim();
      const sanitizedFilename = safeProjectName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [30, 30, 30, 30],
        styles: {
          header: { fontSize: 16, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
          subheader: { fontSize: 12, bold: true, color: '#334155', margin: [0, 10, 0, 5] },
          metaText: { fontSize: 9, color: '#64748b', margin: [0, 0, 0, 10] },
          tableHeader: { fontSize: 8, bold: true, color: '#ffffff', fillColor: '#4f46e5', alignment: 'left' },
          tableHeaderRight: { fontSize: 8, bold: true, color: '#ffffff', fillColor: '#4f46e5', alignment: 'right' },
          tableCell: { fontSize: 8, color: '#1e293b' },
          tableCellRight: { fontSize: 8, color: '#1e293b', alignment: 'right' },
          totalRow: { fontSize: 9, bold: true, color: '#0f172a', fillColor: '#f1f5f9' },
          totalRowRight: { fontSize: 9, bold: true, color: '#0f172a', fillColor: '#f1f5f9', alignment: 'right' }
        },
        content: [
          { text: safeProjectName.toUpperCase(), style: 'header' },
          { text: `SITE EXPENSES & FINANCIAL LEDGER (${dateRangeStr.toUpperCase()})`, style: 'subheader' },
          { text: `Generated on: ${formatDate(new Date())} | Filter: ${dateRangeStr}`, style: 'metaText' },
          
          // Summary KPI Table
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Total Revenue (RA Bills)', style: 'tableHeader' },
                  { text: 'Total Site Cost (True Exp)', style: 'tableHeader' },
                  { text: 'GST Outflow (18% Govt)', style: 'tableHeader' },
                  { text: 'Net Savings / Profit', style: 'tableHeaderRight' }
                ],
                [
                  { text: formatINR(totalRevenue || 0), style: 'tableCell', bold: true, color: '#059669' },
                  { text: formatINR(siteExpensesTotal || 0), style: 'tableCell', bold: true, color: '#e11d48' },
                  { text: formatINR(totalGstExpense || 0), style: 'tableCell', bold: true, color: '#9333ea' },
                  { text: formatINR(netProfit || 0), style: 'tableCellRight', bold: true, color: netProfit >= 0 ? '#059669' : '#e11d48' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 15]
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
                { text: 'Bill No.', style: 'tableHeader' }, 
                { text: 'Date', style: 'tableHeader' }, 
                { text: 'Gross Amount', style: 'tableHeaderRight' }, 
                { text: 'Invoice Amt (Inc. GST)', style: 'tableHeaderRight' }
              ],
              ...billSummaries.map((b: any) => [
                { text: b.billNo || '-', style: 'tableCell' },
                { text: formatDate(b.date || new Date()), style: 'tableCell' },
                { text: formatINR(b.grossAmount || 0), style: 'tableCellRight' },
                { text: formatINR(b.invoiceAmount || 0), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL REVENUE', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(totalRevenue || 0), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add Manpower Wages (Attendance Based)
      if (earnedWorkersList.length > 0) {
        docDefinition.content.push({ text: 'Card 1: Site Manpower Cost (Attendance Wages Earned)', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Worker Name', style: 'tableHeader', fillColor: '#6366f1' }, 
                { text: 'Type / Role', style: 'tableHeader', fillColor: '#6366f1' }, 
                { text: 'Rate/Day', style: 'tableHeaderRight', fillColor: '#6366f1' }, 
                { text: 'Total Hajari', style: 'tableHeader', fillColor: '#6366f1', alignment: 'center' },
                { text: 'Total Earned', style: 'tableHeaderRight', fillColor: '#6366f1' }
              ],
              ...earnedWorkersList.map((p: any) => [
                { text: p.name || 'Worker', style: 'tableCell' },
                { text: p.type === 'SUPERVISOR' ? 'Supervisor' : (p.roleName || 'General'), style: 'tableCell' },
                { text: formatINR(p.rate || 0), style: 'tableCellRight' },
                { text: `${p.totalHajari || 0} Days`, style: 'tableCell', alignment: 'center' },
                { text: formatINR(p.earnedAmount || 0), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL MANPOWER COST', style: 'totalRow', colSpan: 4 }, {}, {}, {},
                { text: formatINR(totalManpowerEarned || 0), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add Manpower Advances & Dues
      if (advancesWorkersList.length > 0) {
        docDefinition.content.push({ text: 'Card 2: Manpower Advances Paid & Net Balance', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Worker Name', style: 'tableHeader', fillColor: '#059669' }, 
                { text: 'Role', style: 'tableHeader', fillColor: '#059669' }, 
                { text: 'Earned Wages', style: 'tableHeaderRight', fillColor: '#059669' }, 
                { text: 'Advance Paid', style: 'tableHeaderRight', fillColor: '#059669' },
                { text: 'Net Balance', style: 'tableHeaderRight', fillColor: '#059669' }
              ],
              ...advancesWorkersList.map((p: any) => [
                { text: p.name || 'Worker', style: 'tableCell' },
                { text: p.roleName || 'General', style: 'tableCell' },
                { text: formatINR(p.earnedAmount || 0), style: 'tableCellRight' },
                { text: formatINR(p.advancePaid || 0), style: 'tableCellRight' },
                { 
                  text: p.netBalance > 0 ? `+ ${formatINR(p.netBalance)} (Due)` : p.netBalance < 0 ? `- ${formatINR(Math.abs(p.netBalance))} (Adv)` : 'Settled',
                  style: 'tableCellRight',
                  color: p.netBalance > 0 ? '#b45309' : p.netBalance < 0 ? '#2563eb' : '#059669'
                }
              ]),
              [
                { text: 'TOTALS', style: 'totalRow', colSpan: 2 }, {},
                { text: formatINR(totalManpowerEarned || 0), style: 'totalRowRight' },
                { text: formatINR(totalAdvancesPaid || 0), style: 'totalRowRight' },
                { text: formatINR(totalNetDue || 0), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Add GST Breakdown
      if (billSummaries.length > 0) {
        docDefinition.content.push({ text: 'GST Outflow (Govt Tax Breakdown)', style: 'subheader' });
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              [
                { text: 'Date', style: 'tableHeader', fillColor: '#9333ea' }, 
                { text: 'Bill No.', style: 'tableHeader', fillColor: '#9333ea' }, 
                { text: 'Gross Amount', style: 'tableHeaderRight', fillColor: '#9333ea' }, 
                { text: 'GST (18%)', style: 'tableHeaderRight', fillColor: '#9333ea' }
              ],
              ...billSummaries.map((b: any) => [
                { text: formatDate(b.date || new Date()), style: 'tableCell' },
                { text: b.billNo || '-', style: 'tableCell' },
                { text: formatINR(b.grossAmount || 0), style: 'tableCellRight' },
                { text: formatINR(b.gstAmount || 0), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL GST OUTFLOW', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(totalGstExpense || 0), style: 'totalRowRight' }
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
                { text: formatDate(e.date || new Date()), style: 'tableCell' },
                { text: e.paidTo || '-', style: 'tableCell' },
                { text: e.description || '-', style: 'tableCell' },
                { text: formatINR(e.amount || 0), style: 'tableCellRight' }
              ]),
              [
                { text: 'TOTAL MANUAL EXPENSES', style: 'totalRow', colSpan: 3 }, {}, {},
                { text: formatINR(manualExpensesTotal || 0), style: 'totalRowRight' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Use getBlob and saveAs for reliable browser file downloading
      if (typeof pdfDoc.getBlob === 'function') {
        const blob = await pdfDoc.getBlob();
        saveAs(blob, `${sanitizedFilename}_Ledger_Report.pdf`);
      } else {
        pdfDoc.download(`${sanitizedFilename}_Ledger_Report.pdf`);
      }
      
      toast.success("PDF Downloaded successfully!", { id: "pdf-toast" });
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      toast.error(error?.message || "Failed to generate PDF. Please try again.", { id: "pdf-toast" });
    }
  };

  const handleExportExcel = async () => {
    toast.info("Generating Excel workbook...", { id: "excel-toast" });
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "RCR ERP";
      workbook.created = new Date();

      // --- SHEET 1: GENERAL LEDGER ---
      const sheet = workbook.addWorksheet("Ledger Report");
      sheet.getColumn("A").width = 20; 
      sheet.getColumn("B").width = 30; 
      sheet.getColumn("C").width = 35; 
      sheet.getColumn("D").width = 25; 

      const addSectionTitle = (ws: any, title: string, cols = "D") => {
        const row = ws.addRow([title]);
        row.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
        ws.mergeCells(`A${row.number}:${cols}${row.number}`);
      };

      const addHeaderRow = (ws: any, headers: string[]) => {
        const row = ws.addRow(headers);
        row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      };

      // 1. SUMMARY
      addSectionTitle(sheet, `FINANCIAL SUMMARY (${dateRangeStr})`);
      addHeaderRow(sheet, ["Metric", "", "", "Amount (Rs)"]);
      sheet.addRow(["Total Revenue (RA Bills + GST)", "", "", totalRevenue]);
      sheet.addRow(["Site Cost (Manpower + Manual)", "", "", siteExpensesTotal]);
      sheet.addRow(["GST Outflow (18% to Govt)", "", "", totalGstExpense]);
      const netRow = sheet.addRow(["Net Savings / Profit", "", "", netProfit]);
      netRow.font = { bold: true, color: { argb: netProfit >= 0 ? "FF059669" : "FFE11D48" } };
      sheet.addRow([]); sheet.addRow([]);

      // 2. RA BILLS
      addSectionTitle(sheet, "RA BILLS GENERATED");
      addHeaderRow(sheet, ["Date", "Bill No", "Gross Amount", "Invoice Amt"]);
      if (billSummaries.length === 0) sheet.addRow(["No RA Bills found", "", "", ""]);
      billSummaries.forEach((b: any) => sheet.addRow([formatDate(b.date), b.billNo, b.grossAmount, b.invoiceAmount]));
      sheet.addRow(["TOTAL REVENUE", "", "", totalRevenue]).font = { bold: true };
      sheet.addRow([]); sheet.addRow([]);

      // 3. GST BREAKDOWN
      addSectionTitle(sheet, "GST OUTFLOW (GOVT TAX BREAKDOWN)");
      addHeaderRow(sheet, ["Date", "Bill No", "Gross Amount", "GST Amount (18%)"]);
      if (billSummaries.length === 0) sheet.addRow(["No RA Bills found", "", "", ""]);
      billSummaries.forEach((b: any) => sheet.addRow([formatDate(b.date), b.billNo, b.grossAmount, b.gstAmount]));
      sheet.addRow(["TOTAL GST OUTFLOW", "", "", totalGstExpense]).font = { bold: true };
      sheet.addRow([]); sheet.addRow([]);

      // 4. MANUAL EXPENSES
      addSectionTitle(sheet, "MANUAL & PETTY EXPENSES");
      addHeaderRow(sheet, ["Date", "Paid To", "Purpose / Reason", "Amount"]);
      if (manualExpenses.length === 0) sheet.addRow(["No Manual Expenses found", "", "", ""]);
      manualExpenses.forEach((e: any) => sheet.addRow([formatDate(e.date), e.paidTo, e.description, e.amount]));
      sheet.addRow(["TOTAL MANUAL EXPENSES", "", "", manualExpensesTotal]).font = { bold: true };

      sheet.getColumn("D").numFmt = '"₹"#,##0.00';
      sheet.getColumn("C").numFmt = '"₹"#,##0.00';

      // --- SHEET 2: MANPOWER WAGES (ATTENDANCE BASED) ---
      const labourSheet = workbook.addWorksheet("Manpower Wages Earned");
      labourSheet.getColumn("A").width = 25; // Name
      labourSheet.getColumn("B").width = 18; // Role
      
      const totalCols = 2 + dateColumns.length + 2;
      
      addSectionTitle(labourSheet, `CARD 1: MANPOWER EARNED COST (ATTENDANCE BASED) - ${dateRangeStr}`, "E");
      const dateHeaders = dateColumns.map(d => {
        const dt = new Date(d);
        return `${dt.getDate()} ${dt.toLocaleDateString('en-IN', { month: 'short' })}`;
      });
      addHeaderRow(labourSheet, ["Worker Name", "Role / Type", ...dateHeaders, "Total Hajari", "Total Earned"]);
      
      if (earnedWorkersList.length === 0) {
        labourSheet.addRow(["No attendance found on this site for selected dates"]);
      } else {
        earnedWorkersList.forEach((p: any) => {
          const row = [p.name, p.type === 'SUPERVISOR' ? 'Supervisor' : p.roleName];
          dateColumns.forEach(d => row.push(p.wagesByDate[d] || ""));
          row.push(p.totalHajari);
          row.push(p.earnedAmount);
          labourSheet.addRow(row);
        });
        
        const totalRowData = ["TOTAL MANPOWER COST", ""];
        dateColumns.forEach(() => totalRowData.push(""));
        totalRowData.push("");
        totalRowData.push(totalManpowerEarned.toString());
        const tRow = labourSheet.addRow(totalRowData);
        tRow.font = { bold: true };
      }

      for (let i = 3; i <= totalCols; i++) {
        labourSheet.getColumn(i).width = 10;
        labourSheet.getColumn(i).alignment = { horizontal: 'center' };
      }
      labourSheet.getColumn(totalCols).width = 18;
      labourSheet.getColumn(totalCols).numFmt = '"₹"#,##0.00';

      // --- SHEET 3: ADVANCES & NET BALANCE ---
      const advancesSheet = workbook.addWorksheet("Advances & Balances");
      advancesSheet.getColumn("A").width = 25; // Name
      advancesSheet.getColumn("B").width = 18; // Role
      advancesSheet.getColumn("C").width = 20; // Earned
      advancesSheet.getColumn("D").width = 20; // Paid
      advancesSheet.getColumn("E").width = 20; // Net Due

      addSectionTitle(advancesSheet, `CARD 2: MANPOWER ADVANCES & BALANCES - ${dateRangeStr}`, "E");
      addHeaderRow(advancesSheet, ["Worker Name", "Role", "Earned Wages", "Advance Paid", "Net Balance Due"]);

      if (advancesWorkersList.length === 0) {
        advancesSheet.addRow(["No advances or wages recorded for selected dates"]);
      } else {
        advancesWorkersList.forEach((p: any) => {
          advancesSheet.addRow([
            p.name,
            p.roleName,
            p.earnedAmount,
            p.advancePaid,
            p.netBalance
          ]);
        });

        const advTotalRow = advancesSheet.addRow([
          "TOTALS",
          "",
          totalManpowerEarned,
          totalAdvancesPaid,
          totalNetDue
        ]);
        advTotalRow.font = { bold: true };
      }

      advancesSheet.getColumn("C").numFmt = '"₹"#,##0.00';
      advancesSheet.getColumn("D").numFmt = '"₹"#,##0.00';
      advancesSheet.getColumn("E").numFmt = '"₹"#,##0.00';

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `${site.projectName}_Ledger_${startDateStr}_to_${endDateStr}.xlsx`);
      toast.success("Excel Workbook Downloaded!", { id: "excel-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel. Please try again.", { id: "excel-toast" });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS: Date Filters & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From:</span>
            <Input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="h-9 w-36 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To:</span>
            <Input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="h-9 w-36 text-sm font-medium"
            />
          </div>
          
          <div className="flex items-center gap-1.5 ml-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                setStartDateStr(formatDateToInput(firstDay));
                setEndDateStr(formatDateToInput(lastDay));
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                setStartDateStr(formatDateToInput(firstDay));
                setEndDateStr(formatDateToInput(lastDay));
              }}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                const earliest = getEarliestSiteDate(site);
                const latest = getLatestSiteDate(site);
                setStartDateStr(formatDateToInput(earliest));
                setEndDateStr(formatDateToInput(latest));
              }}
            >
              All Time
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handlePrintPDF} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <Printer className="h-4 w-4" /> PDF Report
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* TOP SUMMARY METRICS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total Revenue
              <FileCheck className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{billSummaries.length} RA Bill{billSummaries.length !== 1 ? 's' : ''} (Inc. GST)</p>
          </CardContent>
        </Card>

        {/* Site True Expenses */}
        <Card className="border-rose-100 dark:border-rose-950/50 bg-rose-50/20 dark:bg-rose-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total Site Cost
              <Banknote className="h-4 w-4 text-rose-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatINR(siteExpensesTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Manpower ({formatINR(totalManpowerEarned)}) + Petty ({formatINR(manualExpensesTotal)})</p>
          </CardContent>
        </Card>

        {/* GST Outflow */}
        <Card className="border-purple-100 dark:border-purple-950/50 bg-purple-50/20 dark:bg-purple-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              GST Outflow (To Govt)
              <Percent className="h-4 w-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatINR(totalGstExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">18% GST (CGST 9% + SGST 9%)</p>
          </CardContent>
        </Card>

        {/* Net Savings / Profit */}
        <Card className={`border-slate-200 dark:border-slate-800 ${netProfit >= 0 ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Net Savings / Profit
              <TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatINR(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue - (Site Cost + GST)</p>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED SECTION GRID */}
      <div className="grid md:grid-cols-2 gap-6 items-start print:block print:space-y-6 max-w-full">
        
        {/* ROW 1 LEFT: REVENUE SECTION */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-500" />
              <span>RA Bills Revenue</span>
            </CardTitle>
            <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
              {billSummaries.length} Bill{billSummaries.length !== 1 ? 's' : ''}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="max-h-[260px] max-w-full overflow-auto print:max-h-none print:overflow-visible pb-1 relative border rounded-md">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Bill No.</TH>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Date</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Invoice Amt</TH>
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
                        <TD className="text-right font-bold text-emerald-600 whitespace-nowrap">{formatINR(b.invoiceAmount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            
            <div className="mt-3 pt-2 text-right font-bold text-lg text-emerald-600">
              Total Revenue: {formatINR(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        {/* ROW 1 RIGHT: GST BREAKDOWN SECTION */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-500" />
              <span>GST Outflow (Govt Tax)</span>
            </CardTitle>
            <div className="text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-100 dark:border-purple-800">
              18% (CGST + SGST)
            </div>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="max-h-[260px] max-w-full overflow-auto print:max-h-none print:overflow-visible pb-1 relative border rounded-md">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Bill No.</TH>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Date</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Gross Amt</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">GST (18%)</TH>
                  </TR>
                </THead>
                <TBody>
                  {billSummaries.length === 0 ? (
                    <TR><TD colSpan={4} className="text-center text-muted-foreground py-4">No RA Bills generated.</TD></TR>
                  ) : (
                    billSummaries.map((b: any) => (
                      <TR key={b.id}>
                        <TD className="font-medium whitespace-nowrap">{b.billNo}</TD>
                        <TD className="text-muted-foreground whitespace-nowrap">{formatDate(b.date)}</TD>
                        <TD className="text-right text-muted-foreground whitespace-nowrap">{formatINR(b.grossAmount)}</TD>
                        <TD className="text-right font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{formatINR(b.gstAmount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                CGST (9%) + SGST (9%) on RA Bills
              </div>
              <div className="text-right font-bold text-lg text-purple-600 dark:text-purple-400">
                Total GST: {formatINR(totalGstExpense)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROW 2 LEFT: CARD 1 - MANPOWER COST (EARNED WAGES) */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden flex flex-col border-indigo-100 dark:border-indigo-900/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Card 1: Manpower Earned Wages</span>
            </CardTitle>
            <div className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
              Site Work Cost
            </div>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="max-h-[260px] max-w-full overflow-auto print:max-h-none print:overflow-visible pb-1 relative border rounded-md">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[130px]">Name</TH>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[90px]">Role</TH>
                    <TH className="text-center whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[80px]">Hajari</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[90px]">Rate</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[100px]">Earned</TH>
                  </TR>
                </THead>
                <TBody>
                  {earnedWorkersList.length === 0 ? (
                    <TR><TD colSpan={5} className="text-center text-muted-foreground py-4">No attendance recorded on this site for selected dates.</TD></TR>
                  ) : (
                    earnedWorkersList.map((p: any) => (
                      <TR key={p.id}>
                        <TD className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {p.name}
                            {p.type === 'SUPERVISOR' && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                                Sup
                              </span>
                            )}
                          </div>
                        </TD>
                        <TD className="text-muted-foreground whitespace-nowrap text-xs">
                          {p.type === 'SUPERVISOR' ? 'Supervisor' : p.roleName}
                        </TD>
                        <TD className="text-center font-medium whitespace-nowrap">{p.totalHajari} d</TD>
                        <TD className="text-right text-muted-foreground whitespace-nowrap text-xs">{formatINR(p.rate)}</TD>
                        <TD className="text-right font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatINR(p.earnedAmount)}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {earnedWorkersList.length} active worker{earnedWorkersList.length !== 1 ? 's' : ''} on this site
              </div>
              <div className="text-right font-bold text-lg text-indigo-600 dark:text-indigo-400">
                Total Earned: {formatINR(totalManpowerEarned)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROW 2 RIGHT: CARD 2 - MANPOWER ADVANCES & BALANCES */}
        <Card className="print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden flex flex-col border-emerald-100 dark:border-emerald-900/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <span>Card 2: Advances Paid & Balance</span>
            </CardTitle>
            <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
              Paid vs Earned
            </div>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="max-h-[260px] max-w-full overflow-auto print:max-h-none print:overflow-visible pb-1 relative border rounded-md">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[120px]">Name</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[90px]">Earned</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[95px]">Advance Paid</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b min-w-[100px]">Net Balance</TH>
                  </TR>
                </THead>
                <TBody>
                  {advancesWorkersList.length === 0 ? (
                    <TR><TD colSpan={4} className="text-center text-muted-foreground py-4">No advances or attendance recorded.</TD></TR>
                  ) : (
                    advancesWorkersList.map((p: any) => (
                      <TR key={p.id}>
                        <TD className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {p.name}
                            {p.type === 'SUPERVISOR' && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                                Sup
                              </span>
                            )}
                          </div>
                        </TD>
                        <TD className="text-right text-muted-foreground whitespace-nowrap text-xs">{formatINR(p.earnedAmount)}</TD>
                        <TD className="text-right font-medium text-rose-600 whitespace-nowrap text-xs">
                          {formatINR(p.advancePaid)}
                          {p.paymentsCount > 1 && (
                            <span className="text-[10px] text-muted-foreground ml-1">({p.paymentsCount})</span>
                          )}
                        </TD>
                        <TD className="text-right whitespace-nowrap">
                          {p.netBalance > 0 ? (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              + {formatINR(p.netBalance)} Due
                            </span>
                          ) : p.netBalance < 0 ? (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              - {formatINR(Math.abs(p.netBalance))} Adv
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Settled
                            </span>
                          )}
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground">
                Advance Paid: <span className="text-rose-600">{formatINR(totalAdvancesPaid)}</span>
              </div>
              <div className="text-right font-bold text-base">
                Net Pending: <span className={totalNetDue >= 0 ? "text-amber-600" : "text-blue-600"}>{formatINR(totalNetDue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROW 3: MANUAL EXPENSES (FULL WIDTH) */}
        <Card className="md:col-span-2 print:shadow-none print:border-none print:break-inside-avoid min-w-0 w-full overflow-hidden">
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

            <div className="max-h-[260px] max-w-full overflow-auto print:max-h-none print:overflow-visible pb-1 relative border rounded-md">
              <Table>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Date</TH>
                    <TH className="whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Details</TH>
                    <TH className="text-right whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b">Amount</TH>
                    <TH className="w-10 print:hidden whitespace-nowrap sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b"></TH>
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
            
            <div className="mt-3 pt-2 text-right font-bold text-lg text-rose-600">
              Total Manual Expenses: {formatINR(manualExpensesTotal)}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
