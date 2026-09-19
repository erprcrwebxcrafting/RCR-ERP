"use server";
// TS Re-check trigger
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { sendEmailWithAttachment } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { renderQuotationToBuffer } from "@/lib/pdf/components/renderPdf";
import { formatINR } from "@/lib/utils";

export async function sendQuotationEmailAction(quotationId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const [q, globalSettings] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { site: { include: { client: true } }, client: true },
    }),
    prisma.globalSettings.findUnique({
      where: { id: "global" },
    }),
  ]);
  const clientName = q?.client?.name || q?.site?.client.name;
  const clientEmail = q?.client?.email || q?.site?.client.email;
  const projectName = q?.projectName || q?.site?.projectName;

  if (!q) return { error: "Quotation not found" };
  if (!clientEmail) return { error: "Client email is missing. Please update the Client profile with an email address." };

  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const pdfBuffer = await renderQuotationToBuffer({
    companyName: globalSettings?.companyName || "RCR ENTERPRISES",
    companyGst: "27CIMPR8276H1ZF",
    companyEmail: globalSettings?.email || "rcrenterprises786@gmail.com",
    companyPhone: globalSettings?.phone || "+91 9619439243",
    companyWebsite: globalSettings?.website || "www.rcrenterprises.in",
    companyAddress: globalSettings?.address || "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305",
    clientName: clientName || "",
    projectAddress: projectName || "",
    quotationNo: q.quotationNo,
    subject: q.subject,
    date: new Date(q.date).toLocaleDateString("en-GB"),
    items: JSON.parse(q.itemsJson),
    terms: JSON.parse(q.termsJson),
    exclusions: q.exclusionsJson ? JSON.parse(q.exclusionsJson) : [],
    logoUrl: `${baseUrl}/rcr-logo.png`,
    signUrl: `${baseUrl}/sign&logo.png`,
  } as any);

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

  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;
  const pdfUrl = `${baseUrl}/api/quotations/${quotationId}/pdf`;

  const message = `Hello Sir,\n\nPlease find the quotation ${q.quotationNo} for ${projectName}.\n\nYou can view and download the PDF directly from this link:\n${pdfUrl}\n\nRegards,\nRCR Enterprises`;
  
  // Format phone number for wa.me (remove spaces, +, etc.)
  const formattedPhone = clientPhone.replace(/\D/g, "");
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "SENT" },
  });

  return { success: true, url: waUrl };
}

export async function updateContactAndSendEmailAction(quotationId: string, clientId: string, newEmail: string) {
  if (newEmail) await prisma.client.update({ where: { id: clientId }, data: { email: newEmail } });
  return sendQuotationEmailAction(quotationId);
}

export async function updateContactAndSendWhatsAppAction(quotationId: string, clientId: string, newPhone: string) {
  if (newPhone) await prisma.client.update({ where: { id: clientId }, data: { phone: newPhone } });
  return sendQuotationWhatsAppAction(quotationId);
}
