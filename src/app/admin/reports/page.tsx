import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";
import { getFinancialYearDates } from "@/lib/get-fy";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const resolvedParams = await searchParams;
  const range = resolvedParams.range || "fy";

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

  if (isAllTime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in duration-500">
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Select a Financial Year</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          The Reports dashboard requires a specific timeframe to generate meaningful graphs and prevent memory overload. 
          Please select a specific Financial Year (e.g., FY 2024-2025) from the sidebar dropdown to view detailed analytics.
        </p>
      </div>
    );
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
