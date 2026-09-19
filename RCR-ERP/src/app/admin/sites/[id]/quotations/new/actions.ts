"use server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createQuotation(siteId: string, formData: FormData) {
  const subject = formData.get("subject") as string;
  const descriptions = formData.getAll("itemDescription[]") as string[];
  const units = formData.getAll("itemUnit[]") as string[];
  const rates = formData.getAll("itemRate[]") as string[];
  const terms = (formData.get("terms") as string).split("\n").map((t) => t.trimEnd());
  const exclusions = (formData.get("exclusions") as string).split("\n").map((t) => t.trimEnd());

  const items = descriptions
    .map((d, i) => ({ description: d, unit: units[i] || "Sft", rate: parseFloat(rates[i] || "0") || 0 }))
    .filter((i) => i.description);

  const count = await prisma.quotation.count({ where: { siteId } });
  const quotationNo = `RCR/QTN/${new Date().getFullYear()}/${String(count + 1).padStart(3, "0")}`;

  const q = await prisma.quotation.create({
    data: {
      siteId,
      quotationNo,
      subject,
      itemsJson: JSON.stringify(items),
      termsJson: JSON.stringify(terms),
      exclusionsJson: JSON.stringify(exclusions),
      status: "DRAFT",
    },
  });

  redirect(`/admin/sites/${siteId}?tab=quotations&created=${q.id}`);
}
