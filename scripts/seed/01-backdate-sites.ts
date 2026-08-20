import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const backdateSites = async () => {
  console.log("Starting Step 1: Backdating Sites & Quotations to 90 days ago...");

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Update Quotations
  const quotations = await prisma.quotation.findMany();
  for (const q of quotations) {
    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        createdAt: ninetyDaysAgo,
        date: ninetyDaysAgo, // Keep the formal date same as creation for consistency
      }
    });
  }
  console.log(`Backdated ${quotations.length} Quotations.`);

  // Update Sites
  const sites = await prisma.site.findMany();
  for (const site of sites) {
    await prisma.site.update({
      where: { id: site.id },
      data: {
        createdAt: ninetyDaysAgo,
        startDate: ninetyDaysAgo,
        progress: 0,
      }
    });
  }
  console.log(`Backdated ${sites.length} Sites.`);

  console.log("Step 1 Complete.");
};

backdateSites()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
