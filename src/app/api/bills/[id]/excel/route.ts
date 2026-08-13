import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRABillExcelWorkbook } from "@/lib/excel-export";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: billId } = await params;
    const bill = await prisma.runningBill.findUnique({
      where: { id: billId },
      include: {
        site: {
          include: {
            client: true,
            buildings: {
              include: { workItems: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
            supplyLabourEntries: { orderBy: { date: "asc" } },
            bills: { orderBy: { createdAt: "desc" }, include: { lines: true } },
            payments: { orderBy: { date: "asc" } },
          },
        },
        lines: true,
        supplyLabourEntries: true,
      },
    });

    if (!bill) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    const buffer = await generateRABillExcelWorkbook({
      site: bill.site,
      runningBill: bill,
      towers: bill.site.buildings,
      supplyEntries: bill.supplyLabourEntries.length > 0 ? bill.supplyLabourEntries : bill.site.supplyLabourEntries,
      payments: bill.site.payments,
    });

    const filename = `${bill.site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL_${(bill.billNo || "007").replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Historical bill excel export error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
