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
    select: { monthlySalary: true, name: true },
  });

  if (!supervisor) {
    throw new Error("Supervisor not found.");
  }

  const monthlySalary = supervisor?.monthlySalary || 0;
  const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
  let earnedAmount = 0;
  if (status === "PRESENT") {
    earnedAmount = dailyRate;
  } else if (status === "HALF_DAY") {
    earnedAmount = Math.round((dailyRate / 2) * 100) / 100;
  } else {
    earnedAmount = 0;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const existing = await prisma.supervisorAttendance.findUnique({
    where: { supervisorId_date: { supervisorId, date } }
  });

  if (existing && (new Date().getTime() - new Date(existing.createdAt).getTime() > 24 * 60 * 60 * 1000)) {
    throw new Error("Attendance cannot be edited after 24 hours of creation.");
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
    select: { id: true, monthlySalary: true },
  });

    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

    const existingRecords = await prisma.supervisorAttendance.findMany({ where: { date } });
    const existingMap = new Map(existingRecords.map(r => [r.supervisorId, r]));
    const now = new Date().getTime();

    const operations = supervisors.map((sup) => {
      const existing = existingMap.get(sup.id);
      if (existing && (now - new Date(existing.createdAt).getTime() > 24 * 60 * 60 * 1000)) {
        throw new Error(`Attendance for ${sup.id} cannot be edited after 24 hours of creation.`);
      }

      const monthlySalary = sup.monthlySalary || 0;
      const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
      let earnedAmount = 0;
      if (status === "PRESENT") {
        earnedAmount = dailyRate;
      } else if (status === "HALF_DAY") {
        earnedAmount = Math.round((dailyRate / 2) * 100) / 100;
      }

    return prisma.supervisorAttendance.upsert({
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
    });
  });

  await prisma.$transaction(operations);

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

  const existing = await prisma.supervisorAttendance.findUnique({
    where: { supervisorId_date: { supervisorId, date } }
  });

  if (existing && (new Date().getTime() - new Date(existing.createdAt).getTime() > 24 * 60 * 60 * 1000)) {
    throw new Error("Attendance cannot be deleted after 24 hours of creation.");
  }

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
