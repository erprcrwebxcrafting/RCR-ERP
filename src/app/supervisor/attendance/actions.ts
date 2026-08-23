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

  // 1. Future date validation (Applies to all)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() > today.getTime()) {
    return { error: "Attendance date cannot be in the future." };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const labourIds = formData.getAll("labourId[]") as string[];

  const existingRecords = await prisma.attendance.findMany({
    where: {
      date,
      labourId: { in: labourIds }
    }
  });
  
  const existingMap = new Map(existingRecords.map(r => [r.labourId, r]));

  // Fetch all current labour rates and joining dates
  const currentLabours = await prisma.labour.findMany({
    where: { id: { in: labourIds } },
    include: { labourCategory: true }
  });
  const rateMap = new Map(currentLabours.map(l => [l.id, l.dailyWage || l.labourCategory.dailyWage]));
  const labourMap = new Map(currentLabours.map(l => [l.id, l]));

  for (const labourId of labourIds) {
    const hajariInput = formData.get(`hajari__${labourId}`) as string;
    if (hajariInput === null) continue;
    
    let hajari = parseFloat(hajariInput) || 0;
    if (hajari < 0) hajari = 0;
    if (hajari > 10) hajari = 10;
    const status = hajari > 0 ? "PRESENT" : "ABSENT";
    const remarks = formData.get(`remarks__${labourId}`) as string;

    const existing = existingMap.get(labourId);
    const labour = labourMap.get(labourId);
    
    if (!labour) continue;

    // 2. Joining Date Validation (Cannot mark attendance before joining date)
    const joiningDate = new Date(labour.joiningDate || labour.createdAt);
    joiningDate.setHours(0, 0, 0, 0);
    if (targetDate.getTime() < joiningDate.getTime()) {
      return { error: `Cannot mark attendance for ${labour.name} before their joining date (${joiningDate.toLocaleDateString()}).` };
    }

    // 3. 24-Hour Edit Lock (Cannot edit an EXISTING record if it was recorded more than 24 hours ago)
    if (existing) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
        return { error: `Cannot edit attendance for ${labour.name} as it was recorded more than 24 hours ago.` };
      }
    }

    // 4. Rate Snapshot Protection
    // If it's an existing record, keep its original saved rate. Otherwise use the current rate.
    const appliedRate = existing ? existing.hajariRate : (rateMap.get(labourId) || 0);

    await prisma.attendance.upsert({
      where: { labourId_date: { labourId, date } },
      create: { siteId, buildingId, labourId, date, status, hajari, hajariRate: appliedRate, remarks, markedById },
      update: { buildingId, status, hajari, hajariRate: appliedRate, remarks },
    });
  }

  revalidatePath("/supervisor/attendance");
  return { success: true };
}
