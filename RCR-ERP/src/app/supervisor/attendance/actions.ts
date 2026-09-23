"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getDaysInMonth } from "date-fns";

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

  // Batch fetch status histories for all labourers
  const allStatuses = await prisma.labourStatusHistory.findMany({
    where: {
      labourId: { in: labourIds },
      effectiveDate: { lte: targetDate }
    },
    orderBy: { effectiveDate: 'desc' }
  });

  const statusMap = new Map();
  for (const status of allStatuses) {
    if (!statusMap.has(status.labourId)) {
      statusMap.set(status.labourId, status); // takes the latest because of desc order
    }
  }

  const promises = [];

  for (const labourId of labourIds) {
    const hajariInput = formData.get(`hajari__${labourId}`) as string;
    if (hajariInput === null) continue;
    
    if (hajariInput === "") {
      const existing = existingMap.get(labourId);
      if (existing) {
        const twentyFourHoursAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
          return { error: `Cannot clear attendance for ${labourMap.get(labourId)?.name} as it was recorded more than 10 days ago.` };
        }
        promises.push(prisma.attendance.delete({
          where: { labourId_date: { labourId, date } }
        }));
      }
      continue;
    }
    
    let hajari = parseFloat(hajariInput) || 0;
    if (hajari < 0) hajari = 0;
    if (hajari > 10) hajari = 10;
    const status = hajari > 0 ? "PRESENT" : "ABSENT";
    const remarks = formData.get(`remarks__${labourId}`) as string;

    const existing = existingMap.get(labourId);
    const labour = labourMap.get(labourId);
    
    if (!labour) continue;

    // Fitter Foreman Hajari Limit Validation
    if (labour.labourCategory?.name === "Fitter Foreman" && hajari > 1) {
      return { error: `Validation Error: Fitter Foreman (${labour.name}) cannot have more than 1 hajari per day.` };
    }

    // Status History Validation
    const lastStatus = statusMap.get(labourId);

    if (lastStatus && lastStatus.status === "INACTIVE") {
      return { error: `Cannot mark attendance for ${labour.name}. They were marked as INACTIVE on ${lastStatus.effectiveDate.toLocaleDateString()} (Reason: ${lastStatus.reason || 'None provided'}).` };
    } else if (!lastStatus && !labour.active) {
      return { error: `Cannot mark attendance for ${labour.name} as they are currently inactive.` };
    }

    // Joining Date Validation
    const joiningDate = new Date(labour.joiningDate || labour.createdAt);
    joiningDate.setHours(0, 0, 0, 0);
    if (targetDate.getTime() < joiningDate.getTime()) {
      return { error: `Cannot mark attendance for ${labour.name} before their joining date (${joiningDate.toLocaleDateString()}).` };
    }

    // 10-Day Edit Lock
    if (existing) {
      const twentyFourHoursAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
        return { error: `Cannot edit attendance for ${labour.name} as it was recorded more than 10 days ago.` };
      }
    }

    // Rate Snapshot Protection
    let appliedRate = existing ? existing.hajariRate : (rateMap.get(labourId) || 0);
    
    if (!existing && labour.labourCategory?.name === "Fitter Foreman") {
      const monthlySalary = Math.round(appliedRate * 30);
      const daysInMonth = getDaysInMonth(date);
      appliedRate = monthlySalary / daysInMonth;
    }

    promises.push(prisma.attendance.upsert({
      where: { labourId_date: { labourId, date } },
      create: { siteId, buildingId, labourId, date, status, hajari, hajariRate: appliedRate, remarks, markedById },
      update: { buildingId, status, hajari, hajariRate: appliedRate, remarks },
    }));
  }

  // Execute all DB operations concurrently
  if (promises.length > 0) {
    await Promise.all(promises);
  }

  revalidatePath("/supervisor/attendance");
  return { success: true };
}

export async function clearAllAttendance(siteId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const date = new Date(dateStr);
  
  // Only allow clearing if within 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  
  const existingRecords = await prisma.attendance.findMany({
    where: { siteId, date }
  });

  // Check if any record is locked
  for (const record of existingRecords) {
    if (record.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
      return { error: "Cannot clear all attendances because some records are locked (older than 24 hours)." };
    }
  }

  await prisma.attendance.deleteMany({
    where: { siteId, date }
  });

  revalidatePath("/supervisor/attendance");
  return { success: true };
}
