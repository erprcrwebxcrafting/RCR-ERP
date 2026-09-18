import { prisma } from "@/lib/prisma";
import { AttendanceCardData } from "@/lib/pdf/attendance-card";

export async function calculateAttendanceCardData(
  entityId: string,
  entityType: "LABOUR" | "SUPERVISOR",
  monthParam: string, // YYYY-MM-DD
): Promise<AttendanceCardData | null> {
  const dateParam = new Date(monthParam);
  if (isNaN(dateParam.getTime())) {
    throw new Error("Invalid month parameter");
  }

  const year = dateParam.getFullYear();
  const month = dateParam.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fromDate = new Date(year, month, 1);
  const toDate = new Date(year, month, daysInMonth, 23, 59, 59, 999);

  // Find if it's the very first month of work
  const firstAtt = entityType === "LABOUR"
    ? await prisma.attendance.findFirst({
        where: { labourId: entityId },
        orderBy: { date: 'asc' }
      })
    : await prisma.supervisorAttendance.findFirst({
        where: { supervisorId: entityId },
        orderBy: { date: 'asc' }
      });
  
  let isFirstMonth = false;
  if (!firstAtt || (firstAtt.date.getFullYear() === year && firstAtt.date.getMonth() === month)) {
    isFirstMonth = true;
  }

  const payStart = isFirstMonth ? new Date(year, month, 1, 0, 0, 0, 0) : new Date(year, month, 21, 0, 0, 0, 0);
  const payEnd = new Date(year, month + 1, 20, 23, 59, 59, 999);

  let workerName = "";
  let rate = 0;
  let siteName = "";
  let attendances: any[] = [];
  let payments: any[] = [];
  let openingEarned = 0;
  let openingPaid = 0;

  if (entityType === "LABOUR") {
    const labour = await prisma.labour.findUnique({
      where: { id: entityId },
      include: { site: true }
    });
    if (!labour) return null;
    
    workerName = labour.name;
    siteName = labour.site.projectName;
    rate = labour.dailyWage || 0;

    attendances = await prisma.attendance.findMany({
      where: { labourId: entityId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" }
    });

    payments = await prisma.labourPayment.findMany({
      where: { labourId: entityId, date: { gte: payStart, lte: payEnd } },
      orderBy: { date: "asc" }
    });

    if (!isFirstMonth) {
      const pastAtts = await prisma.attendance.findMany({
        where: { labourId: entityId, date: { lt: fromDate }, hajari: { gt: 0 } }
      });
      pastAtts.forEach(a => {
        openingEarned += (a.hajari || 0) * (a.hajariRate || rate);
      });

      const pastPays = await prisma.labourPayment.findMany({
        where: { labourId: entityId, date: { lt: payStart } }
      });
      pastPays.forEach(p => { openingPaid += p.amount; });
    }
  } else if (entityType === "SUPERVISOR") {
    const supervisor = await prisma.user.findUnique({
      where: { id: entityId },
      include: { assignedSites: { include: { site: true } } }
    });
    if (!supervisor) return null;
    
    workerName = supervisor.name;
    siteName = supervisor.assignedSites.map(s => s.site.projectName).join(", ");
    rate = (supervisor.monthlySalary || 0) / 30;

    attendances = await prisma.supervisorAttendance.findMany({
      where: { supervisorId: entityId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" }
    });

    payments = await prisma.supervisorPayment.findMany({
      where: { supervisorId: entityId, date: { gte: payStart, lte: payEnd } },
      orderBy: { date: "asc" }
    });

    if (!isFirstMonth) {
      const pastAtts = await prisma.supervisorAttendance.findMany({
        where: { supervisorId: entityId, date: { lt: fromDate }, status: { not: 'ABSENT' } }
      });
      pastAtts.forEach(a => {
        let h = 0;
        if (a.status === 'PRESENT') h = 1;
        else if (a.status === 'HALF_DAY') h = 0.5;
        openingEarned += h * rate; 
      });

      const pastPays = await prisma.supervisorPayment.findMany({
        where: { supervisorId: entityId, date: { lt: payStart } }
      });
      pastPays.forEach(p => { openingPaid += p.amount; });
    }
  } else {
    throw new Error("Invalid entity type");
  }

  const factoryName = `R.C.R Enterprises ${siteName}`;
  const monthName = dateParam.toLocaleString('default', { month: 'long', year: 'numeric' });

  const attMap = new Map<number, any[]>();
  attendances.forEach(a => {
    const d = new Date(a.date).getDate();
    if (!attMap.has(d)) attMap.set(d, []);
    attMap.get(d)!.push(a);
  });

  const payMap = new Map<number, any[]>();
  payments.forEach(p => {
    const d = new Date(p.date).getDate();
    if (!payMap.has(d)) payMap.set(d, []);
    payMap.get(d)!.push(p);
  });

  const days = [];
  let totalDays = 0;
  let totalEarned = 0;
  let totalAdvance = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const dayAtts = attMap.get(i) || [];
    
    let advDateNum = 20 + i;
    if (advDateNum > daysInMonth) advDateNum -= daysInMonth;
    
    const dayPays = payMap.get(advDateNum) || [];

    let dayHajari = 0;
    dayAtts.forEach(a => { 
      if (a.hajari !== undefined) {
        dayHajari += (a.hajari || 0); 
      } else if (a.status) {
        if (a.status === 'PRESENT') dayHajari += 1;
        else if (a.status === 'HALF_DAY') dayHajari += 0.5;
      }
    });
    totalDays += dayHajari;
    
    dayAtts.forEach(a => {
      const appliedRate = a.hajariRate || rate;
      if (a.hajari !== undefined) {
        totalEarned += (a.hajari || 0) * appliedRate;
      } else if (a.status) {
        let h = 0;
        if (a.status === 'PRESENT') h = 1;
        else if (a.status === 'HALF_DAY') h = 0.5;
        totalEarned += h * appliedRate;
      }
    });

    let dayAdvance = 0;
    let reasons: string[] = [];
    dayPays.forEach(p => {
      dayAdvance += p.amount;
      if (p.reason) reasons.push(p.reason);
    });
    totalAdvance += dayAdvance;

    let presentStr = "";
    if (dayHajari === 1) presentStr = "P";
    else if (dayHajari === 0.5) presentStr = "P 1/2";
    else if (dayHajari === 0 && dayAtts.length > 0) presentStr = "A";
    else if (dayHajari > 1) {
      presentStr = Array(Math.floor(dayHajari)).fill("P").join("");
      if (dayHajari % 1 !== 0) presentStr += " 1/2";
    }

    days.push({
      dateNum: i,
      presentStr: presentStr,
      advDateNum: advDateNum,
      advanceAmt: dayAdvance > 0 ? dayAdvance : null,
      remarks: reasons.join(", ")
    });
  }

  const openingBalance = openingEarned - openingPaid;
  let finalDeductions = 0;
  
  if (openingBalance < 0) {
    finalDeductions = Math.abs(openingBalance);
  }
  
  let balancePayable = totalEarned - totalAdvance - finalDeductions;
  if (openingBalance > 0) {
    balancePayable += openingBalance;
  }

  let finalRate = rate;
  if (totalDays > 0 && totalEarned > 0) {
    finalRate = totalEarned / totalDays;
  }

  return {
    factoryName,
    workerName,
    monthName,
    rate: Math.round(finalRate * 100) / 100,
    days,
    totalDays,
    totalEarned,
    totalAdvance,
    deductions: finalDeductions, 
    balancePayable,
    openingBalance 
  };
}
