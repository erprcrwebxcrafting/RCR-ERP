import { prisma } from "@/lib/prisma";
import { SupervisorAttendanceHub } from "./supervisor-attendance-hub";

export const dynamic = "force-dynamic";

export default async function SupervisorAttendanceHubPage() {
  const [supervisors, allSites, attendances] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      include: {
        assignedSites: { include: { site: true } },
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
    prisma.supervisorAttendance.findMany({
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
  }));

  return (
    <SupervisorAttendanceHub
      supervisors={supervisors as any}
      allSites={allSites}
      initialAttendances={formattedAttendances}
    />
  );
}
