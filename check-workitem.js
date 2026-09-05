const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({
    select: {
      id: true,
      projectName: true,
      buildings: {
        select: {
          name: true,
          workItems: {
            select: {
              name: true,
              previousPct: true,
              currentPct: true,
              previousQty: true,
              currentQty: true,
              unit: true,
            }
          }
        }
      },
      bills: {
        select: { billNo: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    }
  });

  for (const site of sites) {
    const lastBill = site.bills[0]?.billNo || 'None';
    console.log(`\nSite: ${site.projectName} (${site.id}), Last Bill: ${lastBill}`);
    for (const b of site.buildings) {
      for (const item of b.workItems) {
        const cumPct = (item.previousPct || 0) + (item.currentPct || 0);
        console.log(`  ${b.name} - ${item.name}: prevPct=${item.previousPct}, curPct=${item.currentPct}, cumPct=${cumPct}, prevQty=${item.previousQty}, curQty=${item.currentQty}, unit=${item.unit}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
