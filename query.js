const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bySite = await prisma.attendance.groupBy({
    by: ['siteId'],
    where: { date: { gte: new Date('2024-01-02T00:00:00Z'), lte: new Date('2024-03-13T23:59:59Z') } },
    _count: { id: true }
  });
  console.log("Sites with attendance in range:", bySite);
}

main().finally(() => prisma.$disconnect());
