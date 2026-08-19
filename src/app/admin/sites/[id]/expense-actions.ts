"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordSiteExpenseAction(siteId: string, formData: FormData) {
  const dateStr = formData.get("date") as string;
  const amountStr = formData.get("amount") as string;
  const paidTo = formData.get("paidTo") as string;
  const description = formData.get("description") as string;

  if (!dateStr || !amountStr || !paidTo || !description) {
    throw new Error("All fields are required.");
  }

  const amount = parseFloat(amountStr.replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Please enter a valid positive amount.");
  }

  await prisma.siteExpense.create({
    data: {
      siteId,
      date: new Date(dateStr),
      amount,
      paidTo,
      description,
    },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function deleteSiteExpenseAction(siteId: string, expenseId: string) {
  await prisma.siteExpense.delete({
    where: { id: expenseId },
  });

  revalidatePath(`/admin/sites/${siteId}`);
}
