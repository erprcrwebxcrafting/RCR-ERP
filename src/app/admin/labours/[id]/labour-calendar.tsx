"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Attendance = { id: string; date: string | Date; status: string; overtimeHrs: number; hajari: number; hajariRate: number; remarks?: string | null };
type Payment = { id: string; date: string | Date; amount: number; reason?: string | null };

export function LabourCalendar({ attendances, payments }: { attendances: Attendance[], payments: Payment[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get local date string YYYY-MM-DD safely
  const toLocalString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayString = toLocalString(new Date());

  // Helpers to get data for a day
  const getDayData = (date: Date) => {
    const dateString = toLocalString(date);
    
    const dayAttendances = attendances.filter(a => {
      // a.date might be a string from Next.js serialization or a Date object
      const aDateStr = typeof a.date === "string" ? a.date.substring(0, 10) : toLocalString(a.date);
      return aDateStr === dateString;
    });
    
    const dayPayments = payments.filter(p => {
      const pDateStr = typeof p.date === "string" ? p.date.substring(0, 10) : toLocalString(p.date);
      return pDateStr === dateString;
    });

    return { att: dayAttendances[0], payments: dayPayments };
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <CardTitle className="text-lg font-medium">Calendar Overview</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="font-semibold min-w-[140px] text-center">{monthName}</div>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {weekdays.map(day => (
                <div key={day} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="bg-card min-h-[100px]" />;
            
            const { att, payments } = getDayData(date);
            const isToday = todayString === toLocalString(date);
            
            return (
              <div key={i} className={`bg-card min-h-[100px] p-2 flex flex-col gap-1 transition-colors hover:bg-muted/30 ${isToday ? "bg-primary/5" : ""}`}>
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {date.getDate()}
                </div>
                
                <div className="flex flex-col gap-1 flex-1 mt-1">
                  {att && (
                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-fit
                      ${att.status === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 
                        att.status === 'ABSENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                      {att.status === 'PRESENT' ? `${att.hajari} Hajari` : att.status === 'ABSENT' ? 'Absent' : 'Half Day'}
                      {att.status === 'PRESENT' && att.hajariRate > 0 && <span className="block font-bold mt-0.5 opacity-80">@ ₹{att.hajariRate}</span>}
                      {att.remarks && <span className="block text-[9px] leading-tight opacity-90 mt-0.5 italic">{att.remarks}</span>}
                    </div>
                  )}
                  {payments.map(p => (
                    <div key={p.id} className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded w-fit border border-red-100 dark:border-red-900/50">
                      <span className="font-bold">-₹{p.amount.toLocaleString("en-IN")}</span>
                      {p.reason && <span className="block text-[9px] leading-tight text-red-500/80 mt-0.5">{p.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
