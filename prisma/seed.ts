import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting database and seeding fresh, complete billing test data...");

  // Clean up all existing test records
  console.log("Cleaning up old test buildings, work items, bills, supply entries, and payments...");
  try {
    await prisma.building.deleteMany({});
  } catch (e) {
    console.log("Building cleanup note:", e);
  }
  try {
    await prisma.runningBill.deleteMany({});
  } catch (e) {
    console.log("RunningBill cleanup note:", e);
  }
  try {
    await prisma.payment.deleteMany({});
  } catch (e) {
    console.log("Payment cleanup note:", e);
  }
  try {
    await prisma.supplyLabourEntry.deleteMany({});
  } catch (e) {
    console.log("SupplyLabourEntry cleanup note:", e);
  }
  try {
    await prisma.site.deleteMany({});
  } catch (e) {
    console.log("Site cleanup note:", e);
  }
  try {
    await prisma.client.deleteMany({});
  } catch (e) {
    console.log("Client cleanup note:", e);
  }

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
  // SITE 1: SSHIVAAY CONSTRUCTIONS (BMC COLONY VIKHROLI - MAIN TEST SITE)
  // Multi-Tower + Extra Supply Labour + Client Payments + RA Bills
  // -------------------------------------------------------------
  console.log("Seeding Main Test Site: SSHIVAAY CONSTRUCTIONS (BMC Colony)...");
  const client1 = await prisma.client.create({
    data: {
      id: "seed-client-shivaay",
      name: "SSHIVAAY CONSTRUCTIONS",
      address: "Flat 5, Sant Krupa CHS, Sector 19, Nerul, Navi Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Mr. Sandip Patil",
    },
  });

  const site1 = await prisma.site.create({
    data: {
      id: "seed-site-shivaay",
      projectName: "BMC COLONY - BUILDING NO. S2 & S3 VIKHROLI",
      clientId: client1.id,
      address: "BMC Colony, Building S2 & S3, Vikhroli, Mumbai",
      workOrderNo: "PARKSITE/SSHIVAAY/2026-27",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 45,
    },
  });

  // Tower S2 Wing: 314,554 Sft @ ₹53/Sft = ₹16,671,362 Total Contract Value
  // Sum of partAmount across work items MUST EQUAL 16,671,362 EXACTLY!
  const towerS2 = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "Tower S2 Wing",
      approxArea: 314554,
      contractRate: 53,
      order: 0,
      workItems: {
        create: [
          {
            siteId: site1.id,
            name: "Raft Footing & Plinth Beam Reinforcement",
            unit: "Sft",
            rate: 53,
            partAmount: 3000000, // Allocated part amount
            previousPct: 100,
            currentPct: 0,
            cumulativePct: 100,
            previousAmt: 3000000,
            currentAmt: 0,
            cumulativeAmt: 3000000,
            previousQty: 56604,
            currentQty: 0,
          },
          {
            siteId: site1.id,
            name: "1st to 14th Slab Concrete & Reinforcement",
            unit: "Sft",
            rate: 53,
            partAmount: 9671362, // Allocated part amount
            previousPct: 100,
            currentPct: 0,
            cumulativePct: 100,
            previousAmt: 9671362,
            currentAmt: 0,
            cumulativeAmt: 9671362,
            previousQty: 182478,
            currentQty: 0,
          },
          {
            siteId: site1.id,
            name: "15th to 16th Slab Reinforcement Work",
            unit: "Sft",
            rate: 53,
            partAmount: 2000000, // Allocated part amount
            previousPct: 0,
            currentPct: 20, // 20% done in current bill = ₹400,000
            cumulativePct: 20,
            previousAmt: 0,
            currentAmt: 400000,
            cumulativeAmt: 400000,
            previousQty: 0,
            currentQty: 7547,
          },
          {
            siteId: site1.id,
            name: "Terrace Slab, LMR & OHWT Parapet Wall",
            unit: "Sft",
            rate: 53,
            partAmount: 2000000, // Allocated part amount
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
            previousQty: 0,
            currentQty: 0,
          },
        ],
      },
    },
  });

  // Tower S3 Wing: 24,750 Sft @ ₹52/Sft = ₹1,287,000 Total Contract Value
  // Sum of partAmount across work items MUST EQUAL 1,287,000 EXACTLY!
  const towerS3 = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "Tower S3 Wing",
      approxArea: 24750,
      contractRate: 52,
      order: 1,
      workItems: {
        create: [
          {
            siteId: site1.id,
            name: "15th Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 143000, // Allocated part amount (11.11%)
            previousPct: 0,
            currentPct: 100, // 100% done = ₹143,000
            cumulativePct: 100,
            previousAmt: 0,
            currentAmt: 143000,
            cumulativeAmt: 143000,
            previousQty: 0,
            currentQty: 2750,
          },
          {
            siteId: site1.id,
            name: "16th Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 143000, // Allocated part amount (11.11%)
            previousPct: 0,
            currentPct: 70, // 70% done = ₹100,100
            cumulativePct: 70,
            previousAmt: 0,
            currentAmt: 100100,
            cumulativeAmt: 100100,
            previousQty: 0,
            currentQty: 1925,
          },
          {
            siteId: site1.id,
            name: "17th to 21st Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 715000, // Allocated part amount (55.56%)
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
            previousQty: 0,
            currentQty: 0,
          },
          {
            siteId: site1.id,
            name: "Completion of Terrace & LMR Parapet",
            unit: "Sft",
            rate: 52,
            partAmount: 286000, // Allocated part amount (22.22%)
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
            previousQty: 0,
            currentQty: 0,
          },
        ],
      },
    },
  });

  // Extra Supply Labour Log Entries for SSHIVAAY site
  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: site1.id,
        challanNo: "001",
        description: "15th slab covering and steel checking work S3 building",
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
        siteId: site1.id,
        challanNo: "002",
        description: "15th slab casting 1 fitter & S2 drain slab steel cutting",
        fitterQty: 4,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 1,
        helperHours: 10,
        helperRate: 800,
        totalAmount: 5400,
        date: new Date("2026-04-10"),
      },
      {
        siteId: site1.id,
        challanNo: "003",
        description: "Column reinforcement extra shift work & beam shuttering support",
        fitterQty: 3,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 2,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 4900,
        date: new Date("2026-04-12"),
      },
    ],
  });

  // Payments received for Balance Sheet
  await prisma.payment.createMany({
    data: [
      {
        siteId: site1.id,
        date: new Date("2026-04-15"),
        amount: 300000,
        mode: "NEFT",
        accountCredited: "ICICI 0884",
        remarks: "Advance payment against RA Bill 01",
      },
      {
        siteId: site1.id,
        date: new Date("2026-05-02"),
        amount: 150000,
        mode: "CASH",
        accountCredited: "CASH HAND",
        remarks: "Part settlement received on site",
      },
    ],
  });

  // Create RunningBill 01 Snapshot for SSHIVAAY
  await prisma.runningBill.create({
    data: {
      siteId: site1.id,
      billNo: "007/2026-27",
      refNo: "01",
      periodLabel: "May 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      retentionPct: 2,
      tdsPct: 1,
      lines: {
        create: [
          {
            buildingId: towerS2.id,
            description: "Tower S2 Wing — 15th to 16th Slab Reinforcement (20%)",
            unit: "Sft",
            woQty: 314554,
            rate: 53,
            previousQty: 23892,
            currentQty: 7547,
            cumulativeQty: 31439,
            previousAmount: 12671362,
            currentAmount: 400000,
            cumulativeAmount: 13071362,
          },
          {
            buildingId: towerS3.id,
            description: "Tower S3 Wing — 15th & 16th Slab Work",
            unit: "Sft",
            woQty: 24750,
            rate: 52,
            previousQty: 0,
            currentQty: 4675,
            cumulativeQty: 4675,
            previousAmount: 0,
            currentAmount: 243100,
            cumulativeAmount: 243100,
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // SITE 2: NEO ITURKAA ENTERPRISES (REAL PDF s.pdf FORMAT)
  // -------------------------------------------------------------
  console.log("Seeding Real PDF Site: NEO ITURKAA ENTERPRISES (s.pdf)...");
  const client2 = await prisma.client.create({
    data: {
      id: "seed-client-pdf",
      name: "NEO ITURKAA ENTERPRISES",
      address: "Plot 12, Suburb Area, Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Site Manager",
    },
  });

  const site2 = await prisma.site.create({
    data: {
      id: "seed-site-pdf",
      projectName: "NEO ITURKAA - Real Bill PDF (s.pdf Format)",
      clientId: client2.id,
      address: "Mumbai Central Site",
      workOrderNo: "WO/NEO/2026/023",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 92,
    },
  });

  // Total Contract Value = 184,464 Sft @ ₹49.60/Sft = ₹9,149,414.40
  // Sum of partAmount across work items MUST EQUAL 9,149,414.40 EXACTLY!
  const towerPdf = await prisma.building.create({
    data: {
      siteId: site2.id,
      name: "BUA Building (s.pdf Format)",
      approxArea: 184464,
      contractRate: 49.60,
      order: 0,
      workItems: {
        create: [
          { siteId: site2.id, name: "16th slab", unit: "%", partAmount: 310000, previousPct: 100, currentPct: 0, cumulativePct: 100, previousAmt: 310000, currentAmt: 0, cumulativeAmt: 310000 },
          ...Array.from({ length: 23 }, (_, i) => ({
            siteId: site2.id,
            name: `${17 + i}th slab`,
            unit: "%",
            partAmount: 340000,
            previousPct: 100,
            currentPct: 0,
            cumulativePct: 100,
            previousAmt: 340000,
            currentAmt: 0,
            cumulativeAmt: 340000,
          })),
          { siteId: site2.id, name: "Completion of Terrace Slab 40th slab", unit: "%", partAmount: 339414.40, previousPct: 0, currentPct: 100, cumulativePct: 100, previousAmt: 0, currentAmt: 339414.40, cumulativeAmt: 339414.40 },
          { siteId: site2.id, name: "Completion of LMR, OHWT PARAPET WALL", unit: "%", partAmount: 680000, previousPct: 0, currentPct: 0, cumulativePct: 0, previousAmt: 0, currentAmt: 0, cumulativeAmt: 0 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      siteId: site2.id,
      date: new Date("2026-08-05"),
      amount: 200000,
      mode: "ONLINE",
      accountCredited: "ICICI 0884",
      remarks: "RA Bill 23 Part Settlement",
    },
  });

  await prisma.runningBill.create({
    data: {
      siteId: site2.id,
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
            rate: 339414.40,
            previousQty: 2400,
            currentQty: 100,
            cumulativeQty: 2500,
            previousAmount: 8130000,
            currentAmount: 339414.40,
            cumulativeAmount: 8469414.40,
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // SITE 3: GODREJ PROPERTIES (GOLDEN HEIGHTS - 100% COMPLETED)
  // -------------------------------------------------------------
  console.log("Seeding Scenario 3: Godrej Properties (100% Finished Site)...");
  const client3 = await prisma.client.create({
    data: {
      id: "seed-client-godrej",
      name: "Godrej Properties Ltd",
      address: "Bandra East, Mumbai",
      gstNo: "27AAACG1234F1Z1",
      contactPerson: "Mr. Rajesh Malhotra",
    },
  });

  const site3 = await prisma.site.create({
    data: {
      id: "seed-site-godrej",
      projectName: "Golden Heights — 100% Completed Project",
      clientId: client3.id,
      address: "Plot 42, Bandra East, Mumbai",
      workOrderNo: "WO/GODREJ/2025/100",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 100,
    },
  });

  // Total Contract Value = 23,000 Sft @ ₹55/Sft = ₹1,265,000
  // Sum of partAmount = 250,000 + 835,000 + 180,000 = 1,265,000 EXACTLY!
  await prisma.building.create({
    data: {
      siteId: site3.id,
      name: "Tower A (100% Completed)",
      approxArea: 23000,
      contractRate: 55,
      order: 0,
      workItems: {
        create: [
          { siteId: site3.id, name: "Raft Footing & Plinth Beam", unit: "%", partAmount: 250000, previousPct: 0, currentPct: 100, cumulativePct: 100, previousAmt: 0, currentAmt: 250000, cumulativeAmt: 250000 },
          { siteId: site3.id, name: "1st to 5th Slab Concrete & Steel", unit: "%", partAmount: 835000, previousPct: 0, currentPct: 100, cumulativePct: 100, previousAmt: 0, currentAmt: 835000, cumulativeAmt: 835000 },
          { siteId: site3.id, name: "Terrace Slab & Parapet Wall", unit: "%", partAmount: 180000, previousPct: 0, currentPct: 100, cumulativePct: 100, previousAmt: 0, currentAmt: 180000, cumulativeAmt: 180000 },
        ],
      },
    },
  });

  console.log("✅ All test sites seeded cleanly with exact distribution math!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
