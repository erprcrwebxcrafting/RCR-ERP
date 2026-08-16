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
  try { await prisma.supervisorAttendance.deleteMany({}); } catch (e) {}
  try { await prisma.labourPayment.deleteMany({}); } catch (e) {}
  try { await prisma.supervisorPayment.deleteMany({}); } catch (e) {}
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

  // 3. User Accounts (Admin & Supervisors with full personal & bank details)
  console.log("3. Seeding Admin & Supervisor Users...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@rcrenterprises.in";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const sup1Email = process.env.SUPERVISOR_1_EMAIL || "ramesh.supervisor@rcrenterprises.in";
  const sup1Password = process.env.SUPERVISOR_1_PASSWORD || "supervisor123";
  const sup2Email = process.env.SUPERVISOR_2_EMAIL || "suresh.supervisor@rcrenterprises.in";
  const sup2Password = process.env.SUPERVISOR_2_PASSWORD || "supervisor123";

  const adminPass = await bcrypt.hash(adminPassword, 10);
  const sup1Pass = await bcrypt.hash(sup1Password, 10);
  const sup2Pass = await bcrypt.hash(sup2Password, 10);
  const sup3Pass = await bcrypt.hash("supervisor123", 10);

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
      monthlySalary: 36000,
      address: "Flat 304, Shanti Heights, Station Road, Virar (W), Mumbai - 401303",
      aadharNumber: "5421 9876 1234",
      dateOfJoining: new Date("2025-04-01"),
      accountNumber: "91802003456789",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      bankBranch: "Virar West Branch",
    },
  });

  const sup2 = await prisma.user.create({
    data: {
      name: "Suresh Gupta",
      email: sup2Email,
      phone: "+91 98202 44556",
      passwordHash: sup2Pass,
      role: "SUPERVISOR",
      monthlySalary: 30000,
      address: "Room 12, Sai Krupa Chawl, Hanuman Nagar, Nallasopara (E) - 401209",
      aadharNumber: "8765 4321 9876",
      dateOfJoining: new Date("2025-06-15"),
      accountNumber: "088401500998",
      ifscCode: "ICIC0000884",
      bankName: "ICICI Bank",
      bankBranch: "Nallasopara East Branch",
    },
  });

  const sup3 = await prisma.user.create({
    data: {
      name: "Vikas Patil",
      email: "vikas.patil@rcrenterprises.in",
      phone: "+91 98203 77889",
      passwordHash: sup3Pass,
      role: "SUPERVISOR",
      monthlySalary: 27000,
      address: "Row House No. 4, Yashoda Park, Vasai Road (W) - 401202",
      aadharNumber: "4321 8765 2109",
      dateOfJoining: new Date("2025-09-01"),
      accountNumber: "50100456789012",
      ifscCode: "SBIN0004567",
      bankName: "State Bank of India",
      bankBranch: "Vasai Road Branch",
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
      remarks: "Reinforcement & Concrete Shuttering work for 2 High-Rise Towers (G+16 Floors).",
    },
  });

  // Bidirectional Supervisor Assignment for Site 1 (Ramesh & Suresh)
  await prisma.siteSupervisor.createMany({
    data: [
      { siteId: site1.id, supervisorId: sup1.id },
      { siteId: site1.id, supervisorId: sup2.id },
    ],
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
  const lab1 = await prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catFitter1.id, supervisorId: sup1.id, name: "Manoj Kumar Yadav", phone: "+91 97680 11221", dailyWage: 1100, aadharNumber: "7894-5612-3012" } });
  const lab2 = await prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catFitter1.id, supervisorId: sup1.id, name: "Santosh Verma", phone: "+91 97680 22332", dailyWage: 1100, aadharNumber: "7894-5612-3013" } });
  const lab3 = await prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catHelper1.id, supervisorId: sup1.id, name: "Brijesh Gond", phone: "+91 97680 33443", dailyWage: 800, aadharNumber: "7894-5612-3014" } });
  const lab4 = await prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catHelper1.id, supervisorId: sup2.id, name: "Deepak Chauhan", phone: "+91 97680 44554", dailyWage: 800, aadharNumber: "7894-5612-3015" } });
  const lab5 = await prisma.labour.create({ data: { siteId: site1.id, labourCategoryId: catMason1.id, supervisorId: sup2.id, name: "Ram Asrey Chaurasia", phone: "+91 97680 55665", dailyWage: 950, aadharNumber: "7894-5612-3016" } });

  const laboursSite1 = [lab1, lab2, lab3, lab4, lab5];

  // Labour Attendance on Site 1 via single createMany
  const today = new Date();
  const labourAttendanceData: any[] = [];
  for (let d = 5; d >= 1; d--) {
    const attDate = new Date(today);
    attDate.setDate(today.getDate() - d);
    attDate.setUTCHours(0, 0, 0, 0);

    for (const lab of laboursSite1) {
      labourAttendanceData.push({
        siteId: site1.id,
        labourId: lab.id,
        date: attDate,
        status: "PRESENT",
        hajari: 1.0,
        hajariRate: lab.dailyWage || 800,
        markedById: sup1.id,
      });
    }
  }
  await prisma.attendance.createMany({ data: labourAttendanceData });

  // Building A on Site 1: 18 Detailed Stages to thoroughly test Single-Page PDF Layout
  const bldg1A = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "Wing A (Residential Tower)",
      approxArea: 145000,
      contractRate: 49.60,
      order: 0,
    },
  });

  const towerAStages = [
    { name: "PCC & Raft Foundation Footing", partAmount: 450000, prevPct: 100, currPct: 0 },
    { name: "Basement 1 Retaining Wall & Slab", partAmount: 420000, prevPct: 100, currPct: 0 },
    { name: "Ground Stilt Parking Floor Slab", partAmount: 420000, prevPct: 100, currPct: 0 },
    { name: "Podium 1 Slab & Columns", partAmount: 380000, prevPct: 100, currPct: 0 },
    { name: "1st Typical Floor Slab", partAmount: 360000, prevPct: 100, currPct: 0 },
    { name: "2nd Typical Floor Slab", partAmount: 360000, prevPct: 100, currPct: 0 },
    { name: "3rd Typical Floor Slab", partAmount: 360000, prevPct: 100, currPct: 0 },
    { name: "4th Typical Floor Slab", partAmount: 360000, prevPct: 100, currPct: 0 },
    { name: "5th Typical Floor Slab", partAmount: 360000, prevPct: 100, currPct: 0 },
    { name: "6th Typical Floor Slab", partAmount: 360000, prevPct: 80, currPct: 20 },
    { name: "7th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 60 },
    { name: "8th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "9th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "10th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "11th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "12th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "13th Typical Floor Slab", partAmount: 360000, prevPct: 0, currPct: 0 },
    { name: "Terrace Slab & Parapet Wall", partAmount: 372000, prevPct: 0, currPct: 0 },
  ];

  await prisma.workItem.createMany({
    data: towerAStages.map((s, i) => {
      const prevAmt = (s.prevPct / 100) * s.partAmount;
      const currAmt = (s.currPct / 100) * s.partAmount;
      return {
        siteId: site1.id,
        buildingId: bldg1A.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: s.prevPct,
        currentPct: s.currPct,
        cumulativePct: s.prevPct + s.currPct,
        previousAmt: prevAmt,
        currentAmt: currAmt,
        cumulativeAmt: prevAmt + currAmt,
        order: i,
      };
    }),
  });

  // Building B on Site 1
  const bldg1B = await prisma.building.create({
    data: {
      siteId: site1.id,
      name: "Wing B (Residential Tower)",
      approxArea: 130000,
      contractRate: 49.60,
      order: 1,
    },
  });

  const towerBStages = [
    { name: "Raft Foundation & Footings", partAmount: 400000, prevPct: 100, currPct: 0 },
    { name: "Stilt Parking Slab", partAmount: 380000, prevPct: 100, currPct: 0 },
    { name: "1st Typical Floor Slab", partAmount: 340000, prevPct: 100, currPct: 0 },
    { name: "2nd Typical Floor Slab", partAmount: 340000, prevPct: 50, currPct: 50 },
    { name: "3rd Typical Floor Slab", partAmount: 340000, prevPct: 0, currPct: 40 },
    { name: "4th Typical Floor Slab", partAmount: 340000, prevPct: 0, currPct: 0 },
  ];

  await prisma.workItem.createMany({
    data: towerBStages.map((s, i) => {
      const prevAmt = (s.prevPct / 100) * s.partAmount;
      const currAmt = (s.currPct / 100) * s.partAmount;
      return {
        siteId: site1.id,
        buildingId: bldg1B.id,
        name: s.name,
        unit: "%",
        rate: s.partAmount,
        partAmount: s.partAmount,
        previousPct: s.prevPct,
        currentPct: s.currPct,
        cumulativePct: s.prevPct + s.currPct,
        previousAmt: prevAmt,
        currentAmt: currAmt,
        cumulativeAmt: prevAmt + currAmt,
        order: i,
      };
    }),
  });

  // Supply Labour Entries for Site 1
  await prisma.supplyLabourEntry.createMany({
    data: [
      {
        siteId: site1.id,
        date: new Date("2026-05-10"),
        challanNo: "CH-2026/045",
        description: "Emergency reinforcement checking & column shuttering fixing for 6th slab",
        fitterQty: 4,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 6,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 9200,
      },
      {
        siteId: site1.id,
        date: new Date("2026-05-18"),
        challanNo: "CH-2026/058",
        description: "Overtime concrete pour assisting & vibrator handling at 7th floor",
        fitterQty: 2,
        fitterHours: 12,
        fitterRate: 1100,
        helperQty: 4,
        helperHours: 12,
        helperRate: 800,
        totalAmount: 8100,
      },
    ],
  });

  // RA Bill 1 (Billed earlier)
  const bill1 = await prisma.runningBill.create({
    data: {
      siteId: site1.id,
      billNo: "001/2026-27",
      refNo: "01",
      billDate: new Date("2026-04-30"),
      periodLabel: "April 2026",
      status: "GENERATED",
      cgstPct: 9,
      sgstPct: 9,
      retentionPct: 2,
      tdsPct: 1,
    },
  });

  await prisma.billLine.create({
    data: {
      runningBillId: bill1.id,
      buildingId: bldg1A.id,
      description: "Wing A (Residential Tower) - April RCC Work",
      unit: "%",
      rate: 3500000,
      previousQty: 0,
      currentQty: 100,
      cumulativeQty: 100,
      previousAmount: 0,
      currentAmount: 3500000,
      cumulativeAmount: 3500000,
      order: 0,
    },
  });

  // Client Payment for Bill 1
  await prisma.payment.create({
    data: {
      siteId: site1.id,
      date: new Date("2026-05-12"),
      amount: 3800000,
      mode: "NEFT",
      accountCredited: "ICICI A/C 088405500559",
      reference: "NEFT-SSHIVAAY-00129",
      remarks: "Part payment against RA Bill 001/2026-27",
    },
  });

  // =========================================================================
  // SITE 2: RUNWAL BLISS (Assigned to Suresh & Vikas)
  // =========================================================================
  console.log("6. Seeding Site 2: Runwal Bliss Wing C...");
  const site2 = await prisma.site.create({
    data: {
      projectName: "RUNWAL BLISS - WING C",
      clientId: client2.id,
      address: "Kanjurmarg (East), Opp. Kanjurmarg Railway Station, Mumbai - 400042",
      gstNo: "27AAJFN6629D1Z5",
      workOrderNo: "RUNWAL/BLISS/2026-27/088",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 35,
      active: true,
      remarks: "High-end residential tower shuttering and steel reinforcement.",
    },
  });

  await prisma.siteSupervisor.createMany({
    data: [
      { siteId: site2.id, supervisorId: sup2.id },
      { siteId: site2.id, supervisorId: sup3.id },
    ],
  });

  // =========================================================================
  // SITE 3: GODREJ WOODS (Assigned to Ramesh & Vikas)
  // =========================================================================
  console.log("7. Seeding Site 3: Godrej Woods Tower 1...");
  const site3 = await prisma.site.create({
    data: {
      projectName: "GODREJ WOODS - TOWER 1",
      clientId: client3.id,
      address: "Sector 43, Phase 2, Palm Beach Road, Navi Mumbai - 400706",
      gstNo: "27AAJFN6629D1Z5",
      workOrderNo: "GODREJ/WOODS/2026-27/005",
      retentionPct: 2,
      cgstPct: 9,
      sgstPct: 9,
      tdsPct: 1,
      progress: 10,
      active: true,
      remarks: "Premium luxury high-rise tower foundation work.",
    },
  });

  await prisma.siteSupervisor.createMany({
    data: [
      { siteId: site3.id, supervisorId: sup1.id },
      { siteId: site3.id, supervisorId: sup3.id },
    ],
  });

  // =========================================================================
  // 8. SUPERVISOR ATTENDANCE & SALARY SEEDING (Feature 2)
  // Daily rate = Monthly Salary ÷ 30
  // =========================================================================
  console.log("8. Seeding Supervisor Attendance Records & Payouts...");

  const supervisors = [
    { sup: sup1, monthlySalary: 36000 },
    { sup: sup2, monthlySalary: 30000 },
    { sup: sup3, monthlySalary: 27000 },
  ];

  const supervisorAttendanceData: any[] = [];
  const supervisorPaymentData: any[] = [];

  for (const item of supervisors) {
    const dailyRate = Math.round((item.monthlySalary / 30) * 100) / 100;
    const halfRate = Math.round((dailyRate / 2) * 100) / 100;

    for (let dayOffset = 25; dayOffset >= 1; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      d.setUTCHours(0, 0, 0, 0);

      let status = "PRESENT";
      let earned = dailyRate;

      if (dayOffset % 7 === 0) {
        status = "ABSENT";
        earned = 0;
      } else if (dayOffset % 9 === 0) {
        status = "HALF_DAY";
        earned = halfRate;
      }

      supervisorAttendanceData.push({
        supervisorId: item.sup.id,
        date: d,
        status,
        dailyRate,
        earnedAmount: earned,
        remarks: status === "HALF_DAY" ? "Site visit till 2:00 PM" : status === "ABSENT" ? "Personal Leave" : "Full day site supervision",
        markedById: admin.id,
      });
    }

    const payoutAmount = Math.round(item.monthlySalary * 0.65);
    const pDate = new Date(today);
    pDate.setDate(today.getDate() - 5);

    supervisorPaymentData.push({
      supervisorId: item.sup.id,
      amount: payoutAmount,
      date: pDate,
      transactionId: `TXN-RCR-${item.sup.name.slice(0, 3).toUpperCase()}-099`,
      reason: "Monthly Attendance Advance Payout",
    });
  }

  await prisma.supervisorAttendance.createMany({ data: supervisorAttendanceData });
  
  for (const p of supervisorPaymentData) {
    await prisma.supervisorPayment.create({ data: p });
  }

  // =========================================================================
  // 9. QUOTATIONS
  // =========================================================================
  console.log("9. Seeding Quotations...");
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

  console.log("==================================================");
  console.log("DATABASE SEEDED SUCCESSFULLY WITH ALL NEW FEATURES!");
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
