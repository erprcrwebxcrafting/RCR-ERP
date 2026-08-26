import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixLabourHistory() {
  const labours = await prisma.labour.findMany({
    include: {
      attendances: { orderBy: { date: 'asc' } },
      wageHistory: { orderBy: { effectiveDate: 'asc' } }
    }
  });

  for (const lb of labours) {
    if (lb.wageHistory && lb.wageHistory.length > 0) {
      const oldestHistory = lb.wageHistory[0];
      const priorAttendances = lb.attendances.filter(a => a.date < oldestHistory.effectiveDate && a.hajariRate > 0);
      
      if (priorAttendances.length > 0) {
        const initialDailyRate = priorAttendances[0].hajariRate;
        console.log(`Fixing history for ${lb.name}: Found prior hajari rate of ${initialDailyRate}`);
        
        await prisma.labourWageHistory.create({
          data: {
            labourId: lb.id,
            dailyWage: initialDailyRate,
            effectiveDate: lb.joiningDate || lb.createdAt
          }
        });
      }
    } else if (lb.dailyWage && (!lb.wageHistory || lb.wageHistory.length === 0)) {
      console.log(`Fixing history for ${lb.name}: Inserting missing initial history of ${lb.dailyWage}`);
      await prisma.labourWageHistory.create({
        data: {
          labourId: lb.id,
          dailyWage: lb.dailyWage,
          effectiveDate: lb.joiningDate || lb.createdAt
        }
      });
    }
  }
}

fixLabourHistory().then(() => console.log('Done')).finally(() => prisma.$disconnect());
