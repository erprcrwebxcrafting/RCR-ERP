"use server";
// TS Re-check trigger
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function createIndependentQuotation(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  let clientId = formData.get("clientId") as string;
  const newClientName = formData.get("newClientName") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const clientPhone = formData.get("clientPhone") as string;
  const projectName = formData.get("projectName") as string;

  if (newClientName && newClientName.trim() !== "") {
    const newClient = await prisma.client.create({
      data: { 
        name: newClientName.trim(),
        email: clientEmail || null,
        phone: clientPhone || null
      }
    });
    clientId = newClient.id;
  } else if (clientId && (clientEmail || clientPhone)) {
    // Optionally update existing client's contact info if provided in the form
    await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(clientEmail ? { email: clientEmail } : {}),
        ...(clientPhone ? { phone: clientPhone } : {}),
      }
    });
  }

  if (!clientId) throw new Error("Please select a client or provide a new client name");
  const subject = (formData.get("subject") as string || "").trim();
  const terms = formData.get("terms") as string;
  const exclusions = formData.get("exclusions") as string;

  if (!projectName || projectName.trim().length < 2) {
    throw new Error("Project name is required (minimum 2 characters).");
  }

  if (!subject || subject.length < 3) {
    throw new Error("Quotation subject is required.");
  }

  const descs = formData.getAll("itemDescription[]") as string[];
  const units = formData.getAll("itemUnit[]") as string[];
  const rates = formData.getAll("itemRate[]") as string[];

  const items = descs.map((desc, i) => ({
    description: desc,
    unit: units[i] || "Sft",
    rate: parseFloat(rates[i] || "0"),
    remarks: "",
  }));

  const termsJson = JSON.stringify(terms.split("\n").map(t => t.trimEnd()));
  const exclusionsJson = JSON.stringify(exclusions.split("\n").map(t => t.trimEnd()));
  const itemsJson = JSON.stringify(items);

  const count = await prisma.quotation.count();
  const quotationNo = `QTN/${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  await prisma.quotation.create({
    data: {
      clientId,
      projectName,
      quotationNo,
      subject,
      termsJson,
      exclusionsJson,
      itemsJson,
    },
  });

  redirect("/admin/quotations");
}

export async function deleteQuotationAction(quotationId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.quotation.delete({
    where: { id: quotationId },
  });
}

export async function updateQuotationAction(quotationId: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const existingQuotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });

  if (!existingQuotation) throw new Error("Quotation not found");
  
  if (existingQuotation.status !== "DRAFT") {
    throw new Error("Cannot edit a quotation that has already been sent.");
  }

  let clientId = formData.get("clientId") as string;
  const newClientName = formData.get("newClientName") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const clientPhone = formData.get("clientPhone") as string;
  const projectName = formData.get("projectName") as string;

  if (newClientName && newClientName.trim() !== "") {
    const newClient = await prisma.client.create({
      data: { 
        name: newClientName.trim(),
        email: clientEmail || null,
        phone: clientPhone || null
      }
    });
    clientId = newClient.id;
  } else if (clientId && (clientEmail || clientPhone)) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(clientEmail ? { email: clientEmail } : {}),
        ...(clientPhone ? { phone: clientPhone } : {}),
      }
    });
  }

  if (!clientId) throw new Error("Please select a client or provide a new client name");
  const subject = formData.get("subject") as string;
  const terms = formData.get("terms") as string;
  const exclusions = formData.get("exclusions") as string;

  const descs = formData.getAll("itemDescription[]") as string[];
  const units = formData.getAll("itemUnit[]") as string[];
  const rates = formData.getAll("itemRate[]") as string[];

  const items = descs.map((desc, i) => ({
    description: desc,
    unit: units[i] || "Sft",
    rate: parseFloat(rates[i] || "0"),
    remarks: "",
  }));

  const termsJson = JSON.stringify(terms.split("\n").map(t => t.trimEnd()));
  const exclusionsJson = JSON.stringify(exclusions.split("\n").map(t => t.trimEnd()));
  const itemsJson = JSON.stringify(items);

  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      clientId,
      projectName,
      subject,
      termsJson,
      exclusionsJson,
      itemsJson,
    },
  });

  redirect("/admin/quotations");
}
