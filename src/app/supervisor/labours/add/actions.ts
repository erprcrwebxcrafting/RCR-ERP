"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";

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
  ifscCode: z.string().optional(),
  bankBranch: z.string().optional(),
  dailyWage: z.string().optional(),
});

export async function saveSupervisorLabour(formData: FormData) {
  const session = await auth();
  const supervisorId = (session?.user as any)?.id as string;
  if (!supervisorId) throw new Error("Unauthorized");

  const parsed = labourSchema.parse(Object.fromEntries(formData));

  // Verify that the supervisor is actually assigned to this site
  const assignment = await prisma.siteSupervisor.findUnique({
    where: { siteId_supervisorId: { siteId: parsed.siteId, supervisorId } }
  });

  if (!assignment) {
    throw new Error("You are not assigned to this site!");
  }

  const data = {
    name: parsed.name,
    phone: parsed.phone || null,
    address: parsed.address || null,
    siteId: parsed.siteId,
    labourCategoryId: parsed.labourCategoryId,
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
  redirect("/supervisor/labours");
}
