"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markSupervisorAttendanceUniversal(
  supervisorId: string,
  dateStr: string,
  status: "PRESENT" | "HALF_DAY" | "ABSENT",
  remarks?: string
) {
  if (!supervisorId || !dateStr) {
    throw new Error("Supervisor ID and Date are required.");
  }

  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId },
    select: { monthlySalary: true, name: true, dateOfJoining: true, createdAt: true },
  });

  if (!supervisor) {
    throw new Error("Supervisor not found.");
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

  if (existing) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
      throw new Error("Attendance cannot be edited for dates older than 24 hours from creation.");
    }
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

  revalidatePath("/admin/supervisors/attendance");
  revalidatePath(`/admin/supervisors/${supervisorId}/attendance`);
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
  revalidatePath("/admin/reports");

  return { success: true, supervisorName: supervisor.name, status, earnedAmount };
}

export async function markAllSupervisorsAttendanceUniversal(
  dateStr: string,
  status: "PRESENT" | "HALF_DAY" | "ABSENT"
) {
  if (!dateStr) {
    throw new Error("Date is required.");
  }

  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR", active: true },
    select: { id: true, name: true, monthlySalary: true, dateOfJoining: true, createdAt: true },
  });

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() > today.getTime()) {
    throw new Error("Attendance date cannot be in the future.");
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existingRecords = await prisma.supervisorAttendance.findMany({ where: { date } });
  const existingMap = new Map(existingRecords.map(r => [r.supervisorId, r]));

  const operations = [];
  let processedCount = 0;

  for (const sup of supervisors) {
    const joiningDate = new Date(sup.dateOfJoining || sup.createdAt);
    joiningDate.setHours(0, 0, 0, 0);
    
    // Skip supervisors who haven't joined yet by this target date
    if (targetDate.getTime() < joiningDate.getTime()) {
      continue; 
    }

    const existing = existingMap.get(sup.id);

    // Skip editing if older than 24h
    if (existing && targetDate.getTime() < yesterday.getTime()) {
      continue; 
    }

    const monthlySalary = sup.monthlySalary || 0;
    const currentDailyRate = Math.round((monthlySalary / 30) * 100) / 100;
    const dailyRate = existing ? existing.dailyRate : currentDailyRate;

    let earnedAmount = 0;
    if (status === "PRESENT") {
      earnedAmount = dailyRate;
    } else if (status === "HALF_DAY") {
      earnedAmount = Math.round((dailyRate / 2) * 100) / 100;
    }

    operations.push(
      prisma.supervisorAttendance.upsert({
        where: {
          supervisorId_date: {
            supervisorId: sup.id,
            date,
          },
        },
        create: {
          supervisorId: sup.id,
          date,
          status,
          dailyRate,
          earnedAmount,
        },
        update: {
          status,
          dailyRate,
          earnedAmount,
        },
      })
    );
    processedCount++;
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  revalidatePath("/admin/supervisors/attendance");
  revalidatePath("/admin/supervisors");
  revalidatePath("/admin/reports");

  return { success: true, count: supervisors.length };
}

export async function clearSupervisorAttendanceUniversal(
  supervisorId: string,
  dateStr: string
) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (targetDate.getTime() < yesterday.getTime()) {
    throw new Error("Attendance cannot be deleted for dates older than 24 hours (yesterday).");
  }

  const existing = await prisma.supervisorAttendance.findUnique({
    where: { supervisorId_date: { supervisorId, date } }
  });

  await prisma.supervisorAttendance.deleteMany({
    where: {
      supervisorId,
      date,
    },
  });

  revalidatePath("/admin/supervisors/attendance");
  revalidatePath(`/admin/supervisors/${supervisorId}/attendance`);
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
  revalidatePath("/admin/reports");

  return { success: true };
}
