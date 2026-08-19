import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be provided in the environment variables. No fallbacks are allowed.");
  }

  // Ensure Global Settings exists
  await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      companyName: "RCR ENTERPRISES",
    },
  });

  // Create or Update Admin User
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error("PASSWORD_PEPPER must be provided in the environment variables.");
  }
  
  const hashedPassword = await bcrypt.hash(adminPassword + pepper, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: "System Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      active: true,
    },
  });

  console.log(`Admin user seeded successfully with email: ${admin.email}`);
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
