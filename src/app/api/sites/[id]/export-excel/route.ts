import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRABillExcelWorkbook } from "@/lib/excel-export";

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
          include: {
            workItems: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        supplyLabourEntries: { orderBy: { date: "asc" } },
        bills: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { lines: { include: { workItem: true, building: true } }, supplyLabourEntries: true },
        },
        payments: { orderBy: { date: "asc" } },
      },
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const latestBill = site.bills[0] || null;

    let reconstructedTowers = site.buildings;
    let supplyEntries = site.supplyLabourEntries;

    if (latestBill && latestBill.lines && latestBill.lines.length > 0) {
      reconstructedTowers = site.buildings.map((b: any) => {
        const bLines = latestBill.lines.filter((l: any) => l.buildingId === b.id);
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

                let partAmt = item.partAmount || l?.workItem?.partAmount || 0;
                const unit = item.unit || l?.unit || "%";
                const rate = l?.rate || item.rate || 0;
                if (!partAmt) {
                  if (unit === "%") {
                    partAmt = 100 * rate;
                  } else if (l?.woQty && rate) {
                    partAmt = l.woQty * rate;
                  } else {
                    partAmt = rate;
                  }
                }
                return {
                  id: item.id,
                  name: item.name || l?.description || "Work Item",
                  unit,
                  previousAmt: prevA,
                  currentAmt: currA,
                  cumulativeAmt: cumA,
                  previousQty: prevQ,
                  currentQty: currQ,
                  cumulativeQty: cumQ,
                  rate,
                  partAmount: partAmt,
                };
              })
            : bLines.map((l: any) => {
                let partAmt = l.workItem?.partAmount || 0;
                const unit = l.workItem?.unit || l.unit || "%";
                const rate = l.rate || 0;
                if (!partAmt) {
                  if (unit === "%") {
                    partAmt = 100 * rate;
                  } else if (l.woQty && rate) {
                    partAmt = l.woQty * rate;
                  } else {
                    partAmt = rate;
                  }
                }
                return {
                  id: l.workItemId || l.id,
                  name: l.workItem?.name || l.description?.replace(`${b.name} - `, "") || l.description || "Work Item",
                  unit,
                  previousAmt: l.previousAmount || 0,
                  currentAmt: l.currentAmount || 0,
                  cumulativeAmt: l.cumulativeAmount || ((l.previousAmount || 0) + (l.currentAmount || 0)),
                  previousQty: l.previousQty || 0,
                  currentQty: l.currentQty || 0,
                  cumulativeQty: l.cumulativeQty || ((l.previousQty || 0) + (l.currentQty || 0)),
                  rate,
                  partAmount: partAmt,
                };
              }),
        };
      });
      supplyEntries = latestBill.supplyLabourEntries && latestBill.supplyLabourEntries.length > 0
        ? latestBill.supplyLabourEntries
        : site.supplyLabourEntries.filter((se: any) => se.runningBillId === latestBill.id);
    } else {
      supplyEntries = site.supplyLabourEntries.filter((se: any) => !se.runningBillId);
    }

    const buffer = await generateRABillExcelWorkbook({
      site,
      runningBill: latestBill,
      towers: reconstructedTowers,
      supplyEntries,
      payments: site.payments,
    });

    const filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
