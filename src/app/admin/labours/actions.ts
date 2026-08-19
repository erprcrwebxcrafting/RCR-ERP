"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const labourSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  siteId: z.string().min(1, "Site is required"),
  labourCategoryName: z.string().min(1, "Category is required"),
  joiningDate: z.string().optional(),
  aadharNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  bankBranch: z.string().optional(),
  supervisorId: z.string().optional(),
  dailyWage: z.string().optional(),
});

export async function saveLabour(formData: FormData) {
  const parsed = labourSchema.parse(Object.fromEntries(formData));

  if (!parsed.name || parsed.name.trim().length < 2) {
    throw new Error("Labourer full name is required (minimum 2 characters).");
  }

  if (!parsed.siteId) {
    throw new Error("Please select a construction site.");
  }

  if (!parsed.labourCategoryName) {
    throw new Error("Please select a labour category / trade.");
  }

  // Find or create the category for this specific site
  let category = await prisma.labourCategory.findFirst({
    where: { siteId: parsed.siteId, name: parsed.labourCategoryName }
  });

  if (!category) {
    category = await prisma.labourCategory.create({
      data: {
        siteId: parsed.siteId,
        name: parsed.labourCategoryName,
        dailyWage: parsed.dailyWage ? parseFloat(parsed.dailyWage) : 800, // Default fallback
      }
    });
  }

  if (parsed.phone && parsed.phone.trim()) {
    let cleanedPhone = parsed.phone.replace(/\s+/g, "");
    if (cleanedPhone.startsWith("+91")) cleanedPhone = cleanedPhone.slice(3);
    else if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) cleanedPhone = cleanedPhone.slice(2);
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }
  }

  if (parsed.aadharNumber && parsed.aadharNumber.trim()) {
    const cleanedAadhar = parsed.aadharNumber.replace(/[\s-]+/g, "");
    if (!/^\d{12}$/.test(cleanedAadhar)) {
      throw new Error("Aadhar card number must be exactly 12 digits.");
    }
  }

  if (parsed.ifscCode && parsed.ifscCode.trim()) {
    const cleanedIFSC = parsed.ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
      throw new Error("Invalid IFSC Code format (e.g. ICIC0000884).");
    }
  }

  const data = {
    name: parsed.name,
    phone: parsed.phone || null,
    address: parsed.address || null,
    siteId: parsed.siteId,
    labourCategoryId: category.id,
    joiningDate: parsed.joiningDate ? new Date(parsed.joiningDate) : null,
    aadharNumber: parsed.aadharNumber || null,
    accountNumber: parsed.accountNumber || null,
    bankName: parsed.bankName || null,
    ifscCode: parsed.ifscCode || null,
    bankBranch: parsed.bankBranch || null,
    supervisorId: parsed.supervisorId || null,
    dailyWage: parsed.dailyWage ? parseFloat(parsed.dailyWage) : null,
  };

  if (parsed.id) {
    await prisma.labour.update({ where: { id: parsed.id }, data });
  } else {
    await prisma.labour.create({ data });
  }
  revalidatePath("/admin/labours");
}

export async function deleteLabour(id: string) {
  await prisma.labour.delete({ where: { id } });
  revalidatePath("/admin/labours");
}
