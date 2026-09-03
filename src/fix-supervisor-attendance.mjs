import { PrismaClient } from "@prisma/client";
import { getDaysInMonth } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Supervisor Attendance Fix Migration...");
  
  const attendances = await prisma.supervisorAttendance.findMany({
    orderBy: { date: "asc" },
  });

  console.log(`Found ${attendances.length} attendance records to review.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const attendance of attendances) {
    // Find the applicable wage history for this date
    const history = await prisma.supervisorWageHistory.findFirst({
      where: {
        supervisorId: attendance.supervisorId,
        effectiveDate: { lte: attendance.date },
      },
      orderBy: { effectiveDate: "desc" },
    });

    let newDailyRate = attendance.dailyRate;

    if (history && history.monthlySalary) {
      const daysInMonth = getDaysInMonth(attendance.date);
      newDailyRate = history.monthlySalary / daysInMonth;
    } else if (history && history.dailyWage) {
      newDailyRate = history.dailyWage;
    }

    let newEarnedAmount = 0;
    if (attendance.status === "PRESENT") {
      newEarnedAmount = newDailyRate;
    } else if (attendance.status === "HALF_DAY") {
      newEarnedAmount = newDailyRate / 2;
    }

    if (newDailyRate !== attendance.dailyRate || newEarnedAmount !== attendance.earnedAmount) {
      await prisma.supervisorAttendance.update({
        where: { id: attendance.id },
        data: {
          dailyRate: newDailyRate,
          earnedAmount: newEarnedAmount,
        },
      });
      console.log(`Updated Attendance [${attendance.date.toISOString().split("T")[0]}] for Supervisor ${attendance.supervisorId}: oldRate=${attendance.dailyRate} -> newRate=${newDailyRate}`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Migration Complete. Updated ${updatedCount} records. Skipped ${skippedCount} records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
