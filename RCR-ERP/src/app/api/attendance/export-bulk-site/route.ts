import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBulkAttendanceCardBuffer, AttendanceCardData } from "@/lib/pdf/attendance-card";
import { calculateAttendanceCardData } from "@/lib/attendance-calc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const monthParam = searchParams.get("month"); // Format: "YYYY-MM-DD"
    
    if (!siteId || !monthParam) {
      return new NextResponse("Missing required parameters: siteId and month", { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return new NextResponse("Site not found", { status: 404 });

    // Fetch all active labours for this site
    const labours = await prisma.labour.findMany({
      where: { siteId, active: true },
      select: { id: true, name: true }
    });

    // Fetch all supervisors for this site
    const siteSupervisors = await prisma.siteSupervisor.findMany({
      where: { siteId },
      include: { supervisor: { select: { id: true, name: true, active: true } } }
    });
    const supervisors = siteSupervisors.filter(ss => ss.supervisor.active).map(ss => ss.supervisor);

    const allCardsData: AttendanceCardData[] = [];
    
    // Batch processing to reduce server load (5 at a time)
    const batchSize = 5;
    
    // Process Labours
    for (let i = 0; i < labours.length; i += batchSize) {
      const batch = labours.slice(i, i + batchSize);
      const promises = batch.map(async (labour) => {
        try {
          return await calculateAttendanceCardData(labour.id, "LABOUR", monthParam);
        } catch (e) {
          console.error(`Error calculating card for labour ${labour.id}:`, e);
          return null;
        }
      });
      const results = await Promise.all(promises);
      results.forEach(r => { if (r) allCardsData.push(r); });
    }

    // Process Supervisors
    for (let i = 0; i < supervisors.length; i += batchSize) {
      const batch = supervisors.slice(i, i + batchSize);
      const promises = batch.map(async (supervisor) => {
        try {
          return await calculateAttendanceCardData(supervisor.id, "SUPERVISOR", monthParam);
        } catch (e) {
          console.error(`Error calculating card for supervisor ${supervisor.id}:`, e);
          return null;
        }
      });
      const results = await Promise.all(promises);
      results.forEach(r => { if (r) allCardsData.push(r); });
    }

    if (allCardsData.length === 0) {
      return new NextResponse("No attendance data found for this site in this month", { status: 404 });
    }

    try {
      const fs = require("fs");
      const path = require("path");
      const imageBuffer = fs.readFileSync(path.join(process.cwd(), "public", "rcr-logo.png"));
      const logoStr = `data:image/png;base64,${imageBuffer.toString("base64")}`;
      allCardsData.forEach(card => {
        card.logoStr = logoStr;
      });
    } catch (e) {
      console.error("Failed to load logo for bulk cards", e);
    }

    const pdfBuffer = await generateBulkAttendanceCardBuffer(allCardsData);
    
    const dateParam = new Date(monthParam);
    const monthName = dateParam.toLocaleString('default', { month: 'short', year: 'numeric' });
    const filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Bulk_Cards_${monthName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Bulk Site Attendance Card PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
