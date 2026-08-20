import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // 1. Find the link
    const link = await prisma.shareLink.findUnique({
      where: { code },
    });

    // 2. Validate
    if (!link) {
      return new NextResponse("Link not found or invalid.", { status: 404 });
    }
    
    if (new Date() > link.expiresAt) {
      return new NextResponse("This link has expired.", { status: 410 });
    }

    // 3. Redirect to the internal API route that serves the PDF
    const baseUrl = process.env.AUTH_URL;
    if (!baseUrl) {
      return new NextResponse("AUTH_URL is not defined in the .env file.", { status: 500 });
    }
    
    if (link.type === "BILL") {
      return NextResponse.redirect(`${baseUrl}/api/bills/${link.refId}/pdf`);
    } else if (link.type === "QUOTATION") {
      return NextResponse.redirect(`${baseUrl}/api/quotations/${link.refId}/pdf`);
    }

    return new NextResponse("Invalid link type.", { status: 400 });
  } catch (error) {
    console.error("Error serving shared link:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
