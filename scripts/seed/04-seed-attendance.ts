import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedAttendance = async () => {
  console.log("Starting Step 4: Seeding 30 Days of Attendance (up to TODAY)...");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to midnight for precise date checking

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30); // 30 days ago

  const sites = await prisma.site.findMany({
    include: {
      supervisors: true,
      labours: true,
    }
  });

  if (sites.length === 0) {
    console.error("No sites found.");
    return;
  }

  let totalLabourAtt = 0;
  let totalSupAtt = 0;

  for (const site of sites) {
    const supervisorId = site.supervisors.length > 0 ? site.supervisors[0].supervisorId : null;
    
    const supervisorAttendanceData: any[] = [];
    const labourAttendanceData: any[] = [];

    // Loop through each day
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);

      // 1. Seed Supervisor Attendance
      if (supervisorId) {
        const isPresent = Math.random() > 0.05;
        supervisorAttendanceData.push({
          supervisorId: supervisorId,
          date: currentDate,
          status: isPresent ? "PRESENT" : "ABSENT",
          dailyRate: 1000, // Roughly 30k/month
          earnedAmount: isPresent ? 1000 : 0,
          markedById: "SYSTEM",
          createdAt: currentDate
        });
      }

      // 2. Build Labour Attendance Array
      for (const labour of site.labours) {
        let status = "PRESENT";
        let hajari = 1;
        let overtime = 0;

        const rand = Math.random();
        if (rand > 0.9) {
          status = "ABSENT";
          hajari = 0;
        } else if (rand > 0.85) {
          status = "HALF_DAY";
          hajari = 0.5;
        } else {
          if (Math.random() > 0.7) {
            overtime = Math.floor(Math.random() * 4) + 1;
          }
        }

        const rate = labour.dailyWage || 0;

        labourAttendanceData.push({
          siteId: site.id,
          labourId: labour.id,
          date: currentDate,
          status,
          hajari,
          hajariRate: rate,
          overtimeHrs: overtime,
          markedById: supervisorId || "SYSTEM",
          createdAt: currentDate
        });
      }
    }

    // Bulk Insert Supervisor Attendance
    if (supervisorAttendanceData.length > 0) {
      await prisma.supervisorAttendance.createMany({
        data: supervisorAttendanceData,
        skipDuplicates: true, // Safe against duplicate runs
      });
      totalSupAtt += supervisorAttendanceData.length;
    }

    // Bulk Insert Labour Attendance
    if (labourAttendanceData.length > 0) {
      await prisma.attendance.createMany({
        data: labourAttendanceData,
        skipDuplicates: true, // Safe against duplicate runs
      });
      totalLabourAtt += labourAttendanceData.length;
    }
    
    console.log(`Seeded attendance for ${site.projectName} using bulk insert`);
  }

  console.log(`Step 4 Complete. Seeded ${totalLabourAtt} Labour Attendances & ${totalSupAtt} Supervisor Attendances.`);
};

seedAttendance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
