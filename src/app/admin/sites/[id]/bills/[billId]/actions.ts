"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmailWithAttachment } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateBillPdfs } from "@/lib/pdf/bill";
import JSZip from "jszip";

export async function sendBillEmailAction(billId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: { site: { include: { client: true } }, lines: { include: { building: true, workItem: true, labourCategory: true } } },
  });
  if (!bill || !bill.site.client.email) throw new Error("Bill or client email not found");

  const pdfs = await generateBillPdfs(bill);
  
  const zip = new JSZip();
  for (const pdf of pdfs) zip.file(pdf.filename, pdf.buffer);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  await sendEmailWithAttachment(
    bill.site.client.email,
    `Running Bill ${bill.billNo} - ${bill.site.projectName}`,
    `Dear Sir,\n\nPlease find attached the Running Bill ${bill.billNo} for the project ${bill.site.projectName}.\n\nRegards,\nConstruction ERP`,
    [{ filename: `Running_Bill_${bill.billNo.replace(/\//g, "-")}.zip`, content: zipBuffer }]
  );
}

export async function sendBillWhatsAppAction(billId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: { site: { include: { client: true } } },
  });
  if (!bill || !bill.site.client.phone) throw new Error("Bill or client phone not found");

  const message = `Hello Sir,\n\nPlease find the Running Bill ${bill.billNo} for ${bill.site.projectName}. (ZIP package will be emailed to you).\n\nRegards,\nConstruction ERP`;
  await sendWhatsAppMessage(bill.site.client.phone, message);
}
