import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePaymentSlipPdfBuffer, PaymentSlipData } from "@/lib/pdf/payment-slip";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType"); // "LABOUR" or "SUPERVISOR"
    const type = searchParams.get("type"); // "SINGLE" or "STATEMENT"
    
    if (!entityId || !entityType || !type) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const globalSettings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    const companyName = globalSettings?.companyName || "RCR Enterprises";
    const companyAddress = globalSettings?.address || "";

    let entityName = "";
    let entityRole = "";
    let entityPhone = "";
    let entitySite = "";
    let payments: any[] = [];
    let statementPeriod: { from: Date; to: Date } | undefined;

    if (entityType === "LABOUR") {
      const labour = await prisma.labour.findUnique({
        where: { id: entityId },
        include: { site: true, labourCategory: true }
      });
      if (!labour) return new NextResponse("Labour not found", { status: 404 });
      
      entityName = labour.name;
      entityRole = `Labour (${labour.labourCategory.name})`;
      entityPhone = labour.phone || "";
      entitySite = labour.site.projectName;

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.labourPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!fromStr || !toStr) return new NextResponse("Missing date range", { status: 400 });
        
        const from = new Date(fromStr);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toStr);
        to.setHours(23, 59, 59, 999);

        statementPeriod = { from, to };
        payments = await prisma.labourPayment.findMany({
          where: { labourId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });
      }
    } else if (entityType === "SUPERVISOR") {
      const supervisor = await prisma.user.findUnique({
        where: { id: entityId },
        include: { assignedSites: { include: { site: true } } }
      });
      if (!supervisor) return new NextResponse("Supervisor not found", { status: 404 });
      
      entityName = supervisor.name || "Supervisor";
      entityRole = "Supervisor";
      entityPhone = supervisor.phone || "";
      entitySite = supervisor.assignedSites.map((s: any) => s.site.projectName).join(", ");

      if (type === "SINGLE") {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });
        const p = await prisma.supervisorPayment.findUnique({ where: { id: paymentId } });
        if (!p) return new NextResponse("Payment not found", { status: 404 });
        payments = [p];
      } else {
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        if (!fromStr || !toStr) return new NextResponse("Missing date range", { status: 400 });
        
        const from = new Date(fromStr);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toStr);
        to.setHours(23, 59, 59, 999);

        statementPeriod = { from, to };
        payments = await prisma.supervisorPayment.findMany({
          where: { supervisorId: entityId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" }
        });
      }
    } else {
      return new NextResponse("Invalid entity type", { status: 400 });
    }

    if (payments.length === 0) {
      return new NextResponse("No payments found for the given criteria", { status: 404 });
    }

    let logoStr = null;
    let stampStr = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoStr = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
      
      const stampPath = path.join(process.cwd(), "public", "sign&logo.png");
      if (fs.existsSync(stampPath)) {
        const stampBuffer = fs.readFileSync(stampPath);
        stampStr = `data:image/png;base64,${stampBuffer.toString("base64")}`;
      }
    } catch (e) {
      console.warn("Could not load images for payment slip");
    }

    const pdfData: PaymentSlipData = {
      companyName,
      companyAddress,
      entityName,
      entityRole,
      entityPhone,
      entitySite,
      payments,
      statementPeriod,
      logoStr,
      stampStr
    };

    const pdfBuffer = await generatePaymentSlipPdfBuffer(pdfData);

    const docName = type === "SINGLE" ? "Payment_Receipt" : "Payment_Statement";
    const filename = `${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${docName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Payment Slip PDF Export Error:", error);
    return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
  }
}
