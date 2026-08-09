"use server";
// TS Re-check trigger
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmailWithAttachment } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateQuotationPdf } from "@/lib/pdf/quotation";
import { formatINR } from "@/lib/utils";

export async function sendQuotationEmailAction(quotationId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { site: { include: { client: true } }, client: true },
  });
  const clientName = q?.client?.name || q?.site?.client.name;
  const clientEmail = q?.client?.email || q?.site?.client.email;
  const projectName = q?.projectName || q?.site?.projectName;

  if (!q) return { error: "Quotation not found" };
  if (!clientEmail) return { error: "Client email is missing. Please update the Client profile with an email address." };

  const pdfBuffer = await generateQuotationPdf({
    companyName: "RCR Enterprises",
    companyGst: "27XXXXX0000X1Z5",
    companyEmail: "hello@rcrenterprises.com",
    companyPhone: "+91 99999 99999",
    clientName: clientName || "",
    projectAddress: projectName || "",
    subject: q.subject,
    date: q.date.toLocaleDateString("en-IN"),
    items: JSON.parse(q.itemsJson),
    terms: JSON.parse(q.termsJson),
    exclusions: JSON.parse(q.exclusionsJson || "[]"),
  });

  await sendEmailWithAttachment(
    clientEmail,
    `Quotation ${q.quotationNo} - ${projectName}`,
    `Dear Sir,\n\nPlease find attached the quotation ${q.quotationNo}.\n\nRegards,\nConstruction ERP`,
    [{ filename: `Quotation_${q.quotationNo}.pdf`, content: Buffer.from(pdfBuffer) }]
  );

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "SENT" },
  });

  return { success: true };
}

export async function sendQuotationWhatsAppAction(quotationId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { site: { include: { client: true } }, client: true },
  });
  const clientPhone = q?.client?.phone || q?.site?.client.phone;
  const projectName = q?.projectName || q?.site?.projectName;

  if (!q) return { error: "Quotation not found" };
  if (!clientPhone) return { error: "Client phone is missing. Please update the Client profile with a phone number." };

  const message = `Hello Sir,\n\nPlease find the quotation ${q.quotationNo} for ${projectName}. (PDF sent via email).\n\nRegards,\nConstruction ERP`;
  await sendWhatsAppMessage(clientPhone, message);

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "SENT" },
  });

  return { success: true };
}

export async function updateContactAndSendEmailAction(quotationId: string, clientId: string, newEmail: string) {
  if (newEmail) await prisma.client.update({ where: { id: clientId }, data: { email: newEmail } });
  return sendQuotationEmailAction(quotationId);
}

export async function updateContactAndSendWhatsAppAction(quotationId: string, clientId: string, newPhone: string) {
  if (newPhone) await prisma.client.update({ where: { id: clientId }, data: { phone: newPhone } });
  return sendQuotationWhatsAppAction(quotationId);
}
