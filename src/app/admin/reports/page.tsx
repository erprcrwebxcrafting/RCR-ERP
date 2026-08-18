import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";
import { getFinancialYearDates } from "@/lib/get-fy";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const resolvedParams = await searchParams;
  const range = resolvedParams.range || "30d";

  const { startDate: fyStart, endDate: fyEnd, isAllTime } = await getFinancialYearDates();
  
  let startDate = fyStart;
  let endDate = fyEnd;

  if (range === "30d") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else if (range === "90d") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
  }

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
      where: { billDate: { gte: startDate, lte: endDate } },
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
      where: { date: { gte: startDate, lte: endDate } },
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
        assignedSites: {
          where: { site: { active: true } },
          select: { siteId: true }
        },
        supervisorAttendances: {
          where: { date: { gte: startDate, lte: endDate } },
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
      where: { date: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        date: true,
        hajari: true,
        hajariRate: true,
        overtimeHrs: true,
        siteId: true,
        labourId: true,
        labour: {
          select: {
            dailyWage: true,
            labourCategory: { select: { name: true } }
          }
        }
      },
      orderBy: { date: "desc" }
    }),
    prisma.supplyLabourEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
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
      initialRange={range}
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
