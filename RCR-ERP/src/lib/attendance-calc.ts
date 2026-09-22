import { prisma } from "@/lib/prisma";
import { AttendanceCardData } from "@/lib/pdf/attendance-card";

export function formatPresentStr(dayHajari: number, hasAttendanceRecord: boolean = false): string {
  if (dayHajari <= 0) {
    return (dayHajari === 0 && hasAttendanceRecord) ? "A" : "";
  }

  const whole = Math.floor(dayHajari);
  const frac = Math.round((dayHajari - whole) * 100) / 100;

  let fracStr = "";
  if (frac === 0.5) fracStr = "1/2";
  else if (frac === 0.25) fracStr = "1/4";
  else if (frac === 0.75) fracStr = "3/4";
  else if (frac > 0) fracStr = frac.toString().replace(/^0\./, ".");

  if (whole > 0) {
    const pStr = "P".repeat(whole);
    return fracStr ? `${pStr} ${fracStr}` : pStr;
  } else {
    return fracStr ? `P ${fracStr}` : "";
  }
}

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

  const payStart = new Date(year, month, 21, 0, 0, 0, 0);
  const payEnd = new Date(year, month + 1, 20, 23, 59, 59, 999);

  let workerName = "";
  let rate = 0;
  let siteName = "";
  let attendances: any[] = [];
  let payments: any[] = [];
  let openingEarned = 0;
  let openingPaid = 0;
  let initialDbBalance = 0;

  if (entityType === "LABOUR") {
    const labour = await prisma.labour.findUnique({
      where: { id: entityId },
      include: { site: true, labourCategory: true }
    });
    if (!labour) return null;
    
    workerName = labour.name;
    siteName = labour.site?.projectName || "";
    // Full fallback chain: labour dailyWage -> category dailyWage -> 0
    rate = labour.dailyWage || labour.labourCategory?.dailyWage || 0;
    initialDbBalance = labour.openingBalance || 0;

    attendances = await prisma.attendance.findMany({
      where: { labourId: entityId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
      include: { site: { select: { projectName: true } } }
    });

    payments = await prisma.labourPayment.findMany({
      where: { labourId: entityId, date: { gte: payStart, lte: payEnd } },
      orderBy: { date: "asc" }
    });

    const pastAtts = await prisma.attendance.findMany({
      where: { labourId: entityId, date: { lt: fromDate }, hajari: { gt: 0 } },
      select: {
        hajari: true,
        hajariRate: true,
        labour: { select: { dailyWage: true, labourCategory: { select: { dailyWage: true } } } }
      }
    });
    pastAtts.forEach(a => {
      const appliedRate = a.hajariRate || a.labour?.dailyWage || a.labour?.labourCategory?.dailyWage || rate;
      openingEarned += (a.hajari || 0) * appliedRate;
    });

    const pastPays = await prisma.labourPayment.findMany({
      where: { labourId: entityId, date: { lt: payStart } },
      select: { amount: true }
    });
    pastPays.forEach(p => { openingPaid += (p.amount || 0); });
  } else if (entityType === "SUPERVISOR") {
    const supervisor = await prisma.user.findUnique({
      where: { id: entityId },
      include: { assignedSites: { include: { site: true } } }
    });
    if (!supervisor) return null;
    
    workerName = supervisor.name;
    siteName = supervisor.assignedSites.map(s => s.site.projectName).join(", ");
    rate = supervisor.monthlySalary ? Math.round((supervisor.monthlySalary / daysInMonth) * 100) / 100 : 0;

    attendances = await prisma.supervisorAttendance.findMany({
      where: { supervisorId: entityId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" }
    });

    payments = await prisma.supervisorPayment.findMany({
      where: { supervisorId: entityId, date: { gte: payStart, lte: payEnd } },
      orderBy: { date: "asc" }
    });

    const pastAtts = await prisma.supervisorAttendance.findMany({
      where: { supervisorId: entityId, date: { lt: fromDate }, status: { not: 'ABSENT' } },
      select: { status: true, dailyRate: true, earnedAmount: true }
    });
    pastAtts.forEach(a => {
      const earned = a.earnedAmount !== undefined && a.earnedAmount !== null
        ? a.earnedAmount
        : (a.dailyRate || rate) * (a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0);
      openingEarned += earned;
    });

    const pastPays = await prisma.supervisorPayment.findMany({
      where: { supervisorId: entityId, date: { lt: payStart } },
      select: { amount: true }
    });
    pastPays.forEach(p => { openingPaid += (p.amount || 0); });
  } else {
    throw new Error("Invalid entity type");
  }

  const factoryName = `R.C.R Enterprises ${siteName}`;
  const monthName = dateParam.toLocaleString('default', { month: 'long', year: 'numeric' });

  const attMap = new Map<string, any[]>();
  attendances.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!attMap.has(key)) attMap.set(key, []);
    attMap.get(key)!.push(a);
  });

  const payMap = new Map<string, any[]>();
  payments.forEach(p => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!payMap.has(key)) payMap.set(key, []);
    payMap.get(key)!.push(p);
  });

  const days = [];
  let totalDays = 0;
  let totalEarned = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const attKey = `${year}-${month}-${i}`;
    const dayAtts = attMap.get(attKey) || [];
    
    let advMonth = month;
    let advYear = year;
    let advDateNumRaw = 20 + i;
    let advDateNum = advDateNumRaw;
    if (advDateNumRaw > daysInMonth) {
      advMonth += 1;
      if (advMonth > 11) {
         advMonth = 0;
         advYear += 1;
      }
      advDateNum -= daysInMonth;
    }
    
    const payKey = `${advYear}-${advMonth}-${advDateNum}`;
    const dayPays = payMap.get(payKey) || [];

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
      if (a.hajari !== undefined) {
        const appliedRate = a.hajariRate || rate;
        totalEarned += (a.hajari || 0) * appliedRate;
      } else if (a.status) {
        const earned = a.earnedAmount !== undefined && a.earnedAmount !== null
          ? a.earnedAmount
          : (a.dailyRate || rate) * (a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0);
        totalEarned += earned;
      }
    });

    let dayAdvance = 0;
    let reasons: string[] = [];
    dayPays.forEach(p => {
      dayAdvance += (p.amount || 0);
      if (p.reason) reasons.push(p.reason);
    });

    dayAtts.forEach(a => {
      if (a.site && a.site.projectName && a.site.projectName !== siteName) {
        if (!reasons.includes(`Site: ${a.site.projectName}`)) {
          reasons.push(`Site: ${a.site.projectName}`);
        }
      }
      if (a.remarks && !reasons.includes(a.remarks)) {
        reasons.push(a.remarks);
      }
    });

    const presentStr = formatPresentStr(dayHajari, dayAtts.length > 0);

    const fullDateStr = `${i}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    
    const advFullDateStr = `${advDateNum}/${(advMonth + 1).toString().padStart(2, '0')}/${advYear}`;

    days.push({
      dateNum: i,
      fullDateStr,
      presentStr: presentStr,
      advDateNum: advDateNum,
      advFullDateStr,
      advanceAmt: dayAdvance > 0 ? dayAdvance : null,
      remarks: reasons.join(", ")
    });
  }

  // 100% Exact Advance Sum: guaranteed zero payments dropped or missed
  const totalAdvance = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Exact Opening Balance (Prev Pending if positive, Excess Advance if negative)
  const openingBalance = Math.round((openingEarned - openingPaid + initialDbBalance) * 100) / 100;
  
  // Balance Payable = Current Earned - Current Advance + Prev Balance
  const balancePayable = Math.round((totalEarned - totalAdvance + openingBalance) * 100) / 100;
  const finalDeductions = openingBalance < 0 ? Math.abs(openingBalance) : 0;

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
    totalDays: Math.round(totalDays * 100) / 100,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalAdvance: Math.round(totalAdvance * 100) / 100,
    deductions: Math.round(finalDeductions * 100) / 100, 
    balancePayable,
    openingBalance 
  };
}
