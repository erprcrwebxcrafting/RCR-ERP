"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  HardHat,
  Receipt,
  Banknote,
  DollarSign,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Briefcase,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";

import ExcelJS from "exceljs";

import { fetchReportsDataAction } from "./actions";

interface ReportsDashboardProps {
  sites: any[];
  initialData: any;
  initialRange: string;
}

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ReportsDashboard({
  sites,
  initialData,
  initialRange,
}: ReportsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>(initialRange || "1d");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"financial" | "labour" | "supervisor" | "billing">("financial");

  const [dashboardData, setDashboardData] = useState<any>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    // Only fetch if it's not the initial render (initialData is used)
    // Or if timeRange is custom but dates are missing, don't fetch yet
    if (timeRange === "custom" && (!customStartDate || !customEndDate)) return;

    let isMounted = true;
    setIsLoading(true);
    
    fetchReportsDataAction(timeRange, selectedSiteId, customStartDate, customEndDate)
      .then((data) => {
        if (isMounted) setDashboardData(data);
      })
      .catch((err) => {
        console.error("Error fetching reports data:", err);
        toast.error("Failed to fetch report data");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [timeRange, selectedSiteId, customStartDate, customEndDate]);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const PAGE_SIZE = 10;

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
    router.push(`${pathname}?range=${range}`);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    const newStart = type === "start" ? value : customStartDate;
    const newEnd = type === "end" ? value : customEndDate;

    if (newStart && newEnd && new Date(newStart) > new Date(newEnd)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    if (type === "start") setCustomStartDate(value);
    else setCustomEndDate(value);
  };

  const {
    totalBilledGross = 0,
    totalBilledTaxable = 0,
    totalPaymentsReceived = 0,
    totalOutstandingReceivable = 0,
    collectionPercentage = 0,
    totalLabourWagesEarned = 0,
    totalLabourPaymentsMade = 0,
    totalSupervisorEarned = 0,
    totalSupervisorPaid = 0,
    grossMargin = 0
  } = dashboardData?.kpi || {};

  const {
    siteFinancialChartData = [],
    clientRevenueData = [],
    labourCategoryExpenseData = [],
    dailyHajariTrendData = [],
    topEarningLabours = [],
    supplyEntriesAggregated = []
  } = dashboardData?.charts || {};

  const labourMatrixList = dashboardData?.tables?.labourMatrixList || [];
  const supervisorPayrollData = dashboardData?.tables?.supervisorPayrollData || [];
  const exportBills = dashboardData?.tables?.bills || [];

  // Export Utilities
  const exportFinancialsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Financial Report");
    
    worksheet.columns = [
      { header: "Project / Site", key: "project", width: 30 },
      { header: "Client", key: "client", width: 25 },
      { header: "Total Billed", key: "billed", width: 18 },
      { header: "Total Received", key: "received", width: 18 },
      { header: "Outstanding Balance", key: "outstanding", width: 22 },
      { header: "Collection %", key: "collection", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };

    siteFinancialChartData.forEach((s: any) => {
      worksheet.addRow({
        project: s.fullName,
        client: s.client,
        billed: s.Billed,
        received: s.Received,
        outstanding: s.Outstanding,
        collection: s.Billed > 0 ? Math.round((s.Received / s.Billed) * 100) + "%" : "0%"
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Financial_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinancialsToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let html = `
      <html>
        <head>
          <title>Financial Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
            .right { text-align: right; }
            .outstanding { color: #e11d48; font-weight: bold; }
            .collection { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Financial & Collections Report</h2>
          <div class="header-info">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${timeRange === "custom" ? (customStartDate || "Start") + " to " + (customEndDate || "End") : timeRange}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Project / Site</th>
                <th>Client</th>
                <th class="right">Total Billed</th>
                <th class="right">Total Received</th>
                <th class="right">Outstanding Balance</th>
                <th class="right">Collection %</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    siteFinancialChartData.forEach((s: any) => {
      const pct = s.Billed > 0 ? Math.round((s.Received / s.Billed) * 100) : 0;
      html += `
        <tr>
          <td>${s.fullName}</td>
          <td>${s.client}</td>
          <td class="right">${s.Billed.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right">${s.Received.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right ${s.Outstanding > 0 ? 'outstanding' : ''}">${s.Outstanding.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right collection">${pct}%</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportLabourToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // --- Sheet 1: Summary Matrix ---
    const summarySheet = workbook.addWorksheet("Labour Summary");
    summarySheet.columns = [
      { header: "Labourer Name", key: "name", width: 25 },
      { header: "Trade / Category", key: "category", width: 20 },
      { header: "Site", key: "site", width: 25 },
      { header: "Total Hajaris", key: "hajaris", width: 15 },
      { header: "Daily Rate", key: "rate", width: 15 },
      { header: "Gross Earned", key: "earned", width: 18 },
      { header: "Advance Paid", key: "advance", width: 18 },
      { header: "Net Payable", key: "payable", width: 18 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    summarySheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    labourMatrixList.forEach((l: any) => {
      summarySheet.addRow({
        name: l.name,
        category: l.category,
        site: l.site,
        hajaris: l.totalHajari,
        rate: l.dailyWage,
        earned: l.grossEarned,
        advance: l.advancePaid,
        payable: l.balance
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Labour_Detailed_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSupervisorToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // --- Sheet 1: Supervisor Summary Matrix ---
    const summarySheet = workbook.addWorksheet("Supervisor Summary");
    summarySheet.columns = [
      { header: "Supervisor Name", key: "name", width: 25 },
      { header: "Monthly Salary", key: "monthly", width: 15 },
      { header: "Daily Rate", key: "rate", width: 15 },
      { header: "Present", key: "present", width: 10 },
      { header: "Half Days", key: "half", width: 10 },
      { header: "Absent", key: "absent", width: 10 },
      { header: "Gross Earned", key: "earned", width: 18 },
      { header: "Advance Paid", key: "advance", width: 18 },
      { header: "Net Payable", key: "payable", width: 18 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    summarySheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    supervisorPayrollData.forEach((s: any) => {
      summarySheet.addRow({
        name: s.name,
        monthly: s.monthlySalary,
        rate: s.dailyRate,
        present: s.presentCount,
        half: s.halfCount,
        absent: s.absentCount,
        earned: s.grossEarned,
        advance: s.totalPaid,
        payable: s.balanceDue
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Supervisor_Detailed_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSupervisorToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let html = `
      <html>
        <head>
          <title>Supervisor Payroll Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
            .right { text-align: right; }
            .center { text-align: center; }
            .payable { color: #d97706; font-weight: bold; }
            .advance { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Supervisor Payroll & Advances Report</h2>
          <div class="header-info">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${timeRange === "custom" ? (customStartDate || "Start") + " to " + (customEndDate || "End") : timeRange}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Supervisor Name</th>
                <th class="center">Present</th>
                <th class="center">Half Day</th>
                <th class="center">Absent</th>
                <th class="right">Monthly Salary</th>
                <th class="right">Gross Earned</th>
                <th class="right">Advance Paid</th>
                <th class="right">Net Payable</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    supervisorPayrollData.forEach((s: any) => {
      html += `
        <tr>
          <td>${s.name}</td>
          <td class="center">${s.presentCount}</td>
          <td class="center">${s.halfCount}</td>
          <td class="center">${s.absentCount}</td>
          <td class="right">${s.monthlySalary.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right">${s.grossEarned.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right advance">${s.totalPaid.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right ${s.balanceDue > 0 ? 'payable' : ''}">${s.balanceDue.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportLabourToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let html = `
      <html>
        <head>
          <title>Labour Wages Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
            .right { text-align: right; }
            .center { text-align: center; }
            .payable { color: #d97706; font-weight: bold; }
            .advance { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Labour Wages & Advances Report</h2>
          <div class="header-info">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${timeRange === "custom" ? (customStartDate || "Start") + " to " + (customEndDate || "End") : timeRange}</p>
            <p>Site: ${selectedSiteId === "all" ? "All Sites" : sites?.find((s: any) => s.id === selectedSiteId)?.projectName || "All Sites"}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Labourer Name</th>
                <th>Category</th>
                <th>Site</th>
                <th class="center">Hajaris</th>
                <th class="right">Daily Rate</th>
                <th class="right">Gross Earned</th>
                <th class="right">Advance Paid</th>
                <th class="right">Net Payable</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    labourMatrixList.forEach((l: any) => {
      html += `
        <tr>
          <td>${l.name}</td>
          <td>${l.category}</td>
          <td>${l.site}</td>
          <td class="center">${l.totalHajari.toFixed(1)}</td>
          <td class="right">${l.dailyWage.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right">${l.grossEarned.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right advance">${l.advancePaid.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right ${l.balance > 0 ? 'payable' : ''}">${l.balance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportBillingToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // --- Sheet 1: RA Bill Summary ---
    const summarySheet = workbook.addWorksheet("RA Bill Summary");
    summarySheet.columns = [
      { header: "Bill No / Ref", key: "billNo", width: 20 },
      { header: "Bill Date", key: "date", width: 15 },
      { header: "Project", key: "project", width: 25 },
      { header: "Client", key: "client", width: 25 },
      { header: "Taxable Work Done", key: "taxable", width: 20 },
      { header: "CGST+SGST", key: "gst", width: 15 },
      { header: "Retention", key: "retention", width: 15 },
      { header: "TDS", key: "tds", width: 15 },
      { header: "Net Payable Amount", key: "net", width: 20 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    summarySheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    exportBills.forEach((b: any) => {
      const taxable = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
      const cgst = taxable * ((b.cgstPct ?? 9) / 100);
      const sgst = taxable * ((b.sgstPct ?? 9) / 100);
      const ret = taxable * ((b.retentionPct ?? 2) / 100);
      const tds = taxable * ((b.tdsPct ?? 1) / 100);
      const netAmt = taxable + cgst + sgst;

      summarySheet.addRow({
        billNo: b.billNo + (b.refNo ? ` (${b.refNo})` : ""),
        date: formatDate(b.billDate),
        project: b.site?.projectName || "—",
        client: b.site?.client?.name || "—",
        taxable: taxable,
        gst: cgst + sgst,
        retention: ret,
        tds: tds,
        net: netAmt
      });
    });

    // --- Sheet 2: Detailed Bill Lines ---
    const linesSheet = workbook.addWorksheet("Detailed Bill Items");
    linesSheet.columns = [
      { header: "Bill No", key: "billNo", width: 15 },
      { header: "Project", key: "project", width: 20 },
      { header: "Item Description", key: "desc", width: 40 },
      { header: "Type", key: "type", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Qty Billed", key: "qty", width: 15 },
      { header: "Rate", key: "rate", width: 15 },
      { header: "Amount", key: "amount", width: 18 },
    ];
    linesSheet.getRow(1).font = { bold: true };
    linesSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
    linesSheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    exportBills.forEach((b: any) => {
      (b.lines || []).forEach((l: any) => {
        linesSheet.addRow({
          billNo: b.billNo,
          project: b.site?.projectName || "—",
          desc: l.description,
          type: l.category === "SUPPLY" ? "Material Supply" : "Work Done",
          unit: l.uom || "LS",
          qty: Number(l.currentQty) || 0,
          rate: Number(l.rate) || 0,
          amount: Number(l.currentAmount) || 0
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `RABilling_Registry_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBillingToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let html = `
      <html>
        <head>
          <title>RA Billing Registry Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
            .right { text-align: right; }
            .center { text-align: center; }
            .payable { color: #10b981; font-weight: bold; }
            .deduction { color: #ef4444; }
          </style>
        </head>
        <body>
          <h2>Running Account (RA) Bill Registry</h2>
          <div class="header-info">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${timeRange === "custom" ? (customStartDate || "Start") + " to " + (customEndDate || "End") : timeRange}</p>
            <p>Site: ${selectedSiteId === "all" ? "All Sites" : sites?.find((s: any) => s.id === selectedSiteId)?.projectName || "All Sites"}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bill No / Ref</th>
                <th>Bill Date</th>
                <th>Project</th>
                <th>Client</th>
                <th class="right">Taxable Work Done</th>
                <th class="right">CGST+SGST</th>
                <th class="right">Retention</th>
                <th class="right">TDS</th>
                <th class="right">Net Payable Amount</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    exportBills.forEach((b: any) => {
      const taxable = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
      const cgst = taxable * ((b.cgstPct ?? 9) / 100);
      const sgst = taxable * ((b.sgstPct ?? 9) / 100);
      const ret = taxable * ((b.retentionPct ?? 2) / 100);
      const tds = taxable * ((b.tdsPct ?? 1) / 100);
      const netAmt = taxable + cgst + sgst;

      html += `
        <tr>
          <td>${b.billNo} <br/><small style="color:#666">${b.refNo || ""}</small></td>
          <td>${new Date(b.billDate).toLocaleDateString("en-IN")}</td>
          <td>${b.site?.projectName || "—"}</td>
          <td>${b.site?.client?.name || "—"}</td>
          <td class="right">${taxable.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right">${(cgst+sgst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right deduction">-${ret.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right deduction">-${tds.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
          <td class="right payable">${netAmt.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 sm:p-10 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-500/30">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
              Real-time Business Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Executive Analytics & Reports</h1>
            <p className="text-slate-300 max-w-2xl text-sm sm:text-base font-normal">
              High-level operational metrics, client revenue realization, labour wage liabilities, supervisor payroll, and project cash-flows.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 dark:bg-black/30 p-2 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-indigo-500/30 text-xs">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Sites ({sites?.length || 0})</option>
                {(sites || []).map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center rounded-xl bg-slate-900/80 p-1 border border-indigo-500/30 text-xs gap-1">
              <button
                onClick={() => handleTimeRangeChange("1d")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "1d" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                1 Day
              </button>
              <button
                onClick={() => handleTimeRangeChange("30d")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "30d" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => handleTimeRangeChange("90d")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "90d" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                90 Days
              </button>
              <button
                onClick={() => handleTimeRangeChange("this_year")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "this_year" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                This Year
              </button>
              <button
                onClick={() => handleTimeRangeChange("last_year")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "last_year" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Last Year
              </button>
              <button
                onClick={() => handleTimeRangeChange("all_time")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "all_time" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleTimeRangeChange("custom")}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  timeRange === "custom" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Picker Row (Conditionally Rendered) */}
          {timeRange === "custom" && (
            <div className="flex items-center gap-4 bg-white/10 dark:bg-black/30 p-2 rounded-2xl backdrop-blur-md border border-white/10 mt-3 animate-in fade-in slide-in-from-top-2 w-full max-w-md">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-xs font-bold">From:</span>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => handleCustomDateChange("start", e.target.value)}
                  className="bg-slate-900/80 text-white text-xs border border-indigo-500/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-xs font-bold">To:</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => handleCustomDateChange("end", e.target.value)}
                  className="bg-slate-900/80 text-white text-xs border border-indigo-500/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          TOP EXECUTIVE KPI CARDS
         ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue Billed */}
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 shadow-lg relative overflow-hidden rounded-2xl hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600">
            <Receipt className="h-16 w-16" />
          </div>
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Invoiced (Gross)</span>
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-0">{exportBills.length} Bills</Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatINR(totalBilledGross)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <span>Taxable: {formatINR(totalBilledTaxable)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Payments Received */}
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 shadow-lg relative overflow-hidden rounded-2xl hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Collected Realization</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-0">{collectionPercentage}% Realized</Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatINR(totalPaymentsReceived)}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${collectionPercentage}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Outstanding Receivables */}
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20 shadow-lg relative overflow-hidden rounded-2xl hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600">
            <AlertCircle className="h-16 w-16" />
          </div>
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Outstanding Dues</span>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-0">Pending</Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatINR(totalOutstandingReceivable)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              From {siteFinancialChartData.length} active construction sites
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Gross Operational Margin */}
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20 shadow-lg relative overflow-hidden rounded-2xl hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
            <TrendingUp className="h-16 w-16" />
          </div>
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Operational Balance</span>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-0">Net Realized</Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatINR(grossMargin)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Labour Wage: {formatINR(totalLabourWagesEarned)} | Sup: {formatINR(totalSupervisorEarned)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==========================================
          INTERACTIVE TABS
         ========================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl shadow-xl overflow-hidden p-2">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl">
          <button
            onClick={() => setActiveTab("financial")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "financial"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4" /> Financial & Collections
          </button>
          <button
            onClick={() => setActiveTab("labour")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "labour"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" /> Labour Wages & Shifts
          </button>
          <button
            onClick={() => setActiveTab("supervisor")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "supervisor"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Briefcase className="h-4 w-4" /> Supervisor Payroll
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "billing"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Receipt className="h-4 w-4" /> RA Billing Registry
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          {/* ==========================================
              TAB 1: FINANCIAL & COLLECTIONS
             ========================================== */}
          {activeTab === "financial" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Site Billed vs Received vs Balance */}
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-500" /> Site-wise Billed vs Realized vs Outstanding
                    </CardTitle>
                    <CardDescription>Direct comparative analysis of total work invoiced vs cash collected per project</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[340px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={siteFinancialChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: any) => [formatINR(Number(value)), ""]}
                          contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #334155", color: "#fff" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Bar dataKey="Billed" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Total Billed (₹)" />
                        <Bar dataKey="Received" fill="#10b981" radius={[6, 6, 0, 0]} name="Received (₹)" />
                        <Bar dataKey="Outstanding" fill="#ef4444" radius={[6, 6, 0, 0]} name="Outstanding Dues (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Donut Chart: Client Revenue Share */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PieIcon className="h-5 w-5 text-indigo-500" /> Client Revenue Share
                    </CardTitle>
                    <CardDescription>Billed turnover contribution by developer</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[340px] flex flex-col items-center justify-center">
                    {clientRevenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientRevenueData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {clientRevenueData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [formatINR(Number(value)), "Revenue"]} />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-400 py-12">No client billing data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Site Financial Health Table */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" /> Project Realization Ledger
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportFinancialsToExcel} className="h-8 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportFinancialsToPDF} className="h-8 gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:hover:bg-rose-900/50">
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <THead className="bg-slate-50/80 dark:bg-slate-900/80">
                        <TR>
                          <TH>Site / Project</TH>
                          <TH>Client</TH>
                          <TH className="text-right">Total Billed</TH>
                          <TH className="text-right">Total Received</TH>
                          <TH className="text-right">Outstanding Balance</TH>
                          <TH className="text-center w-36">Collection %</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {siteFinancialChartData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s: any, idx: number) => {
                          const pct = s.Billed > 0 ? Math.min(100, Math.round((s.Received / s.Billed) * 100)) : 0;
                          return (
                            <TR key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                              <TD className="font-bold text-slate-900 dark:text-slate-100">{s.fullName}</TD>
                              <TD className="text-slate-600 dark:text-slate-400">{s.client}</TD>
                              <TD className="text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatINR(s.Billed)}</TD>
                              <TD className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(s.Received)}</TD>
                              <TD className={`text-right font-mono font-bold ${s.Outstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                                {formatINR(s.Outstanding)}
                              </TD>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold font-mono">{pct}%</span>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(siteFinancialChartData.length / PAGE_SIZE)} 
                totalItems={siteFinancialChartData.length} 
                pageSize={PAGE_SIZE} 
              />
            </div>
          )}

          {/* ==========================================
              TAB 2: LABOUR WAGES & SHIFTS
             ========================================== */}
          {activeTab === "labour" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stacked Bar Chart: Daily Attendance & Shifts */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-500" /> Daily Workforce Presence & Shifts Trend
                    </CardTitle>
                    <CardDescription>Daily full day present, half day and absent count</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyHajariTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #334155", color: "#fff" }} />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Bar dataKey="present" stackId="a" fill="#10b981" name="Full Day (1+ Hajari)" />
                        <Bar dataKey="halfDay" stackId="a" fill="#f59e0b" name="Half Day (0.5 Hajari)" />
                        <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Wage Distribution */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <HardHat className="h-5 w-5 text-indigo-500" /> Wage Expenditure by Trade / Category
                    </CardTitle>
                    <CardDescription>Total wages incurred per specialized labour trade</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={labourCategoryExpenseData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: any) => [formatINR(Number(value)), "Gross Wages"]} />
                        <Bar dataKey="wages" fill="#6366f1" radius={[6, 6, 0, 0]} name="Wages Incurred (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Labour Wage & Advance Ledger */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" /> Labourer Wage & Advance Payout Matrix
                    </CardTitle>
                    <CardDescription>Individual worker hajaris, daily wage rates, gross earnings and pending balances</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono mr-2">{labourMatrixList.length} Active Labours</Badge>
                    <Button variant="outline" size="sm" onClick={exportLabourToExcel} className="h-8 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportLabourToPDF} className="h-8 gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:hover:bg-rose-900/50">
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[450px]">
                    <Table>
                      <THead className="bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
                        <TR>
                          <TH>Labourer</TH>
                          <TH>Trade / Category</TH>
                          <TH>Site</TH>
                          <TH className="text-center">Total Hajaris</TH>
                          <TH className="text-right">Daily Rate</TH>
                          <TH className="text-right">Gross Earned</TH>
                          <TH className="text-right">Advance Paid</TH>
                          <TH className="text-right">Net Payable Balance</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {labourMatrixList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((lab: any) => (
                          <TR key={lab.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-bold text-slate-900 dark:text-slate-100">{lab.name}</TD>
                            <TD><Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">{lab.category}</Badge></TD>
                            <TD className="text-slate-600 dark:text-slate-400 text-xs">{lab.site}</TD>
                            <TD className="text-center font-mono font-bold">{lab.totalHajari.toFixed(1)}</TD>
                            <TD className="text-right font-mono text-slate-600 dark:text-slate-400">₹{lab.dailyWage}</TD>
                            <TD className="text-right font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(lab.grossEarned)}</TD>
                            <TD className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(lab.advancePaid)}</TD>
                            <TD className={`text-right font-mono font-bold ${lab.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                              {formatINR(lab.balance)}
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(labourMatrixList.length / PAGE_SIZE)} 
                totalItems={labourMatrixList.length} 
                pageSize={PAGE_SIZE} 
              />
            </div>
          )}

          {/* ==========================================
              TAB 3: SUPERVISOR PAYROLL
             ========================================== */}
          {activeTab === "supervisor" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Supervisor Bar Chart */}
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-500" /> Supervisor Earned Salary vs Advances vs Dues
                    </CardTitle>
                    <CardDescription>Calculated from daily marked attendance (Monthly Salary ÷ 30)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supervisorPayrollData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: any) => [formatINR(Number(value)), ""]} />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Bar dataKey="grossEarned" fill="#6366f1" radius={[6, 6, 0, 0]} name="Earned (from Attendance)" />
                        <Bar dataKey="totalPaid" fill="#10b981" radius={[6, 6, 0, 0]} name="Advance Paid" />
                        <Bar dataKey="balanceDue" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Balance Due (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* KPI Summary Card */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-md bg-gradient-to-br from-indigo-900 to-slate-900 text-white flex flex-col justify-between p-6">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Supervisor Payroll Summary</span>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">Total Salary Earned</p>
                      <p className="text-2xl font-black font-mono text-white">{formatINR(totalSupervisorEarned)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">Total Advances Paid</p>
                      <p className="text-2xl font-black font-mono text-emerald-400">{formatINR(totalSupervisorPaid)}</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-indigo-500/30">
                      <p className="text-xs text-slate-400">Net Salary Payable</p>
                      <p className="text-2xl font-black font-mono text-amber-400">{formatINR(Math.max(0, totalSupervisorEarned - totalSupervisorPaid))}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-4">
                    *Attendance is recorded daily with snapshot rate (Monthly Salary ÷ 30).
                  </p>
                </Card>
              </div>

              {/* Supervisor Payroll Table */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" /> Supervisor Monthly Compensation Registry
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportSupervisorToExcel} className="h-8 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportSupervisorToPDF} className="h-8 gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:hover:bg-rose-900/50">
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <THead className="bg-slate-50/80 dark:bg-slate-900/80">
                        <TR>
                          <TH>Supervisor Name</TH>
                          <TH className="text-right">Monthly Salary</TH>
                          <TH className="text-right">Daily Rate (÷30)</TH>
                          <TH className="text-center">Days Present</TH>
                          <TH className="text-center">Half Days</TH>
                          <TH className="text-center">Absent</TH>
                          <TH className="text-right">Gross Earned</TH>
                          <TH className="text-right">Advance Paid</TH>
                          <TH className="text-right">Net Payable Balance</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {supervisorPayrollData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((sup: any) => (
                          <TR key={sup.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <TD className="font-bold text-slate-900 dark:text-slate-100">{sup.name}</TD>
                            <TD className="text-right font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatINR(sup.monthlySalary)}</TD>
                            <TD className="text-right font-mono text-slate-500">₹{sup.dailyRate}</TD>
                            <TD className="text-center font-mono font-bold text-emerald-600">{sup.presentCount}</TD>
                            <TD className="text-center font-mono font-bold text-amber-600">{sup.halfCount}</TD>
                            <TD className="text-center font-mono font-bold text-rose-600">{sup.absentCount}</TD>
                            <TD className="text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatINR(sup.grossEarned)}</TD>
                            <TD className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(sup.totalPaid)}</TD>
                            <TD className={`text-right font-mono font-bold ${sup.balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"}`}>
                              {formatINR(sup.balanceDue)}
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(supervisorPayrollData.length / PAGE_SIZE)} 
                totalItems={supervisorPayrollData.length} 
                pageSize={PAGE_SIZE} 
              />
            </div>
          )}

          {/* ==========================================
              TAB 4: RA BILLING REGISTRY
             ========================================== */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-indigo-500" /> Running Account (RA) Bill Registry
                    </CardTitle>
                    <CardDescription>Full tax, TDS, retention deductions, and gross receivable details for all generated invoices</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-0 font-mono">
                      {exportBills.length} Invoices
                    </Badge>
                    <Button variant="outline" size="sm" onClick={exportBillingToExcel} className="h-8 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportBillingToPDF} className="h-8 gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:hover:bg-rose-900/50">
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <THead className="bg-slate-50/80 dark:bg-slate-900/80">
                        <TR>
                          <TH>Bill No / Ref</TH>
                          <TH>Bill Date</TH>
                          <TH>Project</TH>
                          <TH>Client</TH>
                          <TH className="text-right">Taxable Work Done</TH>
                          <TH className="text-right">CGST+SGST</TH>
                          <TH className="text-right">Retention (2%)</TH>
                          <TH className="text-right">TDS (1%)</TH>
                          <TH className="text-right">Net Payable Amount</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {exportBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((b: any) => {
                          const taxable = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
                          const cgst = taxable * ((b.cgstPct ?? 9) / 100);
                          const sgst = taxable * ((b.sgstPct ?? 9) / 100);
                          const ret = taxable * ((b.retentionPct ?? 2) / 100);
                          const tds = taxable * ((b.tdsPct ?? 1) / 100);
                          const netAmt = taxable + cgst + sgst;

                          return (
                            <TR key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                              <TD>
                                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{b.billNo}</span>
                                {b.refNo && <span className="text-xs text-slate-400 block font-mono">Ref: {b.refNo}</span>}
                              </TD>
                              <TD className="text-slate-600 dark:text-slate-400 text-xs font-medium">{formatDate(b.billDate)}</TD>
                              <TD className="font-semibold text-slate-800 dark:text-slate-200">{b.site?.projectName}</TD>
                              <TD className="text-slate-600 dark:text-slate-400 text-xs">{b.site?.client?.name || "—"}</TD>
                              <TD className="text-right font-mono font-semibold">{formatINR(taxable)}</TD>
                              <TD className="text-right font-mono text-xs text-teal-600 dark:text-teal-400 font-semibold">{formatINR(cgst + sgst)}</TD>
                              <TD className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">-{formatINR(ret)}</TD>
                              <TD className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">-{formatINR(tds)}</TD>
                              <TD className="text-right font-mono font-bold text-slate-900 dark:text-white text-sm">{formatINR(netAmt)}</TD>
                            </TR>
                          );
                        })}
                      </TBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(exportBills.length / PAGE_SIZE)} 
                totalItems={exportBills.length} 
                pageSize={PAGE_SIZE} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
