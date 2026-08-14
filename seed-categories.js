const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany();
  const categories = [
    { name: 'Fitter', dailyWage: 1100, overtimeRate: 150 },
    { name: 'Fitter Helper', dailyWage: 800, overtimeRate: 100 },
    { name: 'Carpenter', dailyWage: 1200, overtimeRate: 150 },
    { name: 'Mason', dailyWage: 1000, overtimeRate: 120 }
  ];
  
  let count = 0;
  for (const site of sites) {
    for (const cat of categories) {
      // Check if exists
      const exists = await prisma.labourCategory.findFirst({
        where: { siteId: site.id, name: cat.name }
      });
      if (!exists) {
        await prisma.labourCategory.create({
          data: {
            siteId: site.id,
            name: cat.name,
            dailyWage: cat.dailyWage,
            overtimeRate: cat.overtimeRate,
          }
        });
        count++;
      }
    }
  }
  console.log('Added ' + count + ' categories.');
}
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  });
