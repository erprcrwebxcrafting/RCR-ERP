import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAttendanceExcel } from "@/lib/excel/attendance";
import { generateAttendancePdf } from "@/lib/pdf/attendance";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const format = searchParams.get("format");

    if (!siteId || !startDateStr || !endDateStr || !format) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        siteId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: "asc" },
        { labour: { labourCategory: { name: "asc" } } },
        { labour: { name: "asc" } }
      ],
      include: {
        labour: { include: { labourCategory: true } },
        building: true,
      },
    });

    if (format === "excel") {
      const buffer = await generateAttendanceExcel(attendances, site.projectName, startDateStr, endDateStr);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Attendance_${site.projectName.replace(/\s+/g, "_")}_${startDateStr}_to_${endDateStr}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else if (format === "pdf") {
      const buffer = await generateAttendancePdf(attendances, site.projectName, startDateStr, endDateStr);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Attendance_${site.projectName.replace(/\s+/g, "_")}_${startDateStr}_to_${endDateStr}.pdf"`,
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
