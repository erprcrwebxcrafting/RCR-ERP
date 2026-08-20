import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderQuotationToStream } from "@/lib/pdf/components/renderPdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quotation, globalSettings] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id: id },
      include: { site: { include: { client: true } }, client: true },
    }),
    prisma.globalSettings.findUnique({
      where: { id: "global" },
    }),
  ]);
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = JSON.parse(quotation.itemsJson || "[]");
  
  let terms = [];
  try {
    const parsedTerms = JSON.parse(quotation.termsJson || "[]");
    terms = Array.isArray(parsedTerms) ? parsedTerms : typeof parsedTerms === 'string' ? parsedTerms.split('\n') : [];
  } catch (e) {
    terms = [];
  }

  let exclusions = [];
  try {
    const parsedExclusions = JSON.parse(quotation.exclusionsJson || "[]");
    exclusions = Array.isArray(parsedExclusions) ? parsedExclusions : typeof parsedExclusions === 'string' ? parsedExclusions.split('\n') : [];
  } catch (e) {
    exclusions = [];
  }

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;
  
  const data = {
    companyName: globalSettings?.companyName || "RCR ENTERPRISES",
    companyGst: "27CIMPR8276H1ZF",
    companyEmail: globalSettings?.email || "rcrenterprises786@gmail.com",
    companyPhone: globalSettings?.phone || "+91 9619439243",
    companyWebsite: globalSettings?.website || "www.rcrenterprises.in",
    companyAddress: globalSettings?.address || "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305",
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
