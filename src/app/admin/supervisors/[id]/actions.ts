"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordSupervisorPayment(formData: FormData) {
  const supervisorId = formData.get("supervisorId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const transactionId = formData.get("transactionId") as string;
  const reason = formData.get("reason") as string;
  const dateStr = formData.get("date") as string;

  if (!supervisorId || isNaN(amount)) return;

  const date = dateStr ? new Date(dateStr) : new Date();
  
  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId },
    select: { dateOfJoining: true, createdAt: true, name: true }
  });

  if (supervisor) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() > today.getTime()) {
      throw new Error("Payment date cannot be in the future.");
    }

    const joiningDate = new Date(supervisor.dateOfJoining || supervisor.createdAt);
    joiningDate.setHours(0, 0, 0, 0);
    if (targetDate.getTime() < joiningDate.getTime()) {
      throw new Error(`Cannot record payment for ${supervisor.name} before their joining date (${joiningDate.toLocaleDateString()}).`);
    }
  }

  await prisma.supervisorPayment.create({
    data: {
      supervisorId,
      amount,
      transactionId,
      reason,
      date,
    },
  });

  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
}

export async function markSupervisorAttendanceAction(
  supervisorId: string,
  dateStr: string,
  status: "PRESENT" | "HALF_DAY" | "ABSENT",
  remarks?: string
) {
  if (!supervisorId || !dateStr) return;

  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId },
    select: { monthlySalary: true, name: true, dateOfJoining: true, createdAt: true },
  });

  if (!supervisor) return;

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() > today.getTime()) {
    throw new Error("Attendance date cannot be in the future.");
  }

  const joiningDate = new Date(supervisor.dateOfJoining || supervisor.createdAt);
  joiningDate.setHours(0, 0, 0, 0);
  if (targetDate.getTime() < joiningDate.getTime()) {
    throw new Error(`Cannot mark attendance for ${supervisor.name} before their joining date (${joiningDate.toLocaleDateString()}).`);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existing = await prisma.supervisorAttendance.findUnique({
    where: { supervisorId_date: { supervisorId, date } }
  });

  if (existing && targetDate.getTime() < yesterday.getTime()) {
    throw new Error("Attendance cannot be edited for dates older than 24 hours (yesterday).");
  }

  const monthlySalary = supervisor?.monthlySalary || 0;
  const currentDailyRate = Math.round((monthlySalary / 30) * 100) / 100;
  const dailyRate = existing ? existing.dailyRate : currentDailyRate;

  let earnedAmount = 0;
  if (status === "PRESENT") {
    earnedAmount = dailyRate;
  } else if (status === "HALF_DAY") {
    earnedAmount = Math.round((dailyRate / 2) * 100) / 100;
  } else {
    earnedAmount = 0;
  }

  await prisma.supervisorAttendance.upsert({
    where: {
      supervisorId_date: {
        supervisorId,
        date,
      },
    },
    create: {
      supervisorId,
      date,
      status,
      dailyRate,
      earnedAmount,
      remarks: remarks || null,
    },
    update: {
      status,
      dailyRate,
      earnedAmount,
      remarks: remarks || null,
    },
  });

  revalidatePath(`/admin/supervisors/${supervisorId}/attendance`);
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
}

export async function deleteSupervisorAttendanceAction(attendanceId: string, supervisorId: string) {
  await prisma.supervisorAttendance.delete({
    where: { id: attendanceId },
  });
  revalidatePath(`/admin/supervisors/${supervisorId}/attendance`);
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
}
