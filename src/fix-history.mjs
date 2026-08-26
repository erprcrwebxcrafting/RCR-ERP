import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixHistory() {
  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    include: {
      supervisorAttendances: { orderBy: { date: 'asc' } },
      wageHistory: { orderBy: { effectiveDate: 'asc' } }
    }
  });

  for (const sv of supervisors) {
    if (sv.wageHistory && sv.wageHistory.length > 0) {
      const oldestHistory = sv.wageHistory[0];
      const priorAttendances = sv.supervisorAttendances.filter(a => a.date < oldestHistory.effectiveDate && a.dailyRate > 0);
      
      if (priorAttendances.length > 0) {
        const initialDailyRate = priorAttendances[0].dailyRate;
        const initialMonthlySalary = Math.round(initialDailyRate * 30);
        console.log(`Fixing history for ${sv.name}: Found prior salary of ${initialMonthlySalary}`);
        
        await prisma.supervisorWageHistory.create({
          data: {
            supervisorId: sv.id,
            monthlySalary: initialMonthlySalary,
            dailyWage: initialDailyRate,
            effectiveDate: sv.dateOfJoining || sv.createdAt
          }
        });
      }
    } else if (sv.monthlySalary && (!sv.wageHistory || sv.wageHistory.length === 0)) {
      console.log(`Fixing history for ${sv.name}: Inserting missing initial history of ${sv.monthlySalary}`);
      await prisma.supervisorWageHistory.create({
        data: {
          supervisorId: sv.id,
          monthlySalary: sv.monthlySalary,
          dailyWage: sv.monthlySalary / 30,
          effectiveDate: sv.dateOfJoining || sv.createdAt
        }
      });
    }
  }
}

fixHistory().then(() => console.log('Done')).finally(() => prisma.$disconnect());
