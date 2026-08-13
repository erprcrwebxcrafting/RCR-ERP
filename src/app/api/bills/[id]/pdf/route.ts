import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBillPdfPackage } from "@/lib/pdf/bill";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: billId } = await params;

    const bill = await prisma.runningBill.findUnique({
      where: { id: billId },
      include: {
        site: {
          include: {
            client: true,
            buildings: true,
            payments: { orderBy: { date: "asc" } },
          },
        },
        lines: {
          include: { building: true, workItem: true },
        },
        supplyLabourEntries: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!bill) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    const { site, lines, supplyLabourEntries } = bill;

    // Reconstruct towers from snapshotted lines for PDF generation
    const reconstructedTowers = site.buildings.map((b) => {
      const bLines = lines.filter((l) => l.buildingId === b.id);
      return {
        ...b,
        workItems: bLines.map((l) => ({
          id: l.workItemId || l.id,
          name: l.workItem?.name || l.description || "Work Item",
          unit: l.workItem?.unit || l.unit || "%",
          previousAmt: l.previousAmount,
          currentAmt: l.currentAmount,
          cumulativeAmt: l.cumulativeAmount,
          previousQty: l.previousQty,
          currentQty: l.currentQty,
          cumulativeQty: l.cumulativeQty,
          rate: l.rate,
          partAmount: l.workItem?.partAmount || 0,
        })),
      };
    });

    const pdfBuffer = await generateBillPdfPackage({
      site,
      runningBill: bill,
      towers: reconstructedTowers,
      supplyEntries: supplyLabourEntries,
      payments: site.payments,
    });

    const filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_${bill.billNo.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Historical PDF export error:", error);
    return new NextResponse(`PDF Export failed: ${error.message}`, { status: 500 });
  }
}
