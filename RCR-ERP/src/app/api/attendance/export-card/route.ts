import { NextRequest, NextResponse } from "next/server";
import { generateAttendanceCardBuffer } from "@/lib/pdf/attendance-card";
import { calculateAttendanceCardData } from "@/lib/attendance-calc";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType") as "LABOUR" | "SUPERVISOR";
    const monthParam = searchParams.get("month"); // Format: "YYYY-MM-DD"
    
    if (!entityId || !entityType || !monthParam) {
      return new NextResponse("Missing required parameters: entityId, entityType, and month", { status: 400 });
    }

    const data = await calculateAttendanceCardData(entityId, entityType, monthParam);
    if (!data) {
      return new NextResponse("Entity or attendance data not found", { status: 404 });
    }

    try {
      const imageBuffer = fs.readFileSync(path.join(process.cwd(), "public", "rcr-logo.png"));
      (data as any).logoStr = `data:image/png;base64,${imageBuffer.toString("base64")}`;
    } catch (e) {
      console.error("Failed to load logo", e);
    }

    const filename = `${data.workerName.replace(/[^a-zA-Z0-9]/g, "_")}_Card_${data.monthName.replace(/ /g, "_")}.pdf`;

    const format = searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({ pdfData: data, filename });
    }

    const pdfBuffer = await generateAttendanceCardBuffer(data);

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
