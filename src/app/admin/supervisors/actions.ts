"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createSupervisor(formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const phone = (formData.get("phone") as string || "").trim();
  const password = (formData.get("password") as string) || "supervisor123";
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;

  if (!name || !email) {
    throw new Error("Supervisor name and email are required.");
  }
  if (monthlySalary !== null && (isNaN(monthlySalary) || monthlySalary < 0)) {
    throw new Error("Monthly salary cannot be negative.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A user with email "${email}" already exists. Please use a unique email.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ 
    data: { 
      name, 
      email, 
      phone: phone || null, 
      passwordHash, 
      role: "SUPERVISOR",
      monthlySalary,
    } 
  });
  revalidatePath("/admin/supervisors");
}

export async function updateSupervisor(id: string, formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const phone = (formData.get("phone") as string || "").trim();
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;
  const password = formData.get("password") as string;

  if (!name || !email) {
    throw new Error("Supervisor name and email are required.");
  }
  if (monthlySalary !== null && (isNaN(monthlySalary) || monthlySalary < 0)) {
    throw new Error("Monthly salary cannot be negative.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    throw new Error(`Email "${email}" is already used by another user.`);
  }

  const data: any = {
    name,
    email,
    phone: phone || null,
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
