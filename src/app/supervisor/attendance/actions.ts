"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveAttendance(siteId: string, formData: FormData) {
  const session = await auth();
  const markedById = (session?.user as any)?.id as string;
  // Parse date correctly, ensuring it's treated as a local date string (midnight UTC)
  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr); 
  const buildingId = (formData.get("buildingId") as string) || null;

  // 1. Future and Past date validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() > today.getTime()) {
    throw new Error("Attendance date cannot be in the future.");
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (targetDate.getTime() < yesterday.getTime()) {
    throw new Error("Attendance cannot be marked or edited for dates older than 24 hours (yesterday).");
  }

  const labourIds = formData.getAll("labourId[]") as string[];

  const existingRecords = await prisma.attendance.findMany({
    where: {
      date,
      labourId: { in: labourIds }
    }
  });
  
  const existingMap = new Map(existingRecords.map(r => [r.labourId, r]));
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  // Fetch all current labour rates so we can snapshot them
  const currentLabours = await prisma.labour.findMany({
    where: { id: { in: labourIds } },
    include: { labourCategory: true }
  });
  const rateMap = new Map(currentLabours.map(l => [l.id, l.dailyWage || l.labourCategory.dailyWage]));

  for (const labourId of labourIds) {
    const hajariInput = formData.get(`hajari__${labourId}`) as string;
    if (hajariInput === null) continue;
    
    let hajari = parseFloat(hajariInput) || 0;
    if (hajari < 0) hajari = 0;
    if (hajari > 10) hajari = 10; // Cap at max 10 shifts per day
    const status = hajari > 0 ? "PRESENT" : "ABSENT";
    const remarks = formData.get(`remarks__${labourId}`) as string;

    const existing = existingMap.get(labourId);
    // createdAt check removed as per new rule (using attendance date instead)

    const currentRate = rateMap.get(labourId) || 0;

    await prisma.attendance.upsert({
      where: { labourId_date: { labourId, date } },
      create: { siteId, buildingId, labourId, date, status, hajari, hajariRate: currentRate, remarks, markedById },
      update: { buildingId, status, hajari, hajariRate: currentRate, remarks },
    });
  }

  revalidatePath("/supervisor/attendance");
}
