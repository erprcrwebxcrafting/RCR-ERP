import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBulkAttendanceCardBuffer, AttendanceCardData } from "@/lib/pdf/attendance-card";
import { calculateAttendanceCardData } from "@/lib/attendance-calc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType"); // "LABOUR" or "SUPERVISOR"
    
    if (!entityId || !entityType) {
      return new NextResponse("Missing required parameters: entityId and entityType", { status: 400 });
    }

    let workerName = "";
    const uniqueMonths = new Set<string>(); // Format: "YYYY-MM-01"

    if (entityType === "LABOUR") {
      const labour = await prisma.labour.findUnique({ where: { id: entityId } });
      if (!labour) return new NextResponse("Labour not found", { status: 404 });
      workerName = labour.name;

      // Get all attendances to find unique months
      const attendances = await prisma.attendance.findMany({
        where: { labourId: entityId },
        select: { date: true },
        orderBy: { date: "asc" }
      });

      attendances.forEach(a => {
        const year = a.date.getFullYear();
        const month = String(a.date.getMonth() + 1).padStart(2, '0');
        uniqueMonths.add(`${year}-${month}-01`);
      });

      // Also check payments in case they had a payment but no attendance in a cycle
      const payments = await prisma.labourPayment.findMany({
        where: { labourId: entityId },
        select: { date: true }
      });
      payments.forEach(p => {
        const year = p.date.getFullYear();
        const month = String(p.date.getMonth() + 1).padStart(2, '0');
        // Payments are often given for the previous month's work if made between 1st-20th.
        // To be safe, we just add the month of the payment itself.
        uniqueMonths.add(`${year}-${month}-01`);
      });
    } else if (entityType === "SUPERVISOR") {
      const supervisor = await prisma.user.findUnique({ where: { id: entityId } });
      if (!supervisor) return new NextResponse("Supervisor not found", { status: 404 });
      workerName = supervisor.name;

      const attendances = await prisma.supervisorAttendance.findMany({
        where: { supervisorId: entityId },
        select: { date: true },
        orderBy: { date: "asc" }
      });

      attendances.forEach(a => {
        const year = a.date.getFullYear();
        const month = String(a.date.getMonth() + 1).padStart(2, '0');
        uniqueMonths.add(`${year}-${month}-01`);
      });

      const payments = await prisma.supervisorPayment.findMany({
        where: { supervisorId: entityId },
        select: { date: true }
      });
      payments.forEach(p => {
        const year = p.date.getFullYear();
        const month = String(p.date.getMonth() + 1).padStart(2, '0');
        uniqueMonths.add(`${year}-${month}-01`);
      });
    } else {
      return new NextResponse("Invalid entity type", { status: 400 });
    }

    const monthsArray = Array.from(uniqueMonths).sort(); // Sort chronologically

    if (monthsArray.length === 0) {
      return new NextResponse("No data found for this entity", { status: 404 });
    }

    const allCardsData: AttendanceCardData[] = [];
    
    // Process each month one by one (Sequential since it's just one person's history)
    for (const monthParam of monthsArray) {
      try {
        const data = await calculateAttendanceCardData(entityId, entityType as "LABOUR" | "SUPERVISOR", monthParam);
        if (data) allCardsData.push(data);
      } catch (e) {
        console.error(`Error calculating card for ${workerName} for month ${monthParam}:`, e);
      }
    }

    if (allCardsData.length === 0) {
      return new NextResponse("Failed to calculate attendance data", { status: 500 });
    }

    const pdfBuffer = await generateBulkAttendanceCardBuffer(allCardsData);
    
    const filename = `${workerName.replace(/[^a-zA-Z0-9]/g, "_")}_AllTime_Cards.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Bulk All-Time Attendance Card PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
