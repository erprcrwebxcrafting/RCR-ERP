import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateBillPdfs } from "../../../../../lib/pdf/bill";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const bill = await prisma.runningBill.findUnique({
      where: { id: id },
      include: {
        site: { include: { client: true } },
        lines: { include: { building: true, workItem: true, labourCategory: true } },
      },
    });

    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pdfs = await generateBillPdfs(bill);
    
    const zip = new JSZip();
    for (const pdf of pdfs) {
      zip.file(pdf.filename, pdf.buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return new Response(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Running_Bill_${bill.billNo.replace(/\//g, "-")}.zip"`,
      },
    });
  } catch (error) {
    console.error("ZIP Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 });
  }
}
