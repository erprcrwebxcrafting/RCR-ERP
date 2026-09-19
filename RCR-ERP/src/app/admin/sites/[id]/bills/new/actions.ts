"use server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatInvoiceNo, formatRefNo } from "@/lib/utils";

export async function generateRunningBill(siteId: string, formData: FormData) {
  const site = await prisma.site.findUniqueOrThrow({
    where: { id: siteId },
    include: { buildings: true, workItems: true, labourCategories: true },
  });

  const count = await prisma.runningBill.count({ where: { siteId } });
  const periodLabel = (formData.get("periodLabel") as string) || "";
  const refNo = (formData.get("refNo") as string || formatRefNo(count + 1)).trim();
  const billNo = (formData.get("billNo") as string || formatInvoiceNo(count + 1)).trim();

  // find last bill for "previous" figures
  const lastBill = await prisma.runningBill.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: { lines: true },
  });

  function prevFor(buildingId: string | null, workItemId: string | null, labourCategoryId: string | null) {
    const line = lastBill?.lines.find(
      (l) => l.buildingId === buildingId && l.workItemId === workItemId && l.labourCategoryId === labourCategoryId
    );
    return { qty: line?.cumulativeQty ?? 0, amount: line?.cumulativeAmount ?? 0 };
  }

  const lineCreates: any[] = [];

  for (const b of site.buildings) {
    for (const w of site.workItems) {
      const key = `qty__${b.id}__${w.id}`;
      const currentQty = parseFloat((formData.get(key) as string) || "0") || 0;
      const prev = prevFor(b.id, w.id, null);
      const cumulativeQty = prev.qty + currentQty;
      lineCreates.push({
        buildingId: b.id,
        workItemId: w.id,
        description: `${w.name} — ${b.name}`,
        unit: w.unit,
        woQty: w.buWork,
        rate: w.rate,
        previousQty: prev.qty,
        currentQty,
        cumulativeQty,
        previousAmount: prev.amount,
        currentAmount: currentQty * w.rate,
        cumulativeAmount: cumulativeQty * w.rate,
      });
    }
  }

  for (const l of site.labourCategories) {
    const key = `labour__${l.id}`;
    const currentQty = parseFloat((formData.get(key) as string) || "0") || 0;
    const prev = prevFor(null, null, l.id);
    const cumulativeQty = prev.qty + currentQty;
    lineCreates.push({
      buildingId: null,
      labourCategoryId: l.id,
      description: `Dept. ${l.name} Supply.`,
      unit: "Nos.",
      woQty: null,
      rate: l.dailyWage,
      previousQty: prev.qty,
      currentQty,
      cumulativeQty,
      previousAmount: prev.amount,
      currentAmount: currentQty * l.dailyWage,
      cumulativeAmount: cumulativeQty * l.dailyWage,
    });
  }

  const bill = await prisma.runningBill.create({
    data: {
      siteId,
      billNo,
      refNo,
      periodLabel,
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      retentionPct: site.retentionPct,
      lines: { create: lineCreates },
    },
  });

  redirect(`/admin/sites/${siteId}/bills/${bill.id}`);
}
