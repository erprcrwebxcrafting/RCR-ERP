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

  if (!parsed.name || parsed.name.trim().length < 2) {
    throw new Error("Client name is required (minimum 2 characters).");
  }

  if (parsed.phone && parsed.phone.trim()) {
    let cleanedPhone = parsed.phone.replace(/\D/g, "");
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    if (!/^[1-9]\d{9}$/.test(cleanedPhone)) {
      throw new Error("Please enter a valid 10-digit phone number.");
    }
  }

  if (parsed.gstNo && parsed.gstNo.trim()) {
    const cleanedGST = parsed.gstNo.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanedGST)) {
      throw new Error("Invalid GST Number format (e.g. 27AAAAA0000A1Z5).");
    }
  }

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

  if (!parsed.name || parsed.name.trim().length < 2) {
    throw new Error("Client name is required (minimum 2 characters).");
  }

  if (parsed.phone && parsed.phone.trim()) {
    let cleanedPhone = parsed.phone.replace(/\D/g, "");
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    if (!/^[1-9]\d{9}$/.test(cleanedPhone)) {
      throw new Error("Please enter a valid 10-digit phone number.");
    }
  }

  if (parsed.gstNo && parsed.gstNo.trim()) {
    const cleanedGST = parsed.gstNo.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanedGST)) {
      throw new Error("Invalid GST Number format (e.g. 27AAAAA0000A1Z5).");
    }
  }

  await prisma.client.update({
    where: { id },
    data: parsed,
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}
