"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

interface ReportsDashboardProps {
  initialSites: any[];
  initialBills: any[];
  initialPayments: any[];
  initialLabours: any[];
  initialSupervisors: any[];
  initialAttendances: any[];
  initialSupplyEntries: any[];
}

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ReportsDashboard({
  initialSites,
  initialBills,
  initialPayments,
  initialLabours,
  initialSupervisors,
  initialAttendances,
  initialSupplyEntries,
}: ReportsDashboardProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "fy" | "all">("all");
  const [activeTab, setActiveTab] = useState<"financial" | "labour" | "supervisor" | "billing">("financial");

  // Date filtering logic
  const now = new Date();
  const dateCutoff = useMemo(() => {
    if (timeRange === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    }
    if (timeRange === "90d") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return d;
    }
    if (timeRange === "fy") {
      // Current Financial Year (Starting April 1)
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return new Date(currentYear, 3, 1);
    }
    return null;
  }, [timeRange]);

  // Filtered Datasets based on Site and Date
  const filteredSites = useMemo(() => {
    if (selectedSiteId === "all") return initialSites;
    return initialSites.filter((s) => s.id === selectedSiteId);
  }, [selectedSiteId, initialSites]);

  const filteredBills = useMemo(() => {
    return initialBills.filter((b) => {
      const matchSite = selectedSiteId === "all" || b.siteId === selectedSiteId;
      const matchDate = !dateCutoff || new Date(b.billDate || b.createdAt) >= dateCutoff;
      return matchSite && matchDate;
    });
  }, [initialBills, selectedSiteId, dateCutoff]);

  const filteredPayments = useMemo(() => {
    return initialPayments.filter((p) => {
      const matchSite = selectedSiteId === "all" || p.siteId === selectedSiteId;
      const matchDate = !dateCutoff || new Date(p.date) >= dateCutoff;
      return matchSite && matchDate;
    });
  }, [initialPayments, selectedSiteId, dateCutoff]);

  const filteredLabours = useMemo(() => {
    if (selectedSiteId === "all") return initialLabours;
    return initialLabours.filter((l) => l.siteId === selectedSiteId);
  }, [initialLabours, selectedSiteId]);

  const filteredAttendances = useMemo(() => {
    return initialAttendances.filter((a) => {
      const matchSite = selectedSiteId === "all" || a.siteId === selectedSiteId;
      const matchDate = !dateCutoff || new Date(a.date) >= dateCutoff;
      return matchSite && matchDate;
    });
  }, [initialAttendances, selectedSiteId, dateCutoff]);

  // ==========================================
  // TOP EXECUTIVE KPI AGGREGATIONS
  // ==========================================
  const totalBilledGross = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      const lineSum = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
      const cgst = lineSum * ((b.cgstPct ?? 9) / 100);
      const sgst = lineSum * ((b.sgstPct ?? 9) / 100);
      return sum + (lineSum + cgst + sgst);
    }, 0);
  }, [filteredBills]);

  const totalBilledTaxable = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      const lineSum = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
      return sum + lineSum;
    }, 0);
  }, [filteredBills]);

  const totalPaymentsReceived = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const totalOutstandingReceivable = Math.max(0, totalBilledGross - totalPaymentsReceived);
  const collectionPercentage = totalBilledGross > 0 ? Math.min(100, Math.round((totalPaymentsReceived / totalBilledGross) * 100)) : 0;

  // Labour Wage Liability
  const totalLabourWagesEarned = useMemo(() => {
    return filteredAttendances.reduce((sum, a) => {
      const hajari = Number(a.hajari) || 0;
      const rate = Number(a.hajariRate) || (a.labour?.dailyWage) || 800;
      return sum + (hajari * rate);
    }, 0);
  }, [filteredAttendances]);

  const totalLabourPaymentsMade = useMemo(() => {
    return filteredLabours.reduce((sum, l) => {
      const paySum = (l.payments || []).reduce((s: number, p: any) => {
        const matchDate = !dateCutoff || new Date(p.date) >= dateCutoff;
        return matchDate ? s + (Number(p.amount) || 0) : s;
      }, 0);
      return sum + paySum;
    }, 0);
  }, [filteredLabours, dateCutoff]);

  // Supervisor Salaries
  const totalSupervisorEarned = useMemo(() => {
    return initialSupervisors.reduce((sum, s) => {
      const atts = (s.supervisorAttendances || []).filter((a: any) => {
        const matchDate = !dateCutoff || new Date(a.date) >= dateCutoff;
        return matchDate;
      });
      const supSum = atts.reduce((aSum: number, a: any) => aSum + (Number(a.earnedAmount) || 0), 0);
      return sum + supSum;
    }, 0);
  }, [initialSupervisors, dateCutoff]);

  const totalSupervisorPaid = useMemo(() => {
    return initialSupervisors.reduce((sum, s) => {
      const pays = (s.supervisorPayments || []).filter((p: any) => {
        const matchDate = !dateCutoff || new Date(p.date) >= dateCutoff;
        return matchDate;
      });
      const supPay = pays.reduce((pSum: number, p: any) => pSum + (Number(p.amount) || 0), 0);
      return sum + supPay;
    }, 0);
  }, [initialSupervisors, dateCutoff]);

  const grossMargin = totalBilledTaxable - totalLabourWagesEarned - totalSupervisorEarned;

  // ==========================================
  // CHART DATA: FINANCIALS PER SITE
  // ==========================================
  const siteFinancialChartData = useMemo(() => {
    return filteredSites.map((site) => {
      const sBills = filteredBills.filter((b) => b.siteId === site.id);
      const sPayments = filteredPayments.filter((p) => p.siteId === site.id);

      const billed = sBills.reduce((sum, b) => {
        const lSum = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
        return sum + lSum;
      }, 0);

      const received = sPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const balance = Math.max(0, billed - received);

      return {
        name: site.projectName.length > 18 ? site.projectName.slice(0, 16) + "..." : site.projectName,
        fullName: site.projectName,
        client: site.client?.name || "Client",
        Billed: billed,
        Received: received,
        Outstanding: balance,
      };
    });
  }, [filteredSites, filteredBills, filteredPayments]);

  // Client Revenue Share Donut Data
  const clientRevenueData = useMemo(() => {
    const clientMap = new Map<string, number>();
    for (const b of filteredBills) {
      const cName = b.site?.client?.name || "Other Client";
      const amt = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
      clientMap.set(cName, (clientMap.get(cName) || 0) + amt);
    }
    return Array.from(clientMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredBills]);

  // ==========================================
  // CHART DATA: LABOUR CATEGORY & DAILY HAJARI
  // ==========================================
  const labourCategoryExpenseData = useMemo(() => {
    const catMap = new Map<string, { name: string; count: number; wages: number }>();
    for (const a of filteredAttendances) {
      const catName = a.labour?.labourCategory?.name || "General Labour";
      const hajari = Number(a.hajari) || 0;
      const rate = Number(a.hajariRate) || (a.labour?.dailyWage) || 800;
      const cur = catMap.get(catName) || { name: catName, count: 0, wages: 0 };
      cur.count += hajari > 0 ? 1 : 0;
      cur.wages += hajari * rate;
      catMap.set(catName, cur);
    }
    return Array.from(catMap.values());
  }, [filteredAttendances]);

  const dailyHajariTrendData = useMemo(() => {
    const dateMap = new Map<string, { date: string; present: number; halfDay: number; absent: number; totalShifts: number }>();
    
    // Sort attendances ascending by date
    const sortedAtts = [...filteredAttendances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const a of sortedAtts) {
      const dStr = new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const cur = dateMap.get(dStr) || { date: dStr, present: 0, halfDay: 0, absent: 0, totalShifts: 0 };
      const haj = Number(a.hajari) || 0;
      if (haj >= 1.0) cur.present++;
      else if (haj > 0) cur.halfDay++;
      else cur.absent++;
      cur.totalShifts += haj;
      dateMap.set(dStr, cur);
    }
    return Array.from(dateMap.values()).slice(-14); // Last 14 days recorded
  }, [filteredAttendances]);

  // Labour Matrix Table
  const labourMatrixList = useMemo(() => {
    return filteredLabours.map((l) => {
      const lAtts = filteredAttendances.filter((a) => a.labourId === l.id);
      const totalHaj = lAtts.reduce((s, a) => s + (Number(a.hajari) || 0), 0);
      const rate = Number(l.dailyWage) || 800;
      const grossEarned = totalHaj * rate;
      const advancePaid = (l.payments || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
      const balance = grossEarned - advancePaid;

      return {
        id: l.id,
        name: l.name,
        category: l.labourCategory?.name || "Helper",
        site: l.site?.projectName || "—",
        totalHajari: totalHaj,
        dailyWage: rate,
        grossEarned,
        advancePaid,
        balance,
      };
    }).sort((a, b) => b.grossEarned - a.grossEarned);
  }, [filteredLabours, filteredAttendances]);

  // ==========================================
  // CHART DATA: SUPERVISOR PAYROLL
  // ==========================================
  const supervisorPayrollData = useMemo(() => {
    return initialSupervisors.map((sup) => {
      const atts = sup.supervisorAttendances || [];
      const presentCount = atts.filter((a: any) => a.status === "PRESENT").length;
      const halfCount = atts.filter((a: any) => a.status === "HALF_DAY").length;
      const absentCount = atts.filter((a: any) => a.status === "ABSENT").length;
      const grossEarned = atts.reduce((sum: number, a: any) => sum + (Number(a.earnedAmount) || 0), 0);
      const totalPaid = (sup.supervisorPayments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const balanceDue = Math.max(0, grossEarned - totalPaid);

      return {
        id: sup.id,
        name: sup.name,
        monthlySalary: sup.monthlySalary || 30000,
        dailyRate: Math.round(((sup.monthlySalary || 30000) / 30) * 100) / 100,
        presentCount,
        halfCount,
        absentCount,
        grossEarned,
        totalPaid,
        balanceDue,
      };
    });
  }, [initialSupervisors]);

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
            {/* Site Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-indigo-500/30 text-xs">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Sites ({initialSites.length})</option>
                {initialSites.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.projectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Presets */}
            <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-indigo-500/30 text-xs">
              <button
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "all" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeRange("fy")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "fy" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                This FY
              </button>
              <button
                onClick={() => setTimeRange("90d")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "90d" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                90 Days
              </button>
              <button
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "30d" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
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
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-0">{filteredBills.length} Bills</Badge>
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
              From {filteredSites.length} active construction sites
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
                            {clientRevenueData.map((entry, index) => (
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
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" /> Project Realization Ledger
                  </CardTitle>
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
                        {siteFinancialChartData.map((s, idx) => {
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
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" /> Labourer Wage & Advance Payout Matrix
                    </CardTitle>
                    <CardDescription>Individual worker hajaris, daily wage rates, gross earnings and pending balances</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">{labourMatrixList.length} Active Labours</Badge>
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
                        {labourMatrixList.map((lab) => (
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
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" /> Supervisor Monthly Compensation Registry
                  </CardTitle>
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
                        {supervisorPayrollData.map((sup) => (
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
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-0 font-mono">
                    {filteredBills.length} Invoices
                  </Badge>
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
                        {filteredBills.map((b) => {
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
