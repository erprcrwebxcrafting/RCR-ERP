import { PrismaClient } from "@prisma/client";
import { fakerEN_IN as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const seedLabours = async () => {
  console.log("Starting Step 3: Seeding ~100 Internal Labours (70 days ago)...");

  const seventyDaysAgo = new Date();
  seventyDaysAgo.setDate(seventyDaysAgo.getDate() - 70);

  const sites = await prisma.site.findMany({
    include: {
      supervisors: true,
      labourCategories: true,
    }
  });

  if (sites.length === 0) {
    console.error("No sites found.");
    return;
  }

  let totalLabours = 0;

  for (const site of sites) {
    // Determine how many labours this site gets based on number of buildings/workitems roughly (or random 8-15)
    const numLabours = Math.floor(Math.random() * 8) + 8; // 8 to 15 labours per site

    const supervisor = site.supervisors.length > 0 ? site.supervisors[0].supervisorId : null;
    const categories = site.labourCategories;

    if (categories.length === 0) {
      console.warn(`Site ${site.projectName} has no labour categories. Skipping labour creation.`);
      continue;
    }

    for (let i = 0; i < numLabours; i++) {
      // Pick a random category
      const category = categories[Math.floor(Math.random() * categories.length)];

      await prisma.labour.create({
        data: {
          siteId: site.id,
          supervisorId: supervisor,
          labourCategoryId: category.id,
          name: faker.person.fullName(),
          phone: faker.phone.number({ style: 'national' }).replace(/\D/g, '').substring(0, 10),
          address: faker.location.streetAddress(),
          joiningDate: seventyDaysAgo,
          createdAt: seventyDaysAgo,
          dailyWage: category.dailyWage,
          overtimeRate: category.overtimeRate,
          active: true,
          aadharNumber: `12345678${Math.floor(Math.random() * 9000) + 1000}`,
          accountNumber: `987654321${Math.floor(Math.random() * 90) + 10}`,
          ifscCode: "HDFC0001234",
          bankName: "HDFC Bank",
          bankBranch: "Main Branch",
        }
      });
      totalLabours++;
    }
    console.log(`Assigned ${numLabours} labours to ${site.projectName}`);
  }

  console.log(`Step 3 Complete. Seeded a total of ${totalLabours} Labours.`);
};

seedLabours()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
