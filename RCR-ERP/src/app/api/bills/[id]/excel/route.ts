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
        lines: { orderBy: { order: "asc" }, include: { workItem: true, building: true } },
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
      const hasSpecificItemLines = bLines.some((l: any) => l.workItemId != null);
      
      let workItems: any[] = [];
      if (b.workItems && b.workItems.length > 0) {
        const anyMatched = b.workItems.some((item: any) => 
          bLines.some((x: any) => (x.workItemId && x.workItemId === item.id) || (x.description && x.description.includes(item.name)))
        );

        if (anyMatched || bLines.length === 0) {
          workItems = b.workItems.map((item: any) => {
            const l = bLines.find((x: any) => (x.workItemId && x.workItemId === item.id) || (x.description && x.description.includes(item.name)));
            const prevQ = l ? (l.previousQty ?? 0) : (hasSpecificItemLines ? 0 : (item.previousPct ?? item.previousQty ?? 0));
            const currQ = l ? (l.currentQty ?? 0) : (hasSpecificItemLines ? 0 : (item.currentPct ?? item.currentQty ?? 0));
            const cumQ = l ? (l.cumulativeQty ?? (prevQ + currQ)) : (hasSpecificItemLines ? 0 : (item.cumulativePct ?? item.cumulativeQty ?? (prevQ + currQ)));
            const prevA = l ? (l.previousAmount ?? 0) : (hasSpecificItemLines ? 0 : (item.previousAmt ?? 0));
            const currA = l ? (l.currentAmount ?? 0) : (hasSpecificItemLines ? 0 : (item.currentAmt ?? 0));
            const cumA = l ? (l.cumulativeAmount ?? (prevA + currA)) : (hasSpecificItemLines ? 0 : (item.cumulativeAmt ?? (prevA + currA)));

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
          });
        } else {
          workItems = bLines.map((l: any) => {
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
              name: l.workItem?.name || l.description?.replace(`${b.name} - `, "") || l.description || "Work Done",
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
          });
        }
      } else {
        workItems = bLines.map((l: any) => {
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
            name: l.workItem?.name || l.description?.replace(`${b.name} - `, "") || l.description || "Work Done",
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
        });
      }

      return {
        ...b,
        workItems,
        bLines,
      };
    });

    const effectiveSupplyEntries = (supplyLabourEntries && supplyLabourEntries.length > 0)
      ? supplyLabourEntries
      : (site.supplyLabourEntries || []);

    const buffer = await generateRABillExcelWorkbook({
      site,
      runningBill: bill,
      towers: reconstructedTowers,
      supplyEntries: effectiveSupplyEntries,
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
