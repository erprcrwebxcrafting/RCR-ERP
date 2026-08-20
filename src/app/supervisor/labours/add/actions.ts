"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

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
  ifscCode: z.string().optional(),
  bankBranch: z.string().optional(),
  dailyWage: z.string().optional(),
});

export async function saveSupervisorLabour(formData: FormData) {
  const session = await auth();
  const supervisorId = (session?.user as any)?.id as string;
  if (!supervisorId) throw new Error("Unauthorized");

  const parsed = labourSchema.parse(Object.fromEntries(formData));

  if (!parsed.name || parsed.name.trim().length < 2) {
    throw new Error("Full name is required and must be at least 2 characters.");
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

  // Verify that the supervisor is actually assigned to this site
  const assignment = await prisma.siteSupervisor.findUnique({
    where: { siteId_supervisorId: { siteId: parsed.siteId, supervisorId } }
  });

  if (!assignment) {
    throw new Error("You are not assigned to this site!");
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

  const data = {
    name: parsed.name,
    phone: parsed.phone || null,
    address: parsed.address || null,
    siteId: parsed.siteId,
    labourCategoryId: category.id,
    joiningDate: parsed.joiningDate ? new Date(parsed.joiningDate) : null,
    aadharNumber: parsed.aadharNumber || null,
    accountNumber: parsed.accountNumber || null,
    ifscCode: parsed.ifscCode || null,
    bankBranch: parsed.bankBranch || null,
    supervisorId: supervisorId, // automatically assign to this supervisor
    dailyWage: parsed.dailyWage ? parseFloat(parsed.dailyWage) : null,
  };

  if (parsed.id) {
    await prisma.labour.update({ where: { id: parsed.id, supervisorId }, data });
  } else {
    await prisma.labour.create({ data });
  }
  
  revalidatePath("/supervisor/labours");
}
