"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function transferLabourAction(data: {
  labourId: string;
  fromSiteId: string | null;
  toSiteId: string;
  toLabourCategoryId: string;
  toSupervisorId?: string;
  newDailyWage?: number;
  newOvertimeRate?: number;
}) {
  const {
    labourId,
    fromSiteId,
    toSiteId,
    toLabourCategoryId,
    toSupervisorId,
    newDailyWage,
    newOvertimeRate,
  } = data;

  try {
    const labour = await prisma.labour.findUnique({
      where: { id: labourId },
    });

    if (!labour) throw new Error("Labour not found");

    await prisma.$transaction(async (tx: any) => {
      // 1. Create transfer history
      await tx.labourTransferHistory.create({
        data: {
          labourId,
          fromSiteId: fromSiteId || labour.siteId,
          toSiteId,
          fromSupervisorId: labour.supervisorId,
          toSupervisorId,
          previousDailyWage: labour.dailyWage,
          newDailyWage: newDailyWage ?? labour.dailyWage,
          previousOvertimeRate: labour.overtimeRate,
          newOvertimeRate: newOvertimeRate ?? labour.overtimeRate,
        },
      });

      // 2. Update labour
      await tx.labour.update({
        where: { id: labourId },
        data: {
          siteId: toSiteId,
          labourCategoryId: toLabourCategoryId,
          supervisorId: toSupervisorId || null,
          dailyWage: newDailyWage ?? labour.dailyWage,
          overtimeRate: newOvertimeRate ?? labour.overtimeRate,
        },
      });
    });

    revalidatePath(`/admin/sites/${fromSiteId}`);
    revalidatePath(`/admin/sites/${toSiteId}`);
    revalidatePath(`/admin/labours`);
    revalidatePath(`/admin/labours/${labourId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Transfer labour error:", error);
    return { success: false, error: error.message };
  }
}

export async function transferSupervisorAction(data: {
  supervisorId: string;
  fromSiteId: string;
  toSiteId: string;
  laboursToTransfer: {
    labourId: string;
    toLabourCategoryId: string;
    newDailyWage?: number;
    newOvertimeRate?: number;
  }[];
}) {
  const { supervisorId, fromSiteId, toSiteId, laboursToTransfer } = data;

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Add supervisor to new site if not already there
      const existingAssignment = await tx.siteSupervisor.findUnique({
        where: {
          siteId_supervisorId: { siteId: toSiteId, supervisorId },
        },
      });

      if (!existingAssignment) {
        await tx.siteSupervisor.create({
          data: { siteId: toSiteId, supervisorId },
        });
      }

      // 2. Remove supervisor from old site
      await tx.siteSupervisor.deleteMany({
        where: { siteId: fromSiteId, supervisorId },
      });

      // 3. Create supervisor transfer history
      await tx.supervisorTransferHistory.create({
        data: {
          supervisorId,
          fromSiteId,
          toSiteId,
          laboursTransferred: laboursToTransfer.length,
        },
      });

      // 4. Transfer associated labours
      for (const labourTransfer of laboursToTransfer) {
        const labour = await tx.labour.findUnique({
          where: { id: labourTransfer.labourId },
        });
        if (!labour) continue;

        await tx.labourTransferHistory.create({
          data: {
            labourId: labour.id,
            fromSiteId,
            toSiteId,
            fromSupervisorId: labour.supervisorId,
            toSupervisorId: supervisorId, // assigning to the transferred supervisor
            previousDailyWage: labour.dailyWage,
            newDailyWage: labourTransfer.newDailyWage ?? labour.dailyWage,
            previousOvertimeRate: labour.overtimeRate,
            newOvertimeRate: labourTransfer.newOvertimeRate ?? labour.overtimeRate,
          },
        });

        await tx.labour.update({
          where: { id: labour.id },
          data: {
            siteId: toSiteId,
            labourCategoryId: labourTransfer.toLabourCategoryId,
            supervisorId: supervisorId,
            dailyWage: labourTransfer.newDailyWage ?? labour.dailyWage,
            overtimeRate: labourTransfer.newOvertimeRate ?? labour.overtimeRate,
          },
        });
      }
    });

    revalidatePath(`/admin/sites/${fromSiteId}`);
    revalidatePath(`/admin/sites/${toSiteId}`);
    revalidatePath(`/admin/supervisors`);
    revalidatePath(`/admin/supervisors/${supervisorId}`);
    revalidatePath(`/admin/labours`);

    return { success: true };
  } catch (error: any) {
    console.error("Transfer supervisor error:", error);
    return { success: false, error: error.message };
  }
}
