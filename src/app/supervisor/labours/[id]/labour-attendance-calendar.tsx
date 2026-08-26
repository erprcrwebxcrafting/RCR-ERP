"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
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
import { markIndividualLabourAttendance } from "./actions";
import { toast } from "sonner";

type AttendanceRecord = {
  id: string;
  labourId: string;
  date: string | Date;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | string;
  hajari: number;
  hajariRate: number;
  createdAt: string | Date;
};

type Props = {
  labour: {
    id: string;
    name: string;
    dailyWage: number;
  };
  initialAttendances: AttendanceRecord[];
};

export function LabourAttendanceCalendar({ labour, initialAttendances }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  const standardDailyRate = labour.dailyWage || 0;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attendanceMap = new Map<string, AttendanceRecord>();
  initialAttendances.forEach((att) => {
    const d = new Date(att.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    attendanceMap.set(key, att);
  });

  let monthHajariCount = 0;
  let monthAbsentCount = 0;
  let monthTotalEarned = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const att = attendanceMap.get(key);
    if (att) {
      if (att.hajari > 0) monthHajariCount += att.hajari;
      else monthAbsentCount++;
      monthTotalEarned += (att.hajari * att.hajariRate) || 0;
    }
  }

  const handleMarkHajari = (day: number, val: string | number) => {
    let hajari = typeof val === 'string' ? parseFloat(val) : val;

    if (val === "custom") {
      const input = window.prompt("Enter custom Hajari value (e.g., 1.25):");
      if (!input || input.trim() === "") return; // Cancelled
      
      const parsed = parseFloat(input);
      if (isNaN(parsed) || parsed < 0) {
        toast.error("Invalid custom value entered.");
        return;
      }
      hajari = parsed;
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    startTransition(async () => {
      try {
        await markIndividualLabourAttendance(labour.id, dateStr, hajari);
        toast.success(`Marked ${hajari} Hajari for ${labour.name}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to mark attendance");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/40 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Hajari This Month</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {monthHajariCount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-emerald-500/70">hajari</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/70 to-red-50/70 dark:from-rose-950/40 dark:to-red-950/40 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent Days</p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {monthAbsentCount} <span className="text-sm font-semibold text-rose-500/70">days</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600">
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
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <p className="text-xs text-slate-500 mt-0.5">Select a hajari value to mark attendance.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday} className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 font-semibold">Today</Button>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-2 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                  <div key={dayName} className={`py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg ${idx === 0 || idx === 6 ? "text-rose-500 bg-rose-50/40 dark:bg-rose-950/20" : "text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30"}`}>
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="min-h-[90px] sm:min-h-[110px] rounded-xl bg-slate-50/30 dark:bg-slate-800/10 border border-dashed border-slate-100 dark:border-slate-800/40 opacity-40" />
                ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const att = attendanceMap.get(dateStr);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              let isLocked = false;
              if (att && att.createdAt) {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                isLocked = new Date(att.createdAt).getTime() < twentyFourHoursAgo.getTime();
              }
              const now = new Date();
              const isFuture = new Date(year, month, day).getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

              let cardBg = "bg-white dark:bg-slate-900 hover:border-blue-400";
              if (att && att.hajari > 0) cardBg = "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70 shadow-sm";
              else if (att && att.hajari === 0) cardBg = "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/70 shadow-sm";

              return (
                <div key={day} className={`group relative min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 md:p-2.5 rounded-xl border transition-all flex flex-col justify-between ${cardBg} ${isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${isFuture ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold ${isToday ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300"}`}>{day}</span>
                    {att && (
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${att.hajari > 0 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50" : "text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/50"}`}>
                        {att.hajari > 0 ? `${att.hajari} Hajari` : "Absent"}
                      </div>
                    )}
                  </div>

                  <div className="my-1">
                    {att ? (
                      <div className="text-left">
                        <div className="text-[11px] sm:text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">
                          ₹{(att.hajari * att.hajariRate).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium truncate">Rate: ₹{att.hajariRate}</p>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300 dark:text-slate-600 italic">Not marked</div>
                    )}
                  </div>

                  {!isFuture && (
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                      {isLocked ? (
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 py-1 rounded">
                          <Lock className="h-3 w-3" /> Locked
                        </div>
                      ) : (
                        <select
                          disabled={isPending}
                          className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                          value={att ? att.hajari.toString() : ""}
                          onChange={(e) => handleMarkHajari(day, e.target.value)}
                        >
                          <option value="" disabled>Select Hajari</option>
                          <option value="0">Absent (0 Hajari)</option>
                          <option value="0.5">0.5 Hajari (Half Day)</option>
                          <option value="1">1.0 Hajari (Full Day)</option>
                          <option value="1.5">1.5 Hajari (1.5 Shifts)</option>
                          <option value="2">2.0 Hajari (Double Shift)</option>
                          <option value="2.5">2.5 Hajari (2.5 Shifts)</option>
                          <option value="3">3.0 Hajari (Triple Shift)</option>
                          <option value="3.5">3.5 Hajari</option>
                          <option value="4">4.0 Hajari</option>
                          <option value="4.5">4.5 Hajari</option>
                          <option value="5">5.0 Hajari</option>
                          <option value="5.5">5.5 Hajari</option>
                          <option value="6">6.0 Hajari</option>
                          <option value="6.5">6.5 Hajari</option>
                          <option value="7">7.0 Hajari</option>
                          <option value="7.5">7.5 Hajari</option>
                          <option value="8">8.0 Hajari</option>
                          <option value="8.5">8.5 Hajari</option>
                          <option value="9">9.0 Hajari</option>
                          <option value="9.5">9.5 Hajari</option>
                          <option value="10">10.0 Hajari</option>
                          <option value="custom" className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900">
                            + Custom Hajari Value...
                          </option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
