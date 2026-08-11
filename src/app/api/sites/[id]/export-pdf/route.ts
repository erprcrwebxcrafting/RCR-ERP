import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBillPdfPackage } from "@/lib/pdf/bill";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        client: true,
        buildings: {
          include: { workItems: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        supplyLabourEntries: { orderBy: { date: "asc" } },
        bills: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { lines: true, supplyLabourEntries: true },
        },
        payments: { orderBy: { date: "asc" } },
      },
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const latestBill = site.bills[0] || null;

    const pdfBuffer = await generateBillPdfPackage({
      site,
      runningBill: latestBill,
      towers: site.buildings,
      supplyEntries: site.supplyLabourEntries,
      payments: site.payments,
    });

    const filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL_PACKAGE_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Package export error:", error);
    return new NextResponse(`PDF Export failed: ${error.message}`, { status: 500 });
  }
}
