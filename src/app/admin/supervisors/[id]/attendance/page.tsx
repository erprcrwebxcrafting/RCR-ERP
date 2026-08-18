import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, UserCheck, IndianRupee } from "lucide-react";
import { AttendanceCalendar } from "./attendance-calendar";

export const dynamic = "force-dynamic";

export default async function SupervisorAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supervisor = await prisma.user.findUnique({
    where: { id, role: "SUPERVISOR" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      monthlySalary: true,
      // ✅ No passwordHash, aadharNumber etc.
      assignedSites: {
        where: { site: { active: true } },
        select: { site: { select: { id: true, projectName: true } } }
      },
      supervisorAttendances: {
        orderBy: { date: "asc" },
        select: { id: true, supervisorId: true, date: true, status: true, dailyRate: true, earnedAmount: true, remarks: true }
      },
    },
  });

  if (!supervisor) notFound();

  const monthlySalary = supervisor.monthlySalary || 0;
  const standardDailyRate = Math.round((monthlySalary / 30) * 100) / 100;

  // Format attendance records for client component
  const attendances = (supervisor.supervisorAttendances || []).map((att) => ({
    id: att.id,
    supervisorId: att.supervisorId,
    date: att.date.toISOString(),
    status: att.status,
    dailyRate: att.dailyRate,
    earnedAmount: att.earnedAmount,
    remarks: att.remarks,
  }));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href={`/admin/supervisors/${supervisor.id}`}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              Supervisor Attendance & Daily Salary
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {supervisor.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
              Monthly Salary: <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{monthlySalary.toLocaleString("en-IN")}</span> (Daily Rate: ₹{standardDailyRate}/day)
              {supervisor.assignedSites.length > 0 && ` • Assigned to ${supervisor.assignedSites.map((a: any) => a.site.projectName).join(", ")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar */}
      <AttendanceCalendar
        supervisor={{
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          monthlySalary: supervisor.monthlySalary,
        }}
        initialAttendances={attendances}
      />
    </div>
  );
}
