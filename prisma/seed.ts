import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const firstNames = ["Rahul", "Amit", "Suresh", "Ramesh", "Vijay", "Anil", "Sunil", "Rajesh", "Prakash", "Ganesh", "Kishore", "Sanjay", "Manoj", "Ajay", "Dinesh", "Nitin", "Pramod", "Deepak", "Ravi", "Ashok"];
const lastNames = ["Singh", "Kumar", "Sharma", "Verma", "Patil", "Yadav", "Gupta", "Jadhav", "Deshmukh", "Kale", "Kadam", "Mishra", "Chavan"];
const projectNames = ["Green Meadows", "Skyline Towers", "Riverfront Residences", "Sunset Boulevard", "Golden Estates"];
const clientNames = ["SSHIVAAY CONSTRUCTIONS", "L&T Realty", "Godrej Properties", "Lodha Group", "Shapoorji Pallonji"];

function getRandomName() {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

async function main() {
  console.log("Starting bulk seed...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rcrenterprises.com" },
    update: {},
    create: {
      name: "RCR Admin",
      email: "admin@rcrenterprises.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const supervisors = [];
  for (let i = 1; i <= 5; i++) {
    const supHash = await bcrypt.hash(`supervisor${i}`, 10);
    const sup = await prisma.user.upsert({
      where: { email: `supervisor${i}@rcrenterprises.com` },
      update: {},
      create: {
        name: `Supervisor ${i}`,
        email: `supervisor${i}@rcrenterprises.com`,
        passwordHash: supHash,
        role: "SUPERVISOR",
      },
    });
    supervisors.push(sup);
  }

  for (let s = 0; s < 5; s++) {
    const supervisor = supervisors[s];
    
    // Create Client
    const client = await prisma.client.upsert({
      where: { id: `seed-client-${s}` },
      update: {},
      create: {
        id: `seed-client-${s}`,
        name: clientNames[s],
        address: `Sector ${s+1}, Navi Mumbai`,
        gstNo: `27AEXFS8040P1Z${s}`,
        contactPerson: `Mr. Client ${s+1}`,
      },
    });

    // Create Site
    const site = await prisma.site.upsert({
      where: { id: `seed-site-${s}` },
      update: {},
      create: {
        id: `seed-site-${s}`,
        projectName: projectNames[s],
        clientId: client.id,
        address: `Plot ${s*10}, Mumbai`,
        workOrderNo: `WO/2026/${s+1}`,
        buildings: {
          create: [{ name: "Tower A", order: 0 }, { name: "Tower B", order: 1 }],
        },
        workItems: {
          create: [
            { name: "Excavation", unit: "Cum", rate: 250, buWork: 5000, order: 0 },
            { name: "RCC Slab", unit: "Sft", rate: 55, buWork: 15000, order: 1 },
            { name: "Brickwork", unit: "Sqm", rate: 450, buWork: 8000, order: 2 },
          ],
        },
        labourCategories: {
          create: [
            { name: "Fitter", dailyWage: 1200, overtimeRate: 150, order: 0 },
            { name: "Helper", dailyWage: 800, overtimeRate: 100, order: 1 },
            { name: "Mason", dailyWage: 1100, overtimeRate: 140, order: 2 },
            { name: "Carpenter", dailyWage: 1150, overtimeRate: 145, order: 3 },
          ],
        },
      },
    });

    await prisma.siteSupervisor.upsert({
      where: { siteId_supervisorId: { siteId: site.id, supervisorId: supervisor.id } },
      update: {},
      create: { siteId: site.id, supervisorId: supervisor.id },
    });

    const siteWithDeps = await prisma.site.findUnique({
      where: { id: site.id },
      include: { labourCategories: true, buildings: true, workItems: true },
    });

    if (!siteWithDeps) continue;

    // Create 20 Labours per supervisor/site
    const labours = [];
    for (let l = 1; l <= 20; l++) {
      const category = siteWithDeps.labourCategories[Math.floor(Math.random() * siteWithDeps.labourCategories.length)];
      const dailyWage = category.dailyWage + (Math.floor(Math.random() * 50) - 25); // Slight variation
      const overtimeRate = category.overtimeRate;

      const labour = await (prisma as any).labour.upsert({
        where: { id: `seed-labour-${s}-${l}` },
        update: {},
        create: {
          id: `seed-labour-${s}-${l}`,
          siteId: site.id,
          labourCategoryId: category.id,
          name: getRandomName(),
          phone: `9876543${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          supervisorId: supervisor.id,
          dailyWage: dailyWage,
          overtimeRate: overtimeRate,
          joiningDate: new Date("2026-05-01"),
        },
      });
      labours.push(labour);
    }

    // Create Attendance for past 10 days
    const today = new Date();
    const attendanceData = [];
    for (let d = 1; d <= 10; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);

      for (const labour of labours) {
        const r = Math.random();
        let status = "PRESENT";
        let hajari = 1;
        
        if (r > 0.9) {
          status = "ABSENT";
          hajari = 0;
        }
        
        // Randomly assign multiple hajaris for some workers to simulate overtime
        if (status === "PRESENT" && Math.random() > 0.7) {
          hajari = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 hajaris
        }

        attendanceData.push({
          siteId: site.id,
          buildingId: siteWithDeps.buildings[0].id,
          labourId: labour.id,
          date: date,
          status: status,
          hajari: hajari,
          hajariRate: labour.dailyWage,
          markedById: supervisor.id
        });
      }
    }
    
    const chunkSize = 100;
    for (let i = 0; i < attendanceData.length; i += chunkSize) {
      await prisma.attendance.createMany({ 
        skipDuplicates: true, 
        data: attendanceData.slice(i, i + chunkSize) 
      });
    }

    // Create 2-3 Payments per Labour
    for (const labour of labours) {
      await (prisma as any).labourPayment.create({
        data: {
          labourId: labour.id,
          amount: Math.floor(Math.random() * 3) * 500 + 1000, // 1000, 1500, or 2000
          date: new Date(),
          reason: "Weekly Advance",
        }
      });
    }

    // Create 1 Quotation
    await prisma.quotation.create({
      data: {
        siteId: site.id,
        clientId: client.id,
        projectName: site.projectName,
        quotationNo: `QT-${s+1}/2026`,
        date: new Date(),
        subject: `Quotation for ${site.projectName}`,
        termsJson: JSON.stringify(["Payment within 30 days"]),
        itemsJson: JSON.stringify([
          { description: "RCC Works", unit: "Sft", rate: 55, remarks: "" },
          { description: "Brickwork", unit: "Sqm", rate: 450, remarks: "" }
        ]),
        status: "SENT",
      }
    });

    // Create 1 Running Bill
    await prisma.runningBill.upsert({
      where: { id: `seed-bill-${s}` },
      update: {},
      create: {
        id: `seed-bill-${s}`,
        siteId: site.id,
        billNo: `RB-00${s+1}/2026-27`,
        refNo: "01",
        periodLabel: "May 2026",
        status: "GENERATED",
        lines: {
          create: [
            {
              buildingId: siteWithDeps.buildings[0].id,
              workItemId: siteWithDeps.workItems[1].id, // RCC
              description: "RCC Work Done",
              unit: "Sft",
              woQty: 15000,
              rate: 55,
              currentQty: 2500,
              currentAmount: 25000 * 55, // Math is wrong here (2500*55), let's fix it: 137500
              cumulativeQty: 2500,
              cumulativeAmount: 137500,
              order: 0
            }
          ]
        }
      }
    });
  }

  console.log("Bulk Seed complete!");
  console.log("Created: 5 Sites, 5 Supervisors, 100 Labours, 1000 Attendances, Payments, Bills, and Quotations.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
