const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const todayAttendances = await prisma.attendance.findMany({
    where: { date: { gte: new Date('2026-08-19T00:00:00Z') } },
    select: { siteId: true, date: true }
  });
  console.log('Today attendances:', todayAttendances.length);
  
  const anyAttendances = await prisma.attendance.findMany({
    take: 5,
    orderBy: { date: 'desc' }
  });
  console.log('Recent attendances:', anyAttendances);
}

main().finally(() => prisma.$disconnect());
