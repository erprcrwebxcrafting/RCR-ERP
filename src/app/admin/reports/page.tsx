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
      select: {
        id: true,
        projectName: true,
        client: { select: { name: true } }
      },
      orderBy: { projectName: "asc" },
    }),
    prisma.runningBill.findMany({
      select: {
        id: true,
        billNo: true,
        billDate: true,
        siteId: true,
        site: { select: { projectName: true, client: { select: { name: true } } } },
        lines: { select: { currentAmount: true } },
      },
      orderBy: { billDate: "desc" },
    }),
    prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        siteId: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.labour.findMany({
      select: {
        id: true,
        name: true,
        dailyWage: true,
        active: true,
        siteId: true,
        labourCategory: { select: { name: true } },
        payments: {
          select: { amount: true, date: true },
          orderBy: { date: "desc" },
          take: 12,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      select: {
        id: true,
        name: true,
        monthlySalary: true,
        supervisorAttendances: {
          where: { date: { gte: yearStart, lte: yearEnd } },
          select: { date: true, status: true, earnedAmount: true },
          orderBy: { date: "desc" },
        },
        supervisorPayments: {
          select: { amount: true, date: true },
          orderBy: { date: "desc" },
          take: 24,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: yearStart, lte: yearEnd } },
      select: {
        id: true,
        date: true,
        hajari: true,
        hajariRate: true,
        overtimeHours: true,
        overtimeRate: true,
        siteId: true,
        labourId: true,
        labour: {
          select: {
            dailyWage: true,
            labourCategory: { select: { name: true } }
          }
        }
      },
      orderBy: { date: "desc" },
    }),
    prisma.supplyLabourEntry.findMany({
      select: {
        id: true,
        date: true,
        totalAmount: true,
        siteId: true,
      },
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
