"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  gstNo: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  remarks: z.string().optional(),
});

export async function createClient(formData: FormData) {
  const parsed = clientSchema.parse(Object.fromEntries(formData));
  await prisma.client.create({ data: parsed });
  revalidatePath("/admin/clients");
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  revalidatePath("/admin/clients");
}

export async function updateClient(id: string, formData: FormData) {
  const parsed = clientSchema.parse(Object.fromEntries(formData));
  await prisma.client.update({
    where: { id },
    data: parsed,
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}
