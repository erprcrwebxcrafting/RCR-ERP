"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarDays,
  UserCheck,
  Building2,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  Eye,
  Calendar as CalendarIcon,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  markSupervisorAttendanceUniversal,
  markAllSupervisorsAttendanceUniversal,
  clearSupervisorAttendanceUniversal,
} from "./actions";

interface SupervisorRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  monthlySalary: number | null;
  assignedSites: Array<{ site: { id: string; projectName: string } }>;
  supervisorPayments: Array<{ amount: number }>;
}

interface AttendanceItem {
  id: string;
  supervisorId: string;
  date: string; // YYYY-MM-DD
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | string;
  dailyRate: number;
  earnedAmount: number;
  remarks: string | null;
}

interface SupervisorAttendanceHubProps {
  supervisors: SupervisorRecord[];
  allSites: Array<{ id: string; projectName: string }>;
  initialAttendances: AttendanceItem[];
}

export function SupervisorAttendanceHub({
  supervisors,
  allSites,
  initialAttendances,
}: SupervisorAttendanceHubProps) {
  const [selectedTab, setSelectedTab] = useState<"daily" | "monthly" | "payroll">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Map of attendances by `supervisorId_YYYY-MM-DD`
  const attendanceMap: Record<string, AttendanceItem> = {};
  initialAttendances.forEach((att) => {
    const dStr = att.date.split("T")[0];
    attendanceMap[`${att.supervisorId}_${dStr}`] = att;
  });

  // Filtered supervisors
  const filteredSupervisors = supervisors.filter((s) => {
    const matchesQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery));

    const matchesSite =
      !siteFilter ||
      s.assignedSites.some((as) => as.site.id === siteFilter);

    return matchesQuery && matchesSite;
  });

  // Date Navigation Helpers
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Single attendance marker
  const handleMarkAttendance = (
    supervisorId: string,
    status: "PRESENT" | "HALF_DAY" | "ABSENT"
  ) => {
    startTransition(async () => {
      try {
        const res = await markSupervisorAttendanceUniversal(
          supervisorId,
          selectedDate,
          status
        );
        toast.success(`Marked as ${status}`, {
          description: `${res.supervisorName} for ${selectedDate} (Earned: ₹${res.earnedAmount})`,
        });
      } catch (err: any) {
        toast.error("Failed to mark attendance", {
          description: err?.message || "Please retry.",
        });
      }
    });
  };

  // Clear single attendance
  const handleClearAttendance = (supervisorId: string) => {
    startTransition(async () => {
      try {
        await clearSupervisorAttendanceUniversal(supervisorId, selectedDate);
        toast.success("Attendance cleared for selected date.");
      } catch (err: any) {
        toast.error("Failed to clear attendance", { description: err?.message });
      }
    });
  };

  // Mark all supervisors present
  const handleMarkAllPresent = () => {
    startTransition(async () => {
      try {
        const res = await markAllSupervisorsAttendanceUniversal(
          selectedDate,
          "PRESENT"
        );
        toast.success(`Marked all ${res.count} supervisors as PRESENT!`, {
          description: `Date: ${selectedDate}`,
        });
      } catch (err: any) {
        toast.error("Bulk mark failed", { description: err?.message });
      }
    });
  };

  // Calculate Daily Stats for selectedDate
  let presentTodayCount = 0;
  let halfDayTodayCount = 0;
  let absentTodayCount = 0;
  let unmarkedTodayCount = 0;

  supervisors.forEach((s) => {
    const key = `${s.id}_${selectedDate}`;
    const rec = attendanceMap[key];
    if (rec?.status === "PRESENT") presentTodayCount++;
    else if (rec?.status === "HALF_DAY") halfDayTodayCount++;
    else if (rec?.status === "ABSENT") absentTodayCount++;
    else unmarkedTodayCount++;
  });

  // Monthly stats calculations for selectedMonth/Year
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthDates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    monthDates.push(dStr);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedDateObj = new Date(selectedDate);
  selectedDateObj.setHours(0, 0, 0, 0);
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const isLocked = selectedDateObj.getTime() < yesterday.getTime();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-2xl shadow-blue-500/20 border border-blue-400/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20">
              <ShieldCheck className="h-4 w-4" />
              Central Attendance & Payroll Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Supervisor Attendance Hub
            </h1>
            <p className="text-blue-100 text-sm sm:text-base font-medium max-w-2xl">
              Centralized interface to mark daily shifts, inspect monthly attendance sheets, and monitor salary realization for all site supervisors.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/admin/supervisors">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold">
                Supervisor Directory
              </Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold">
                Labour Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {selectedTab === "daily" && !isLocked && unmarkedTodayCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-xl shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-300">Action Required: Unmarked Attendance</h3>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mt-1 leading-relaxed">
              You have <strong>{unmarkedTodayCount}</strong> supervisor{unmarkedTodayCount !== 1 ? 's' : ''} with unmarked attendance for {new Date(selectedDate).toLocaleDateString('en-IN')}. Please ensure all attendances are marked to prevent them from being permanently locked.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisors</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{supervisors.length}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{presentTodayCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-amber-200 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Half Day</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{halfDayTodayCount}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</p>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{absentTodayCount}</p>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unmarked</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">{unmarkedTodayCount}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setSelectedTab("daily")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedTab === "daily"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Daily Marking Matrix
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("monthly")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedTab === "monthly"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            Monthly Attendance Sheet
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("payroll")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedTab === "payroll"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <IndianRupee className="h-4 w-4" />
            Payroll Ledger
          </button>
        </div>

        {/* Global Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supervisor..."
              className="pl-9 h-11 w-48 sm:w-60 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="flex h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Sites</option>
            {allSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: DAILY MARKING MATRIX */}
      {selectedTab === "daily" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Date Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShiftDate(-1)}
                className="h-10 w-10 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 rounded-xl font-bold w-44 font-mono cursor-pointer"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShiftDate(1)}
                className="h-10 w-10 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetToday}
                className="h-10 rounded-xl px-4 text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Selected:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {new Date(selectedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </strong>
              </span>
              <Button
                onClick={handleMarkAllPresent}
                disabled={isPending}
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                Mark All Present
              </Button>
            </div>
          </div>

          {/* Supervisors Daily Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSupervisors.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No supervisors found.</p>
                </div>
              ) : (
                filteredSupervisors.map((sup, idx) => {
                  const key = `${sup.id}_${selectedDate}`;
                  const currentAtt = attendanceMap[key];
                  const status = currentAtt?.status;
                  const monthlySalary = sup.monthlySalary || 0;
                  const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
                  const earnedAmt = currentAtt?.earnedAmount ?? (status === "PRESENT" ? dailyRate : status === "HALF_DAY" ? dailyRate / 2 : 0);

                  return (
                    <div
                      key={sup.id}
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        status === "PRESENT"
                          ? "bg-emerald-50/20 dark:bg-emerald-950/10"
                          : status === "HALF_DAY"
                          ? "bg-amber-50/20 dark:bg-amber-950/10"
                          : status === "ABSENT"
                          ? "bg-rose-50/20 dark:bg-rose-950/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-600 shrink-0">
                          {sup.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/supervisors/${sup.id}`}
                              className="font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                            >
                              {sup.name}
                            </Link>
                            <Link
                              href={`/admin/supervisors/${sup.id}/attendance`}
                              title="Open Individual Calendar View"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>
                              Salary: <strong>₹{monthlySalary.toLocaleString("en-IN")}</strong>/mo
                            </span>
                            <span>•</span>
                            <span>
                              Rate: <strong>₹{dailyRate}</strong>/day
                            </span>
                            {sup.assignedSites.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  {sup.assignedSites.map((as) => as.site.projectName).join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Status Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isLocked && <span className="text-xs text-rose-500 font-bold mr-2 hidden sm:inline">Locked (Past 24h)</span>}
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || isLocked}
                          onClick={() => handleMarkAttendance(sup.id, "PRESENT")}
                          className={`h-9 px-4 rounded-xl font-bold text-xs transition-all ${
                            status === "PRESENT"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
                          } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Present (₹{dailyRate})
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || isLocked}
                          onClick={() => handleMarkAttendance(sup.id, "HALF_DAY")}
                          className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all ${
                            status === "HALF_DAY"
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-700"
                          } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Half (₹{Math.round(dailyRate / 2)})
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || isLocked}
                          onClick={() => handleMarkAttendance(sup.id, "ABSENT")}
                          className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all ${
                            status === "ABSENT"
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-700"
                          } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Absent (₹0)
                        </Button>

                        {status && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isPending || isLocked}
                            title={isLocked ? "Cannot clear locked records" : "Reset / Clear status"}
                            onClick={() => handleClearAttendance(sup.id)}
                            className={`h-9 w-9 text-slate-400 hover:text-rose-500 rounded-xl ${isLocked ? "opacity-50 cursor-not-allowed hover:text-slate-400" : ""}`}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY ATTENDANCE SHEET */}
      {selectedTab === "monthly" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Month & Year Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="flex h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
              >
                {monthNames.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="flex h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" /> Present (P)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" /> Half Day (HD)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" /> Absent (A)
              </span>
            </div>
          </div>

          {/* 31-Day Attendance Sheet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-48 shadow-sm">
                    Supervisor
                  </th>
                  {monthDates.map((dStr) => {
                    const dayNum = parseInt(dStr.split("-")[2], 10);
                    return (
                      <th key={dStr} className="p-2 text-center w-8 font-mono">
                        {dayNum}
                      </th>
                    );
                  })}
                  <th className="p-3 text-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold">
                    P
                  </th>
                  <th className="p-3 text-center bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold">
                    HD
                  </th>
                  <th className="p-3 text-center bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold">
                    A
                  </th>
                  <th className="p-3 text-right bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold">
                    Earned Payout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSupervisors.map((sup) => {
                  let pCount = 0;
                  let hdCount = 0;
                  let aCount = 0;
                  let monthEarned = 0;

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 text-slate-800 dark:text-slate-200 whitespace-nowrap shadow-sm">
                        <Link
                          href={`/admin/supervisors/${sup.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {sup.name}
                        </Link>
                      </td>

                      {monthDates.map((dStr) => {
                        const key = `${sup.id}_${dStr}`;
                        const rec = attendanceMap[key];
                        const status = rec?.status;

                        if (status === "PRESENT") {
                          pCount++;
                          monthEarned += rec?.earnedAmount || 0;
                        } else if (status === "HALF_DAY") {
                          hdCount++;
                          monthEarned += rec?.earnedAmount || 0;
                        } else if (status === "ABSENT") {
                          aCount++;
                        }

                        return (
                          <td key={dStr} className="p-1 text-center">
                            {status === "PRESENT" ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                                P
                              </span>
                            ) : status === "HALF_DAY" ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-500 text-white font-bold text-[10px]">
                                H
                              </span>
                            ) : status === "ABSENT" ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-rose-500 text-white font-bold text-[10px]">
                                A
                              </span>
                            ) : (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-bold font-mono text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20">
                        {pCount}
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-amber-600 bg-amber-50/40 dark:bg-amber-950/20">
                        {hdCount}
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-rose-600 bg-rose-50/40 dark:bg-rose-950/20">
                        {aCount}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 whitespace-nowrap">
                        ₹{monthEarned.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PAYROLL & ADVANCE REALIZATION */}
      {selectedTab === "payroll" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredSupervisors.map((sup) => {
            const monthlySalary = sup.monthlySalary || 0;
            const totalAdvances = sup.supervisorPayments.reduce(
              (sum, p) => sum + (p.amount || 0),
              0
            );

            // Compute total earned to date across loaded attendance
            let totalEarnedAllTime = 0;
            let totalPresentAllTime = 0;
            let totalHalfAllTime = 0;

            initialAttendances
              .filter((a) => a.supervisorId === sup.id)
              .forEach((a) => {
                totalEarnedAllTime += a.earnedAmount || 0;
                if (a.status === "PRESENT") totalPresentAllTime++;
                if (a.status === "HALF_DAY") totalHalfAllTime++;
              });

            const netBalance = totalEarnedAllTime - totalAdvances;

            return (
              <Card
                key={sup.id}
                className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {sup.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {sup.email} {sup.phone && `• ${sup.phone}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Supervisor
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Salary</p>
                      <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                        ₹{monthlySalary.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Earned So Far</p>
                      <p className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                        ₹{totalEarnedAllTime.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Advance Taken</p>
                      <p className="text-base font-bold font-mono text-rose-700 dark:text-rose-400 mt-0.5">
                        ₹{totalAdvances.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${netBalance >= 0 ? "bg-blue-50 dark:bg-blue-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Net Payable</p>
                      <p className={`text-base font-black font-mono mt-0.5 ${netBalance >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-600"}`}>
                        ₹{netBalance.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Attendance: <strong>{totalPresentAllTime}P</strong>, <strong>{totalHalfAllTime}HD</strong>
                    </span>
                    <Link
                      href={`/admin/supervisors/${sup.id}/attendance`}
                      className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline gap-1"
                    >
                      Detailed Calendar <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
