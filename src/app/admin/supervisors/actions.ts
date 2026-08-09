"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createSupervisor(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = (formData.get("password") as string) || "supervisor123";
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ 
    data: { 
      name, 
      email, 
      phone, 
      passwordHash, 
      role: "SUPERVISOR",
      monthlySalary,
    } 
  });
  revalidatePath("/admin/supervisors");
}

export async function updateSupervisor(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;
  const password = formData.get("password") as string;

  const data: any = {
    name,
    email,
    phone,
    monthlySalary,
  };

  if (password && password.trim() !== "") {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/supervisors");
  revalidatePath(`/admin/supervisors/${id}`);
}
