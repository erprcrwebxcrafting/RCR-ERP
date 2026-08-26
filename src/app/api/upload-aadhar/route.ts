import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as "labour" | "supervisor" | null;
  const id = formData.get("id") as string | null;

  if (!file || !type || !id) {
    return NextResponse.json({ error: "Missing required fields: file, type, id" }, { status: 400 });
  }

  if (!["labour", "supervisor"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Must be 'labour' or 'supervisor'." }, { status: 400 });
  }

  // File size limit: 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
  }

  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!allowedMimes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WebP, and PDF are allowed." }, { status: 400 });
  }

  // Role-based authorization
  if (user.role === "SUPERVISOR") {
    if (type === "supervisor") {
      return NextResponse.json({ error: "Supervisors cannot upload their own Aadhar. Contact admin." }, { status: 403 });
    }
    // Supervisor can only upload for their own assigned labours
    if (!id.startsWith("temp-")) {
      const labour = await prisma.labour.findUnique({ where: { id }, select: { supervisorId: true } });
      if (!labour || labour.supervisorId !== user.id) {
        return NextResponse.json({ error: "You can only upload Aadhar for labours assigned to you." }, { status: 403 });
      }
    }
  } else if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch real-world time to bypass the local 2026 time issue
    let realTimestamp = Math.round(Date.now() / 1000);
    try {
      const timeRes = await fetch("http://worldtimeapi.org/api/timezone/Etc/UTC", { cache: "no-store" });
      const timeData = await timeRes.json();
      realTimestamp = timeData.unixtime;
    } catch (e) {
      console.warn("Failed to fetch real time, falling back to local time");
    }

    // Convert File to Buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Manually sign the request to force Cloudinary to use the real timestamp
    const signature = cloudinary.utils.api_sign_request(
      {
        folder: "aadhar-cards",
        public_id: `${type}-${id}`,
        overwrite: true,
        timestamp: realTimestamp,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "aadhar-cards",
          public_id: `${type}-${id}`,
          overwrite: true,
          resource_type: "auto", // handles both images and PDFs
          timestamp: realTimestamp,
          signature: signature,
          api_key: process.env.CLOUDINARY_API_KEY,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(buffer);
    });

    // Persist URL to DB
    if (!id.startsWith("temp-")) {
      if (type === "labour") {
        await prisma.labour.update({ where: { id }, data: { aadharCardUrl: uploadResult.secure_url } });
      } else {
        await prisma.user.update({ where: { id }, data: { aadharCardUrl: uploadResult.secure_url } });
      }
    }

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err: any) {
    console.error("[upload-aadhar] Error:", err);
    return NextResponse.json({ error: "Upload failed. Please check your Cloudinary credentials." }, { status: 500 });
  }
}
