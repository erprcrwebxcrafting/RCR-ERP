import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRunningBillWorkbook, BillLineData } from "@/lib/excel/runningBill";
import { formatDate } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = await prisma.runningBill.findUnique({
    where: { id: id },
    include: {
      site: { include: { client: true, buildings: true } },
      lines: { include: { building: true, workItem: true, labourCategory: true } },
    },
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const site = bill.site;

  // Building-wise detail sheets
  const buildingSheets = site.buildings.map((b) => {
    const lines = bill.lines.filter((l) => l.buildingId === b.id && l.workItemId);
    const approxArea = lines.reduce((s, l) => s + (l.woQty || 0), 0);
    const avgRate = lines.length ? lines.reduce((s, l) => s + l.rate, 0) / lines.length : 0;
    return {
      buildingName: b.name,
      approxArea,
      unit: lines[0]?.unit || "Sft",
      rate: avgRate,
      lines: lines.map((l): BillLineData => ({
        description: l.workItem?.name || l.description,
        unit: l.unit,
        woQty: l.woQty,
        rate: l.rate,
        previousQty: l.previousQty,
        currentQty: l.currentQty,
        cumulativeQty: l.cumulativeQty,
        previousAmount: l.previousAmount,
        currentAmount: l.currentAmount,
        cumulativeAmount: l.cumulativeAmount,
      })),
    };
  });

  // Summary sheet: one aggregated row per building + one row per labour category
  const summaryLines: BillLineData[] = [];
  for (const b of buildingSheets) {
    const prevQty = b.lines.reduce((s, l) => s + l.previousQty, 0);
    const curQty = b.lines.reduce((s, l) => s + l.currentQty, 0);
    const cumQty = b.lines.reduce((s, l) => s + l.cumulativeQty, 0);
    const prevAmt = b.lines.reduce((s, l) => s + l.previousAmount, 0);
    const curAmt = b.lines.reduce((s, l) => s + l.currentAmount, 0);
    const cumAmt = b.lines.reduce((s, l) => s + l.cumulativeAmount, 0);
    summaryLines.push({
      description: `${b.buildingName} Reinforcement Work Done.`,
      unit: b.unit,
      woQty: b.approxArea,
      rate: b.rate,
      previousQty: prevQty, currentQty: curQty, cumulativeQty: cumQty,
      previousAmount: prevAmt, currentAmount: curAmt, cumulativeAmount: cumAmt,
    });
  }
  for (const l of bill.lines.filter((l) => l.labourCategoryId)) {
    summaryLines.push({
      description: l.description,
      unit: l.unit,
      woQty: l.woQty,
      rate: l.rate,
      previousQty: l.previousQty, currentQty: l.currentQty, cumulativeQty: l.cumulativeQty,
      previousAmount: l.previousAmount, currentAmount: l.currentAmount, cumulativeAmount: l.cumulativeAmount,
    });
  }

  // Labour supply sheet — built from Attendance for this site during the bill period (falls back to empty if none logged)
  const attendance = await prisma.attendance.findMany({
    where: { siteId: site.id, status: { in: ["PRESENT", "HALF_DAY"] } },
    include: { labour: { include: { labourCategory: true } } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map<string, { fitterCount: number; fitterHours: number; helperCount: number; helperHours: number; desc: string[] }>();
  for (const a of attendance) {
    const dateKey = formatDate(a.date);
    const entry = byDate.get(dateKey) || { fitterCount: 0, fitterHours: 0, helperCount: 0, helperHours: 0, desc: [] };
    const hrs = a.status === "HALF_DAY" ? 4 : 8;
    const catName = a.labour.labourCategory.name.toLowerCase();
    if (catName.includes("helper")) {
      entry.helperCount += 1; entry.helperHours = hrs;
    } else {
      entry.fitterCount += 1; entry.fitterHours = hrs;
    }
    if (a.remarks) entry.desc.push(a.remarks);
    byDate.set(dateKey, entry);
  }
  const supplyRows = [...byDate.entries()].map(([date, v]) => ({
    date,
    description: v.desc.join("; ") || "Site work as per attendance",
    fitterCount: v.fitterCount,
    fitterHours: v.fitterHours,
    helperCount: v.helperCount,
    helperHours: v.helperHours,
  }));

  const payments = await prisma.payment.findMany({ where: { siteId: site.id }, orderBy: { date: "asc" } });

  const thisBillGrossAmount = bill.lines.reduce((s, l) => s + l.currentAmount, 0);

  const buffer = await generateRunningBillWorkbook({
    companyName: "RCR ENTERPRISES",
    clientName: site.client.name,
    clientAddress: site.address || "",
    workName: "Reinforcement Work.",
    projectLabel: `${site.projectName.toUpperCase()}`,
    workOrderNo: site.workOrderNo || undefined,
    billNo: bill.billNo,
    refNo: bill.refNo || undefined,
    billDate: formatDate(bill.billDate),
    bankAccountName: "RCR ENTERPRISES",
    bankAccountNo: "088405500559",
    bankIfsc: "ICIC0000884",
    cgstPct: bill.cgstPct,
    sgstPct: bill.sgstPct,
    tdsPct: bill.tdsPct,
    retentionPct: bill.retentionPct,
    summaryLines,
    buildingSheets,
    supplyRows,
    supplyMonthLabel: bill.periodLabel || formatDate(bill.billDate),
    payments: payments.map((p) => ({ date: formatDate(p.date), accountCredited: p.accountCredited || p.mode, amount: p.amount })),
    thisBillGrossAmount,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Running_Bill_${bill.billNo.replace(/\//g, "-")}.xlsx"`,
    },
  });
}
