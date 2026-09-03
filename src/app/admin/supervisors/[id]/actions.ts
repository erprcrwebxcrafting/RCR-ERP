"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDaysInMonth } from "date-fns";

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
    return { error: "Attendance date cannot be in the future." };
  }

  const joiningDate = new Date(supervisor.dateOfJoining || supervisor.createdAt);
  joiningDate.setHours(0, 0, 0, 0);
  if (targetDate.getTime() < joiningDate.getTime()) {
    return { error: `Cannot mark attendance for ${supervisor.name} before their joining date (${joiningDate.toLocaleDateString()}).` };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existing = await prisma.supervisorAttendance.findUnique({
    where: { supervisorId_date: { supervisorId, date } }
  });

  if (existing) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
      return { error: "Attendance cannot be edited. It was recorded more than 24 hours ago and is now locked." };
    }
  }

  const monthlySalary = supervisor?.monthlySalary || 0;
  const daysInMonth = getDaysInMonth(date);
  const currentDailyRate = monthlySalary / daysInMonth;
  
  let historicalDailyRate = currentDailyRate;
  // @ts-ignore: Prisma client cache issue in IDE
  const history = await prisma.supervisorWageHistory.findFirst({
    where: { 
      supervisorId: supervisorId,
      effectiveDate: { lte: date }
    },
    orderBy: { effectiveDate: 'desc' }
  });

  if (history && history.monthlySalary) {
    historicalDailyRate = history.monthlySalary / daysInMonth;
  } else if (history && history.dailyWage) {
    historicalDailyRate = history.dailyWage;
  } else {
    // Fallback heuristic for transitional data: if no history exists for this old date,
    // look at the most recent past attendance to infer what the rate was back then.
    const pastAttendance = await prisma.supervisorAttendance.findFirst({
      where: { supervisorId, date: { lte: date } },
      orderBy: { date: 'desc' }
    });
    if (pastAttendance && pastAttendance.dailyRate) {
      historicalDailyRate = pastAttendance.dailyRate;
    }
  }

  const dailyRate = historicalDailyRate;

  let earnedAmount = 0;
  if (status === "PRESENT") {
    earnedAmount = dailyRate;
  } else if (status === "HALF_DAY") {
    earnedAmount = dailyRate / 2;
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
  return { success: true };
}

export async function deleteSupervisorAttendanceAction(attendanceId: string, supervisorId: string) {
  const existing = await prisma.supervisorAttendance.findUnique({
    where: { id: attendanceId },
  });
  
  if (!existing) {
    return { error: "Attendance record not found." };
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (existing.createdAt.getTime() < twentyFourHoursAgo.getTime()) {
    return { error: "Attendance deletion is disabled. It was recorded more than 24 hours ago and is now locked." };
  }

  await prisma.supervisorAttendance.delete({
    where: { id: attendanceId },
  });
  revalidatePath(`/admin/supervisors/${supervisorId}/attendance`);
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  revalidatePath("/admin/supervisors");
}

export async function getSupervisorMonthlySlipData(supervisorId: string, year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId, role: "SUPERVISOR" },
    include: {
      // @ts-ignore
      wageHistory: {
        orderBy: { effectiveDate: 'desc' }
      }
    }
  });

  if (!supervisor) throw new Error("Supervisor not found");

  const attendances = await prisma.supervisorAttendance.findMany({
    where: {
      supervisorId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const payments = await prisma.supervisorPayment.findMany({
    where: {
      supervisorId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const presentDays = attendances.filter(a => a.status === "PRESENT").length;
  const halfDays = attendances.filter(a => a.status === "HALF_DAY").length;
  const absentDays = attendances.filter(a => a.status === "ABSENT").length;
  const earnedSalary = attendances.reduce((sum, a) => sum + (a.earnedAmount || 0), 0);
  const advancePaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = earnedSalary - advancePaid;
  const netPayable = balance > 0 ? balance : 0;

  let activeMonthlySalary = supervisor.monthlySalary || 0;
  // @ts-ignore
  const historyForMonth = supervisor.wageHistory?.find(h => h.effectiveDate.getTime() <= endDate.getTime());
  if (historyForMonth && historyForMonth.monthlySalary) {
    activeMonthlySalary = historyForMonth.monthlySalary;
  } else {
    const firstValidAttendance = attendances.find(a => a.dailyRate && a.dailyRate > 0);
    if (firstValidAttendance) {
      const daysInThisMonth = getDaysInMonth(firstValidAttendance.date);
      activeMonthlySalary = Math.round(firstValidAttendance.dailyRate * daysInThisMonth);
    }
  }

  const distinctDailyRates = Array.from(new Set(attendances.map(a => a.dailyRate).filter(Boolean))) as number[];
  let salaryString = "";
  let hasMultipleRates = false;

  if (distinctDailyRates.length > 1) {
    hasMultipleRates = true;
    distinctDailyRates.sort((a, b) => a - b); // Assuming it increased
    const daysInThisMonth = getDaysInMonth(startDate);
    const salaries = distinctDailyRates.map(r => Math.round(r * daysInThisMonth));
    salaryString = salaries.map(s => `₹${s.toLocaleString("en-IN")}`).join(" ➔ ");
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
  const doj = supervisor.dateOfJoining || supervisor.createdAt;
  const dojStr = doj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return {
    companyName: "RCR INFRASTRUCTURE",
    companyAddress: "Mumbai, Maharashtra, India",
    employeeName: supervisor.name,
    employeeId: `EMP-${supervisor.id.substring(0, 6).toUpperCase()}`,
    designation: "Supervisor",
    month: monthName,
    year: year.toString(),
    dateOfJoining: dojStr,
    bankName: supervisor.bankName || "N/A",
    accountNumber: supervisor.accountNumber || "N/A",
    monthlySalary: activeMonthlySalary,
    salaryString,
    hasMultipleRates,
    presentDays,
    halfDays,
    absentDays,
    earnedSalary,
    advancePaid,
    netPayable,
  };
}
