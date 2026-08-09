"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const paymentSchema = z.object({
  labourId: z.string().min(1, "Labour ID is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  reason: z.string().optional(),
  transactionId: z.string().optional(),
});

export async function savePayment(formData: FormData) {
  const parsed = paymentSchema.parse(Object.fromEntries(formData));
  
  await (prisma as any).labourPayment.create({
    data: {
      labourId: parsed.labourId,
      amount: parseFloat(parsed.amount),
      date: new Date(parsed.date),
      reason: parsed.reason || null,
      transactionId: parsed.transactionId || null,
    }
  });

  revalidatePath(`/admin/labours/${parsed.labourId}`);
}
