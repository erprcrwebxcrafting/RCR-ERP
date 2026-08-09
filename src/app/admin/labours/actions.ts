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
  labourCategoryId: z.string().min(1, "Category is required"),
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
  const data = {
    name: parsed.name,
    phone: parsed.phone || null,
    address: parsed.address || null,
    siteId: parsed.siteId,
    labourCategoryId: parsed.labourCategoryId,
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
