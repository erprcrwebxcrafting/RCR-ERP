"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getDaysInMonth } from "date-fns";

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

  let appliedRate = existing ? existing.hajariRate : (labour.dailyWage || labour.labourCategory.dailyWage);
  if (!existing && labour.labourCategory?.name === "Fitter Foreman") {
    const monthlySalary = Math.round((labour.dailyWage || 0) * 30);
    const daysInMonth = getDaysInMonth(date);
    appliedRate = monthlySalary / daysInMonth;
  }
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

export async function toggleLabourActiveSupervisor(labourId: string, active: boolean) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  if (!userId || (session?.user as any)?.role !== "SUPERVISOR") throw new Error("Unauthorized");

  // Ownership check — supervisor can only toggle their own labours
  const labour = await prisma.labour.findUnique({ where: { id: labourId }, select: { supervisorId: true, name: true } });
  if (!labour) throw new Error("Labour not found.");
  if (labour.supervisorId !== userId) throw new Error("You can only change status of labours assigned to you.");

  await prisma.labour.update({ where: { id: labourId }, data: { active } });
  revalidatePath("/supervisor/labours");
  revalidatePath(`/supervisor/labours/${labourId}`);
}

export async function clearIndividualLabourAttendance(labourId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  if (!labourId || !dateStr) {
    throw new Error("Labour ID and Date are required.");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const existing = await prisma.attendance.findUnique({
    where: { labourId_date: { labourId, date } }
  });

  if (!existing) return { success: true };

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
    throw new Error(`Cannot clear attendance as it was recorded more than 24 hours ago.`);
  }

  await prisma.attendance.delete({
    where: { labourId_date: { labourId, date } }
  });

  revalidatePath(`/supervisor/labours/${labourId}`);
  revalidatePath("/supervisor/labours");
  return { success: true };
}
