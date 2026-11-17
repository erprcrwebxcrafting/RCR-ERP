import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRABillExcelWorkbook } from "@/lib/excel-export";
import { formatInvoiceNo, formatRefNo } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const { searchParams } = new URL(req.url);
    const billId = searchParams.get("billId");

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
          include: { lines: { include: { workItem: true, building: true } }, supplyLabourEntries: true },
        },
        payments: { orderBy: { date: "asc" } },
      },
    });

    if (!site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const targetBill = billId && billId !== "draft"
      ? (site.bills || []).find((b: any) => b.id === billId)
      : null;

    let reconstructedTowers: any[];
    let supplyEntries: any[];
    let runningBill: any;
    let filename: string;

    if (targetBill) {
      // Historical bill export mode
      reconstructedTowers = site.buildings.map((b: any) => {
        const bLines = targetBill.lines.filter((l: any) => l.buildingId === b.id);
        const isQtyMode = b.calculationMethod === "QUANTITY";
        return {
          ...b,
          workItems: (b.workItems && b.workItems.length > 0)
            ? b.workItems.map((item: any) => {
                const l = bLines.find((x: any) => (x.workItemId && x.workItemId === item.id) || (x.description && x.description.includes(item.name)));
                let prevQ = l?.previousQty ?? 0;
                let currQ = l?.currentQty ?? 0;
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

                if (!isQtyMode && partAmt > 0) {
                  if (currQ === 0 && currA > 0) {
                    currQ = Math.round(((currA / partAmt) * 100) * 100) / 100;
                  }
                  if (prevQ === 0 && prevA > 0) {
                    prevQ = Math.round(((prevA / partAmt) * 100) * 100) / 100;
                  }
                }
                let cumQ = l?.cumulativeQty ?? (prevQ + currQ);
                if (!isQtyMode && cumQ === 0 && cumA > 0 && partAmt > 0) {
                  cumQ = Math.round(((cumA / partAmt) * 100) * 100) / 100;
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
                let prevQ = l.previousQty || 0;
                let currQ = l.currentQty || 0;
                const prevA = l.previousAmount || 0;
                const currA = l.currentAmount || 0;
                const cumA = l.cumulativeAmount || (prevA + currA);

                if (!isQtyMode && partAmt > 0) {
                  if (currQ === 0 && currA > 0) {
                    currQ = Math.round(((currA / partAmt) * 100) * 100) / 100;
                  }
                  if (prevQ === 0 && prevA > 0) {
                    prevQ = Math.round(((prevA / partAmt) * 100) * 100) / 100;
                  }
                }
                let cumQ = l.cumulativeQty || (prevQ + currQ);
                if (!isQtyMode && cumQ === 0 && cumA > 0 && partAmt > 0) {
                  cumQ = Math.round(((cumA / partAmt) * 100) * 100) / 100;
                }

                return {
                  id: l.workItemId || l.id,
                  name: l.workItem?.name || l.description?.replace(`${b.name} - `, "") || l.description || "Work Item",
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
              }),
        };
      });

      supplyEntries = targetBill.supplyLabourEntries && targetBill.supplyLabourEntries.length > 0
        ? targetBill.supplyLabourEntries
        : (site.supplyLabourEntries || []).filter((se: any) => se.runningBillId === targetBill.id);

      runningBill = targetBill;
      const billRef = targetBill.billNo ? targetBill.billNo.replace(/[^a-zA-Z0-9]/g, "_") : "BILL";
      filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_${billRef}_RA_BILL.xlsx`;
    } else {
      // LIVE DRAFT MODE: Export unbilled current progress and unbilled supply entries
      reconstructedTowers = site.buildings.map((b: any) => {
        const isQtyMode = b.calculationMethod === "QUANTITY";
        const bRate = b.contractRate || 0;
        const workItems = (b.workItems || []).map((item: any) => {
          let partAmt = item.partAmount || 0;
          const unit = item.unit || "%";
          const rate = item.rate || bRate;
          if (!partAmt) {
            if (unit === "%") {
              partAmt = 100 * rate;
            } else if (item.buWork && rate) {
              partAmt = item.buWork * rate;
            } else {
              partAmt = rate;
            }
          }
          let prevQ = item.previousPct || item.previousQty || 0;
          let currQ = item.currentPct || item.currentQty || 0;
          const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? Number(item.previousAmt) : (prevQ > 0 && partAmt > 0 ? (partAmt * prevQ / 100) : 0);
          const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? Number(item.currentAmt) : (currQ > 0 && partAmt > 0 ? (partAmt * currQ / 100) : 0);
          const cumA = item.cumulativeAmt !== undefined && item.cumulativeAmt !== null ? Number(item.cumulativeAmt) : (prevA + currA);

          if (!isQtyMode && partAmt > 0) {
            if (currQ === 0 && currA > 0) {
              currQ = Math.round(((currA / partAmt) * 100) * 100) / 100;
            }
            if (prevQ === 0 && prevA > 0) {
              prevQ = Math.round(((prevA / partAmt) * 100) * 100) / 100;
            }
          }
          let cumQ = isQtyMode ? (prevQ + currQ) : (item.cumulativePct || (prevQ + currQ));
          if (!isQtyMode && cumQ === 0 && cumA > 0 && partAmt > 0) {
            cumQ = Math.round(((cumA / partAmt) * 100) * 100) / 100;
          }
          return {
            ...item,
            partAmount: partAmt,
            previousQty: prevQ,
            currentQty: currQ,
            cumulativeQty: cumQ,
            previousPct: prevQ,
            currentPct: currQ,
            cumulativePct: cumQ,
            previousAmt: prevA,
            currentAmt: currA,
            cumulativeAmt: cumA,
          };
        });
        return {
          ...b,
          workItems,
        };
      });

      supplyEntries = (site.supplyLabourEntries || []).filter((se: any) => !se.runningBillId);

      const nextBillCount = (site.bills || []).length + 1;
      const nextBillNo = formatInvoiceNo(nextBillCount);
      const nextRefNo = formatRefNo(nextBillCount);

      runningBill = {
        id: "draft",
        isDraft: true,
        billNo: `DRAFT (${nextBillNo})`,
        refNo: nextRefNo,
        billDate: new Date(),
        periodLabel: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
        cgstPct: site.cgstPct ?? 9,
        sgstPct: site.sgstPct ?? 9,
        retentionPct: site.retentionPct ?? 2,
        tdsPct: site.tdsPct ?? 1,
      };

      filename = `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_DRAFT_RA_BILL_${new Date().toISOString().slice(0, 10)}.xlsx`;
    }

    const buffer = await generateRABillExcelWorkbook({
      site,
      runningBill,
      towers: reconstructedTowers,
      supplyEntries,
      payments: site.payments,
    });

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
