"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDaysInMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  CalendarDays,
  Sparkles,
  Info,
  Lock,
} from "lucide-react";
import { markSupervisorAttendanceAction, deleteSupervisorAttendanceAction } from "./actions";
import { toast } from "sonner";

type AttendanceRecord = {
  id: string;
  supervisorId: string;
  date: string | Date;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | string;
  dailyRate: number;
  earnedAmount: number;
  remarks?: string | null;
  createdAt?: string | Date;
};

type Props = {
  supervisor: {
    id: string;
    name: string;
    email: string;
    monthlySalary: number | null;
  };
  initialAttendances: AttendanceRecord[];
};

export function AttendanceCalendar({ supervisor, initialAttendances }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthlySalary = supervisor.monthlySalary || 0;
  const currentMonthDays = getDaysInMonth(currentDate);
  const standardDailyRate = Math.round((monthlySalary / currentMonthDays) * 100) / 100;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a map for fast lookup by "YYYY-MM-DD"
  const attendanceMap = new Map<string, AttendanceRecord>();
  initialAttendances.forEach((att) => {
    const d = new Date(att.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    attendanceMap.set(key, att);
  });

  // Calculate monthly stats for the visible month
  let monthPresentCount = 0;
  let monthHalfDayCount = 0;
  let monthAbsentCount = 0;
  let monthTotalEarned = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const att = attendanceMap.get(key);
    if (att) {
      if (att.status === "PRESENT") monthPresentCount++;
      else if (att.status === "HALF_DAY") monthHalfDayCount++;
      else if (att.status === "ABSENT") monthAbsentCount++;
      monthTotalEarned += att.earnedAmount || 0;
    }
  }

  const handleMarkStatus = (day: number, status: "PRESENT" | "HALF_DAY" | "ABSENT") => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    startTransition(async () => {
      try {
        const res = await markSupervisorAttendanceAction(supervisor.id, dateStr, status);
        if (res && res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`Attendance marked as ${status} for ${dateStr}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to mark attendance");
      }
    });
  };

  const handleClear = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const att = attendanceMap.get(dateStr);
    if (att) {
      startTransition(async () => {
        try {
          const res = await deleteSupervisorAttendanceAction(att.id, supervisor.id);
          if (res && res.error) {
            toast.error(res.error);
            return;
          }
          toast.success(`Cleared attendance for day ${day}`);
        } catch (err: any) {
          toast.error(err.message || "Failed to clear attendance");
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards for Selected Month */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Salary Rate</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  ₹{standardDailyRate.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">Dynamic (Monthly ₹{monthlySalary.toLocaleString("en-IN")} ÷ {currentMonthDays})</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present Days</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {monthPresentCount} <span className="text-xs sm:text-sm font-semibold text-slate-400">days</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{monthHalfDayCount > 0 ? `+ ${monthHalfDayCount} half days` : "Full attendance"}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent Days</p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {monthAbsentCount} <span className="text-xs sm:text-sm font-semibold text-slate-400">days</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Unmarked or absent</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/40 dark:to-violet-950/40 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Earned This Month</p>
                <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{monthTotalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">For {monthNames[month]} {year}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {monthNames[month]} {year}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any day to mark attendance (Present, Half Day, Absent) & view daily earnings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 font-semibold"
              >
                Today
              </Button>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevMonth}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6">
          {/* Day Headers (Sun - Sat) */}
          <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="min-w-[580px]">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg ${
                  idx === 0 || idx === 6
                    ? "text-rose-500 bg-rose-50/40 dark:bg-rose-950/20"
                    : "text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30"
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${year}-${month}-${idx}`} className="min-h-[80px] sm:min-h-[95px] md:min-h-[105px] rounded-xl bg-slate-50/30 dark:bg-slate-800/10 border border-dashed border-slate-100 dark:border-slate-800/40 opacity-40" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const att = attendanceMap.get(dateStr);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              let cardBg = "bg-white dark:bg-slate-900 hover:border-blue-400";
              let statusBadge = null;

              if (att?.status === "PRESENT") {
                cardBg = "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70 shadow-sm";
                statusBadge = (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md w-fit">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> Present
                  </div>
                );
              } else if (att?.status === "HALF_DAY") {
                cardBg = "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 shadow-sm";
                statusBadge = (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-md w-fit">
                    <Clock className="h-3 w-3 shrink-0" /> Half Day
                  </div>
                );
              } else if (att?.status === "ABSENT") {
                cardBg = "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/70 shadow-sm";
                statusBadge = (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/50 px-1.5 py-0.5 rounded-md w-fit">
                    <XCircle className="h-3 w-3 shrink-0" /> Absent
                  </div>
                );
              }

              let isLocked = false;
              if (att && att.createdAt) {
                const createdAtTime = new Date(att.createdAt).getTime();
                const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
                isLocked = createdAtTime < twentyFourHoursAgo;
              }

              return (
                <div
                  key={`day-${year}-${month}-${day}`}
                  className={`group relative min-h-[80px] sm:min-h-[95px] md:min-h-[110px] p-1.5 sm:p-2 md:p-2.5 rounded-xl border transition-all flex flex-col justify-between ${cardBg} ${
                    isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""
                  }`}
                >
                  {/* Header: Date + Today Indicator */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold ${
                        isToday
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day}
                    </span>
                    {statusBadge}
                  </div>

                  {/* Daily Earning Box */}
                  <div className="my-1">
                    {att ? (
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <div className="text-[11px] sm:text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">
                            ₹{att.earnedAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                          {isLocked && <span title="Locked (24h past)"><Lock className="h-3 w-3 text-slate-400" /></span>}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium truncate">
                          Rate: ₹{Math.round(att.dailyRate * 100) / 100}
                        </p>
                        {att.remarks && (
                          <p className="text-[9px] mt-1 text-slate-500 italic leading-tight opacity-90 truncate" title={att.remarks}>
                            {att.remarks}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300 dark:text-slate-600 italic">
                        Not marked
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons on Hover */}
                  {!isLocked && (
                    <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkStatus(day, "PRESENT")}
                        title="Mark Present (Full Day)"
                        className="flex-1 py-1 text-[10px] font-bold rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkStatus(day, "HALF_DAY")}
                        title="Mark Half Day (0.5x Pay)"
                        className="flex-1 py-1 text-[10px] font-bold rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        HD
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkStatus(day, "ABSENT")}
                        title="Mark Absent (₹0 Pay)"
                        className="flex-1 py-1 text-[10px] font-bold rounded bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                      >
                        A
                      </button>
                      {att && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleClear(day)}
                          title="Clear Attendance"
                          className="py-1 px-1.5 text-[10px] font-bold rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Legend / Quick Note */}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-700 dark:text-slate-300">Quick Guide:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span><strong>P:</strong> Full Day (100% Daily Rate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span><strong>HD:</strong> Half Day (50% Daily Rate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span><strong>A:</strong> Absent (₹0 Rate)</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Info className="h-3.5 w-3.5" />
              <span>Calculated at 1/30th monthly salary per present day</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
