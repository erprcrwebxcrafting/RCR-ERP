import { PrismaClient } from "@prisma/client";
import { getDaysInMonth } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Fitter Foreman Attendance Fix Migration...");
  
  // Find all Fitter Foreman category IDs (there could be multiple across sites, but usually just one name)
  const foremanCategories = await prisma.labourCategory.findMany({
    where: { name: "Fitter Foreman" }
  });
  const categoryIds = foremanCategories.map(c => c.id);

  if (categoryIds.length === 0) {
    console.log("No Fitter Foreman categories found.");
    return;
  }

  // Find all Fitter Foreman Labours
  const foremen = await prisma.labour.findMany({
    where: { labourCategoryId: { in: categoryIds } }
  });
  const foremanIds = foremen.map(f => f.id);

  if (foremanIds.length === 0) {
    console.log("No Fitter Foremen found.");
    return;
  }

  const attendances = await prisma.attendance.findMany({
    where: { labourId: { in: foremanIds } },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${attendances.length} Fitter Foreman attendance records to review.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const attendance of attendances) {
    // Wait, if it was already updated previously by the user changing the rate, we might multiply a 31-day rate by 30?
    // Let's find the wage history effective on this date
    const history = await prisma.labourWageHistory.findFirst({
        where: {
            labourId: attendance.labourId,
            effectiveDate: { lte: attendance.date }
        },
        orderBy: { effectiveDate: "desc" }
    });
    
    // The history dailyWage was saved as monthlySalary / 30.
    const baseDailyWage = history ? history.dailyWage : attendance.hajariRate;
    
    const monthlySalary = Math.round(baseDailyWage * 30);
    const daysInMonth = getDaysInMonth(attendance.date);
    const newRate = Math.round((monthlySalary / daysInMonth) * 100) / 100;

    if (newRate !== attendance.hajariRate) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          hajariRate: newRate,
        },
      });
      console.log(`Updated Attendance [${attendance.date.toISOString().split("T")[0]}] for Foreman ${attendance.labourId}: oldRate=${attendance.hajariRate} -> newRate=${newRate}`);
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
