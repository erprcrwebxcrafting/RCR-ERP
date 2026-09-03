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

  const lastItem = await prisma.workItem.findFirst({
    where: { buildingId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastItem?.order ?? -1) + 1;

  await prisma.workItem.create({
    data: { siteId, buildingId, name, unit, rate, buWork, partAmount, order: nextOrder },
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
    
    const previousAmt = item.previousAmt ?? ((prevPct / 100) * partAmt);
    const currentAmt = item.currentAmt ?? ((currPct / 100) * partAmt);
    const cumulativePct = item.cumulativePct ?? (prevPct + currPct);
    const cumulativeAmt = item.cumulativeAmt ?? (previousAmt + currentAmt);

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
  const challanNo = (formData.get("challanNo") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const dateStr = formData.get("date") as string;
  
  const fitterQty = parseFloat((formData.get("fitterQty") as string) || "0");
  const fitterHours = parseFloat((formData.get("fitterHours") as string) || "0");
  const fitterRate = parseFloat((formData.get("fitterRate") as string) || "1100");

  const helperQty = parseFloat((formData.get("helperQty") as string) || "0");
  const helperHours = parseFloat((formData.get("helperHours") as string) || "0");
  const helperRate = parseFloat((formData.get("helperRate") as string) || "800");

  const fitterForemanQty = parseFloat((formData.get("fitterForemanQty") as string) || "0");
  const fitterForemanHours = parseFloat((formData.get("fitterForemanHours") as string) || "0");
  const fitterForemanRate = parseFloat((formData.get("fitterForemanRate") as string) || "1500");

  if (!description) {
    throw new Error("Description is required for Labour Supply entry.");
  }

  // 1. Negative & sanity validation
  if (fitterQty < 0 || helperQty < 0 || fitterForemanQty < 0 || fitterHours < 0 || helperHours < 0 || fitterForemanHours < 0 || fitterRate < 0 || helperRate < 0 || fitterForemanRate < 0) {
    throw new Error("INVALID VALUE ERROR: Quantities, hours, and rates cannot be negative.");
  }
  if (fitterHours > 24 || helperHours > 24 || fitterForemanHours > 24) {
    throw new Error("INVALID HOURS ERROR: Daily shift hours cannot exceed 24 hours per shift.");
  }
  if (fitterQty === 0 && helperQty === 0 && fitterForemanQty === 0) {
    throw new Error("EMPTY ENTRY ERROR: Please enter at least 1 Fitter, Helper, or Foreman count.");
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  // 2. Future date validation
  const today = new Date();
  if (new Date(date).setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0)) {
    throw new Error(`FUTURE DATE ERROR: Challan date (${formatDate(date)}) cannot be in the future.`);
  }

  // 3. Duplicate Challan check
  if (challanNo) {
    const existing = await prisma.supplyLabourEntry.findFirst({
      where: { siteId, challanNo: { equals: challanNo, mode: "insensitive" } },
    });
    if (existing) {
      throw new Error(`DUPLICATE CHALLAN ERROR: Challan No. "${challanNo}" already exists for this site! Please enter a unique challan number.`);
    }
  }

  // Amount calculation based on Excel sheet formulas:
  // If hours provided: (qty * hours / 8) * rate
  // If count/nos provided: qty * rate
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

  let foremanAmt = 0;
  if (fitterForemanHours > 0) {
    foremanAmt = (fitterForemanQty * fitterForemanHours / 8) * fitterForemanRate;
  } else {
    foremanAmt = fitterForemanQty * fitterForemanRate;
  }

  const totalAmount = fitterAmt + helperAmt + foremanAmt;

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
      fitterForemanQty,
      fitterForemanHours,
      fitterForemanRate,
      totalAmount,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function deleteSupplyLabourEntryAction(siteId: string, entryId: string) {
  const entry = await prisma.supplyLabourEntry.findUnique({
    where: { id: entryId },
    select: { id: true, challanNo: true, runningBillId: true },
  });

  if (!entry) return;

  if (entry.runningBillId) {
    throw new Error(`LOCK ERROR: Challan "${entry.challanNo || entry.id}" is already locked and billed in an official RA Bill. It cannot be deleted.`);
  }

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
    fitterForemanQty?: number;
    fitterForemanHours?: number;
    fitterForemanRate?: number;
    totalAmount?: number;
  }[]
) {
  if (!entries || entries.length === 0) return;

  // 1. Check if any entry is locked/already billed
  const existingEntries = await prisma.supplyLabourEntry.findMany({
    where: { id: { in: entries.map((e) => e.id) } },
    select: { id: true, runningBillId: true, challanNo: true },
  });

  const lockedEntry = existingEntries.find((e) => e.runningBillId);
  if (lockedEntry) {
    throw new Error(`LOCK ERROR: Challan "${lockedEntry.challanNo || lockedEntry.id}" is already locked and billed in an official RA Bill. It cannot be modified.`);
  }

  // 2. Validate negative & hours
  for (const entry of entries) {
    if (
      (entry.fitterQty !== undefined && entry.fitterQty < 0) ||
      (entry.helperQty !== undefined && entry.helperQty < 0) ||
      (entry.fitterForemanQty !== undefined && entry.fitterForemanQty < 0) ||
      (entry.fitterHours !== undefined && entry.fitterHours < 0) ||
      (entry.helperHours !== undefined && entry.helperHours < 0) ||
      (entry.fitterForemanHours !== undefined && entry.fitterForemanHours < 0)
    ) {
      throw new Error("INVALID VALUE ERROR: Quantities and hours cannot be negative.");
    }
    if ((entry.fitterHours && entry.fitterHours > 24) || (entry.helperHours && entry.helperHours > 24) || (entry.fitterForemanHours && entry.fitterForemanHours > 24)) {
      throw new Error("INVALID HOURS ERROR: Daily shift hours cannot exceed 24 hours per shift.");
    }
  }

  const updates = entries.map((entry) => {
    const dateVal = entry.date ? new Date(entry.date) : undefined;
    return prisma.supplyLabourEntry.update({
      where: { id: entry.id },
      data: {
        ...(dateVal ? { date: dateVal } : {}),
        challanNo: entry.challanNo?.trim() ?? "",
        description: entry.description?.trim() ?? "",
        fitterQty: entry.fitterQty ?? 0,
        fitterHours: entry.fitterHours ?? 0,
        fitterRate: entry.fitterRate ?? 1100,
        helperQty: entry.helperQty ?? 0,
        helperHours: entry.helperHours ?? 0,
        helperRate: entry.helperRate ?? 800,
        fitterForemanQty: entry.fitterForemanQty ?? 0,
        fitterForemanHours: entry.fitterForemanHours ?? 0,
        fitterForemanRate: entry.fitterForemanRate ?? 1500,
        totalAmount: entry.totalAmount ?? 0,
      },
    });
  });

  await prisma.$transaction(updates);
  revalidatePath(`/admin/sites/${siteId}`);
}

import { formatInvoiceNo, formatRefNo, formatDate } from "@/lib/utils";

export async function generateRunningBillAction(siteId: string, formData: FormData) {
  const billDateStr = formData.get("billDate") as string;
  const billDate = billDateStr ? new Date(billDateStr) : new Date();
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
      bills: {
        select: { id: true, billNo: true, billDate: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!site) return;

  const nextCount = (site.bills || []).length + 1;
  const billNo = (formData.get("billNo") as string || formatInvoiceNo(nextCount, billDate)).trim();
  const refNo = (formData.get("refNo") as string || formatRefNo(nextCount)).trim();

  // 1. VALIDATION: Check duplicate billNo for this site
  const existingBill = site.bills.find((b: any) => b.billNo.trim().toLowerCase() === billNo.toLowerCase());
  if (existingBill) {
    throw new Error(`DUPLICATE BILL ERROR: Bill No. "${billNo}" already exists for this site! Please use a unique bill number.`);
  }

  const periodStartStr = formData.get("periodStart") as string;
  const periodEndStr = formData.get("periodEnd") as string;

  const periodStart = periodStartStr ? new Date(periodStartStr) : null;
  const periodEnd = periodEndStr ? new Date(periodEndStr) : null;

  // 2. VALIDATION: Date range Start <= End
  if (periodStart && periodEnd && periodStart > periodEnd) {
    throw new Error("DATE RANGE ERROR: Bill Period Start Date cannot be after End Date.");
  }

  // 3. VALIDATION: Chronological Order Check (New bill cannot be earlier than previous bills)
  const sortedBills = [...(site.bills || [])].sort(
    (a: any, b: any) => new Date(b.billDate || b.createdAt).getTime() - new Date(a.billDate || a.createdAt).getTime()
  );
  const latestExistingBill = sortedBills[0];

  if (latestExistingBill) {
    const lastDate = new Date(latestExistingBill.billDate || latestExistingBill.createdAt);
    if (new Date(billDate).setHours(0, 0, 0, 0) < new Date(lastDate).setHours(0, 0, 0, 0)) {
      throw new Error(
        `CHRONOLOGY ERROR: New bill date (${formatDate(billDate)}) cannot be earlier than the previous bill (${latestExistingBill.billNo}) date (${formatDate(lastDate)})! RA Bills must be created in chronological order.`
      );
    }
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

  // 5. VALIDATION: Check for sequential stage execution (Item 2 cannot have progress if Item 1 has 0% progress)
  for (const b of site.buildings) {
    const items = b.workItems || [];
    for (let i = 0; i < items.length; i++) {
      const curPct = items[i].currentPct ?? 0;
      const curQty = items[i].currentQty ?? 0;
      const prevPct = items[i].previousPct ?? 0;
      const prevQty = items[i].previousQty ?? 0;
      const cumPct = prevPct + curPct;
      const cumQty = prevQty + curQty;

      if (curPct > 0 || curQty > 0 || cumPct > 0) {
        for (let j = 0; j < i; j++) {
          const priorPrev = items[j].previousPct ?? 0;
          const priorCur = items[j].currentPct ?? 0;
          const priorCum = priorPrev + priorCur;

          const priorPrevQty = items[j].previousQty ?? 0;
          const priorCurQty = items[j].currentQty ?? 0;
          const priorCumQty = priorPrevQty + priorCurQty;

          if (priorCum <= 0 && priorCumQty <= 0) {
            throw new Error(
              `WORK STAGE SEQUENCE ERROR in "${b.name}": Item #${i + 1} ("${items[i].name}") has progress (${curPct > 0 ? curPct + "%" : cumPct > 0 ? cumPct + "%" : curQty > 0 ? curQty + " Sft" : cumQty + " Sft"}), but prior stage Item #${j + 1} ("${items[j].name}") has 0 completion! Work items must be executed in sequence without skipping earlier stages.`
            );
          }
        }
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
  const amountStr = (formData.get("amount") as string)?.replace(/,/g, "") || "0";
  const amount = parseFloat(amountStr);
  const mode = (formData.get("mode") as string) || "CASH";
  const accountCredited = formData.get("accountCredited") as string;
  const reference = formData.get("reference") as string;
  const remarks = formData.get("remarks") as string;
  const dateStr = formData.get("date") as string;

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  if (!dateStr) {
    throw new Error("Payment date is required.");
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.payment.create({
    data: { siteId, amount, mode, accountCredited, reference, remarks, date },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateSiteTaxSettingsAction(siteId: string, formData: FormData) {
  const parsePct = (val: FormDataEntryValue | null, def: number) => {
    if (val === null || (val as string).trim() === "") return def;
    const num = parseFloat(val as string);
    return isNaN(num) ? def : num;
  };

  const retentionPct = parsePct(formData.get("retentionPct"), 2);
  const cgstPct = parsePct(formData.get("cgstPct"), 9);
  const sgstPct = parsePct(formData.get("sgstPct"), 9);
  const tdsPct = parsePct(formData.get("tdsPct"), 1);

  await prisma.site.update({
    where: { id: siteId },
    data: {
      retentionPct,
      cgstPct,
      sgstPct,
      tdsPct,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

