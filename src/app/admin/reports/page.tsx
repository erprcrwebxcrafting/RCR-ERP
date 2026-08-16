import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
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
      include: {
        client: true,
        buildings: true,
      },
      orderBy: { projectName: "asc" },
    }),
    prisma.runningBill.findMany({
      include: {
        site: {
          include: { client: true },
        },
        lines: true,
        supplyLabourEntries: true,
      },
      orderBy: { billDate: "desc" },
    }),
    prisma.payment.findMany({
      include: { site: true },
      orderBy: { date: "desc" },
    }),
    prisma.labour.findMany({
      include: {
        labourCategory: true,
        site: true,
        payments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      include: {
        supervisorAttendances: {
          orderBy: { date: "desc" },
        },
        supervisorPayments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      include: {
        site: true,
        labour: {
          include: { labourCategory: true },
        },
      },
      orderBy: { date: "desc" },
    }),
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
