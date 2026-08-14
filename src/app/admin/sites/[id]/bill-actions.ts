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
  if (!itemsProgress || itemsProgress.length === 0) return;

  const updates = itemsProgress.map((item) => {
    const prevPct = item.previousPct ?? 0;
    const currPct = item.currentPct ?? 0;
    const partAmt = item.partAmount ?? 0;
    
    const previousAmt = (prevPct / 100) * partAmt;
    const currentAmt = (currPct / 100) * partAmt;
    const cumulativePct = prevPct + currPct;
    const cumulativeAmt = previousAmt + currentAmt;

    return prisma.workItem.update({
      where: { id: item.id },
      data: {
        previousQty: item.previousQty,
        currentQty: item.currentQty,
        previousPct: prevPct,
        currentPct: currPct,
        ...(item.name !== undefined ? { name: item.name } : {}),
        partAmount: partAmt,
        previousAmt,
        currentAmt,
        cumulativePct,
        cumulativeAmt,
      },
    });
  });

  await prisma.$transaction(updates);
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
  if (!entries || entries.length === 0) return;

  const updates = entries.map((entry) => {
    const dateVal = entry.date ? new Date(entry.date) : undefined;
    return prisma.supplyLabourEntry.update({
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
  });

  await prisma.$transaction(updates);
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function generateRunningBillAction(siteId: string, formData: FormData) {
  const billNo = (formData.get("billNo") as string || `BILL-${Date.now()}`).trim();
  const refNo = (formData.get("refNo") as string || "01").trim();
  const periodLabel = (formData.get("periodLabel") as string || new Date().toLocaleString("en-US", { month: "short", year: "numeric" })).trim();

  // Fetch all towers & supply entries for this site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      buildings: {
        include: { workItems: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
        orderBy: { createdAt: "asc" },
      },
      supplyLabourEntries: { orderBy: { date: "asc" } },
      bills: { select: { billNo: true } },
    },
  });

  if (!site) return;

  // 1. VALIDATION: Check duplicate billNo for this site
  const existingBill = site.bills.find((b: any) => b.billNo.trim().toLowerCase() === billNo.toLowerCase());
  if (existingBill) {
    throw new Error(`DUPLICATE BILL ERROR: Bill No. "${billNo}" already exists for this site! Please use a unique bill number.`);
  }

  const billDateStr = formData.get("billDate") as string;
  const billDate = billDateStr ? new Date(billDateStr) : new Date();
  const periodStartStr = formData.get("periodStart") as string;
  const periodEndStr = formData.get("periodEnd") as string;

  const periodStart = periodStartStr ? new Date(periodStartStr) : null;
  const periodEnd = periodEndStr ? new Date(periodEndStr) : null;

  // 2. VALIDATION: Date range Start <= End
  if (periodStart && periodEnd && periodStart > periodEnd) {
    throw new Error("DATE RANGE ERROR: Bill Period Start Date cannot be after End Date.");
  }

  // 3. VALIDATION: Check unbilled supply entries & work item progress
  const unbilledSupply = site.supplyLabourEntries.filter((se: any) => {
    if (se.runningBillId) return false;
    const seDate = new Date(se.date);
    if (periodStart && seDate < periodStart) return false;
    if (periodEnd && seDate > periodEnd) return false;
    return true;
  });

  const hasTowerWork = site.buildings.some((b: any) =>
    (b.workItems || []).some((i: any) => (i.currentQty > 0 || (i.currentPct || 0) > 0 || (i.currentAmt || 0) > 0))
  );

  if (!hasTowerWork && unbilledSupply.length === 0) {
    throw new Error("EMPTY BILL ERROR: No current work progress or valid extra labour challans selected for this bill! Please enter work done (%) or check extra labour entries before creating bill.");
  }

  // 4. VALIDATION: Check for over-billing (> 100% cumulative percentage)
  for (const b of site.buildings) {
    for (const item of b.workItems) {
      const currentPct = item.currentPct ?? 0;
      const previousPct = item.previousPct ?? 0;
      const cumPct = previousPct + currentPct;
      if (cumPct > 100.01) {
        throw new Error(`OVER-BILLING ERROR: Item "${item.name}" cumulative percentage (${cumPct.toFixed(1)}%) exceeds 100%!`);
      }
    }
  }

  const runningBill = await prisma.runningBill.create({
    data: {
      siteId,
      billNo,
      refNo,
      periodLabel,
      billDate,
      cgstPct: site.cgstPct ?? 9,
      sgstPct: site.sgstPct ?? 9,
      retentionPct: site.retentionPct ?? 2,
      tdsPct: site.tdsPct ?? 1,
      status: "GENERATED",
    },
  });

  // Prepare all bill lines and workItem updates in bulk for super-fast single transaction execution
  const billLinesData: any[] = [];
  const workItemUpdates: any[] = [];
  let order = 0;

  for (const b of site.buildings) {
    for (const item of b.workItems) {
      const currentPct = item.currentPct ?? 0;
      const previousPct = item.previousPct ?? 0;
      const currentAmt = item.currentAmt ?? 0;
      const previousAmt = item.previousAmt ?? 0;
      const cumulativeAmt = item.cumulativeAmt ?? 0;

      const previousAmount = (previousAmt > 0)
        ? previousAmt
        : (previousPct > 0 && item.partAmount ? (item.partAmount * previousPct / 100) : (item.previousQty * item.rate));
        
      const currentAmount = (currentAmt > 0)
        ? currentAmt
        : (currentPct > 0 && item.partAmount ? (item.partAmount * currentPct / 100) : (item.currentQty * item.rate));
        
      const cumulativeAmount = (cumulativeAmt > 0)
        ? cumulativeAmt
        : (previousAmount + currentAmount);

      const prevQ = previousPct > 0 ? previousPct : item.previousQty;
      const currQ = currentPct > 0 ? currentPct : item.currentQty;
      const cumQ = (previousPct > 0 || currentPct > 0) ? (previousPct + currentPct) : (item.previousQty + item.currentQty);

      billLinesData.push({
        runningBillId: runningBill.id,
        buildingId: b.id,
        workItemId: item.id,
        description: `${b.name} - ${item.name}`,
        unit: item.unit || "%",
        woQty: item.buWork,
        rate: item.rate,
        previousQty: prevQ,
        currentQty: currQ,
        cumulativeQty: cumQ,
        previousAmount,
        currentAmount,
        cumulativeAmount,
        order: order++,
      });

      // Transition current to previous for the next bill
      if (item.currentQty > 0 || currentPct > 0 || currentAmt > 0) {
        workItemUpdates.push(
          prisma.workItem.update({
            where: { id: item.id },
            data: {
              previousQty: item.previousQty + item.currentQty,
              currentQty: 0,
              previousPct: previousPct + currentPct,
              currentPct: 0,
              previousAmt: previousAmount + currentAmount,
              currentAmt: 0,
              cumulativePct: previousPct + currentPct,
              cumulativeAmt: previousAmount + currentAmount,
            },
          })
        );
      }
    }
  }

  // Create bill line for Supply Labour total
  const supplyTotal = unbilledSupply.reduce((sum: number, se: any) => sum + se.totalAmount, 0);

  if (supplyTotal > 0) {
    billLinesData.push({
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
    });
  }

  // Execute createMany + all workItem updates + supply entry linkage in a single batch
  const transactionOps: any[] = [
    prisma.billLine.createMany({ data: billLinesData }),
    ...workItemUpdates,
  ];

  if (unbilledSupply.length > 0) {
    const unbilledIds = unbilledSupply.map((se: any) => se.id);
    transactionOps.push(
      prisma.supplyLabourEntry.updateMany({
        where: { id: { in: unbilledIds } },
        data: { runningBillId: runningBill.id },
      })
    );
  }

  await prisma.$transaction(transactionOps);
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function recordClientPaymentAction(siteId: string, formData: FormData) {
  const amount = parseFloat((formData.get("amount") as string) || "0");
  const mode = (formData.get("mode") as string) || "CASH";
  const accountCredited = formData.get("accountCredited") as string;
  const reference = formData.get("reference") as string;
  const remarks = formData.get("remarks") as string;
  const dateStr = formData.get("date") as string;
  if (!amount) return;

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.payment.create({
    data: { siteId, amount, mode, accountCredited, reference, remarks, date },
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

