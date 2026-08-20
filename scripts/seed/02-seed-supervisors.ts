import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const seedSupervisors = async () => {
  console.log("Starting Step 2: Seeding 10 Supervisors (80 days ago)...");

  const eightyDaysAgo = new Date();
  eightyDaysAgo.setDate(eightyDaysAgo.getDate() - 80);

  const pepper = process.env.PASSWORD_PEPPER || "";
  const passwordHash = await bcrypt.hash("password123" + pepper, 10);

  const supervisorNames = [
    "Rajesh Kumar",
    "Suresh Sharma",
    "Amit Singh",
    "Vikram Patel",
    "Ravi Verma",
    "Manish Gupta",
    "Prakash Tiwari",
    "Sunil Yadav",
    "Deepak Mishra",
    "Anil Chauhan"
  ];

  const sites = await prisma.site.findMany();

  if (sites.length < 10) {
    console.error("Not enough sites found. Ensure 10 sites exist.");
    return;
  }

  for (let i = 0; i < 10; i++) {
    const name = supervisorNames[i];
    const email = `${name.split(" ")[0].toLowerCase()}.supervisor@rcr.com`;

    // Upsert User
    const supervisor = await prisma.user.upsert({
      where: { email },
      update: {
        createdAt: eightyDaysAgo,
        dateOfJoining: eightyDaysAgo,
      },
      create: {
        name,
        email,
        passwordHash,
        role: "SUPERVISOR",
        phone: `98765${i.toString().padStart(5, '0')}`,
        monthlySalary: 25000 + (Math.random() * 5000), // 25k - 30k
        createdAt: eightyDaysAgo,
        dateOfJoining: eightyDaysAgo,
        active: true,
      }
    });

    // Assign to Site
    const site = sites[i];
    
    // Check if already assigned
    const existingAssignment = await prisma.siteSupervisor.findUnique({
      where: {
        siteId_supervisorId: {
          siteId: site.id,
          supervisorId: supervisor.id
        }
      }
    });

    if (!existingAssignment) {
      await prisma.siteSupervisor.create({
        data: {
          siteId: site.id,
          supervisorId: supervisor.id
        }
      });
    }
    
    console.log(`Assigned ${name} to Site: ${site.projectName}`);
  }

  console.log("Step 2 Complete.");
};

seedSupervisors()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
