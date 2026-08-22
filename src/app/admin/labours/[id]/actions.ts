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
  const amount = parseFloat(parsed.amount);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Payment/Advance amount must be greater than 0.");
  }
  
  const paymentDate = new Date(parsed.date);
  
  const labour = await prisma.labour.findUnique({
    where: { id: parsed.labourId },
    select: { joiningDate: true, name: true, createdAt: true }
  });

  if (labour) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(paymentDate);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() > today.getTime()) {
      throw new Error("Payment date cannot be in the future.");
    }

    const joiningDate = new Date(labour.joiningDate || labour.createdAt);
    joiningDate.setHours(0, 0, 0, 0);
    if (targetDate.getTime() < joiningDate.getTime()) {
      throw new Error(`Cannot record payment for ${labour.name} before their joining date (${joiningDate.toLocaleDateString()}).`);
    }
  }
  await (prisma as any).labourPayment.create({
    data: {
      labourId: parsed.labourId,
      amount,
      date: new Date(parsed.date),
      reason: parsed.reason || null,
      transactionId: parsed.transactionId || null,
    }
  });

  revalidatePath(`/admin/labours/${parsed.labourId}`);
}
