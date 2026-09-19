import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHajariSlipPdfBuffer, HajariSlipData } from "@/lib/pdf/hajari-slip";
import { formatDate } from "@/lib/utils";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const labourId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return new NextResponse("Missing date range", { status: 400 });
    }

    const from = new Date(fromStr);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toStr);
    to.setHours(23, 59, 59, 999);

    const labour = await prisma.labour.findUnique({
      where: { id: labourId },
      include: {
        site: true,
        labourCategory: true,
      }
    });

    if (!labour) {
      return new NextResponse("Labour not found", { status: 404 });
    }

    const globalSettings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    // Fetch detailed attendance
    const attendanceDetails = await prisma.attendance.findMany({
      where: {
        labourId,
        date: { gte: from, lte: to },
        hajari: { gt: 0 }
      },
      orderBy: { date: "asc" }
    });
    
    // Calculate total hajari and earned amount based on the rate active that day
    let totalHajari = 0;
    let earnedAmount = 0;
    const processedAttendance = attendanceDetails.map(a => {
      const rate = a.hajariRate || labour.dailyWage || 0;
      const earned = a.hajari * rate;
      totalHajari += a.hajari;
      earnedAmount += earned;
      return { ...a, rate, earned };
    });
    
    const wageRate = labour.dailyWage || 0; // Just for display reference as "Current Rate"

    // 2. Calculate Payments within period
    const paymentsAgg = await prisma.labourPayment.aggregate({
      where: {
        labourId,
        date: { gte: from, lte: to }
      },
      _sum: { amount: true }
    });
    
    const advancePaid = paymentsAgg._sum.amount || 0;
    
    // 3. Calculate Previous Balance (Before 'from' date)
    const prevAttendance = await prisma.attendance.findMany({
      where: {
        labourId,
        date: { lt: from },
        hajari: { gt: 0 }
      },
      select: { hajari: true, hajariRate: true }
    });
    
    let prevEarned = 0;
    for (const a of prevAttendance) {
      const rate = a.hajariRate || labour.dailyWage || 0;
      prevEarned += a.hajari * rate;
    }

    const prevPaymentsAgg = await prisma.labourPayment.aggregate({
      where: {
        labourId,
        date: { lt: from }
      },
      _sum: { amount: true }
    });
    const prevPaid = prevPaymentsAgg._sum.amount || 0;
    const previousBalance = prevEarned - prevPaid;

    // 4. Calculate Total Net Payable
    const netPayable = previousBalance + earnedAmount - advancePaid;

    // Load logos
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
      console.warn("Could not load images for hajari slip");
    }

    const pdfData: HajariSlipData = {
      companyName: globalSettings?.companyName || "RCR Infrastructure",
      companyAddress: globalSettings?.address || "",
      entityName: labour.name,
      entityRole: labour.labourCategory.name,
      entityId: `LAB-${labour.id.substring(0, 6).toUpperCase()}`,
      entityPhone: labour.phone || "",
      entitySite: labour.site.projectName,
      dateOfJoining: labour.joiningDate ? formatDate(labour.joiningDate) : formatDate(labour.createdAt),
      bankName: labour.bankName || "N/A",
      accountNumber: labour.accountNumber || "N/A",
      ifscCode: labour.ifscCode || "N/A",
      period: {
        from: fromStr,
        to: toStr,
      },
      wageRate,
      totalHajari,
      earnedAmount,
      advancePaid,
      previousBalance,
      netPayable,
      attendanceDetails: processedAttendance.map(a => ({
        date: a.date,
        hajari: a.hajari,
        rate: a.rate,
        earned: a.earned
      })),
      logoStr,
      stampStr
    };

    const pdfBuffer = await generateHajariSlipPdfBuffer(pdfData);

    const filename = `${labour.name.replace(/[^a-zA-Z0-9]/g, "_")}_Hajari_Statement.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Hajari Slip PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
