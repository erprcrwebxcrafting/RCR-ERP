import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting seed data with exact PDF (s.pdf) percentage format matching...");

  const seedSiteIds = [
    "seed-site-pdf",
    "seed-site-100pct",
    "seed-site-25pct",
    "seed-site-multitower",
    "seed-site-notowersupply",
    "seed-site-0",
    "seed-site-1",
    "seed-site-2",
    "seed-site-3",
    "seed-site-4"
  ];

  // Clean up duplicate seed records
  console.log("Cleaning up old test buildings, bills, and payments...");
  await prisma.building.deleteMany({ where: { siteId: { in: seedSiteIds } } });
  await prisma.runningBill.deleteMany({ where: { siteId: { in: seedSiteIds } } });
  await prisma.payment.deleteMany({ where: { siteId: { in: seedSiteIds } } });
  await prisma.supplyLabourEntry.deleteMany({ where: { siteId: { in: seedSiteIds } } });

  // 1. Admin & Supervisor Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@rcrenterprises.com" },
    update: {},
    create: {
      name: "RCR Admin",
      email: "admin@rcrenterprises.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const supervisorPasswordHash = await bcrypt.hash("supervisor123", 10);
  await prisma.user.upsert({
    where: { email: "supervisor@rcrenterprises.com" },
    update: {},
    create: {
      name: "Ramesh Sharma (Supervisor)",
      email: "supervisor@rcrenterprises.com",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
    },
  });

  // -------------------------------------------------------------
  // EXACT SCENARIO MATCHING PDF (s.pdf - NEO ITURKAA ENTERPRISES REF NO. 23)
  // -------------------------------------------------------------
  console.log("Seeding Real PDF Scenario (s.pdf - NEO ITURKAA ENTERPRISES)...");
  const clientPdf = await prisma.client.upsert({
    where: { id: "seed-client-pdf" },
    update: {},
    create: {
      id: "seed-client-pdf",
      name: "NEO ITURKAA ENTERPRISES",
      address: "Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Site Project Manager",
    },
  });

  const sitePdf = await prisma.site.upsert({
    where: { id: "seed-site-pdf" },
    update: {},
    create: {
      id: "seed-site-pdf",
      projectName: "NEO ITURKAA - Real Bill PDF (REF NO. 23)",
      clientId: clientPdf.id,
      address: "Mumbai Site",
      workOrderNo: "WO/NEO/2026/023",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 92,
    },
  });

  // Building matching exact s.pdf format
  const towerPdf = await prisma.building.create({
    data: {
      siteId: sitePdf.id,
      name: "BUA Building (s.pdf Format)",
      approxArea: 184464,
      contractRate: 49.60,
      order: 0,
      workItems: {
        create: [
          // Row 1: 16th slab
          { siteId: sitePdf.id, name: "16th slab", unit: "%", partAmount: 310000, previousPct: 100, currentPct: 0, previousQty: 100, currentQty: 0 },
          // Rows 2-24: 17th slab to 39th slab
          ...Array.from({ length: 23 }, (_, i) => ({
            siteId: sitePdf.id,
            name: `${17 + i}${i === 0 ? 'th' : i === 1 ? 'th' : i === 2 ? 'th' : 'th'} slab`,
            unit: "%",
            partAmount: 340000,
            previousPct: 100,
            currentPct: 0,
            previousQty: 100,
            currentQty: 0,
          })),
          // Row 25: 40th Terrace slab (100% in This Bill)
          { siteId: sitePdf.id, name: "Completion of Terrace Slab 40th slab", unit: "%", partAmount: 340000, previousPct: 0, currentPct: 100, previousQty: 0, currentQty: 100 },
          // Row 26: LMR, OHWT Parapet
          { siteId: sitePdf.id, name: "Completion of LMR, OHWT PARAPET WALL", unit: "%", partAmount: 680000, previousPct: 0, currentPct: 0, previousQty: 0, currentQty: 0 },
        ],
      },
    },
  });

  // Create Bill 23 matching s.pdf
  await prisma.runningBill.create({
    data: {
      siteId: sitePdf.id,
      billNo: "REF NO. : 23",
      refNo: "23",
      periodLabel: "August 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      retentionPct: 2,
      tdsPct: 1,
      lines: {
        create: [
          {
            buildingId: towerPdf.id,
            description: "Completion of Terrace Slab 40th slab (100%)",
            unit: "%",
            woQty: 100,
            rate: 340000,
            previousQty: 2400,
            currentQty: 100,
            cumulativeQty: 2500,
            previousAmount: 8130000,
            currentAmount: 340000,
            cumulativeAmount: 8470000,
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // SCENARIO 1: 100% Completed Site (Golden Heights)
  // -------------------------------------------------------------
  console.log("Seeding Scenario 1: 100% Completed Site...");
  const client1 = await prisma.client.upsert({
    where: { id: "seed-client-100pct" },
    update: {},
    create: {
      id: "seed-client-100pct",
      name: "Godrej Properties Ltd",
      address: "Bandra East, Mumbai",
      gstNo: "27AAACG1234F1Z1",
      contactPerson: "Mr. Rajesh Malhotra",
    },
  });

  const site1 = await prisma.site.upsert({
    where: { id: "seed-site-100pct" },
    update: {},
    create: {
      id: "seed-site-100pct",
      projectName: "Golden Heights - 100% Completed",
      clientId: client1.id,
      address: "Plot 42, Bandra East, Mumbai",
      workOrderNo: "WO/GODREJ/2025/100",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 100,
    },
  });

  const tower1 = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "Tower A (100% Done)",
      approxArea: 23000,
      contractRate: 55,
      order: 0,
      workItems: {
        create: [
          { siteId: site1.id, name: "Raft Footing & Plinth", unit: "%", partAmount: 250000, previousPct: 0, currentPct: 100, previousQty: 0, currentQty: 5000 },
          { siteId: site1.id, name: "1st to 5th Slab Concrete", unit: "%", partAmount: 825000, previousPct: 0, currentPct: 100, previousQty: 0, currentQty: 15000 },
          { siteId: site1.id, name: "Terrace Slab & Parapet", unit: "%", partAmount: 180000, previousPct: 0, currentPct: 100, previousQty: 0, currentQty: 3000 },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // SCENARIO 3: Multi-Tower & Extra Supply Labours (Shivaay Towers / Vikhroli)
  // Matching the user's Excel file structure!
  // -------------------------------------------------------------
  console.log("Seeding Scenario 3: Multi-Tower & Extra Supply Site (Matching Excel)...");
  const client3 = await prisma.client.upsert({
    where: { id: "seed-client-excel" },
    update: {},
    create: {
      id: "seed-client-excel",
      name: "SSHIVAAY CONSTRUCTIONS",
      address: "Flat 5, Sant Krupa CHS, Sector 19, Nerul, Navi Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Mr. Sandip Patil",
    },
  });

  const site3 = await prisma.site.upsert({
    where: { id: "seed-site-multitower" },
    update: {},
    create: {
      id: "seed-site-multitower",
      projectName: "BMC Colony - Multi-Tower & Extra Supply",
      clientId: client3.id,
      address: "Building S2 & S3, Vikhroli, Mumbai",
      workOrderNo: "PARKSITE/SSHIVAAY/2026-27",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 60,
    },
  });

  const towerS2 = await prisma.building.create({
    data: {
      siteId: site3.id,
      name: "Tower S2 Wing",
      approxArea: 314554,
      contractRate: 53,
      order: 0,
      workItems: {
        create: [
          { siteId: site3.id, name: "Raft Footing & Plinth Beam", unit: "Sft", rate: 53, partAmount: 1204584, buWork: 22728, previousQty: 22728, currentQty: 0, previousPct: 100, currentPct: 0 },
          { siteId: site3.id, name: "1st to 14th Slab", unit: "Sft", rate: 53, partAmount: 8863932, buWork: 167244, previousQty: 167244, currentQty: 0, previousPct: 100, currentPct: 0 },
          { siteId: site3.id, name: "15th to 16th Slab Reinforcement", unit: "Sft", rate: 53, partAmount: 1266276, buWork: 23892, previousQty: 0, currentQty: 4729, previousPct: 0, currentPct: 20 },
          { siteId: site3.id, name: "Terrace Slab & LMR", unit: "Sft", rate: 53, partAmount: 1266276, buWork: 23892, previousQty: 0, currentQty: 0, previousPct: 0, currentPct: 0 },
        ],
      },
    },
  });

  const towerS3 = await prisma.building.create({
    data: {
      siteId: site3.id,
      name: "Tower S3 Wing",
      approxArea: 24750,
      contractRate: 52,
      order: 1,
      workItems: {
        create: [
          { siteId: site3.id, name: "15th Slab Reinforcement", unit: "Sft", rate: 52, partAmount: 143000, buWork: 2750, previousQty: 0, currentQty: 2750, previousPct: 0, currentPct: 100 },
          { siteId: site3.id, name: "16th Slab Reinforcement", unit: "Sft", rate: 52, partAmount: 143000, buWork: 2750, previousQty: 0, currentQty: 1924, previousPct: 0, currentPct: 70 },
          { siteId: site3.id, name: "17th to 21st Slab", unit: "Sft", rate: 52, partAmount: 715000, buWork: 13750, previousQty: 0, currentQty: 0, previousPct: 0, currentPct: 0 },
          { siteId: site3.id, name: "Completion of Terrace & LMR", unit: "Sft", rate: 52, partAmount: 286000, buWork: 5500, previousQty: 0, currentQty: 0, previousPct: 0, currentPct: 0 },
        ],
      },
    },
  });

  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: site3.id,
        challanNo: "9",
        description: "15th slab covering and slab checking work S3 building",
        fitterQty: 2,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 0,
        helperHours: 0,
        helperRate: 800,
        totalAmount: 2200,
        date: new Date("2026-04-09"),
      },
      {
        siteId: site3.id,
        challanNo: "9",
        description: "15th slab casting work complit 1 fitter & S2 building drain slab steel cutting",
        fitterQty: 4,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 1,
        helperHours: 10,
        helperRate: 800,
        totalAmount: 5400,
        date: new Date("2026-04-10"),
      },
    ],
  });

  console.log("Real PDF Scenario (s.pdf) & Test Scenarios Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
