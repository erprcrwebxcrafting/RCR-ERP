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

  // Check if an Admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });

  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error("PASSWORD_PEPPER must be provided in the environment variables.");
  }
  
  const hashedPassword = await bcrypt.hash(adminPassword + pepper, 10);

  if (existingAdmin) {
    // Admin already exists! Prevent accidental overwrite unless explicitly allowed
    if (process.env.FORCE_ADMIN_UPDATE !== "true") {
      console.log("⚠️ An Admin already exists in the system.");
      console.log("   To update the admin's email or reset their password via seed,");
      console.log("   you must set FORCE_ADMIN_UPDATE=\"true\" in your .env file.");
      console.log("   Seeding aborted safely. No data was changed.");
      return; // Exit safely
    }

    // Force update the existing admin (ensuring there's only ever ONE admin)
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        passwordVersion: { increment: 1 } // Log out old sessions
      }
    });
    console.log(`✅ Existing Admin updated successfully to use email: ${adminEmail}`);

  } else {
    // No admin exists, create the first one
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "System Admin",
        passwordHash: hashedPassword,
        role: "ADMIN",
        active: true,
      }
    });
    console.log(`✅ New Admin user created successfully with email: ${adminEmail}`);
  }
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
