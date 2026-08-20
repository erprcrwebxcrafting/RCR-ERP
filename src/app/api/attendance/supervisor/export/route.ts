import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSupervisorAttendanceExcel } from "@/lib/excel/supervisor-attendance";
import { generateSupervisorAttendancePdf } from "@/lib/pdf/supervisor-attendance";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    const format = searchParams.get("format");

    if (!siteId || !monthStr || !yearStr || !format) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    endDate.setHours(23, 59, 59, 999);

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const siteSupervisors = await prisma.siteSupervisor.findMany({
      where: { siteId },
      include: { supervisor: true }
    });
    
    const supervisorIds = siteSupervisors.map(ss => ss.supervisorId);

    const attendances = await prisma.supervisorAttendance.findMany({
      where: {
        supervisorId: { in: supervisorIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: "asc" },
        { supervisor: { name: "asc" } }
      ],
      include: {
        supervisor: true,
      },
    });

    const periodStr = `${startDate.toLocaleDateString("en-GB")} to ${endDate.toLocaleDateString("en-GB")}`;

    if (format === "excel") {
      const buffer = await generateSupervisorAttendanceExcel(attendances, site.projectName, periodStr);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Supervisor_Attendance_${site.projectName.replace(/\s+/g, "_")}_${month + 1}_${year}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else if (format === "pdf") {
      const buffer = await generateSupervisorAttendancePdf(attendances, site.projectName, periodStr);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Supervisor_Attendance_${site.projectName.replace(/\s+/g, "_")}_${month + 1}_${year}.pdf"`,
          "Content-Type": "application/pdf",
        },
      });
    } else {
      return new NextResponse("Invalid format", { status: 400 });
    }
  } catch (error) {
    console.error("Error generating export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
