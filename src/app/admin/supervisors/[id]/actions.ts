"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordSupervisorPayment(formData: FormData) {
  const supervisorId = formData.get("supervisorId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const transactionId = formData.get("transactionId") as string;
  const reason = formData.get("reason") as string;

  if (!supervisorId || isNaN(amount)) return;

  await prisma.supervisorPayment.create({
    data: {
      supervisorId,
      amount,
      transactionId,
      reason,
    },
  });

  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
}
