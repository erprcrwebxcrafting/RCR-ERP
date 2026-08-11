"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSite(formData: FormData) {
  const projectName = formData.get("projectName") as string;
  const clientId = formData.get("clientId") as string;
  const address = formData.get("address") as string;
  const gstNo = formData.get("gstNo") as string;
  const retentionPct = parseFloat((formData.get("retentionPct") as string) || "2");
  const workOrderNo = formData.get("workOrderNo") as string;
  const remarks = formData.get("remarks") as string;

  const buildingNames = formData.getAll("buildingName[]") as string[];

  const workItemNames = formData.getAll("workItemName[]") as string[];
  const workItemUnits = formData.getAll("workItemUnit[]") as string[];
  const workItemRates = formData.getAll("workItemRate[]") as string[];
  const workItemBuWork = formData.getAll("workItemBuWork[]") as string[];

  const labourNames = formData.getAll("labourName[]") as string[];
  const labourWages = formData.getAll("labourWage[]") as string[];
  const labourOT = formData.getAll("labourOT[]") as string[];

  const site = await prisma.site.create({
    data: {
      projectName,
      clientId,
      address,
      gstNo,
      retentionPct: isNaN(retentionPct) ? 2 : retentionPct,
      workOrderNo,
      remarks,
      buildings: {
        create: buildingNames.filter(Boolean).map((name, i) => ({ name, order: i })),
      },
      workItems: {
        create: workItemNames
          .map((name, i) => ({
            name,
            unit: workItemUnits[i] || "Sft",
            rate: parseFloat(workItemRates[i] || "0") || 0,
            buWork: workItemBuWork[i] ? parseFloat(workItemBuWork[i]) : null,
            order: i,
          }))
          .filter((w) => w.name),
      },
      labourCategories: {
        create: labourNames
          .map((name, i) => ({
            name,
            dailyWage: parseFloat(labourWages[i] || "0") || 0,
            overtimeRate: parseFloat(labourOT[i] || "0") || 0,
            order: i,
          }))
          .filter((l) => l.name),
      },
    },
  });

  revalidatePath("/admin/sites");
  redirect(`/admin/sites/${site.id}`);
}

export async function assignSupervisorToSite(siteId: string, supervisorId: string) {
  await prisma.siteSupervisor.upsert({
    where: { siteId_supervisorId: { siteId, supervisorId } },
    create: { siteId, supervisorId },
    update: {},
  });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function removeSupervisorFromSite(siteId: string, supervisorId: string) {
  await prisma.siteSupervisor.delete({ where: { siteId_supervisorId: { siteId, supervisorId } } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addBuilding(siteId: string, name: string) {
  await prisma.building.create({ data: { siteId, name } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addWorkItem(siteId: string, data: { name: string; unit: string; rate: number; buWork?: number }) {
  await prisma.workItem.create({ data: { siteId, ...data } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addLabourCategory(siteId: string, data: { name: string; dailyWage: number; overtimeRate: number }) {
  await prisma.labourCategory.create({ data: { siteId, ...data } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addLabourer(labourCategoryId: string, siteId: string, name: string, phone?: string) {
  await prisma.labour.create({ data: { labourCategoryId, siteId, name, phone } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateSiteProgress(siteId: string, progress: number) {
  if (progress < 0 || progress > 100) throw new Error("Progress must be between 0 and 100");
  await prisma.site.update({
    where: { id: siteId },
    data: { progress },
  });
  revalidatePath(`/admin/sites/${siteId}`);
  revalidatePath(`/admin/sites`);
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

