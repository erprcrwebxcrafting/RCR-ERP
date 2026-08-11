"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addTowerWorkItemAction(siteId: string, buildingId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const unit = (formData.get("unit") as string) || "%";
  const rate = parseFloat((formData.get("rate") as string) || "0");
  const buWork = parseFloat((formData.get("buWork") as string) || "0");
  const partAmount = parseFloat((formData.get("partAmount") as string) || "0");
  if (!name) return;

  await prisma.workItem.create({
    data: { siteId, buildingId, name, unit, rate, buWork, partAmount },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateTowerWorkProgressAction(
  siteId: string,
  itemsProgress: { id: string; name?: string; previousQty: number; currentQty: number; previousPct?: number; currentPct?: number; cumulativePct?: number; partAmount?: number; previousAmt?: number; currentAmt?: number; cumulativeAmt?: number }[]
) {
  for (const item of itemsProgress) {
    await prisma.workItem.update({
      where: { id: item.id },
      data: {
        previousQty: item.previousQty,
        currentQty: item.currentQty,
        previousPct: item.previousPct ?? 0,
        currentPct: item.currentPct ?? 0,
        ...(item.name !== undefined ? { name: item.name } : {}),
        ...(item.partAmount !== undefined ? { partAmount: item.partAmount } : {}),
        ...(item.cumulativePct !== undefined ? { cumulativePct: item.cumulativePct } : {}),
        ...(item.previousAmt !== undefined ? { previousAmt: item.previousAmt } : {}),
        ...(item.currentAmt !== undefined ? { currentAmt: item.currentAmt } : {}),
        ...(item.cumulativeAmt !== undefined ? { cumulativeAmt: item.cumulativeAmt } : {}),
      },
    });
  }

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function deleteTowerWorkItemAction(siteId: string, workItemId: string) {
  await prisma.workItem.delete({ where: { id: workItemId } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addSupplyLabourEntryAction(siteId: string, formData: FormData) {
  const challanNo = formData.get("challanNo") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const fitterQty = parseFloat((formData.get("fitterQty") as string) || "0");
  const fitterHours = parseFloat((formData.get("fitterHours") as string) || "0");
  const fitterRate = parseFloat((formData.get("fitterRate") as string) || "1100");

  const helperQty = parseFloat((formData.get("helperQty") as string) || "0");
  const helperHours = parseFloat((formData.get("helperHours") as string) || "0");
  const helperRate = parseFloat((formData.get("helperRate") as string) || "800");

  if (!description) return;

  // Amount calculation based on Excel sheet formulas:
  // If hours provided: (fitterQty * fitterHours / 8) * rate + (helperQty * helperHours / 8) * rate
  // If count/nos provided: fitterQty * rate + helperQty * rate
  let fitterAmt = 0;
  if (fitterHours > 0) {
    fitterAmt = (fitterQty * fitterHours / 8) * fitterRate;
  } else {
    fitterAmt = fitterQty * fitterRate;
  }

  let helperAmt = 0;
  if (helperHours > 0) {
    helperAmt = (helperQty * helperHours / 8) * helperRate;
  } else {
    helperAmt = helperQty * helperRate;
  }

  const totalAmount = fitterAmt + helperAmt;
  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.supplyLabourEntry.create({
    data: {
      siteId,
      challanNo,
      description,
      date,
      fitterQty,
      fitterHours,
      fitterRate,
      helperQty,
      helperHours,
      helperRate,
      totalAmount,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function deleteSupplyLabourEntryAction(siteId: string, entryId: string) {
  await prisma.supplyLabourEntry.delete({ where: { id: entryId } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateSupplyLabourEntriesAction(
  siteId: string,
  entries: {
    id: string;
    date?: string;
    challanNo?: string;
    description?: string;
    fitterQty?: number;
    fitterHours?: number;
    fitterRate?: number;
    helperQty?: number;
    helperHours?: number;
    helperRate?: number;
    totalAmount?: number;
  }[]
) {
  for (const entry of entries) {
    const dateVal = entry.date ? new Date(entry.date) : undefined;
    await prisma.supplyLabourEntry.update({
      where: { id: entry.id },
      data: {
        ...(dateVal ? { date: dateVal } : {}),
        challanNo: entry.challanNo ?? "",
        description: entry.description ?? "",
        fitterQty: entry.fitterQty ?? 0,
        fitterHours: entry.fitterHours ?? 0,
        fitterRate: entry.fitterRate ?? 1100,
        helperQty: entry.helperQty ?? 0,
        helperHours: entry.helperHours ?? 0,
        helperRate: entry.helperRate ?? 800,
        totalAmount: entry.totalAmount ?? 0,
      },
    });
  }

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function generateRunningBillAction(siteId: string, formData: FormData) {
  const billNo = formData.get("billNo") as string || `BILL-${Date.now()}`;
  const refNo = formData.get("refNo") as string || "01";
  const periodLabel = formData.get("periodLabel") as string || new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
  const cgstPct = parseFloat((formData.get("cgstPct") as string) || "9");
  const sgstPct = parseFloat((formData.get("sgstPct") as string) || "9");
  const retentionPct = parseFloat((formData.get("retentionPct") as string) || "2");
  const tdsPct = parseFloat((formData.get("tdsPct") as string) || "1");

  // Fetch all towers & supply entries for this site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      buildings: {
        include: { workItems: true },
      },
      supplyLabourEntries: true,
    },
  });

  if (!site) return;

  const billDateStr = formData.get("billDate") as string;
  const billDate = billDateStr ? new Date(billDateStr) : new Date();

  const runningBill = await prisma.runningBill.create({
    data: {
      siteId,
      billNo,
      refNo,
      periodLabel,
      billDate,
      cgstPct,
      sgstPct,
      retentionPct,
      tdsPct,
      status: "GENERATED",
    },
  });


  // Create bill lines for each building work item
  let order = 0;
  for (const b of site.buildings) {
    for (const item of b.workItems) {
      if (item.currentQty > 0 || item.previousQty > 0) {
        const previousAmount = item.previousQty * item.rate;
        const currentAmount = item.currentQty * item.rate;
        const cumulativeAmount = (item.previousQty + item.currentQty) * item.rate;

        await prisma.billLine.create({
          data: {
            runningBillId: runningBill.id,
            buildingId: b.id,
            workItemId: item.id,
            description: `${b.name} - ${item.name}`,
            unit: item.unit,
            woQty: item.buWork,
            rate: item.rate,
            previousQty: item.previousQty,
            currentQty: item.currentQty,
            cumulativeQty: item.previousQty + item.currentQty,
            previousAmount,
            currentAmount,
            cumulativeAmount,
            order: order++,
          },
        });
      }
    }
  }

  // Create bill line for Supply Labour total
  const supplyTotal = site.supplyLabourEntries.reduce((sum, se) => sum + se.totalAmount, 0);
  if (supplyTotal > 0) {
    await prisma.billLine.create({
      data: {
        runningBillId: runningBill.id,
        description: "Departmental Extra Labour Supply",
        unit: "Nos/Hrs",
        rate: 1,
        previousQty: 0,
        currentQty: 1,
        cumulativeQty: 1,
        previousAmount: 0,
        currentAmount: supplyTotal,
        cumulativeAmount: supplyTotal,
        isSupplyLabour: true,
        order: order++,
      },
    });

    // Link supply entries to this running bill
    await prisma.supplyLabourEntry.updateMany({
      where: { siteId, runningBillId: null },
      data: { runningBillId: runningBill.id },
    });
  }

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function recordClientPaymentAction(siteId: string, formData: FormData) {
  const amount = parseFloat((formData.get("amount") as string) || "0");
  const mode = (formData.get("mode") as string) || "CASH";
  const accountCredited = formData.get("accountCredited") as string;
  const remarks = formData.get("remarks") as string;
  const dateStr = formData.get("date") as string;
  if (!amount) return;

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.payment.create({
    data: { siteId, amount, mode, accountCredited, remarks, date },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateSiteTaxSettingsAction(siteId: string, formData: FormData) {
  const retentionPct = parseFloat((formData.get("retentionPct") as string) || "2");
  const cgstPct = parseFloat((formData.get("cgstPct") as string) || "9");
  const sgstPct = parseFloat((formData.get("sgstPct") as string) || "9");
  const tdsPct = parseFloat((formData.get("tdsPct") as string) || "1");

  await prisma.site.update({
    where: { id: siteId },
    data: {
      retentionPct: isNaN(retentionPct) ? 2 : retentionPct,
      cgstPct: isNaN(cgstPct) ? 9 : cgstPct,
      sgstPct: isNaN(sgstPct) ? 9 : sgstPct,
      tdsPct: isNaN(tdsPct) ? 1 : tdsPct,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

