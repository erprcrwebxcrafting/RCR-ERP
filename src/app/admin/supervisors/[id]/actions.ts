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
    select: { monthlySalary: true },
  });

  const monthlySalary = supervisor?.monthlySalary || 0;
  // Fixed daily rate: Monthly Salary / 30
  const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
  let earnedAmount = 0;
  if (status === "PRESENT") {
    earnedAmount = dailyRate;
  } else if (status === "HALF_DAY") {
    earnedAmount = Math.round((dailyRate / 2) * 100) / 100;
  } else {
    earnedAmount = 0;
  }

  // Normalize date to UTC midnight for consistent unique constraint
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

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
