import { prisma } from "@/lib/prisma";
import { SupervisorAttendanceHub } from "./supervisor-attendance-hub";

export const dynamic = "force-dynamic";

export default async function SupervisorAttendanceHubPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const resolvedParams = await searchParams;
  const now = new Date();

  // Parse month/year from URL, default to current month
  const selectedMonth = resolvedParams.month ? parseInt(resolvedParams.month) : now.getMonth();
  const selectedYear = resolvedParams.year ? parseInt(resolvedParams.year) : now.getFullYear();

  // ✅ Load data for the selected month (or current month if none selected)
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  const [supervisors, allSites, attendances] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        monthlySalary: true,
        // ✅ NO passwordHash, aadharNumber, bankAccount etc.
        assignedSites: {
          where: { site: { active: true } },
          select: { site: { select: { id: true, projectName: true } } }
        },
        supervisorPayments: {
          select: { amount: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.site.findMany({
      where: { active: true },
      select: { id: true, projectName: true },
      orderBy: { projectName: "asc" },
    }),
    // ✅ Only current month — ~40 records max (20 supervisors × ~30 days current month)
    prisma.supervisorAttendance.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  const formattedAttendances = attendances.map((a) => ({
    id: a.id,
    supervisorId: a.supervisorId,
    date: a.date.toISOString(),
    status: a.status,
    dailyRate: a.dailyRate,
    earnedAmount: a.earnedAmount,
    remarks: a.remarks,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <SupervisorAttendanceHub
      supervisors={supervisors as any}
      allSites={allSites}
      initialAttendances={formattedAttendances}
    />
  );
}
