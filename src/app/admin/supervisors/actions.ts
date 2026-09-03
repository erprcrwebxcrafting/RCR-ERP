"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDaysInMonth } from "date-fns";
import { hashPassword } from "@/lib/hash-password";
import { auth } from "@/auth";

export async function createSupervisor(formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const phone = (formData.get("phone") as string || "").trim();
  const password = (formData.get("password") as string) || "supervisor123";
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;

  // New personal fields
  const address = (formData.get("address") as string || "").trim() || null;
  const aadharNumber = (formData.get("aadharNumber") as string || "").trim() || null;
  const aadharCardUrl = (formData.get("aadharCardUrl") as string || "").trim() || null;
  const dateOfJoiningStr = formData.get("dateOfJoining") as string;
  const dateOfJoining = dateOfJoiningStr ? new Date(dateOfJoiningStr) : null;

  // Bank details
  const accountNumber = (formData.get("accountNumber") as string || "").trim() || null;
  const ifscCode = (formData.get("ifscCode") as string || "").trim() || null;
  const bankName = (formData.get("bankName") as string || "").trim() || null;
  const bankBranch = (formData.get("bankBranch") as string || "").trim() || null;

  // Site assignments
  const siteIds = formData.getAll("siteIds[]") as string[];

  if (!name || !email) {
    return { error: "Supervisor name and email are required." };
  }
  if (monthlySalary !== null && (isNaN(monthlySalary) || monthlySalary < 0)) {
    return { error: "Monthly salary cannot be negative." };
  }

  if (phone) {
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    if (!/^[1-9]\d{9}$/.test(cleanedPhone)) {
      return { error: "Please enter a valid 10-digit Indian mobile number." };
    }
  }

  if (!aadharNumber) {
    return { error: "Aadhar card number is required." };
  }
  const cleanedAadhar = aadharNumber.replace(/[\s-]+/g, "");
  if (!/^\d{12}$/.test(cleanedAadhar)) {
    return { error: "Aadhar card number must be exactly 12 digits." };
  }

  if (ifscCode) {
    const cleanedIFSC = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
      return { error: "Invalid IFSC Code format (e.g. ICIC0001234)." };
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: `A user with email "${email}" already exists. Please use a unique email.` };
  }

  // ✅ Enforce strong password policy
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",./<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",./<>?]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    return { error: "Password must be at least 8 characters with uppercase, lowercase, a number, and a special character." };
  }

  const passwordHash = await hashPassword(password);
  const supervisor = await prisma.user.create({ 
    data: { 
      name, 
      email, 
      phone: phone || null, 
      passwordHash, 
      role: "SUPERVISOR",
      monthlySalary,
      address,
      aadharNumber,
      aadharCardUrl,
      dateOfJoining,
      accountNumber,
      ifscCode,
      bankName,
      bankBranch,
    } 
  });

  if (monthlySalary !== null) {
    const effectiveD = dateOfJoining || new Date();
    const daysInMonth = getDaysInMonth(effectiveD);
    const dailyWage = monthlySalary / daysInMonth;
    // @ts-ignore
    await prisma.supervisorWageHistory.create({
      data: {
        supervisorId: supervisor.id,
        monthlySalary,
        dailyWage,
        effectiveDate: effectiveD,
      }
    });
  }

  // ✅ Max 3 active sites validation
  if (siteIds.length > 3) {
    return { error: "A supervisor can only manage a maximum of 3 sites simultaneously. Please reduce the number of assigned sites." };
  }

  // Create site assignments
  if (siteIds.length > 0) {
    await prisma.siteSupervisor.createMany({
      data: siteIds.map((siteId) => ({
        siteId,
        supervisorId: supervisor.id,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/admin/supervisors");
  revalidatePath("/admin/sites");
}

export async function updateSupervisor(id: string, formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const phone = (formData.get("phone") as string || "").trim();
  const monthlySalaryStr = formData.get("monthlySalary") as string;
  const monthlySalary = monthlySalaryStr ? parseFloat(monthlySalaryStr) : null;
  const password = formData.get("password") as string;

  // New personal fields
  const address = (formData.get("address") as string || "").trim() || null;
  const aadharNumber = (formData.get("aadharNumber") as string || "").trim() || null;
  const aadharCardUrl = (formData.get("aadharCardUrl") as string || "").trim() || null;
  const dateOfJoiningStr = formData.get("dateOfJoining") as string;
  const dateOfJoining = dateOfJoiningStr ? new Date(dateOfJoiningStr) : null;

  // Bank details
  const accountNumber = (formData.get("accountNumber") as string || "").trim() || null;
  const ifscCode = (formData.get("ifscCode") as string || "").trim() || null;
  const bankName = (formData.get("bankName") as string || "").trim() || null;
  const bankBranch = (formData.get("bankBranch") as string || "").trim() || null;

  // Site assignments
  const siteIds = formData.getAll("siteIds[]") as string[];
  
  const effectiveDateStr = formData.get("effectiveDate") as string;
  const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : null;
  if (effectiveDate) effectiveDate.setHours(0, 0, 0, 0);

  if (!name || !email) {
    throw new Error("Supervisor name and email are required.");
  }
  if (monthlySalary !== null && (isNaN(monthlySalary) || monthlySalary < 0)) {
    throw new Error("Monthly salary cannot be negative.");
  }

  if (phone) {
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    if (!/^[1-9]\d{9}$/.test(cleanedPhone)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }
  }

  if (!aadharNumber) {
    throw new Error("Aadhar card number is required.");
  }
  const cleanedAadhar = aadharNumber.replace(/[\s-]+/g, "");
  if (!/^\d{12}$/.test(cleanedAadhar)) {
    throw new Error("Aadhar card number must be exactly 12 digits.");
  }

  if (ifscCode) {
    const cleanedIFSC = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
      throw new Error("Invalid IFSC Code format (e.g. ICIC0001234).");
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    throw new Error(`Email "${email}" is already used by another user.`);
  }

  const data: any = {
    name,
    email,
    phone: phone || null,
    monthlySalary,
    address,
    aadharNumber,
    aadharCardUrl,
    dateOfJoining,
    accountNumber,
    ifscCode,
    bankName,
    bankBranch,
  };

  if (password && password.trim() !== "") {
    // ✅ Enforce strong password policy
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",./<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",./<>?]{8,}$/;
    if (!passwordRegex.test(password.trim())) {
      throw new Error("Password must be at least 8 characters with uppercase, lowercase, a number, and a special character.");
    }
    data.passwordHash = await hashPassword(password.trim());
  }

  // ✅ Max 3 active sites validation
  if (siteIds.length > 3) {
    throw new Error("A supervisor can only manage a maximum of 3 sites simultaneously. Please reduce the number of assigned sites.");
  }

  const oldSupervisor = await prisma.user.findUnique({ where: { id } });

  await prisma.user.update({
    where: { id },
    data,
  });

  if (effectiveDate && monthlySalary !== null && oldSupervisor?.monthlySalary !== monthlySalary) {
    const daysInMonth = getDaysInMonth(effectiveDate);
    const dailyWage = monthlySalary / daysInMonth;
    
    // @ts-ignore: Prisma client cache issue in IDE
    await prisma.supervisorWageHistory.create({
      data: {
        supervisorId: id,
        monthlySalary,
        dailyWage,
        effectiveDate
      }
    });
    
    const attendancesToUpdate = await prisma.supervisorAttendance.findMany({
      where: { supervisorId: id, date: { gte: effectiveDate } }
    });

    const updatePromises = attendancesToUpdate.map((attendance) => {
      const days = getDaysInMonth(attendance.date);
      const rate = monthlySalary / days;
      let earned = 0;
      if (attendance.status === "PRESENT") earned = rate;
      else if (attendance.status === "HALF_DAY") earned = rate / 2;
      
      return prisma.supervisorAttendance.update({
        where: { id: attendance.id },
        data: { dailyRate: rate, earnedAmount: earned }
      });
    });

    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }
  }

  // Sync site assignments: delete removed, add new
  const currentAssignments = await prisma.siteSupervisor.findMany({
    where: { supervisorId: id },
    select: { siteId: true },
  });
  const currentSiteIds = currentAssignments.map((a) => a.siteId);
  
  // Sites to remove (currently assigned but not in new list)
  const toRemove = currentSiteIds.filter((sid) => !siteIds.includes(sid));
  // Sites to add (in new list but not currently assigned)
  const toAdd = siteIds.filter((sid) => !currentSiteIds.includes(sid));

  const transactionOps: any[] = [];
  
  if (toRemove.length > 0) {
    transactionOps.push(
      prisma.siteSupervisor.deleteMany({
        where: { supervisorId: id, siteId: { in: toRemove } },
      })
    );
  }
  
  if (toAdd.length > 0) {
    transactionOps.push(
      prisma.siteSupervisor.createMany({
        data: toAdd.map((siteId) => ({ siteId, supervisorId: id })),
        skipDuplicates: true,
      })
    );
  }

  if (transactionOps.length > 0) {
    await prisma.$transaction(transactionOps);
  }

  revalidatePath("/admin/supervisors");
  revalidatePath(`/admin/supervisors/${id}`);
  revalidatePath("/admin/sites");
}

export async function toggleSupervisorActive(id: string, active: boolean) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") throw new Error("Unauthorized");
  await prisma.user.update({ where: { id, role: "SUPERVISOR" }, data: { active } });
  revalidatePath("/admin/supervisors");
  revalidatePath(`/admin/supervisors/${id}`);
}
