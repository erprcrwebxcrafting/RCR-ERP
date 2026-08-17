"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateBillPdfPackage } from "@/lib/pdf/bill";
import { sendEmailWithAttachment } from "@/lib/email";
import { createShareLink, buildShareUrl } from "@/lib/share-link";
import { redirect } from "next/navigation";

export async function sendBillEmailAction(billId: string): Promise<void> {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return;

  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: {
      site: {
        include: { client: true, buildings: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, payments: { orderBy: { date: "asc" } } },
      },
      lines: { orderBy: { order: "asc" }, include: { building: true, workItem: true, labourCategory: true } },
      supplyLabourEntries: { orderBy: { date: "asc" } },
    },
  });
  if (!bill || !bill.site.client.email) {
    console.warn("Bill or client email not found for billId:", billId);
    return;
  }

  const { site, lines, supplyLabourEntries } = bill;

  const reconstructedTowers = site.buildings.map((b) => {
    const bLines = lines.filter((l) => l.buildingId === b.id);
    return {
      ...b,
      workItems: bLines.map((l) => ({
        id: l.workItemId || l.id,
        name: l.workItem?.name || l.description || "Work Item",
        unit: l.workItem?.unit || l.unit || "%",
        previousAmt: l.previousAmount,
        currentAmt: l.currentAmount,
        cumulativeAmt: l.cumulativeAmount,
        previousQty: l.previousQty,
        currentQty: l.currentQty,
        cumulativeQty: l.cumulativeQty,
        rate: l.rate,
        partAmount: l.workItem?.partAmount || 0,
      })),
    };
  });

  const globalSettings = await prisma.globalSettings.findUnique({
    where: { id: "global" },
  });

  const pdfBuffer = await generateBillPdfPackage({
    site,
    runningBill: bill,
    towers: reconstructedTowers,
    supplyEntries: supplyLabourEntries,
    payments: site.payments,
    settings: globalSettings,
  });

  const code = await createShareLink("BILL", bill.id);
  const downloadUrl = buildShareUrl(code);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h2 style="color: #4F46E5;">Running Bill Generated</h2>
      <p>Dear Sir/Madam,</p>
      <p>Please find attached the finalized <strong>Running Bill ${bill.billNo}</strong> for the project <strong>${bill.site.projectName}</strong>.</p>
      
      <div style="margin: 30px 0; padding: 20px; background: #F3F4F6; border-radius: 8px; text-align: center;">
        <p style="margin-bottom: 20px; font-size: 14px; color: #666;">You can also view or download the PDF package securely from our portal (Link expires in 72 hours):</p>
        <a href="${downloadUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Bill PDF</a>
      </div>

      <p>Regards,<br/><strong>RCR Enterprises</strong></p>
    </div>
  `;

  await sendEmailWithAttachment(
    bill.site.client.email,
    `Running Bill ${bill.billNo} - ${bill.site.projectName}`,
    `Dear Sir/Madam,\n\nPlease find attached the finalized Running Bill ${bill.billNo} for the project ${bill.site.projectName}.\n\nSecure Download Link: ${downloadUrl}\n\nRegards,\nRCR Enterprises`,
    [{ filename: `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_${bill.billNo.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL.pdf`, content: Buffer.from(pdfBuffer) }],
    html
  );
}

export async function sendBillWhatsAppAction(billId: string): Promise<void> {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return;

  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: { site: { include: { client: true } } },
  });
  if (!bill || !bill.site.client.phone) {
    console.warn("Bill or client phone not found for billId:", billId);
    return;
  }

  const code = await createShareLink("BILL", bill.id);
  const downloadUrl = buildShareUrl(code);

  const message = `Dear Sir/Madam,\n\nPlease find the generated Running Bill ${bill.billNo} for the project ${bill.site.projectName}.\n\n📄 View/Download Bill PDF:\n${downloadUrl}\n\n(This secure link will expire in 72 hours)\n\nRegards,\nRCR Enterprises`;
  const phone = bill.site.client.phone.replace(/[^0-9]/g, "");
  
  redirect(`https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(message)}`);
}
