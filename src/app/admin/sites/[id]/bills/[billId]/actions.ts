"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmailWithAttachment } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateBillPdfPackage } from "@/lib/pdf/bill";

export async function sendBillEmailAction(billId: string): Promise<void> {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return;

  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: {
      site: {
        include: { client: true, buildings: true, payments: { orderBy: { date: "asc" } } },
      },
      lines: { include: { building: true, workItem: true, labourCategory: true } },
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

  const pdfBuffer = await generateBillPdfPackage({
    site,
    runningBill: bill,
    towers: reconstructedTowers,
    supplyEntries: supplyLabourEntries,
    payments: site.payments,
  });

  await sendEmailWithAttachment(
    bill.site.client.email,
    `Running Bill ${bill.billNo} - ${bill.site.projectName}`,
    `Dear Sir,\n\nPlease find attached the finalized Running Bill ${bill.billNo} (PDF Package) for the project ${bill.site.projectName}.\n\nRegards,\nConstruction ERP`,
    [{ filename: `${site.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_${bill.billNo.replace(/[^a-zA-Z0-9]/g, "_")}_RA_BILL.pdf`, content: Buffer.from(pdfBuffer) }]
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

  const message = `Hello Sir,\n\nPlease find the Running Bill ${bill.billNo} for ${bill.site.projectName}. (The detailed PDF package will be emailed to you).\n\nRegards,\nConstruction ERP`;
  await sendWhatsAppMessage(bill.site.client.phone, message);
}
