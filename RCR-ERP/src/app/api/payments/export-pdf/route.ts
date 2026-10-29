import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePaymentSlipPdfBuffer, PaymentSlipData } from "@/lib/pdf/payment-slip";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType"); // "LABOUR" or "SUPERVISOR"
    const type = searchParams.get("type"); // "SINGLE" or "STATEMENT"
    
    if (!entityId || !entityType || !type) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const globalSettings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    const companyName = globalSettings?.companyName || "RCR Enterprises";
    const companyAddress = globalSettings?.address || "";

    let entityName = "";
    let entityRole = "";
    let entityPhone = "";
    let entitySite = "";
    let entityAddress = "";
    let entityAadhar = "";
    let entityJoiningDate: Date | null = null;
    let allTransfers: any[] = [];
    let payments: any[] = [];
    let attendances: any[] = [];
    let statementPeriod: { from: Date; to: Date } | undefined;
    let openingBalance = 0;
    let periodOpeningBalance = 0;
    let baseDailyWage = 0;
    let isMonthlyCategory = false;
    let monthlyBreakdown: any[] = [];
    let finalCalculations = {
      totalEarned: 0,
      totalPaid: 0,
      outstandingBalance: 0
    };

    if (entityType === "LABOUR") {
      const labour = await prisma.labour.findUnique({
        where: { id: entityId },
        include: { 
          site: true, 
          labourCategory: true,
          transferHistory: {
            include: { fromSite: true, toSite: true }
          }
        }
      });
      if (!labour) return new NextResponse("Labour not found", { status: 404 });
      
      entityName = labour.name;
      entityRole = `Labour (${labour.labourCategory.name})`;
      entityPhone = labour.phone || "";
      entitySite = labour.site.projectName;
      entityAddress = labour.address || "";
      entityAadhar = labour.aadharNumber || "";
      entityJoiningDate = labour.joiningDate || null;
      allTransfers = labour.transferHistory.map((t: any) => ({
        date: t.transferDate,
        fromSite: t.fromSite?.projectName || "Unknown",
        toSite: t.toSite?.projectName || "Unknown"
      }));
      openingBalance = labour.openingBalance || 0;
      periodOpeningBalance = openingBalance;
      baseDailyWage = labour.dailyWage || 0;
      isMonthlyCategory = labour.labourCategory.name.toLowerCase().includes("supervisor") || labour.labourCategory.name.toLowerCase().includes("foreman");

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.labourPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const isAllTime = searchParams.get("allTime") === "true";
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!isAllTime && (!fromStr || !toStr)) return new NextResponse("Missing date range", { status: 400 });
        
        let from: Date;
        let to: Date;

        if (isAllTime) {
          from = new Date(0);
          to = toStr ? new Date(toStr) : new Date();
          to.setHours(23, 59, 59, 999);
        } else {
          from = new Date(fromStr!);
          from.setHours(0, 0, 0, 0);
          to = new Date(toStr!);
          to.setHours(23, 59, 59, 999);
        }

        const pastPayments = await prisma.labourPayment.aggregate({
          where: { labourId: entityId, date: { lt: from } },
          _sum: { amount: true }
        });
        const pastAttendances = await prisma.attendance.findMany({
          where: { labourId: entityId, date: { lt: from }, hajari: { gt: 0 } },
          select: { hajari: true, hajariRate: true }
        });
        
        let earnedBeforeFrom = 0;
        pastAttendances.forEach(a => {
          earnedBeforeFrom += (a.hajari || 0) * (a.hajariRate || baseDailyWage);
        });
        const paidBeforeFrom = pastPayments._sum.amount || 0;
        
        periodOpeningBalance = openingBalance + earnedBeforeFrom - paidBeforeFrom;

        payments = await prisma.labourPayment.findMany({
          where: { labourId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });
        attendances = await prisma.attendance.findMany({
          where: { labourId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });

        const effectiveFrom = isAllTime 
          ? (entityJoiningDate || payments[0]?.date || attendances[0]?.date || new Date())
          : from;
        statementPeriod = { from: effectiveFrom, to };
      }
    } else if (entityType === "SUPERVISOR") {
      const supervisor = await prisma.user.findUnique({
        where: { id: entityId },
        include: { 
          assignedSites: { include: { site: true } },
          // @ts-ignore
          supervisorTransfers: {
            include: { fromSite: true, toSite: true }
          }
        }
      });
      if (!supervisor) return new NextResponse("Supervisor not found", { status: 404 });
      
      entityName = supervisor.name || "Supervisor";
      entityRole = "Supervisor";
      entityPhone = supervisor.phone || "";
      entitySite = supervisor.assignedSites.map((s: any) => s.site.projectName).join(", ");
      entityAddress = supervisor.address || "";
      entityAadhar = supervisor.aadharNumber || "";
      entityJoiningDate = supervisor.dateOfJoining || null;
      // @ts-ignore
      allTransfers = (supervisor.supervisorTransfers || []).map((t: any) => ({
        date: t.transferDate,
        fromSite: t.fromSite?.projectName || "Unknown",
        toSite: t.toSite?.projectName || "Unknown"
      }));
      openingBalance = supervisor.openingBalance || 0;
      periodOpeningBalance = openingBalance;
      baseDailyWage = (supervisor.monthlySalary || 0) / 30;
      isMonthlyCategory = true;

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.supervisorPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const isAllTime = searchParams.get("allTime") === "true";
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!isAllTime && (!fromStr || !toStr)) return new NextResponse("Missing date range", { status: 400 });
        
        let from: Date;
        let to: Date;

        if (isAllTime) {
          from = new Date(0);
          to = toStr ? new Date(toStr) : new Date();
          to.setHours(23, 59, 59, 999);
        } else {
          from = new Date(fromStr!);
          from.setHours(0, 0, 0, 0);
          to = new Date(toStr!);
          to.setHours(23, 59, 59, 999);
        }

        const pastPayments = await prisma.supervisorPayment.aggregate({
          where: { supervisorId: entityId, date: { lt: from } },
          _sum: { amount: true }
        });
        const pastAttendances = await prisma.supervisorAttendance.findMany({
          where: { supervisorId: entityId, date: { lt: from }, status: { not: "ABSENT" } },
          select: { status: true, dailyRate: true, earnedAmount: true }
        });
        
        let earnedBeforeFrom = 0;
        pastAttendances.forEach(a => {
          const earned = a.earnedAmount !== undefined && a.earnedAmount !== null
            ? a.earnedAmount
            : (a.dailyRate || baseDailyWage) * (a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0);
          earnedBeforeFrom += earned;
        });
        const paidBeforeFrom = pastPayments._sum.amount || 0;
        
        periodOpeningBalance = openingBalance + earnedBeforeFrom - paidBeforeFrom;

        payments = await prisma.supervisorPayment.findMany({
          where: { supervisorId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });
        attendances = await prisma.supervisorAttendance.findMany({
          where: { supervisorId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });

        const effectiveFrom = isAllTime 
          ? (entityJoiningDate || payments[0]?.date || attendances[0]?.date || new Date())
          : from;
        statementPeriod = { from: effectiveFrom, to };
      }
    } else {
      return new NextResponse("Invalid entity type", { status: 400 });
    }

    if (payments.length === 0 && attendances.length === 0 && periodOpeningBalance === 0) {
      return new NextResponse("No data found for the given criteria", { status: 404 });
    }

    if (type === "STATEMENT" && statementPeriod) {
      const monthMap = new Map<string, any>();
      
      const formatMonth = (d: Date) => {
        const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        return m;
      };

      const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Pre-populate all calendar months in the period to guarantee continuous chronological order
      const startYear = statementPeriod.from.getFullYear();
      const startMonth = statementPeriod.from.getMonth();
      const endYear = statementPeriod.to.getFullYear();
      const endMonth = statementPeriod.to.getMonth();

      let curYear = startYear;
      let curMonth = startMonth;
      while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
        const d = new Date(curYear, curMonth, 1);
        const key = getMonthKey(d);
        if (!monthMap.has(key)) {
          monthMap.set(key, {
            monthStr: formatMonth(d),
            earned: 0,
            paid: 0,
            hajari: 0,
            dateObj: d,
          });
        }
        curMonth++;
        if (curMonth > 11) {
          curMonth = 0;
          curYear++;
        }
      }

      // Aggregate Attendances into calendar month
      attendances.forEach(a => {
        let hajariValue = 0;
        let val = 0;

        if ('hajari' in a) {
          hajariValue = a.hajari;
          if (!hajariValue) return;
          const rate = a.hajariRate || baseDailyWage || 0;
          val = hajariValue * rate;
        } else {
          hajariValue = a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0;
          if (!hajariValue) return;
          val = a.earnedAmount !== undefined && a.earnedAmount !== null 
            ? a.earnedAmount 
            : hajariValue * (a.dailyRate || baseDailyWage || 0);
        }

        const d = new Date(a.date);
        const key = getMonthKey(d);
        if (!monthMap.has(key)) monthMap.set(key, { monthStr: formatMonth(d), earned: 0, paid: 0, hajari: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) });
        
        monthMap.get(key).earned += val;
        monthMap.get(key).hajari += hajariValue;
        finalCalculations.totalEarned += val;
      });

      // Aggregate Payments into their actual calendar month (NO arbitrary shifting!)
      payments.forEach(p => {
        const d = new Date(p.date);
        const key = getMonthKey(d);
        if (!monthMap.has(key)) monthMap.set(key, { monthStr: formatMonth(d), earned: 0, paid: 0, hajari: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) });
        
        monthMap.get(key).paid += p.amount;
        finalCalculations.totalPaid += p.amount;
      });

      // Outstanding balance MUST include the starting periodOpeningBalance
      finalCalculations.outstandingBalance = periodOpeningBalance + finalCalculations.totalEarned - finalCalculations.totalPaid;

      // Calculate rolling balance chronologically
      let rollingBalance = periodOpeningBalance;
      const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      sortedMonths.forEach(m => {
        rollingBalance += m.earned;
        rollingBalance -= m.paid;
        m.closingBalance = rollingBalance;
      });

      monthlyBreakdown = sortedMonths;
      
      allTransfers = allTransfers.filter(t => {
        const d = new Date(t.date);
        return d >= statementPeriod!.from && d <= statementPeriod!.to;
      });
    }

    let logoStr: string | null = null;
    let stampStr: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
      if (fs.existsSync(logoPath)) {
        logoStr = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
      }
      const stampPath = path.join(process.cwd(), "public", "sign&logo.png");
      if (fs.existsSync(stampPath)) {
        stampStr = `data:image/png;base64,${fs.readFileSync(stampPath).toString("base64")}`;
      }
    } catch (e) {
      console.warn("Could not load image buffer as base64:", e);
    }

    const pdfData: PaymentSlipData = {
      companyName,
      companyAddress,
      entityName,
      entityRole,
      entityPhone,
      entitySite,
      entityAddress,
      entityAadhar,
      entityJoiningDate: entityJoiningDate || undefined,
      transferHistory: type === "STATEMENT" ? allTransfers : undefined,
      payments,
      monthlyBreakdown: type === "STATEMENT" ? monthlyBreakdown : undefined,
      finalCalculations: type === "STATEMENT" ? finalCalculations : undefined,
      statementPeriod: statementPeriod ? {
        from: statementPeriod.from,
        to: statementPeriod.to,
        openingBalance: type === "STATEMENT" ? periodOpeningBalance : undefined
      } : undefined,
      logoStr,
      stampStr
    };

    const docName = type === "SINGLE" ? "Payment_Receipt" : "Payment_Statement";
    const filename = `${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${docName}.pdf`;

    const format = searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({ pdfData, filename });
    }

    const pdfBuffer = await generatePaymentSlipPdfBuffer(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Payment Slip PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
