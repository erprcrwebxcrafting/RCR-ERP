import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePaymentSlipPdfBuffer, PaymentSlipData } from "@/lib/pdf/payment-slip";
import fs from "fs";
import path from "path";

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
    let baseDailyWage = 0;
    let isMonthlyCategory = false;

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
      baseDailyWage = labour.dailyWage || 0;
      isMonthlyCategory = labour.labourCategory.name.toLowerCase().includes("supervisor") || labour.labourCategory.name.toLowerCase().includes("foreman");

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.labourPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!fromStr || !toStr) return new NextResponse("Missing date range", { status: 400 });
        
        const from = new Date(fromStr);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toStr);
        to.setHours(23, 59, 59, 999);

        statementPeriod = { from, to };
        
        // Fetch ALL records up to the end date to calculate accurate running balances
        payments = await prisma.labourPayment.findMany({
          where: { labourId: entityId, date: { lte: to } },
          orderBy: { date: "asc" }
        });
        attendances = await prisma.attendance.findMany({
          where: { labourId: entityId, date: { lte: to } },
          orderBy: { date: "asc" }
        });
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
      baseDailyWage = (supervisor.monthlySalary || 0) / 30;
      isMonthlyCategory = true;

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.supervisorPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!fromStr || !toStr) return new NextResponse("Missing date range", { status: 400 });
        
        const from = new Date(fromStr);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toStr);
        to.setHours(23, 59, 59, 999);

        statementPeriod = { from, to };
        payments = await prisma.supervisorPayment.findMany({
          where: { supervisorId: entityId, date: { lte: to } },
          orderBy: { date: "asc" }
        });
        attendances = await prisma.supervisorAttendance.findMany({
          where: { supervisorId: entityId, date: { lte: to } },
          orderBy: { date: "asc" }
        });
      }
    } else {
      return new NextResponse("Invalid entity type", { status: 400 });
    }

    if (payments.length === 0 && attendances.length === 0) {
      return new NextResponse("No data found for the given criteria", { status: 404 });
    }

    // Process month-by-month breakdown if it's a STATEMENT
    let monthlyBreakdown: any[] = [];
    let finalCalculations = {
      totalEarned: 0,
      totalPaid: 0,
      outstandingBalance: openingBalance
    };
    let periodOpeningBalance = openingBalance;

    if (type === "STATEMENT" && statementPeriod) {
      const monthMap = new Map<string, any>();
      
      // We will iterate from the earliest record (or opening balance) up to the 'to' date
      // We only care about displaying months that fall on or after 'from' date
      
      const formatMonth = (d: Date) => {
        const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        return m;
      };

      const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Helper to aggregate based on cycle rules
      // Earned: 1st to End of Month
      attendances.forEach(a => {
        if (!a.hajari) return;
        const d = new Date(a.date);
        const key = getMonthKey(d);
        if (!monthMap.has(key)) monthMap.set(key, { monthStr: formatMonth(d), earned: 0, paid: 0, hajari: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) });
        
        const rate = a.hajariRate || baseDailyWage || 0;
        const val = a.hajari * rate;
        
        monthMap.get(key).earned += val;
        monthMap.get(key).hajari += a.hajari;
        finalCalculations.totalEarned += val;
        finalCalculations.outstandingBalance += val;
      });

      // Paid: 21st to 20th of NEXT month -> this belongs to the EARLIER month's cycle!
      // Example: 25th Aug payment belongs to August cycle (21st Aug - 20th Sept)
      // Example: 5th Sept payment belongs to August cycle (21st Aug - 20th Sept)
      payments.forEach(p => {
        const d = new Date(p.date);
        let cycleMonthDate = new Date(d);
        if (d.getDate() <= 20) {
          // It belongs to the previous month's cycle
          cycleMonthDate.setMonth(cycleMonthDate.getMonth() - 1);
        }
        
        const key = getMonthKey(cycleMonthDate);
        if (!monthMap.has(key)) monthMap.set(key, { monthStr: formatMonth(cycleMonthDate), earned: 0, paid: 0, hajari: 0, dateObj: new Date(cycleMonthDate.getFullYear(), cycleMonthDate.getMonth(), 1) });
        
        monthMap.get(key).paid += p.amount;
        finalCalculations.totalPaid += p.amount;
        finalCalculations.outstandingBalance -= p.amount;
      });

      // Now convert to array, sort chronologically, and calculate rolling balance
      let rollingBalance = openingBalance;
      const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      sortedMonths.forEach(m => {
        rollingBalance += m.earned;
        rollingBalance -= m.paid;
        m.closingBalance = rollingBalance;
      });

      // Finally, filter the array to only include months that intersect with statementPeriod
      // Calculate period opening balance (balance before the first month of the statement)
      const fromKey = getMonthKey(statementPeriod.from);
      const toKey = getMonthKey(statementPeriod.to);
      
      const firstMonthIndex = sortedMonths.findIndex(m => {
        const k = getMonthKey(m.dateObj);
        return k >= fromKey;
      });
      
      if (firstMonthIndex > 0) {
        periodOpeningBalance = sortedMonths[firstMonthIndex - 1].closingBalance;
      }

      monthlyBreakdown = sortedMonths.filter(m => {
        const k = getMonthKey(m.dateObj);
        return k >= fromKey && k <= toKey;
      });
      
      // Option 2: Filter payments to match the Payout Cycle of the selected date range
      // e.g. If range is 1 Aug to 31 Aug, payments shown are 21 Aug to 20 Sept.
      payments = payments.filter(p => {
        const d = new Date(p.date);
        const cycleStart = new Date(statementPeriod!.from.getFullYear(), statementPeriod!.from.getMonth(), 21);
        const cycleEnd = new Date(statementPeriod!.to.getFullYear(), statementPeriod!.to.getMonth() + 1, 20, 23, 59, 59, 999);
        return d >= cycleStart && d <= cycleEnd;
      });
      
      allTransfers = allTransfers.filter(t => {
        const d = new Date(t.date);
        return d >= statementPeriod!.from && d <= statementPeriod!.to;
      });
    }

    let logoStr = null;
    let stampStr = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoStr = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
      
      const stampPath = path.join(process.cwd(), "public", "sign&logo.png");
      if (fs.existsSync(stampPath)) {
        const stampBuffer = fs.readFileSync(stampPath);
        stampStr = `data:image/png;base64,${stampBuffer.toString("base64")}`;
      }
    } catch (e) {
      console.warn("Could not load images for payment slip");
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

    const pdfBuffer = await generatePaymentSlipPdfBuffer(pdfData);

    const docName = type === "SINGLE" ? "Payment_Receipt" : "Payment_Statement";
    const filename = `${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${docName}.pdf`;

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
