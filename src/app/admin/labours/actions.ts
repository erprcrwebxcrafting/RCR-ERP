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
  aadharCardUrl: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  bankBranch: z.string().optional(),
  supervisorId: z.string().optional(),
  dailyWage: z.string().optional(),
  effectiveDate: z.string().optional(),
});

export async function saveLabour(formData: FormData) {
  try {
    const parsed = labourSchema.parse(Object.fromEntries(formData));

    if (!parsed.name || parsed.name.trim().length < 2) {
      return { error: "Labourer full name is required (minimum 2 characters)." };
    }

    if (!parsed.siteId) {
      return { error: "Please select a construction site." };
    }

    if (!parsed.labourCategoryName) {
      return { error: "Please select a labour category / trade." };
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
      let cleanedPhone = parsed.phone.replace(/\D/g, "");
      if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
        cleanedPhone = cleanedPhone.substring(2);
      } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
        cleanedPhone = cleanedPhone.substring(1);
      }
      
      if (!/^[1-9]\d{9}$/.test(cleanedPhone)) {
        return { error: "Please enter a valid 10-digit Indian mobile number." };
      }
    }

    if (parsed.aadharNumber && parsed.aadharNumber.trim()) {
      const cleanedAadhar = parsed.aadharNumber.replace(/[\s-]+/g, "");
      if (!/^\d{12}$/.test(cleanedAadhar)) {
        return { error: "Aadhar card number must be exactly 12 digits." };
      }
    }

    if (parsed.ifscCode && parsed.ifscCode.trim()) {
      const cleanedIFSC = parsed.ifscCode.trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
        return { error: "Invalid IFSC Code format (e.g. ICIC0000884)." };
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
      aadharCardUrl: parsed.aadharCardUrl || null,
      accountNumber: parsed.accountNumber || null,
      bankName: parsed.bankName || null,
      ifscCode: parsed.ifscCode || null,
      bankBranch: parsed.bankBranch || null,
      supervisorId: parsed.supervisorId || null,
      dailyWage: parsed.dailyWage ? parseFloat(parsed.dailyWage) : null,
    };

    if (parsed.id) {
      const oldLabour = await prisma.labour.findUnique({ where: { id: parsed.id } });
      await prisma.labour.update({ where: { id: parsed.id }, data });

      // Handle retroactive wage updates if effectiveDate is provided and wage changed
      if (
        parsed.effectiveDate && 
        data.dailyWage !== null && 
        oldLabour?.dailyWage !== data.dailyWage
      ) {
        const effectiveDate = new Date(parsed.effectiveDate);
        effectiveDate.setHours(0, 0, 0, 0);
        
        // 1. Log the history
        // @ts-ignore
        await prisma.labourWageHistory.create({
          data: {
            labourId: parsed.id,
            dailyWage: data.dailyWage,
            effectiveDate: effectiveDate
          }
        });
        
        // 2. Retroactively update all attendances from effectiveDate onwards
        await prisma.attendance.updateMany({
          where: {
            labourId: parsed.id,
            date: { gte: effectiveDate }
          },
          data: {
            hajariRate: data.dailyWage
          }
        });
      }

    } else {
      const newLabour = await prisma.labour.create({ data });
      
      if (data.dailyWage !== null) {
        // @ts-ignore
        await prisma.labourWageHistory.create({
          data: {
            labourId: newLabour.id,
            dailyWage: data.dailyWage,
            effectiveDate: data.joiningDate || new Date()
          }
        });
      }
    }
    revalidatePath("/admin/labours");
    return { success: true };
  } catch (err: any) {
    console.error("saveLabour Error:", err);
    return { error: err.message || "An unexpected database error occurred while saving." };
  }
}

export async function deleteLabour(id: string) {
  await prisma.labour.delete({ where: { id } });
  revalidatePath("/admin/labours");
}

export async function toggleLabourActive(id: string, active: boolean) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") throw new Error("Unauthorized");
  await prisma.labour.update({ where: { id }, data: { active } });
  revalidatePath("/admin/labours");
  revalidatePath(`/admin/labours/${id}`);
}
