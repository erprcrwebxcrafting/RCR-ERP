import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderQuotationToStream } from "@/lib/pdf/components/renderPdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: id },
    include: { site: { include: { client: true } }, client: true },
  });
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = JSON.parse(quotation.itemsJson);
  const terms = JSON.parse(quotation.termsJson);
  const exclusions = quotation.exclusionsJson ? JSON.parse(quotation.exclusionsJson) : [];

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;
  
  const data = {
    companyName: "RCR ENTERPRISES",
    companyGst: "27CIMPR8276H1ZF",
    companyEmail: "rcrenterprises786@gmail.com",
    companyPhone: "+91 9619439243",
    clientName: quotation.client?.name || quotation.site?.client.name || "",
    projectAddress: quotation.projectName || quotation.site?.address || quotation.site?.projectName || "",
    quotationNo: quotation.quotationNo,
    subject: quotation.subject,
    date: new Date(quotation.date).toLocaleDateString("en-GB"),
    items,
    terms,
    exclusions,
    logoUrl: `${baseUrl}/rcr-logo.png`,
    signUrl: `${baseUrl}/sign&logo.png`,
  };

  const stream = await renderQuotationToStream(data as any);

  const projectName = quotation.projectName || quotation.site?.projectName || quotation.quotationNo;
  const safeFilename = projectName.replace(/[^a-zA-Z0-9-_\s]/g, "").trim().replace(/\s+/g, "_");

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFilename}.pdf"`,
    },
  });
}
