import { PrismaClient } from "@prisma/client";
import { fakerEN_IN as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const seedProgressExpenses = async () => {
  console.log("Starting Step 5: Seeding Work Progress & Expenses (last 15 days)...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fifteenDaysAgo = new Date(today);
  fifteenDaysAgo.setDate(today.getDate() - 15);

  const sites = await prisma.site.findMany({
    include: {
      workItems: true,
      labours: true,
    }
  });

  if (sites.length === 0) {
    console.error("No sites found.");
    return;
  }

  let totalExpenses = 0;
  let totalSupplyLabours = 0;

  for (const site of sites) {
    // 1. Update Work Item Progress
    // We will set currentQty to something random relative to buWork
    let totalProgressPct = 0;
    
    for (const item of site.workItems) {
      if (!item.buWork) continue; // Skip if no approx qty
      
      // Randomly progress between 10% to 60% of the buWork
      const progressFactor = (Math.random() * 0.5) + 0.1;
      const currentQty = parseFloat((item.buWork * progressFactor).toFixed(2));
      
      await prisma.workItem.update({
        where: { id: item.id },
        data: {
          currentQty: currentQty,
        }
      });
      totalProgressPct += progressFactor;
    }

    // Update overall site progress
    if (site.workItems.length > 0) {
      const avgProgress = (totalProgressPct / site.workItems.length) * 100;
      await prisma.site.update({
        where: { id: site.id },
        data: { progress: Math.round(avgProgress) }
      });
    }

    // 2. Add Site Expenses over the last 15 days
    for (let d = new Date(fifteenDaysAgo); d <= today; d.setDate(d.getDate() + 3)) { // Every 3 days
      const amount = Math.floor(Math.random() * 5000) + 500; // 500 to 5500
      const descriptions = [
        "Petty Cash for Tea/Snacks",
        "Hardware Material Purchase",
        "Transport / Auto Fare",
        "JCB Rental",
        "Water Tanker"
      ];

      await (prisma as any).siteExpense.create({
        data: {
          siteId: site.id,
          date: new Date(d),
          amount: amount,
          paidTo: faker.person.fullName(),
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          createdAt: new Date(d)
        }
      });
      totalExpenses++;
    }

    // 3. Add Supply Labour Entries (External)
    if (site.labours.length > 0) {
      // Just one or two entries to simulate sub-contractor bills
      for (let i = 0; i < 2; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (Math.random() * 10)); // random day in last 10 days
        
        await prisma.supplyLabourEntry.create({
          data: {
            siteId: site.id,
            date: d,
            challanNo: `CH/${Math.floor(Math.random() * 1000)}`,
            description: "External Labour Supply by RK Contractors",
            fitterQty: Math.floor(Math.random() * 10) + 2,
            fitterHours: 8,
            fitterRate: 1100,
            helperQty: Math.floor(Math.random() * 15) + 5,
            helperHours: 8,
            helperRate: 800,
            totalAmount: 0, // In a real app this is calculated before saving, or handled by a trigger, let's calculate it:
          }
        });
        totalSupplyLabours++;
      }
    }
  }

  // Quick fix: Update totalAmount for supply labours manually here since we missed calculating it in the create block
  const supplyEntries = await prisma.supplyLabourEntry.findMany();
  for (const entry of supplyEntries) {
    const total = (entry.fitterQty * entry.fitterRate) + (entry.helperQty * entry.helperRate);
    await prisma.supplyLabourEntry.update({
      where: { id: entry.id },
      data: { totalAmount: total }
    });
  }

  console.log(`Step 5 Complete. Generated ${totalExpenses} Expenses and ${totalSupplyLabours} Supply Labour Entries. Updated Work Progress.`);
};

seedProgressExpenses()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
