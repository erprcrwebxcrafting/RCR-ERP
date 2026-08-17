import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // ✅ Limit to current year only — prevents loading all 610K historical records
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const [
    sites,
    bills,
    payments,
    labours,
    supervisors,
    attendances,
    supplyEntries,
  ] = await Promise.all([
    prisma.site.findMany({
      include: { client: true, buildings: true },
      orderBy: { projectName: "asc" },
    }),
    // ✅ All bills OK — only 1,160 total, small
    prisma.runningBill.findMany({
      include: {
        site: { include: { client: true } },
        lines: true,
        supplyLabourEntries: true,
      },
      orderBy: { billDate: "desc" },
    }),
    // ✅ All payments OK — only 1,160 total
    prisma.payment.findMany({
      include: { site: true },
      orderBy: { date: "desc" },
    }),
    // ✅ Labours without full payment history (too heavy)
    prisma.labour.findMany({
      include: {
        labourCategory: true,
        site: true,
        payments: {
          orderBy: { date: "desc" },
          take: 12, // last 12 payments only per labour
        },
      },
      orderBy: { name: "asc" },
    }),
    // ✅ Supervisors with only current year attendances
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      include: {
        supervisorAttendances: {
          where: { date: { gte: yearStart, lte: yearEnd } },
          orderBy: { date: "desc" },
        },
        supervisorPayments: {
          orderBy: { date: "desc" },
          take: 24, // last 24 payments only
        },
        assignedSites: true,
      },
      orderBy: { name: "asc" },
    }),
    // ✅ Attendance: current year only (was loading ALL 610K rows!)
    prisma.attendance.findMany({
      where: { date: { gte: yearStart, lte: yearEnd } },
      include: {
        site: true,
        labour: { include: { labourCategory: true } },
      },
      orderBy: { date: "desc" },
    }),
    // ✅ Supply entries: all OK — only 1,160 total
    prisma.supplyLabourEntry.findMany({
      include: { site: true },
      orderBy: { date: "desc" },
    }),
  ]);


  return (
    <ReportsDashboard
      initialSites={JSON.parse(JSON.stringify(sites))}
      initialBills={JSON.parse(JSON.stringify(bills))}
      initialPayments={JSON.parse(JSON.stringify(payments))}
      initialLabours={JSON.parse(JSON.stringify(labours))}
      initialSupervisors={JSON.parse(JSON.stringify(supervisors))}
      initialAttendances={JSON.parse(JSON.stringify(attendances))}
      initialSupplyEntries={JSON.parse(JSON.stringify(supplyEntries))}
    />
  );
}
