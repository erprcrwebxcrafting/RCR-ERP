"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function markIndividualLabourAttendance(
  labourId: string,
  dateStr: string,
  hajari: number
) {
  const session = await auth();
  const markedById = (session?.user as any)?.id as string;
  
  if (!labourId || !dateStr) {
    throw new Error("Labour ID and Date are required.");
  }

  const labour = await prisma.labour.findUnique({
    where: { id: labourId },
    include: { labourCategory: true }
  });

  if (!labour) {
    throw new Error("Labour not found.");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() > today.getTime()) {
    throw new Error("Attendance date cannot be in the future.");
  }

  const joiningDate = new Date(labour.joiningDate || labour.createdAt);
  joiningDate.setHours(0, 0, 0, 0);
  if (targetDate.getTime() < joiningDate.getTime()) {
    throw new Error(`Cannot mark attendance for ${labour.name} before their joining date (${joiningDate.toLocaleDateString()}).`);
  }

  const existing = await prisma.attendance.findUnique({
    where: { labourId_date: { labourId, date } }
  });

  // 24-Hour Edit Lock
  if (existing) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
      throw new Error(`Cannot edit attendance for ${labour.name} as it was recorded more than 24 hours ago.`);
    }
  }

  const appliedRate = existing ? existing.hajariRate : (labour.dailyWage || labour.labourCategory.dailyWage);
  const status = hajari > 0 ? "PRESENT" : "ABSENT";

  await prisma.attendance.upsert({
    where: { labourId_date: { labourId, date } },
    create: { 
      siteId: labour.siteId, 
      labourId, 
      date, 
      status, 
      hajari, 
      hajariRate: appliedRate,
      markedById 
    },
    update: { 
      status, 
      hajari, 
      hajariRate: appliedRate 
    },
  });

  revalidatePath(`/supervisor/labours/${labourId}`);
  revalidatePath("/supervisor/labours");

  return { success: true };
}
