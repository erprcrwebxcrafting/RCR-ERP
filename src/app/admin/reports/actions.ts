"use server";

import { prisma } from "@/lib/prisma";
import { getFinancialYearDates } from "@/lib/get-fy";

export async function fetchReportsDataAction(range: string, siteId: string, customStartDate?: string, customEndDate?: string) {
  const { startDate: fyStart, endDate: fyEnd } = await getFinancialYearDates();
  
  let effectiveStartDate: Date | undefined;
  let effectiveEndDate: Date | undefined;

  if (range === "1d") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    effectiveStartDate = d;
  } else if (range === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    effectiveStartDate = d;
  } else if (range === "90d") {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    effectiveStartDate = d;
  } else if (range === "this_year") {
    effectiveStartDate = fyStart;
    effectiveEndDate = fyEnd;
  } else if (range === "last_year") {
    const dStart = new Date(fyStart);
    dStart.setFullYear(dStart.getFullYear() - 1);
    const dEnd = new Date(fyEnd);
    dEnd.setFullYear(dEnd.getFullYear() - 1);
    effectiveStartDate = dStart;
    effectiveEndDate = dEnd;
  } else if (range === "custom") {
    if (customStartDate) effectiveStartDate = new Date(customStartDate);
    if (customEndDate) {
      const d = new Date(customEndDate);
      d.setHours(23, 59, 59, 999);
      effectiveEndDate = d;
    }
  }
  // "all_time" leaves effectiveStartDate and effectiveEndDate as undefined

  const dateFilter = {
    ...(effectiveStartDate && { gte: effectiveStartDate }),
    ...(effectiveEndDate && { lte: effectiveEndDate }),
  };
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const siteFilter = siteId !== "all" ? siteId : undefined;

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
      where: siteFilter ? { id: siteFilter } : undefined,
      select: {
        id: true,
        projectName: true,
        client: { select: { name: true } }
      },
      orderBy: { projectName: "asc" },
    }),
    prisma.runningBill.findMany({
      where: { 
        ...(hasDateFilter && { billDate: dateFilter }),
        ...(siteFilter && { siteId: siteFilter })
      },
      select: {
        id: true,
        billNo: true,
        billDate: true,
        siteId: true,
        cgstPct: true,
        sgstPct: true,
        site: { select: { projectName: true, client: { select: { name: true } } } },
        lines: { select: { currentAmount: true } },
      },
    }),
    prisma.payment.findMany({
      where: { 
        ...(hasDateFilter && { date: dateFilter }),
        ...(siteFilter && { siteId: siteFilter })
      },
      select: { amount: true, date: true, siteId: true },
    }),
    prisma.labour.findMany({
      where: siteFilter ? { siteId: siteFilter } : undefined,
      select: {
        id: true,
        name: true,
        dailyWage: true,
        siteId: true,
        labourCategory: { select: { name: true } },
        payments: {
          where: hasDateFilter ? { date: dateFilter } : undefined,
          select: { amount: true, date: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { 
        role: "SUPERVISOR",
        ...(siteFilter && { assignedSites: { some: { siteId: siteFilter } } })
      },
      select: {
        id: true,
        name: true,
        monthlySalary: true,
        assignedSites: { select: { siteId: true } },
        supervisorAttendances: {
          where: hasDateFilter ? { date: dateFilter } : undefined,
          select: { date: true, status: true, earnedAmount: true },
        },
        supervisorPayments: {
          where: hasDateFilter ? { date: dateFilter } : undefined,
          select: { amount: true, date: true },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { 
        ...(hasDateFilter && { date: dateFilter }),
        ...(siteFilter && { siteId: siteFilter })
      },
      select: {
        id: true,
        date: true,
        hajari: true,
        hajariRate: true,
        status: true,
        siteId: true,
        labourId: true,
        labour: {
          select: {
            name: true,
            dailyWage: true,
            labourCategory: { select: { name: true } }
          }
        }
      },
    }),
    prisma.supplyLabourEntry.findMany({
      where: { 
        ...(hasDateFilter && { date: dateFilter }),
        ...(siteFilter && { siteId: siteFilter })
      },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        siteId: true,
        site: { select: { projectName: true } }
      },
    }),
  ]);

  // Now, calculate the KPIs
  let totalBilledGross = 0;
  let totalBilledTaxable = 0;
  bills.forEach((b) => {
    const lineSum = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
    const cgst = lineSum * ((b.cgstPct ?? 9) / 100);
    const sgst = lineSum * ((b.sgstPct ?? 9) / 100);
    totalBilledGross += (lineSum + cgst + sgst);
    totalBilledTaxable += lineSum;
  });

  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOutstandingReceivable = Math.max(0, totalBilledGross - totalPaymentsReceived);
  const collectionPercentage = totalBilledGross > 0 ? Math.min(100, Math.round((totalPaymentsReceived / totalBilledGross) * 100)) : 0;

  const totalLabourWagesEarned = attendances.reduce((sum, a) => {
    const hajari = Number(a.hajari) || 0;
    const rate = Number(a.hajariRate) || (a.labour?.dailyWage) || 800;
    return sum + (hajari * rate);
  }, 0);

  const totalLabourPaymentsMade = labours.reduce((sum, l) => {
    const paySum = (l.payments || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    return sum + paySum;
  }, 0);

  const totalSupervisorEarned = supervisors.reduce((sum, s) => {
    const supSum = (s.supervisorAttendances || []).reduce((aSum: number, a: any) => aSum + (Number(a.earnedAmount) || 0), 0);
    return sum + supSum;
  }, 0);

  const totalSupervisorPaid = supervisors.reduce((sum, s) => {
    const supPay = (s.supervisorPayments || []).reduce((pSum: number, p: any) => pSum + (Number(p.amount) || 0), 0);
    return sum + supPay;
  }, 0);

  const grossMargin = totalBilledTaxable - totalLabourWagesEarned - totalSupervisorEarned;

  // Chart Data
  const siteFinancialChartData = sites.map((site) => {
    const sBills = bills.filter((b) => b.siteId === site.id);
    const sPayments = payments.filter((p) => p.siteId === site.id);
    const billed = sBills.reduce((sum, b) => {
      return sum + (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
    }, 0);
    const received = sPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      name: site.projectName.length > 18 ? site.projectName.slice(0, 16) + "..." : site.projectName,
      fullName: site.projectName,
      client: site.client?.name || "Client",
      Billed: billed,
      Received: received,
      Outstanding: Math.max(0, billed - received),
    };
  });

  const clientMap = new Map<string, number>();
  for (const b of bills) {
    const cName = b.site?.client?.name || "Other Client";
    const amt = (b.lines || []).reduce((s: number, l: any) => s + (Number(l.currentAmount) || 0), 0);
    clientMap.set(cName, (clientMap.get(cName) || 0) + amt);
  }
  const clientRevenueData = Array.from(clientMap.entries()).map(([name, value]) => ({ name, value }));

  const catMap = new Map<string, { name: string; count: number; wages: number }>();
  for (const a of attendances) {
    const catName = a.labour?.labourCategory?.name || "General Labour";
    const hajari = Number(a.hajari) || 0;
    const rate = Number(a.hajariRate) || (a.labour?.dailyWage) || 800;
    const cur = catMap.get(catName) || { name: catName, count: 0, wages: 0 };
    cur.count += hajari > 0 ? 1 : 0;
    cur.wages += hajari * rate;
    catMap.set(catName, cur);
  }
  const labourCategoryExpenseData = Array.from(catMap.values());

  const dateMap = new Map<string, { date: string; present: number; halfDay: number; absent: number; totalShifts: number }>();
  const sortedAtts = [...attendances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const a of sortedAtts) {
    const dStr = new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const cur = dateMap.get(dStr) || { date: dStr, present: 0, halfDay: 0, absent: 0, totalShifts: 0 };
    const haj = Number(a.hajari) || 0;
    if (haj === 1) cur.present++;
    else if (haj === 0.5) cur.halfDay++;
    else if (a.status === "ABSENT") cur.absent++;
    cur.totalShifts += haj;
    dateMap.set(dStr, cur);
  }
  const dailyHajariTrendData = Array.from(dateMap.values());

  const labourWagesMap = new Map<string, { name: string; earned: number; paid: number; cat: string }>();
  for (const a of attendances) {
    if (!a.labour) continue;
    const hajari = Number(a.hajari) || 0;
    const rate = Number(a.hajariRate) || a.labour.dailyWage || 800;
    const cur = labourWagesMap.get(a.labourId) || { name: a.labour.name, earned: 0, paid: 0, cat: a.labour.labourCategory?.name || "" };
    cur.earned += (hajari * rate);
    labourWagesMap.set(a.labourId, cur);
  }
  for (const l of labours) {
    const cur = labourWagesMap.get(l.id) || { name: l.name, earned: 0, paid: 0, cat: l.labourCategory?.name || "" };
    cur.paid += (l.payments || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    labourWagesMap.set(l.id, cur);
  }
  const topEarningLabours = Array.from(labourWagesMap.values()).sort((a, b) => b.earned - a.earned).slice(0, 50);

  const supplyEntriesAggregated = supplyEntries.map(s => ({
    date: new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    totalAmount: s.totalAmount || 0,
    siteName: s.site?.projectName || "Unknown Site"
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const supervisorPayrollData = supervisors.map((sup) => {
    const presentCount = (sup.supervisorAttendances || []).filter((a: any) => a.status === "PRESENT").length;
    const halfCount = (sup.supervisorAttendances || []).filter((a: any) => a.status === "HALF_DAY").length;
    const absentCount = (sup.supervisorAttendances || []).filter((a: any) => a.status === "ABSENT").length;
    const grossEarned = (sup.supervisorAttendances || []).reduce((sum: number, a: any) => sum + (Number(a.earnedAmount) || 0), 0);
    const totalPaid = (sup.supervisorPayments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, grossEarned - totalPaid);

    return {
      id: sup.id,
      name: sup.name,
      monthlySalary: sup.monthlySalary || 30000,
      dailyRate: Math.round(((sup.monthlySalary || 30000) / 30) * 100) / 100,
      presentCount,
      halfCount,
      absentCount,
      grossEarned,
      totalPaid,
      balanceDue,
    };
  });

  const labourMatrixList = labours.map((l) => {
    const lAtts = attendances.filter((a) => a.labourId === l.id);
    const totalHaj = lAtts.reduce((s, a) => s + (Number(a.hajari) || 0), 0);
    const rate = Number(l.dailyWage) || 800;
    const grossEarned = totalHaj * rate;
    const advancePaid = (l.payments || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const balance = grossEarned - advancePaid;

    return {
      id: l.id,
      name: l.name,
      category: l.labourCategory?.name || "Helper",
      site: sites.find(s => s.id === l.siteId)?.projectName || "—",
      totalHajari: totalHaj,
      dailyWage: rate,
      grossEarned,
      advancePaid,
      balance,
    };
  }).sort((a, b) => b.grossEarned - a.grossEarned);

  return {
    kpi: {
      totalBilledGross,
      totalBilledTaxable,
      totalPaymentsReceived,
      totalOutstandingReceivable,
      collectionPercentage,
      totalLabourWagesEarned,
      totalLabourPaymentsMade,
      totalSupervisorEarned,
      totalSupervisorPaid,
      grossMargin
    },
    tables: {
      supervisorPayrollData,
      labourMatrixList,
      bills
    },
    charts: {
      siteFinancialChartData,
      clientRevenueData,
      labourCategoryExpenseData,
      dailyHajariTrendData,
      topEarningLabours,
      supplyEntriesAggregated
    }
  };
}
