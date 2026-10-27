import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateLabourListPdf } from "@/lib/pdf/labour-list";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: siteId } = await params;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "1";

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        supervisors: {
          include: {
            supervisor: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const whereClause: any = { siteId };
    if (activeOnly) {
      whereClause.active = true;
    }

    const labours = await prisma.labour.findMany({
      where: whereClause,
      include: {
        labourCategory: true,
        supervisor: { select: { name: true } }
      },
      orderBy: [
        { active: "desc" },
        { labourCategory: { name: "asc" } },
        { name: "asc" }
      ]
    });

    const supervisorsList = site.supervisors.map((s: any) => s.supervisor.name);

    const pdfBuffer = await generateLabourListPdf({
      siteName: site.projectName,
      supervisors: supervisorsList,
      labours
    });

    const safeSiteName = site.projectName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Labour_List_${safeSiteName}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error: any) {
    console.error("Error generating labour list PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
