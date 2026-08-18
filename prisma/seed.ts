import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// High performance batch inserter
async function insertInBatches<T>(
  label: string,
  items: T[],
  insertFn: (batch: T[]) => Promise<any>,
  batchSize = 5000
) {
  const total = items.length;
  console.log(`   -> Seeding ${label} (${total.toLocaleString()} records in batches of ${batchSize})...`);
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await insertFn(batch);
    const progress = Math.min(i + batchSize, total);
    process.stdout.write(`\r      Progress: ${progress.toLocaleString()} / ${total.toLocaleString()} records (${Math.round((progress / total) * 100)}%)`);
  }
  console.log(`\n      ✓ ${label} seeded successfully.`);
}

export async function seed150SitesDatabase() {
  console.log("===============================================================================");
  console.log("   STARTING 15-YEAR ULTRA-MASSIVE DATASET SEEDING (150 SITES, 2011 - 2026)     ");
  console.log("===============================================================================");

  // 1. Clean up existing database
  console.log("\n1. Cleaning up existing database records...");
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
  console.log("   ✓ Cleaned successfully.");

  // 2. Global Company Settings
  console.log("\n2. Seeding Global Settings...");
  await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      companyName: "RCR ENTERPRISES",
      phone: "+91 9619439243",
      email: "rcrenterprises786@gmail.com",
      website: "www.rcrenterprises.in",
      address: "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305",
    },
  });

  // 3. User Accounts (Admin + 20 Supervisors across 15 Years)
  console.log("\\n3. Seeding Admin & 20 Supervisors spanning 2011 to 2026...");
  
  const PEPPER = process.env.PASSWORD_PEPPER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!PEPPER || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Missing required environment variables for seeding: PASSWORD_PEPPER, ADMIN_EMAIL, ADMIN_PASSWORD");
  }

  const adminPass = await bcrypt.hash(ADMIN_PASSWORD + PEPPER, 12);
  const supPass = await bcrypt.hash("supervisor123" + PEPPER, 12);

  const admin = await prisma.user.create({
    data: {
      name: "RCR Admin",
      email: ADMIN_EMAIL,
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  const supNames = [
    "Ramesh Sharma", "Suresh Gupta", "Vikas Patil", "Anand Mhatre", "Santosh Deshmukh",
    "Rajendra Yadav", "Pravin Kadam", "Mahesh Sawant", "Deepak Shinde", "Ganesh Jadhav",
    "Vijay Naik", "Nitin Pawar", "Sunil Kulkarni", "Ajay More", "Kishore Gaikwad",
    "Suraj Mane", "Vikram Jagtap", "Sachin Bhosale", "Amol Chavan", "Pradeep Rane"
  ];

  const createdSupervisors: any[] = [];
  for (let i = 0; i < supNames.length; i++) {
    const joinYear = 2011 + Math.floor((i * 15) / supNames.length);
    const joinDate = new Date(`${joinYear}-04-01T00:00:00.000Z`);
    const sup = await prisma.user.create({
      data: {
        name: supNames[i],
        email: `${supNames[i].toLowerCase().replace(" ", ".")}@rcrenterprises.in`,
        phone: `+91 9820${String(10000 + i + 1)}`,
        passwordHash: supPass,
        role: "SUPERVISOR",
        monthlySalary: 28000 + (i * 800),
        address: `Flat ${101 + i}, Shanti Krupa, Virar - 401305`,
        aadharNumber: `5421-9876-${String(1000 + i)}`,
        dateOfJoining: joinDate,
        accountNumber: `9180200${String(1000000 + i)}`,
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
        bankBranch: "Mumbai Branch",
        active: true,
      },
    });
    createdSupervisors.push({ ...sup, joinDate });
  }

  // 4. Clients (15 Tier-1 Builders)
  console.log("\n4. Seeding 15 Major Clients...");
  const clientNames = [
    { name: "Sshivaay Constructions / Neo Iturkaa", gst: "27AAACG1234F1Z1", contact: "Mr. Rajeev Nambiar", email: "billing@sshivaayconstructions.com" },
    { name: "Runwal Developers Pvt Ltd", gst: "27AAACR5566G1Z2", contact: "Mr. Amit Kulkarni", email: "contracts@runwalgroup.com" },
    { name: "Godrej Properties Ltd", gst: "27AAACG9988K1Z5", contact: "Mr. Vikramaditya Rathore", email: "billing@godrejproperties.com" },
    { name: "Lodha Developers (Macrotech)", gst: "27AAACL1122M1Z3", contact: "Mr. Sandeep Shah", email: "accounts@lodhagroup.com" },
    { name: "Oberoi Realty Ltd", gst: "27AAACO4433P1Z8", contact: "Mr. Nitin Joshi", email: "procurement@oberoirealty.com" },
    { name: "Shapoorji Pallonji Real Estate", gst: "27AAACS7788Q1Z4", contact: "Mr. Cyrus Engineer", email: "contracts@shapoorji.com" },
    { name: "Larsen & Toubro Realty", gst: "27AAACL9900R1Z9", contact: "Mr. Pradeep Shenoy", email: "realtybilling@larsentoubro.com" },
    { name: "K Raheja Corp", gst: "27AAACK3322T1Z7", contact: "Mr. Deepak Raheja", email: "billing@kraheja.com" },
    { name: "Kalpataru Limited", gst: "27AAACK8877U1Z2", contact: "Mr. Arvind Mehta", email: "projects@kalpataru.com" },
    { name: "Piramal Realty", gst: "27AAACP5544V1Z6", contact: "Mr. Harish Iyer", email: "finance@piramalrealty.com" },
    { name: "Tata Housing Development Co", gst: "27AAACT1122D1Z4", contact: "Mr. Ratan Sen", email: "billing@tatahousing.com" },
    { name: "Rustomjee Urban Spaces", gst: "27AAACR8877W1Z1", contact: "Mr. Boman Irani", email: "contracts@rustomjee.com" },
    { name: "Hiranandani Communities", gst: "27AAACH4433L1Z9", contact: "Mr. Niranjan S", email: "accounts@hiranandani.net" },
    { name: "The Wadhwa Group", gst: "27AAACW9988E1Z3", contact: "Mr. Vijay Wadhwa", email: "billing@thewadhwagroup.com" },
    { name: "Dosti Realty Ltd", gst: "27AAACD5544M1Z8", contact: "Mr. Rajesh Dosti", email: "finance@dostirealty.com" },
  ];

  const createdClients: any[] = [];
  for (const c of clientNames) {
    const cl = await prisma.client.create({
      data: {
        name: c.name,
        address: "Commercial Office Park, Mumbai, Maharashtra",
        gstNo: c.gst,
        contactPerson: c.contact,
        phone: "+91 98210 99887",
        email: c.email,
      },
    });
    createdClients.push(cl);
  }

  // 5. 150 Construction Sites (10 Sites per Year from 2011 to 2026)
  console.log("\n5. Generating 150 Sites (10 Projects/Year across 15 Years)...");
  const projectTypes = [
    "RESIDENTIAL TOWERS", "COMMERCIAL COMPLEX", "TECH PARK WING", "LUXURY ENCLAVE",
    "GOLF ESTATE PHASE", "HORIZON TOWERS", "SIGNATURE SUITES", "BUSINESS BAY",
    "PARK RESIDENCY", "METROPOLIS HUB"
  ];
  const locations = [
    "Powai", "Bandra Kurla Complex", "Thane West", "Vikhroli East", "Kanjurmarg",
    "Goregaon East", "Andheri West", "Worli", "Lower Parel", "Navi Mumbai Palm Beach",
    "Kandivali East", "Mulund West", "Borivali West", "Chembur", "Ghatkopar"
  ];

  const createdSites: any[] = [];

  for (let year = 2011; year <= 2026; year++) {
    for (let s = 1; s <= 10; s++) {
      const siteIdx = (year - 2011) * 10 + s;
      const type = projectTypes[(siteIdx - 1) % projectTypes.length];
      const loc = locations[(siteIdx - 1) % locations.length];
      const client = createdClients[(siteIdx - 1) % createdClients.length];
      const isCurrentYear = year >= 2025;
      const progress = isCurrentYear ? (year === 2026 ? 25 : 70) : 100;
      const active = isCurrentYear;
      const endYear = isCurrentYear ? year + 1 : Math.min(2025, year + 2);

      const site = await prisma.site.create({
        data: {
          projectName: `${loc.toUpperCase()} ${type} - SEC ${s}`,
          clientId: client.id,
          address: `Sector ${s * 4}, Near Highway Junction, ${loc}, Mumbai`,
          gstNo: "27AAJFN6629D1Z5",
          workOrderNo: `WO/${client.name.slice(0, 3).toUpperCase()}/${year}-${(year + 1).toString().slice(2)}/${String(s).padStart(3, "0")}`,
          retentionPct: 2,
          cgstPct: 9,
          sgstPct: 9,
          tdsPct: 1,
          progress,
          active,
          remarks: `15-Year Simulation Site #${siteIdx}. Work timeframe: ${year} - ${endYear}.`,
          createdAt: new Date(`${year}-01-15T00:00:00.000Z`),
        },
      });

      // Assign 2 supervisors
      const sup1 = createdSupervisors[(siteIdx - 1) % createdSupervisors.length];
      const sup2 = createdSupervisors[siteIdx % createdSupervisors.length];

      await prisma.siteSupervisor.createMany({
        data: [
          { siteId: site.id, supervisorId: sup1.id },
          { siteId: site.id, supervisorId: sup2.id },
        ],
      });

      createdSites.push({
        ...site,
        startYear: year,
        endYear,
        supIds: [sup1.id, sup2.id],
      });
    }
  }

  // 6. Labour Categories for All 150 Sites (Bulk Inserted)
  console.log("\n6. Seeding Labour Categories for All 150 Sites...");
  const categoriesToInsert: any[] = [];
  for (const site of createdSites) {
    categoriesToInsert.push(
      { siteId: site.id, name: "Reinforcement Fitter", dailyWage: 1100, overtimeRate: 150, order: 0 },
      { siteId: site.id, name: "General Helper", dailyWage: 800, overtimeRate: 100, order: 1 },
      { siteId: site.id, name: "RCC Mason", dailyWage: 950, overtimeRate: 130, order: 2 },
      { siteId: site.id, name: "Shuttering Carpenter", dailyWage: 1050, overtimeRate: 140, order: 3 }
    );
  }
  await prisma.labourCategory.createMany({ data: categoriesToInsert });
  const allCategories = await prisma.labourCategory.findMany({});

  // 7. Labours (1,200 Labours across 150 Sites, Bulk Inserted)
  console.log("\n7. Seeding 1,200+ Labours across 150 Sites...");
  const firstNames = ["Manoj", "Santosh", "Brijesh", "Deepak", "Ram", "Dinesh", "Sanjay", "Vinod", "Ashok", "Pramod", "Raju", "Mukesh", "Anil", "Sunil", "Ganesh", "Vijay", "Ajay", "Kishore", "Suraj", "Vikram"];
  const lastNames = ["Yadav", "Verma", "Gond", "Chauhan", "Chaurasia", "Gupta", "Mandal", "Paswan", "Kori", "Thakur", "Singh", "Pandey", "Mistri", "Sharma", "Bauri", "Pal", "Bind", "Soni", "Nishad", "Sahani"];

  const laboursToInsert: any[] = [];
  let labCounter = 0;

  for (const site of createdSites) {
    const siteCats = allCategories.filter((c) => c.siteId === site.id);
    for (let l = 0; l < 8; l++) {
      labCounter++;
      const cat = siteCats[l % siteCats.length];
      const supId = site.supIds[l % site.supIds.length];
      const fn = firstNames[(labCounter) % firstNames.length];
      const ln = lastNames[(labCounter + 3) % lastNames.length];

      laboursToInsert.push({
        siteId: site.id,
        labourCategoryId: cat.id,
        supervisorId: supId,
        name: `${fn} ${ln}`,
        phone: `+91 9768${String(100000 + labCounter)}`,
        dailyWage: cat.dailyWage,
        aadharNumber: `7894-5612-${String(1000 + (labCounter % 8999))}`,
        active: site.active,
        createdAt: new Date(`${site.startYear}-02-01T00:00:00.000Z`),
      });
    }
  }

  await insertInBatches("Labours", laboursToInsert, (batch) =>
    prisma.labour.createMany({ data: batch })
  );
  const allLabours = await prisma.labour.findMany({});

  // 8. 15-Year Daily Labour Attendance & Kharcha Payments (Ultra Massive Dataset)
  console.log("\n8. Generating 15-Year Daily Labour Attendance Matrix...");
  const attendanceRecords: any[] = [];
  const labourPayments: any[] = [];

  for (const site of createdSites) {
    const siteLabours = allLabours.filter((l) => l.siteId === site.id);
    const startDate = new Date(`${site.startYear}-02-01T00:00:00.000Z`);
    const endDate = site.active
      ? new Date("2026-08-15T00:00:00.000Z")
      : new Date(`${site.endYear}-11-30T00:00:00.000Z`);

    const currDate = new Date(startDate);
    let dayIndex = 0;

    // Sample daily mark
    while (currDate <= endDate) {
      const isSunday = currDate.getUTCDay() === 0;
      dayIndex++;

      for (const lab of siteLabours) {
        let status = "PRESENT";
        let hajari = 1.0;
        let ot = 0;

        if (isSunday) {
          if (dayIndex % 4 === 0) {
            status = "PRESENT";
            hajari = 1.0;
            ot = 4;
          } else {
            status = "ABSENT";
            hajari = 0;
          }
        } else if (dayIndex % 15 === 0) {
          status = "HALF_DAY";
          hajari = 0.5;
        } else if (dayIndex % 25 === 0) {
          status = "ABSENT";
          hajari = 0;
        } else if (dayIndex % 10 === 0) {
          ot = 2;
        }

        if (status !== "ABSENT" || isSunday) {
          attendanceRecords.push({
            siteId: site.id,
            labourId: lab.id,
            date: new Date(currDate),
            status,
            hajari,
            hajariRate: lab.dailyWage || 900,
            overtimeHrs: ot,
            markedById: lab.supervisorId,
            remarks: ot > 0 ? "Extended pour overtime" : status === "HALF_DAY" ? "Half day post-lunch" : null,
          });
        }

        // Fortnightly Kharcha advance
        if (dayIndex % 15 === 0 && hajari > 0) {
          labourPayments.push({
            labourId: lab.id,
            amount: 5000,
            date: new Date(currDate),
            transactionId: `KHARCHA-${site.startYear}-${dayIndex}-${lab.id.slice(-4)}`,
            reason: "Fortnightly Labour Kharcha / Mess Advance",
          });
        }
      }

      // Step 2 days to balance realistic sampling vs total size
      currDate.setUTCDate(currDate.getUTCDate() + (site.active ? 1 : 2));
    }
  }

  await insertInBatches("Labour Attendance", attendanceRecords, (batch) =>
    prisma.attendance.createMany({ data: batch })
  );

  await insertInBatches("Labour Kharcha Payments", labourPayments, (batch) =>
    prisma.labourPayment.createMany({ data: batch })
  );

  // 9. 15-Year Daily Supervisor Attendance & Salary Advance Payouts
  console.log("\n9. Generating 15-Year Supervisor Attendance & Advance Payouts...");
  const supAttendanceRecords: any[] = [];
  const supPayments: any[] = [];

  for (const sup of createdSupervisors) {
    const sStart = new Date(sup.joinDate);
    const sEnd = new Date("2026-08-15T00:00:00.000Z");
    const sCurr = new Date(sStart);
    const dailyRate = Math.round((sup.monthlySalary / 30) * 100) / 100;
    const halfRate = Math.round((dailyRate / 2) * 100) / 100;

    let sDay = 0;
    while (sCurr <= sEnd) {
      sDay++;
      let status = "PRESENT";
      let earned = dailyRate;

      if (sDay % 7 === 0) {
        status = "ABSENT";
        earned = 0;
      } else if (sDay % 13 === 0) {
        status = "HALF_DAY";
        earned = halfRate;
      }

      supAttendanceRecords.push({
        supervisorId: sup.id,
        date: new Date(sCurr),
        status,
        dailyRate,
        earnedAmount: earned,
        remarks: status === "HALF_DAY" ? "Site coordination till 2 PM" : status === "ABSENT" ? "Weekly Off / Leave" : "Full day site management",
        markedById: admin.id,
      });

      if (sDay % 30 === 0) {
        supPayments.push({
          supervisorId: sup.id,
          amount: Math.round(sup.monthlySalary * 0.60),
          date: new Date(sCurr),
          transactionId: `SAL-ADV-${sup.name.slice(0, 3).toUpperCase()}-${sCurr.getFullYear()}-${sCurr.getMonth() + 1}`,
          reason: "Monthly Attendance Advance Transfer",
        });
      }

      sCurr.setUTCDate(sCurr.getUTCDate() + 1);
    }
  }

  await insertInBatches("Supervisor Attendance", supAttendanceRecords, (batch) =>
    prisma.supervisorAttendance.createMany({ data: batch })
  );

  await insertInBatches("Supervisor Payments", supPayments, (batch) =>
    prisma.supervisorPayment.createMany({ data: batch })
  );

  // 10. Buildings, WorkItems, RA Bills, Bill Lines & Client Payments (150 Projects)
  console.log("\n10. Generating 500+ Towers, 1,200+ RA Bills & Complete Balance Sheet Ledgers...");

  const buildingsToInsert: any[] = [];
  for (const site of createdSites) {
    buildingsToInsert.push(
      { siteId: site.id, name: "Tower A (High-Rise Residential)", approxArea: 140000, contractRate: 49.50, order: 0 },
      { siteId: site.id, name: "Tower B (Commercial Wing)", approxArea: 110000, contractRate: 52.00, order: 1 },
      { siteId: site.id, name: "Tower C (Clubhouse & Amenities)", approxArea: 65000, contractRate: 55.00, order: 2 }
    );
  }
  await insertInBatches("Buildings / Towers", buildingsToInsert, (batch) =>
    prisma.building.createMany({ data: batch })
  );
  const allBuildings = await prisma.building.findMany({});

  const stageTemplates = [
    { name: "PCC & Raft Foundation Footings", amount: 450000 },
    { name: "Basement 1 Retaining Wall & Columns", amount: 420000 },
    { name: "Ground Stilt Parking Floor Slab", amount: 400000 },
    { name: "Podium 1 Slab & Columns", amount: 380000 },
    { name: "1st Typical Floor Slab", amount: 360000 },
    { name: "2nd Typical Floor Slab", amount: 360000 },
    { name: "3rd Typical Floor Slab", amount: 360000 },
    { name: "4th Typical Floor Slab", amount: 360000 },
    { name: "5th Typical Floor Slab", amount: 360000 },
    { name: "6th Typical Floor Slab", amount: 360000 },
    { name: "7th Typical Floor Slab", amount: 360000 },
    { name: "8th Typical Floor Slab", amount: 360000 },
    { name: "9th Typical Floor Slab", amount: 360000 },
    { name: "10th Typical Floor Slab", amount: 360000 },
    { name: "Terrace Slab & Parapet Walls", amount: 380000 },
  ];

  const workItemsToInsert: any[] = [];
  for (const bldg of allBuildings) {
    for (let i = 0; i < stageTemplates.length; i++) {
      const s = stageTemplates[i];
      workItemsToInsert.push({
        siteId: bldg.siteId,
        buildingId: bldg.id,
        name: s.name,
        unit: "%",
        rate: s.amount,
        partAmount: s.amount,
        previousPct: 100,
        currentPct: 0,
        cumulativePct: 100,
        previousAmt: s.amount,
        currentAmt: 0,
        cumulativeAmt: s.amount,
        order: i,
      });
    }
  }
  await insertInBatches("WorkItems / Stages", workItemsToInsert, (batch) =>
    prisma.workItem.createMany({ data: batch })
  );
  const allWorkItems = await prisma.workItem.findMany({});

  // Generate RA Bills & Client Payments for all 150 Sites
  const billsToInsert: any[] = [];
  const challansToInsert: any[] = [];
  const paymentsToInsert: any[] = [];

  for (const site of createdSites) {
    const numBills = site.progress === 100 ? 8 : 2;
    for (let b = 1; b <= numBills; b++) {
      const billDate = new Date(`${site.startYear}-03-01T00:00:00.000Z`);
      billDate.setUTCMonth(billDate.getUTCMonth() + (b - 1) * 3);

      billsToInsert.push({
        siteId: site.id,
        billNo: `RA-${String(b).padStart(2, "0")}/${site.startYear}-${(site.startYear + 1).toString().slice(2)}`,
        refNo: `REF-${String(b).padStart(2, "0")}`,
        billDate,
        periodLabel: `Quarter ${b} (${billDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })})`,
        status: "GENERATED",
        cgstPct: 9,
        sgstPct: 9,
        tdsPct: 1,
        retentionPct: 2,
      });

      // Supply labour challan
      challansToInsert.push({
        siteId: site.id,
        date: billDate,
        challanNo: `CH-${site.startYear}/${String(b * 10).padStart(3, "0")}`,
        description: `Emergency shuttering modification & safety alignment for RA Bill ${b}`,
        fitterQty: 4,
        fitterHours: 8,
        fitterRate: 1100,
        helperQty: 6,
        helperHours: 8,
        helperRate: 800,
        totalAmount: 9200,
      });

      // Client payment ledger entry
      const payDate = new Date(billDate);
      payDate.setUTCDate(payDate.getUTCDate() + 20);

      paymentsToInsert.push({
        siteId: site.id,
        date: payDate,
        amount: 850000,
        mode: "NEFT",
        accountCredited: "ICICI CURRENT A/C 088405500559",
        reference: `NEFT-UTR-${site.startYear}-${String(b * 100 + 45).padStart(5, "0")}`,
        remarks: `NEFT payment against RA Bill No. ${b}`,
      });
    }
  }

  await insertInBatches("RA Bills", billsToInsert, (batch) =>
    prisma.runningBill.createMany({ data: batch })
  );

  await insertInBatches("Supply Labour Challans", challansToInsert, (batch) =>
    prisma.supplyLabourEntry.createMany({ data: batch })
  );

  await insertInBatches("Client Payments (Balance Sheet Ledgers)", paymentsToInsert, (batch) =>
    prisma.payment.createMany({ data: batch })
  );

  const allRunningBills = await prisma.runningBill.findMany({});

  // Generate BillLine snapshots
  console.log("\n   -> Generating Bill Lines for all RA Bills...");
  const billLinesToInsert: any[] = [];
  for (const bill of allRunningBills) {
    const siteWorkItems = allWorkItems.filter((w) => w.siteId === bill.siteId).slice(0, 15);
    for (let wi = 0; wi < siteWorkItems.length; wi++) {
      const item = siteWorkItems[wi];
      billLinesToInsert.push({
        runningBillId: bill.id,
        buildingId: item.buildingId,
        workItemId: item.id,
        description: `${item.name}`,
        unit: "%",
        rate: item.rate,
        previousQty: 10,
        currentQty: 10,
        cumulativeQty: 20,
        previousAmount: item.rate * 0.10,
        currentAmount: item.rate * 0.10,
        cumulativeAmount: item.rate * 0.20,
        order: wi,
      });
    }
  }

  await insertInBatches("Bill Lines", billLinesToInsert, (batch) =>
    prisma.billLine.createMany({ data: batch })
  );

  // 11. Multi-Year Quotations (150 Quotations)
  console.log("\n11. Seeding 150 Quotations across all Sites...");
  const quotationsToInsert: any[] = [];
  for (let i = 0; i < createdSites.length; i++) {
    const site = createdSites[i];
    const client = createdClients[i % createdClients.length];

    quotationsToInsert.push({
      siteId: site.id,
      clientId: client.id,
      projectName: site.projectName,
      quotationNo: `RCR/QTN/${site.startYear}/${String(i + 1).padStart(3, "0")}`,
      date: new Date(`${site.startYear}-01-10T00:00:00.000Z`),
      subject: `Quotation for RCC Shuttering & Reinforcement Work - ${site.projectName}`,
      itemsJson: JSON.stringify([
        { description: "Reinforcement Steel Binding, Cutting & Fabrication", unit: "MT", rate: 6800 },
        { description: "Aluminium & Wooden Shuttering for High-Rise Slabs & Retaining Walls", unit: "Sft", rate: 48 },
        { description: "RMC Concrete Pouring, Pumping, Compaction & Finishing", unit: "Cum", rate: 580 },
      ]),
      termsJson: JSON.stringify([
        "Payment within 15 days from RA bill submission.",
        "Running account bills to be certified within 7 working days.",
        "Electricity, water & crane access provided by developer.",
        "Retention of 2% will be deducted from each RA bill and released after virtual completion.",
      ]),
      exclusionsJson: JSON.stringify([
        "Excavation and external peripheral development.",
        "Supply of raw steel and cement bags.",
      ]),
      status: i < 130 ? "ACCEPTED" : "DRAFT",
    });
  }

  await insertInBatches("Quotations", quotationsToInsert, (batch) =>
    prisma.quotation.createMany({ data: batch })
  );

  // 12. PostgreSQL Storage Analytics & Benchmark Report
  console.log("\n===============================================================================");
  console.log("             POSTGRESQL 15-YEAR STORAGE CAPACITY BENCHMARK REPORT             ");
  console.log("===============================================================================");

  try {
    const dbSizeRes: any = await prisma.$queryRawUnsafe(`SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;`);
    const tableSizes: any = await prisma.$queryRawUnsafe(`
      SELECT 
        relname AS table_name,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
        n_live_tup AS estimated_rows
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC;
    `);

    console.log(`\n📦 TOTAL DATABASE STORAGE USED: ${dbSizeRes[0]?.total_size || "N/A"}`);
    console.log(`🎯 NEON FREE TIER QUOTA       : 512.0 MB`);
    console.log("-------------------------------------------------------------------------------");
    console.log(
      "Table Name".padEnd(30) +
      "Records".padEnd(18) +
      "Storage (Size + Indexes)"
    );
    console.log("-------------------------------------------------------------------------------");

    for (const t of tableSizes) {
      console.log(
        String(t.table_name).padEnd(30) +
        Number(t.estimated_rows).toLocaleString().padEnd(18) +
        String(t.total_size)
      );
    }
    console.log("===============================================================================");
  } catch (err: any) {
    console.log("Storage analyzer error (non-fatal):", err?.message);
  }

  console.log("\n✨ 150-SITE ULTRA DATABASE SEEDING & BENCHMARK COMPLETED SUCCESSFULLY!");
}

async function main() {
  await seed150SitesDatabase();
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
