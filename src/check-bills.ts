import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const bills = await prisma.runningBill.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, billNo: true, billDate: true, status: true, site: { select: { projectName: true } } }
  });
  console.log(JSON.stringify(bills, null, 2));
}
main().finally(() => prisma.$disconnect());
