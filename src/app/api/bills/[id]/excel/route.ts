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
        lines: { orderBy: { order: "asc" } },
        supplyLabourEntries: true,
      },
    });

    if (!bill) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    const { site, lines, supplyLabourEntries } = bill;

    // Reconstruct towers from frozen lines in this bill snapshot
    const reconstructedTowers = site.buildings.map((b: any) => {
      const bLines = lines.filter((l: any) => l.buildingId === b.id);
      return {
        ...b,
        workItems: (b.workItems && b.workItems.length > 0)
          ? b.workItems.map((item: any) => {
              const l = bLines.find((x: any) => (x.workItemId && x.workItemId === item.id) || (x.description && x.description.includes(item.name)));
              const prevQ = l?.previousQty ?? 0;
              const currQ = l?.currentQty ?? 0;
              const cumQ = l?.cumulativeQty ?? (prevQ + currQ);
              const prevA = l?.previousAmount ?? 0;
              const currA = l?.currentAmount ?? 0;
              const cumA = l?.cumulativeAmount ?? (prevA + currA);

              return {
                id: item.id,
                name: item.name || l?.description || "Work Item",
                unit: item.unit || l?.unit || "%",
                previousAmt: prevA,
                currentAmt: currA,
                cumulativeAmt: cumA,
                previousQty: prevQ,
                currentQty: currQ,
                cumulativeQty: cumQ,
                rate: l?.rate || item.rate || 0,
                partAmount: item.partAmount || (l?.woQty && l?.rate ? l.woQty * l.rate : item.rate || 0),
              };
            })
          : bLines.map((l: any) => ({
              id: l.workItemId || l.id,
              name: l.description?.replace(`${b.name} - `, "") || l.description || "Work Item",
              unit: l.unit || "%",
              previousAmt: l.previousAmount || 0,
              currentAmt: l.currentAmount || 0,
              cumulativeAmt: l.cumulativeAmount || ((l.previousAmount || 0) + (l.currentAmount || 0)),
              previousQty: l.previousQty || 0,
              currentQty: l.currentQty || 0,
              cumulativeQty: l.cumulativeQty || ((l.previousQty || 0) + (l.currentQty || 0)),
              rate: l.rate || 0,
              partAmount: (l.woQty && l.rate) ? l.woQty * l.rate : 0,
            })),
      };
    });

    const buffer = await generateRABillExcelWorkbook({
      site,
      runningBill: bill,
      towers: reconstructedTowers,
      supplyEntries: supplyLabourEntries,
      payments: site.payments,
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
