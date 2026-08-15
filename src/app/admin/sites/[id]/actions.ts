"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";

export async function uploadDocumentAction(siteId: string, formData: FormData) {
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result: any = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: "documents" }, (error, result) => {
      if (error) reject(error);
      resolve(result);
    }).end(buffer);
  });

  await prisma.document.create({
    data: { siteId, name, url: result.secure_url, publicId: result.public_id },
  });
  revalidatePath(`/admin/sites/${siteId}`);
}
export async function deleteDocumentAction(siteId: string, documentId: string, publicId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("Cloudinary destroy failed:", e);
  }
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addBuildingAction(siteId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const approxArea = parseFloat((formData.get("approxArea") as string) || "0");
  const contractRate = parseFloat((formData.get("contractRate") as string) || "0");
  if (!name) return;
  await prisma.building.create({ data: { siteId, name, approxArea, contractRate } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function updateBuildingHeaderAction(siteId: string, buildingId: string, formData: FormData) {
  const approxArea = parseFloat((formData.get("approxArea") as string) || "0");
  const contractRate = parseFloat((formData.get("contractRate") as string) || "0");
  await prisma.building.update({
    where: { id: buildingId },
    data: { approxArea, contractRate },
  });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addWorkItemAction(siteId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const unit = (formData.get("unit") as string) || "Sft";
  const rate = parseFloat((formData.get("rate") as string) || "0");
  if (!name) return;
  await prisma.workItem.create({ data: { siteId, name, unit, rate } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addLabourCategoryAction(siteId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const dailyWage = parseFloat((formData.get("dailyWage") as string) || "0");
  const overtimeRate = parseFloat((formData.get("overtimeRate") as string) || "0");
  if (!name) return;
  await prisma.labourCategory.create({ data: { siteId, name, dailyWage, overtimeRate } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function addLabourerAction(siteId: string, labourCategoryId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  if (!name) return;
  await prisma.labour.create({ data: { siteId, labourCategoryId, name, phone } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function assignSupervisorAction(siteId: string, formData: FormData) {
  const supervisorId = formData.get("supervisorId") as string;
  if (!supervisorId) return;
  await prisma.siteSupervisor.upsert({
    where: { siteId_supervisorId: { siteId, supervisorId } },
    create: { siteId, supervisorId },
    update: {},
  });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function unassignSupervisorAction(siteId: string, supervisorId: string) {
  await prisma.siteSupervisor.delete({ where: { siteId_supervisorId: { siteId, supervisorId } } });
  revalidatePath(`/admin/sites/${siteId}`);
}

export async function recordPaymentAction(siteId: string, formData: FormData) {
  const amount = parseFloat((formData.get("amount") as string) || "0");
  const dateStr = formData.get("date") as string;
  const mode = (formData.get("mode") as string) || "NEFT";
  const accountCredited = (formData.get("accountCredited") as string || "").trim() || null;
  const reference = (formData.get("reference") as string || "").trim() || null;
  const remarks = (formData.get("remarks") as string || "").trim() || null;

  if (isNaN(amount) || amount <= 0) {
    throw new Error("INVALID AMOUNT: Payment amount received must be greater than 0.");
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.payment.create({
    data: {
      siteId,
      date,
      amount,
      mode,
      accountCredited,
      reference,
      remarks,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function calculateLabourPaymentAction(siteId: string, formData: FormData) {
  const periodStart = new Date(formData.get("periodStart") as string);
  const periodEnd = new Date(formData.get("periodEnd") as string);
  periodEnd.setHours(23, 59, 59, 999);

  const labours = await prisma.labour.findMany({
    where: { siteId, active: true },
    include: { labourCategory: true },
  });

  for (const labour of labours) {
    const attendance = await prisma.attendance.findMany({
      where: { labourId: labour.id, date: { gte: periodStart, lte: periodEnd } },
    });
    if (attendance.length === 0) continue;

    const presentDays = attendance.reduce((sum, a) => sum + a.hajari, 0);
    const overtimeHrs = 0; // Deprecated
    const dailyWage = labour.dailyWage || labour.labourCategory.dailyWage; // Current fallback rate
    
    // Calculate total earned by multiplying each day's hajari by the rate snapshotted on that specific day
    const grossAmount = attendance.reduce((sum, a) => sum + (a.hajari * (a.hajariRate || dailyWage)), 0);

    const existing = await prisma.labourEntry.findFirst({
      where: { siteId, labourId: labour.id, periodStart, periodEnd },
    });
    if (existing) {
      await prisma.labourEntry.update({
        where: { id: existing.id },
        data: { presentDays, overtimeHrs, dailyWage, grossAmount },
      });
    } else {
      await prisma.labourEntry.create({
        data: { siteId, labourId: labour.id, periodStart, periodEnd, presentDays, overtimeHrs, dailyWage, grossAmount },
      });
    }
  }

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function approveLabourEntryAction(siteId: string, entryId: string) {
  const session = await auth();
  const approvedById = (session?.user as any)?.id as string | undefined;
  await prisma.labourEntry.update({
    where: { id: entryId },
    data: { approved: true, approvedById },
  });
  revalidatePath(`/admin/sites/${siteId}`);
}
