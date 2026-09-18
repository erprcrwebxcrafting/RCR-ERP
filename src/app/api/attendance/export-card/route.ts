import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAttendanceCardBuffer, AttendanceCardData } from "@/lib/pdf/attendance-card";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType"); // "LABOUR" or "SUPERVISOR"
    const monthParam = searchParams.get("month"); // Format: "YYYY-MM-DD"
    
    if (!entityId || !entityType || !monthParam) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const dateParam = new Date(monthParam);
    if (isNaN(dateParam.getTime())) {
      return new NextResponse("Invalid month parameter", { status: 400 });
    }

    const year = dateParam.getFullYear();
    const month = dateParam.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const fromDate = new Date(year, month, 1);
    const toDate = new Date(year, month, daysInMonth, 23, 59, 59, 999);

    const globalSettings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    const prevDateEnd = new Date(year, month, 20, 23, 59, 59, 999);
    // Find if it's the very first month of work
    const firstAtt = await prisma.attendance.findFirst({
      where: { labourId: entityId },
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
      if (!labour) return new NextResponse("Labour not found", { status: 404 });
      
      workerName = labour.name;
      siteName = labour.site.projectName;
      rate = labour.dailyWage || 0;

      // Attendance is strictly for the calendar month
      attendances = await prisma.attendance.findMany({
        where: { labourId: entityId, date: { gte: fromDate, lte: toDate } },
        orderBy: { date: "asc" }
      });

      // Payments are strictly for the cycle
      payments = await prisma.labourPayment.findMany({
        where: { labourId: entityId, date: { gte: payStart, lte: payEnd } },
        orderBy: { date: "asc" }
      });

      // Opening balance logic
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
      if (!supervisor) return new NextResponse("Supervisor not found", { status: 404 });
      
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
      return new NextResponse("Invalid entity type", { status: 400 });
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
      if (dayHajari === 0 && dayAtts.length > 0) {
        presentStr = "A";
      } else if (dayHajari > 0) {
        const whole = Math.floor(dayHajari);
        const frac = Math.round((dayHajari % 1) * 100) / 100;
        
        let fracStr = "";
        if (frac === 0.5) fracStr = "1/2";
        else if (frac === 0.25) fracStr = "1/4";
        else if (frac === 0.75) fracStr = "3/4";
        else if (frac > 0) fracStr = frac.toString().replace("0.", "."); // fallback
        
        if (whole > 0) {
          presentStr = Array(whole).fill("P").join("");
          if (fracStr) presentStr += " " + fracStr;
        } else {
          presentStr = "P " + fracStr;
        }
      }

      days.push({
        dateNum: i,
        presentStr: presentStr,
        advDateNum: advDateNum,
        advanceAmt: dayAdvance > 0 ? dayAdvance : null,
        remarks: reasons.join(", ")
      });
      if (i <= 3) {
        console.log(`Debug day ${i}: dayHajari=${dayHajari}, presentStr="${presentStr}", dayAttsLength=${dayAtts.length}`);
      }
    }

    // Opening Balance calculation
    const openingBalance = openingEarned - openingPaid;
    let finalDeductions = 0;
    
    // If opening balance is negative, it's a pending advance, so we add it to deductions to show on card
    if (openingBalance < 0) {
      finalDeductions = Math.abs(openingBalance);
    }
    
    // If positive, they had pending money owed to them, which technically means balance payable should be higher.
    let balancePayable = totalEarned - totalAdvance - finalDeductions;
    if (openingBalance > 0) {
      balancePayable += openingBalance;
    }

    let finalRate = rate;
    if (totalDays > 0 && totalEarned > 0) {
      finalRate = totalEarned / totalDays;
    }

    const data: AttendanceCardData = {
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
      openingBalance // We will pass this to the PDF so we can show it explicitly if needed
    };

    const pdfBuffer = await generateAttendanceCardBuffer(data);
    const filename = `${workerName.replace(/[^a-zA-Z0-9]/g, "_")}_Card_${monthName.replace(/ /g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Attendance Card PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
