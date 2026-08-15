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
  const [sitesCount, quotationsCount] = await Promise.all([
    prisma.site.count({ where: { clientId: id } }),
    prisma.quotation.count({ where: { clientId: id } }),
  ]);

  if (sitesCount > 0 || quotationsCount > 0) {
    throw new Error(
      `Cannot delete client: This client has ${sitesCount} site(s) and ${quotationsCount} quotation(s) linked. Please delete or reassign them first.`
    );
  }

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
