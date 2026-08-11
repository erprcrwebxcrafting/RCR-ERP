import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting database and seeding 4 complete test sites (100%, 50%, 25%, 90%)...");

  // Clean up all existing test records
  console.log("Cleaning up old test data across all tables...");
  try { await prisma.workItem.deleteMany({}); } catch (e) {}
  try { await prisma.building.deleteMany({}); } catch (e) {}
  try { await prisma.billLine.deleteMany({}); } catch (e) {}
  try { await prisma.runningBill.deleteMany({}); } catch (e) {}
  try { await prisma.payment.deleteMany({}); } catch (e) {}
  try { await prisma.supplyLabourEntry.deleteMany({}); } catch (e) {}
  try { await prisma.site.deleteMany({}); } catch (e) {}
  try { await prisma.client.deleteMany({}); } catch (e) {}

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

  // =============================================================
  // SITE A: 100% COMPLETED SITE (Godrej Golden Heights)
  // Progress = 100% | All items 100% completed
  // =============================================================
  console.log("Seeding Site A: 100% Completed (Godrej Golden Heights)...");
  const clientA = await prisma.client.create({
    data: {
      id: "client-100",
      name: "Godrej Properties Ltd",
      address: "Godrej One, Bandra East, Mumbai",
      gstNo: "27AAACG1234F1Z1",
      contactPerson: "Mr. Rajesh Malhotra",
    },
  });

  const siteA = await prisma.site.create({
    data: {
      id: "site-100",
      projectName: "Golden Heights Tower — 100% Completed Project",
      clientId: clientA.id,
      address: "Plot 42, Bandra East, Mumbai",
      workOrderNo: "WO/GODREJ/2025/100",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 100,
    },
  });

  // Contract: 25,000 Sft @ ₹50/Sft = ₹1,250,000 Total Contract Value
  // Sum of partAmount = 250,000 + 750,000 + 250,000 = 1,250,000 EXACTLY
  const towerA = await prisma.building.create({
    data: {
      siteId: siteA.id,
      name: "Tower A (100% Finished)",
      approxArea: 25000,
      contractRate: 50,
      order: 0,
      workItems: {
        create: [
          {
            siteId: siteA.id,
            name: "Raft Footing & Substructure Concrete",
            unit: "%",
            rate: 50,
            partAmount: 250000,
            previousPct: 100,
            currentPct: 0,
            cumulativePct: 100,
            previousAmt: 250000,
            currentAmt: 0,
            cumulativeAmt: 250000,
          },
          {
            siteId: siteA.id,
            name: "1st to 10th Slab Superstructure",
            unit: "%",
            rate: 50,
            partAmount: 750000,
            previousPct: 50,
            currentPct: 50,
            cumulativePct: 100,
            previousAmt: 375000,
            currentAmt: 375000,
            cumulativeAmt: 750000,
          },
          {
            siteId: siteA.id,
            name: "Completion of Terrace & LMR Parapet",
            unit: "%",
            rate: 50,
            partAmount: 250000,
            previousPct: 0,
            currentPct: 100,
            cumulativePct: 100,
            previousAmt: 0,
            currentAmt: 250000,
            cumulativeAmt: 250000,
          },
        ],
      },
    },
  });

  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: siteA.id,
        challanNo: "SUP-101",
        description: "Terrace waterproofing extra helper supply & cleanup",
        fitterQty: 2,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 3,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 4600,
        date: new Date("2026-03-10"),
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { siteId: siteA.id, date: new Date("2026-02-15"), amount: 500000, mode: "NEFT", accountCredited: "HDFC 1092", remarks: "1st Running Account Payment" },
      { siteId: siteA.id, date: new Date("2026-03-25"), amount: 700000, mode: "ONLINE", accountCredited: "ICICI 0884", remarks: "Final Settlement Payment" },
    ],
  });

  await prisma.runningBill.create({
    data: {
      siteId: siteA.id,
      billNo: "BILL/GOLDEN/004",
      refNo: "04-FINAL",
      periodLabel: "March 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      retentionPct: 2,
      tdsPct: 1,
      lines: {
        create: [
          {
            buildingId: towerA.id,
            description: "Tower A — Final Completion Slabs & Parapet",
            unit: "%",
            woQty: 100,
            rate: 625000,
            previousQty: 50,
            currentQty: 50,
            cumulativeQty: 100,
            previousAmount: 625000,
            currentAmount: 625000,
            cumulativeAmount: 1250000,
          },
        ],
      },
    },
  });

  // =============================================================
  // SITE B: 50% HALFWAY DONE SITE (Shivaay Constructions - Vikhroli)
  // Progress = 50% | Multi-tower + extra supply + ledger
  // =============================================================
  console.log("Seeding Site B: 50% Halfway Done (SSHIVAAY Constructions Vikhroli)...");
  const clientB = await prisma.client.create({
    data: {
      id: "client-50",
      name: "SSHIVAAY CONSTRUCTIONS",
      address: "Flat 5, Sant Krupa CHS, Sector 19, Nerul, Navi Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Mr. Sandip Patil",
    },
  });

  const siteB = await prisma.site.create({
    data: {
      id: "site-50",
      projectName: "BMC COLONY — BUILDING NO. S2 & S3 VIKHROLI (50% Progress)",
      clientId: clientB.id,
      address: "BMC Colony, Building S2 & S3, Vikhroli, Mumbai",
      workOrderNo: "PARKSITE/SSHIVAAY/2026-27",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 50,
    },
  });

  // Tower S2 Wing: 314,554 Sft @ ₹53/Sft = ₹16,671,362 Total Contract Value
  // Sum of partAmount = 3000000 + 9671362 + 2000000 + 2000000 = 16,671,362 EXACTLY
  const towerB1 = await prisma.building.create({
    data: {
      siteId: siteB.id,
      name: "Tower S2 Wing",
      approxArea: 314554,
      contractRate: 53,
      order: 0,
      workItems: {
        create: [
          {
            siteId: siteB.id,
            name: "Raft Footing & Plinth Beam Reinforcement",
            unit: "Sft",
            rate: 53,
            partAmount: 3000000,
            previousPct: 100,
            currentPct: 0,
            cumulativePct: 100,
            previousAmt: 3000000,
            currentAmt: 0,
            cumulativeAmt: 3000000,
          },
          {
            siteId: siteB.id,
            name: "1st to 14th Slab Concrete & Reinforcement",
            unit: "Sft",
            rate: 53,
            partAmount: 9671362,
            previousPct: 40,
            currentPct: 20, // 20% in this bill = ₹1,934,272.40
            cumulativePct: 60,
            previousAmt: 3868544.80,
            currentAmt: 1934272.40,
            cumulativeAmt: 5802817.20,
          },
          {
            siteId: siteB.id,
            name: "15th to 16th Slab Reinforcement Work",
            unit: "Sft",
            rate: 53,
            partAmount: 2000000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
          {
            siteId: siteB.id,
            name: "Terrace Slab, LMR & Parapet Wall",
            unit: "Sft",
            rate: 53,
            partAmount: 2000000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
        ],
      },
    },
  });

  // Tower S3 Wing: 24,750 Sft @ ₹52/Sft = ₹1,287,000 Total Contract Value
  // Sum of partAmount = 143000 + 143000 + 715000 + 286000 = 1,287,000 EXACTLY
  const towerB2 = await prisma.building.create({
    data: {
      siteId: siteB.id,
      name: "Tower S3 Wing",
      approxArea: 24750,
      contractRate: 52,
      order: 1,
      workItems: {
        create: [
          {
            siteId: siteB.id,
            name: "15th Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 143000,
            previousPct: 0,
            currentPct: 100, // 100% this bill = ₹143,000
            cumulativePct: 100,
            previousAmt: 0,
            currentAmt: 143000,
            cumulativeAmt: 143000,
          },
          {
            siteId: siteB.id,
            name: "16th Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 143000,
            previousPct: 0,
            currentPct: 50, // 50% this bill = ₹71,500
            cumulativePct: 50,
            previousAmt: 0,
            currentAmt: 71500,
            cumulativeAmt: 71500,
          },
          {
            siteId: siteB.id,
            name: "17th to 21st Slab Reinforcement Work",
            unit: "Sft",
            rate: 52,
            partAmount: 715000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
          {
            siteId: siteB.id,
            name: "Completion of Terrace & LMR Parapet",
            unit: "Sft",
            rate: 52,
            partAmount: 286000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
        ],
      },
    },
  });

  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: siteB.id,
        challanNo: "CH-001",
        description: "15th slab covering & steel checking work S3 building",
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
        siteId: siteB.id,
        challanNo: "CH-002",
        description: "15th slab casting & S2 drain slab steel cutting",
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

  await prisma.payment.createMany({
    data: [
      { siteId: siteB.id, date: new Date("2026-04-15"), amount: 800000, mode: "NEFT", accountCredited: "ICICI 0884", remarks: "1st Part Payment" },
      { siteId: siteB.id, date: new Date("2026-05-01"), amount: 400000, mode: "CASH", accountCredited: "CASH HAND", remarks: "Site Cash Support" },
    ],
  });

  await prisma.runningBill.create({
    data: {
      siteId: siteB.id,
      billNo: "007/2026-27",
      refNo: "02",
      periodLabel: "May 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      retentionPct: 2,
      tdsPct: 1,
      lines: {
        create: [
          {
            buildingId: towerB1.id,
            description: "Tower S2 Wing — 1st to 14th Slab Progress (20%)",
            unit: "Sft",
            woQty: 314554,
            rate: 53,
            previousQty: 66898,
            currentQty: 36495,
            cumulativeQty: 103393,
            previousAmount: 3868544.80,
            currentAmount: 1934272.40,
            cumulativeAmount: 5802817.20,
          },
          {
            buildingId: towerB2.id,
            description: "Tower S3 Wing — 15th & 16th Slab Work",
            unit: "Sft",
            woQty: 24750,
            rate: 52,
            previousQty: 0,
            currentQty: 4125,
            cumulativeQty: 4125,
            previousAmount: 0,
            currentAmount: 214500,
            cumulativeAmount: 214500,
          },
        ],
      },
    },
  });

  // =============================================================
  // SITE C: 25% JUST STARTED SITE (Oberoi Sky City Tower)
  // Progress = 25% | Foundation & initial slabs done
  // =============================================================
  console.log("Seeding Site C: 25% Just Started (Oberoi Sky City)...");
  const clientC = await prisma.client.create({
    data: {
      id: "client-25",
      name: "Oberoi Realty Ltd",
      address: "Commerz II, International Business Park, Goregaon East, Mumbai",
      gstNo: "27AAACO9876E1Z5",
      contactPerson: "Mr. Vikram Oberoi",
    },
  });

  const siteC = await prisma.site.create({
    data: {
      id: "site-25",
      projectName: "Oberoi Sky City Tower — 25% Progress Project",
      clientId: clientC.id,
      address: "WEH, Borivali East, Mumbai",
      workOrderNo: "WO/OBEROI/2026/025",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 25,
    },
  });

  // Contract: 40,000 Sft @ ₹60/Sft = ₹2,400,000 Total Contract Value
  // Sum of partAmount = 600,000 + 1,200,000 + 600,000 = 2,400,000 EXACTLY
  const towerC = await prisma.building.create({
    data: {
      siteId: siteC.id,
      name: "Tower 1 (25% Progress)",
      approxArea: 40000,
      contractRate: 60,
      order: 0,
      workItems: {
        create: [
          {
            siteId: siteC.id,
            name: "Raft Foundation & Basement Retaining Wall",
            unit: "Sft",
            rate: 60,
            partAmount: 600000,
            previousPct: 0,
            currentPct: 100, // 100% this bill = ₹600,000
            cumulativePct: 100,
            previousAmt: 0,
            currentAmt: 600000,
            cumulativeAmt: 600000,
          },
          {
            siteId: siteC.id,
            name: "Ground to 10th Floor Superstructure",
            unit: "Sft",
            rate: 60,
            partAmount: 1200000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
          {
            siteId: siteC.id,
            name: "Terrace Slab & Parapet Wall",
            unit: "Sft",
            rate: 60,
            partAmount: 600000,
            previousPct: 0,
            currentPct: 0,
            cumulativePct: 0,
            previousAmt: 0,
            currentAmt: 0,
            cumulativeAmt: 0,
          },
        ],
      },
    },
  });

  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: siteC.id,
        challanNo: "OB-01",
        description: "Raft steel binding night shift extra fitters",
        fitterQty: 5,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 2,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 7100,
        date: new Date("2026-05-18"),
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { siteId: siteC.id, date: new Date("2026-05-01"), amount: 200000, mode: "CHEQUE", accountCredited: "ICICI 0884", remarks: "Mobilization Advance" },
    ],
  });

  await prisma.runningBill.create({
    data: {
      siteId: siteC.id,
      billNo: "RA/OBEROI/001",
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
            buildingId: towerC.id,
            description: "Tower 1 — Raft Foundation & Basement Work (100%)",
            unit: "Sft",
            woQty: 10000,
            rate: 60,
            previousQty: 0,
            currentQty: 10000,
            cumulativeQty: 10000,
            previousAmount: 0,
            currentAmount: 600000,
            cumulativeAmount: 600000,
          },
        ],
      },
    },
  });

  // =============================================================
  // SITE D: 90% NEAR COMPLETION REAL PDF SITE (NEO ITURKAA s.pdf)
  // Progress = 90% | Real Bill Ref 23
  // =============================================================
  console.log("Seeding Site D: 90% Real PDF Site (NEO ITURKAA ENTERPRISES)...");
  const clientD = await prisma.client.create({
    data: {
      id: "client-90",
      name: "NEO ITURKAA ENTERPRISES",
      address: "Plot 12, Suburb Area, Mumbai",
      gstNo: "27AEXFS8040P1ZW",
      contactPerson: "Site Project Manager",
    },
  });

  const siteD = await prisma.site.create({
    data: {
      id: "site-90",
      projectName: "NEO ITURKAA — Real Bill PDF (s.pdf Format - 90% Progress)",
      clientId: clientD.id,
      address: "Mumbai Central Site",
      workOrderNo: "WO/NEO/2026/023",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 90,
    },
  });

  // Total Contract Value = 184,464 Sft @ ₹49.60/Sft = ₹9,149,414.40
  // Sum of partAmount across 26 work items MUST EQUAL 9,149,414.40 EXACTLY!
  const towerD = await prisma.building.create({
    data: {
      siteId: siteD.id,
      name: "BUA Building (s.pdf Format)",
      approxArea: 184464,
      contractRate: 49.60,
      order: 0,
      workItems: {
        create: [
          { siteId: siteD.id, name: "16th slab", unit: "%", partAmount: 310000, previousPct: 100, currentPct: 0, cumulativePct: 100, previousAmt: 310000, currentAmt: 0, cumulativeAmt: 310000 },
          ...Array.from({ length: 23 }, (_, i) => ({
            siteId: siteD.id,
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
          { siteId: siteD.id, name: "Completion of Terrace Slab 40th slab", unit: "%", partAmount: 339414.40, previousPct: 0, currentPct: 100, cumulativePct: 100, previousAmt: 0, currentAmt: 339414.40, cumulativeAmt: 339414.40 },
          { siteId: siteD.id, name: "Completion of LMR, OHWT PARAPET WALL", unit: "%", partAmount: 680000, previousPct: 0, currentPct: 0, cumulativePct: 0, previousAmt: 0, currentAmt: 0, cumulativeAmt: 0 },
        ],
      },
    },
  });

  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: siteD.id,
        challanNo: "PDF-99",
        description: "40th terrace slab pump line support extra fitter supply",
        fitterQty: 3,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 1,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 4100,
        date: new Date("2026-08-01"),
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { siteId: siteD.id, date: new Date("2026-08-05"), amount: 500000, mode: "ONLINE", accountCredited: "ICICI 0884", remarks: "RA Bill 23 Part Settlement" },
    ],
  });

  await prisma.runningBill.create({
    data: {
      siteId: siteD.id,
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
            buildingId: towerD.id,
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

  console.log("✅ ALL 4 TEST SITES (100%, 50%, 25%, 90%) SEEDED SUCCESSFULLY WITH ALL MODULES!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
