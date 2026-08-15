import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedFreshDatabase() {
  console.log("==================================================");
  console.log("STARTING FRESH REALISTIC DATABASE SEEDING FOR RCR ERP");
  console.log("==================================================");

  // 1. Clean up all existing tables in cascade order
  console.log("1. Cleaning up all old data...");
  try { await prisma.attendance.deleteMany({}); } catch (e) {}
  try { await prisma.labourPayment.deleteMany({}); } catch (e) {}
  try { await prisma.labourEntry.deleteMany({}); } catch (e) {}
  try { await prisma.labourTransferHistory.deleteMany({}); } catch (e) {}
  try { await prisma.supervisorTransferHistory.deleteMany({}); } catch (e) {}
  try { await prisma.labour.deleteMany({}); } catch (e) {}
  try { await prisma.labourCategory.deleteMany({}); } catch (e) {}
  try { await prisma.siteSupervisor.deleteMany({}); } catch (e) {}
  try { await prisma.billLine.deleteMany({}); } catch (e) {}
  try { await prisma.supplyLabourEntry.deleteMany({}); } catch (e) {}
  try { await prisma.runningBill.deleteMany({}); } catch (e) {}
  try { await prisma.payment.deleteMany({}); } catch (e) {}
  try { await prisma.quotation.deleteMany({}); } catch (e) {}
  try { await prisma.workItem.deleteMany({}); } catch (e) {}
  try { await prisma.building.deleteMany({}); } catch (e) {}
  try { await prisma.site.deleteMany({}); } catch (e) {}
  try { await prisma.client.deleteMany({}); } catch (e) {}
  try { await prisma.globalSettings.deleteMany({}); } catch (e) {}
  try { await prisma.user.deleteMany({}); } catch (e) {}

  // 2. Company Settings (Official Letterhead & Settings)
  console.log("2. Seeding Global Settings...");
  await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      companyName: "RCR ENTERPRISES",
      phone: "+91 98200 12345",
      email: "rcrenterprises04@gmail.com",
      website: "www.rcrenterprises.in",
      address: "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305",
    },
  });

  // 3. User Accounts (Admin & Supervisors strictly from .env - Zero hardcoded fallback)
  console.log("3. Seeding Admin & Supervisor Users from .env...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sup1Email = process.env.SUPERVISOR_1_EMAIL;
  const sup1Password = process.env.SUPERVISOR_1_PASSWORD;
  const sup2Email = process.env.SUPERVISOR_2_EMAIL;
  const sup2Password = process.env.SUPERVISOR_2_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("CRITICAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env");
  }
  if (!sup1Email || !sup1Password) {
    throw new Error("CRITICAL ERROR: SUPERVISOR_1_EMAIL and SUPERVISOR_1_PASSWORD must be defined in .env");
  }
  if (!sup2Email || !sup2Password) {
    throw new Error("CRITICAL ERROR: SUPERVISOR_2_EMAIL and SUPERVISOR_2_PASSWORD must be defined in .env");
  }

  const adminPass = await bcrypt.hash(adminPassword, 10);
  const sup1Pass = await bcrypt.hash(sup1Password, 10);
  const sup2Pass = await bcrypt.hash(sup2Password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "RCR Admin",
      email: adminEmail,
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  const sup1 = await prisma.user.create({
    data: {
      name: "Ramesh Sharma",
      email: sup1Email,
      phone: "+91 98201 11223",
      passwordHash: sup1Pass,
      role: "SUPERVISOR",
      monthlySalary: 35000,
    },
  });

  const sup2 = await prisma.user.create({
    data: {
      name: "Suresh Gupta",
      email: sup2Email,
      phone: "+91 98202 44556",
      passwordHash: sup2Pass,
      role: "SUPERVISOR",
      monthlySalary: 32000,
    },
  });

  // 4. Clients
  console.log("4. Seeding Clients...");
  const client1 = await prisma.client.create({
    data: {
      name: "Sshivaay Constructions / Neo Iturkaa",
      address: "B-602, Supreme Business Park, Hiranandani Gardens, Powai, Mumbai - 400076",
      gstNo: "27AAACG1234F1Z1",
      contactPerson: "Mr. Rajeev Nambiar (Project Director)",
      phone: "+91 98210 99887",
      email: "billing@sshivaayconstructions.com",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Runwal Developers Pvt Ltd",
      address: "Runwal & Omkar Esquare, 5th Floor, Eastern Express Highway, Sion (E), Mumbai - 400022",
      gstNo: "27AAACR5566G1Z2",
      contactPerson: "Mr. Amit Kulkarni (Senior VP Projects)",
      phone: "+91 98211 44332",
      email: "contracts@runwalgroup.com",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Godrej Properties Ltd",
      address: "Godrej One, 5th Floor, Pirojshanagar, Eastern Express Highway, Vikhroli (E), Mumbai - 400079",
      gstNo: "27AAACG9988K1Z5",
      contactPerson: "Mr. Vikramaditya Rathore (Chief Engineer)",
      phone: "+91 98212 88776",
      email: "billing@godrejproperties.com",
    },
  });

  // =========================================================================
  // SITE 1: ACTIVE ONGOING PROJECT (60% Progress, 2 RA Bills, Payments, Labour)
  // Project: "PARKSITE PROJECT - WING A & B"
  // =========================================================================
  console.log("5. Seeding Site 1: Ongoing Project (Parksite Wing A & B)...");
  const site1 = await prisma.site.create({
    data: {
      projectName: "PARKSITE RESIDENCY - WING A & B",
      clientId: client1.id,
      address: "CTS No. 102/A, Behind Godrej Complex, LBS Marg, Vikhroli (West), Mumbai - 400079",
      gstNo: "27AAJFN6629D1Z5",
      workOrderNo: "PARKSITE/SSHIVAAY/2026-27/012",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 60,
      active: true,
      remarks: "Reinforcement & Concrete Shuttering work for 2 High-Rise Towers (G+12 Floors).",
    },
  });

  // Assign Supervisor 1 to Site 1
  await prisma.siteSupervisor.create({
    data: { siteId: site1.id, supervisorId: sup1.id },
  });

  // Labour Categories for Site 1
  const catFitter1 = await prisma.labourCategory.create({
    data: { siteId: site1.id, name: "Reinforcement Fitter", dailyWage: 1100, overtimeRate: 150, order: 0 },
  });
  const catHelper1 = await prisma.labourCategory.create({
    data: { siteId: site1.id, name: "General Helper", dailyWage: 800, overtimeRate: 100, order: 1 },
  });
  const catMason1 = await prisma.labourCategory.create({
    data: { siteId: site1.id, name: "RCC Mason", dailyWage: 950, overtimeRate: 130, order: 2 },
  });

  // Labours for Site 1
  const laboursSite1 = await Promise.all([
    prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catFitter1.id, supervisorId: sup1.id, name: "Manoj Kumar Yadav", phone: "+91 97680 11221", dailyWage: 1100, aadharNumber: "7894-5612-3012" } }),
    prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catFitter1.id, supervisorId: sup1.id, name: "Santosh Verma", phone: "+91 97680 22332", dailyWage: 1100, aadharNumber: "7894-5612-3013" } }),
    prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catHelper1.id, supervisorId: sup1.id, name: "Brijesh Gond", phone: "+91 97680 33443", dailyWage: 800, aadharNumber: "7894-5612-3014" } }),
    prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catHelper1.id, supervisorId: sup1.id, name: "Deepak Chauhan", phone: "+91 97680 44554", dailyWage: 800, aadharNumber: "7894-5612-3015" } }),
    prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catMason1.id, supervisorId: sup1.id, name: "Ram Asrey Chaurasia", phone: "+91 97680 55665", dailyWage: 950, aadharNumber: "7894-5612-3016" } }),
  ]);

  // Attendance for past 7 days on Site 1
  const today = new Date();
  for (let d = 7; d >= 1; d--) {
    const attDate = new Date(today);
    attDate.setDate(today.getDate() - d);
    attDate.setHours(0, 0, 0, 0);

    for (const lab of laboursSite1) {
      await prisma.attendance.create({
        data: {
          siteId: site1.id,
          labourId: lab.id,
          date: attDate,
          status: "PRESENT",
          hajari: 1.0,
          hajariRate: lab.dailyWage || 800,
          markedById: sup1.id,
        },
      });
    }
  }

  // Buildings for Site 1 (Wing A & Wing B)
  const bldg1A = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "WING A",
      approxArea: 145000,
      contractRate: 420,
      order: 0,
    },
  });
  const bldg1B = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "WING B",
      approxArea: 130000,
      contractRate: 420,
      order: 1,
    },
  });

  // Stage work items for Wing A (Total 14 stages summing to ₹6,09,00,000)
  const stagesA = [
    { name: "Raft Foundation & Retaining Wall", partAmount: 6090000, prevPct: 100, curPct: 0 },
    { name: "Basement 1 Slab & Columns", partAmount: 4872000, prevPct: 100, curPct: 0 },
    { name: "Stilt Floor Slab & Ramp", partAmount: 4872000, prevPct: 100, curPct: 0 },
    { name: "1st Typical Floor Slab", partAmount: 4263000, prevPct: 100, curPct: 0 },
    { name: "2nd Typical Floor Slab", partAmount: 4263000, prevPct: 100, curPct: 0 },
    { name: "3rd Typical Floor Slab", partAmount: 4263000, prevPct: 100, curPct: 0 },
    { name: "4th Typical Floor Slab", partAmount: 4263000, prevPct: 100, curPct: 0 },
    { name: "5th Typical Floor Slab", partAmount: 4263000, prevPct: 80, curPct: 20 },
    { name: "6th Typical Floor Slab", partAmount: 4263000, prevPct: 0, curPct: 50 },
    { name: "7th Typical Floor Slab", partAmount: 4263000, prevPct: 0, curPct: 0 },
    { name: "8th Typical Floor Slab", partAmount: 4263000, prevPct: 0, curPct: 0 },
    { name: "9th Typical Floor Slab", partAmount: 4263000, prevPct: 0, curPct: 0 },
    { name: "10th Typical Floor Slab", partAmount: 4263000, prevPct: 0, curPct: 0 },
    { name: "Terrace Slab & Water Tank", partAmount: 2436000, prevPct: 0, curPct: 0 },
  ];

  for (let i = 0; i < stagesA.length; i++) {
    const s = stagesA[i];
    const prevAmt = (s.prevPct / 100) * s.partAmount;
    const curAmt = (s.curPct / 100) * s.partAmount;
    await prisma.workItem.create({
      data: {
        siteId: site1.id,
        buildingId: bldg1A.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: s.prevPct,
        currentPct: s.curPct,
        cumulativePct: s.prevPct + s.curPct,
        previousAmt: prevAmt,
        currentAmt: curAmt,
        cumulativeAmt: prevAmt + curAmt,
        order: i,
      },
    });
  }

  // Stage work items for Wing B (Total 14 stages summing to ₹5,46,00,000)
  const stagesB = [
    { name: "Raft Foundation & Retaining Wall", partAmount: 5460000, prevPct: 100, curPct: 0 },
    { name: "Basement 1 Slab & Columns", partAmount: 4368000, prevPct: 100, curPct: 0 },
    { name: "Stilt Floor Slab & Ramp", partAmount: 4368000, prevPct: 100, curPct: 0 },
    { name: "1st Typical Floor Slab", partAmount: 3822000, prevPct: 100, curPct: 0 },
    { name: "2nd Typical Floor Slab", partAmount: 3822000, prevPct: 100, curPct: 0 },
    { name: "3rd Typical Floor Slab", partAmount: 3822000, prevPct: 100, curPct: 0 },
    { name: "4th Typical Floor Slab", partAmount: 3822000, prevPct: 70, curPct: 30 },
    { name: "5th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 40 },
    { name: "6th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 0 },
    { name: "7th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 0 },
    { name: "8th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 0 },
    { name: "9th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 0 },
    { name: "10th Typical Floor Slab", partAmount: 3822000, prevPct: 0, curPct: 0 },
    { name: "Terrace Slab & Water Tank", partAmount: 2184000, prevPct: 0, curPct: 0 },
  ];

  for (let i = 0; i < stagesB.length; i++) {
    const s = stagesB[i];
    const prevAmt = (s.prevPct / 100) * s.partAmount;
    const curAmt = (s.curPct / 100) * s.partAmount;
    await prisma.workItem.create({
      data: {
        siteId: site1.id,
        buildingId: bldg1B.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: s.prevPct,
        currentPct: s.curPct,
        cumulativePct: s.prevPct + s.curPct,
        previousAmt: prevAmt,
        currentAmt: curAmt,
        cumulativeAmt: prevAmt + curAmt,
        order: i,
      },
    });
  }

  // Extra Labour Supply for Site 1 (Signed site challans)
  const challan1 = await prisma.supplyLabourEntry.create({
    data: {
      siteId: site1.id,
      challanNo: "RCR/CH-101",
      description: "Basement dewatering pump line setup & steel shifting",
      date: new Date("2026-07-20"),
      fitterQty: 2,
      fitterHours: 8,
      fitterRate: 1100,
      helperQty: 4,
      helperHours: 8,
      helperRate: 800,
      totalAmount: (2 * 1100) + (4 * 800), // 5400
    },
  });

  const challan2 = await prisma.supplyLabourEntry.create({
    data: {
      siteId: site1.id,
      challanNo: "RCR/CH-102",
      description: "Podium slab shuttering extra safety netting deployment",
      date: new Date("2026-08-05"),
      fitterQty: 3,
      fitterHours: 8,
      fitterRate: 1100,
      helperQty: 2,
      helperHours: 8,
      helperRate: 800,
      totalAmount: (3 * 1100) + (2 * 800), // 4900
    },
  });

  // RA Bill 01 for Site 1 (Already Generated & Locked)
  const bill1 = await prisma.runningBill.create({
    data: {
      siteId: site1.id,
      billNo: "001/2026-27",
      refNo: "01",
      billDate: new Date("2026-07-31"),
      periodLabel: "July 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      retentionPct: 2,
    },
  });

  // Link challan1 to bill1
  await prisma.supplyLabourEntry.update({
    where: { id: challan1.id },
    data: { runningBillId: bill1.id },
  });

  // Payments received for Site 1
  await prisma.payment.create({
    data: {
      siteId: site1.id,
      date: new Date("2026-08-02"),
      amount: 2500000,
      mode: "NEFT",
      accountCredited: "SANDIP ICICI 0884",
      reference: "AXISN00482910123",
      remarks: "PART PAYMENT FOR RA BILL NO. 01 - PARKSITE",
    },
  });

  // =========================================================================
  // SITE 2: EARLY STAGE PROJECT (25% Progress, 1 Bill)
  // Project: "RUNWAL BLISS - WING C"
  // =========================================================================
  console.log("6. Seeding Site 2: Early Stage Project (Runwal Bliss Wing C)...");
  const site2 = await prisma.site.create({
    data: {
      projectName: "RUNWAL BLISS - WING C",
      clientId: client2.id,
      address: "Kanjurmarg (East), Opp. Crompton Greaves, Mumbai - 400042",
      gstNo: "27AAJFN6629D1Z5",
      workOrderNo: "RUNWAL/BLISS/2026-27/045",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 25,
      active: true,
      remarks: "Foundation raft and basement structure in progress.",
    },
  });

  await prisma.siteSupervisor.create({
    data: { siteId: site2.id, supervisorId: sup2.id },
  });

  const bldg2C = await prisma.building.create({
    data: {
      siteId: site2.id,
      name: "WING C",
      approxArea: 95000,
      contractRate: 410,
      order: 0,
    },
  });

  const stagesC = [
    { name: "Raft Foundation & Retaining Wall", partAmount: 3895000, prevPct: 100, curPct: 0 },
    { name: "Lower Basement Retaining Wall & Slab", partAmount: 3116000, prevPct: 100, curPct: 0 },
    { name: "Upper Basement Slab & Columns", partAmount: 3116000, prevPct: 60, curPct: 40 },
    { name: "Ground Floor Stilt Slab & Ramp", partAmount: 3116000, prevPct: 0, curPct: 0 },
    { name: "1st Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "2nd Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "3rd Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "4th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "5th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "6th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "7th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "8th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "9th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "10th Typical Floor Slab", partAmount: 2726500, prevPct: 0, curPct: 0 },
    { name: "Terrace Slab & Water Tank", partAmount: 1558000, prevPct: 0, curPct: 0 },
  ];

  for (let i = 0; i < stagesC.length; i++) {
    const s = stagesC[i];
    await prisma.workItem.create({
      data: {
        siteId: site2.id,
        buildingId: bldg2C.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: s.prevPct,
        currentPct: s.curPct,
        cumulativePct: s.prevPct + s.curPct,
        previousAmt: (s.prevPct / 100) * s.partAmount,
        currentAmt: (s.curPct / 100) * s.partAmount,
        cumulativeAmt: ((s.prevPct + s.curPct) / 100) * s.partAmount,
        order: i,
      },
    });
  }

  // =========================================================================
  // SITE 3: FRESH NEWLY LAUNCHED SITE (0% Progress, 0 Bills)
  // Project: "GODREJ WOODS - TOWER 1"
  // =========================================================================
  console.log("7. Seeding Site 3: Fresh Site for New Bill Testing (Godrej Woods)...");
  const site3 = await prisma.site.create({
    data: {
      projectName: "GODREJ WOODS - TOWER 1",
      clientId: client3.id,
      address: "Sector 43, Phase 2, Near Golf Course, Navi Mumbai",
      gstNo: "27AAJFN6629D1Z5",
      workOrderNo: "GODREJ/WOODS/2026-27/008",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 0,
      active: true,
      remarks: "Fresh project. Ready for live RA Bill creation, challan logging and testing.",
    },
  });

  const bldg3A = await prisma.building.create({
    data: {
      siteId: site3.id,
      name: "TOWER 1",
      approxArea: 80000,
      contractRate: 450,
      order: 0,
    },
  });

  const stagesWoods = [
    { name: "PCC & Footing Raft Foundation", partAmount: 3600000 },
    { name: "Basement 1 Slab & Columns", partAmount: 2880000 },
    { name: "Ground Stilt Parking Slab", partAmount: 2880000 },
    { name: "1st Typical Floor Slab", partAmount: 2520000 },
    { name: "2nd Typical Floor Slab", partAmount: 2520000 },
    { name: "3rd Typical Floor Slab", partAmount: 2520000 },
    { name: "4th Typical Floor Slab", partAmount: 2520000 },
    { name: "5th Typical Floor Slab", partAmount: 2520000 },
    { name: "6th Typical Floor Slab", partAmount: 2520000 },
    { name: "7th Typical Floor Slab", partAmount: 2520000 },
    { name: "8th Typical Floor Slab", partAmount: 2520000 },
    { name: "9th Typical Floor Slab", partAmount: 2520000 },
    { name: "10th Typical Floor Slab", partAmount: 2520000 },
    { name: "Terrace Slab & Water Tank", partAmount: 1440000 },
  ];

  for (let i = 0; i < stagesWoods.length; i++) {
    const s = stagesWoods[i];
    await prisma.workItem.create({
      data: {
        siteId: site3.id,
        buildingId: bldg3A.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: 0,
        currentPct: 0,
        cumulativePct: 0,
        previousAmt: 0,
        currentAmt: 0,
        cumulativeAmt: 0,
        order: i,
      },
    });
  }

  // 8. Seeding Quotation Records for all 3 Projects
  console.log("8. Seeding Quotation Records for all 3 Projects...");

  // Quotation 1 for Site 1 (Parksite Residency - Accepted)
  await prisma.quotation.create({
    data: {
      siteId: site1.id,
      clientId: client1.id,
      quotationNo: "RCR/QTN/2026/001",
      subject: "Quotation for RCC Shuttering & Reinforcement Work - Parksite Residency Wing A & B",
      itemsJson: JSON.stringify([
        { description: "Reinforcement Steel Binding, Cutting & Fabrication", unit: "MT", rate: 6800 },
        { description: "Aluminium & Wooden Shuttering for High-Rise Slabs & Retaining Walls", unit: "Sft", rate: 48 },
        { description: "RMC Concrete Pouring, Pumping, Compaction & Finishing", unit: "Cum", rate: 580 },
      ]),
      termsJson: JSON.stringify([
        "Payment within 15 days from RA bill submission.",
        "Running account bills to be certified within 7 working days.",
        "Electricity, water & crane access provided by developer.",
      ]),
      exclusionsJson: JSON.stringify([
        "Excavation and external peripheral development.",
        "Supply of raw steel and cement bags.",
      ]),
      status: "ACCEPTED",
    },
  });

  // Quotation 2 for Site 2 (Runwal Bliss - Accepted)
  await prisma.quotation.create({
    data: {
      siteId: site2.id,
      clientId: client2.id,
      quotationNo: "RCR/QTN/2026/002",
      subject: "Quotation for Foundation Raft & Basement Shuttering Work - Runwal Bliss Wing C",
      itemsJson: JSON.stringify([
        { description: "Heavy Raft Foundation Rebar Binding", unit: "MT", rate: 6400 },
        { description: "Basement Shuttering & Retaining Wall Scaffolding", unit: "Sft", rate: 44 },
        { description: "M35 Grade Concrete Pouring with Boom Placer", unit: "Cum", rate: 540 },
      ]),
      termsJson: JSON.stringify([
        "Payment within 21 days from RA bill submission.",
        "Retention of 2% to be released 6 months after structural completion.",
      ]),
      exclusionsJson: JSON.stringify([
        "Dewatering diesel pump cost.",
      ]),
      status: "ACCEPTED",
    },
  });

  // Quotation 3 for Site 3 (Godrej Woods - Accepted)
  await prisma.quotation.create({
    data: {
      siteId: site3.id,
      clientId: client3.id,
      quotationNo: "RCR/QTN/2026/003",
      subject: "Quotation for Comprehensive Structural RCC Work - Godrej Woods Tower 1",
      itemsJson: JSON.stringify([
        { description: "Reinforcement Steel Binding & Cutting", unit: "MT", rate: 6500 },
        { description: "Shuttering & Deshuttering for Slabs & Columns", unit: "Sft", rate: 45 },
        { description: "Concrete Pouring & Compaction with Vibrator", unit: "Cum", rate: 550 },
      ]),
      termsJson: JSON.stringify([
        "Payment terms: 15 days from RA bill submission.",
        "Water and power supply to be provided by client at site.",
        "Steel and cement will be supplied by client at ground unloading point.",
      ]),
      exclusionsJson: JSON.stringify([
        "Excavation and debris disposal outside site boundary.",
        "Curing water pump electricity cost.",
      ]),
      status: "ACCEPTED",
    },
  });

  console.log("==================================================");
  console.log("FRESH SEEDING SCRIPT CREATED SUCCESSFULLY!");
  console.log("==================================================");
}

async function main() {
  await seedFreshDatabase();
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
