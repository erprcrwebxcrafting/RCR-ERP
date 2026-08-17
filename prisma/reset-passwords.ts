/**
 * Reset all existing user passwords to a secure default: Temp@1234
 * This is needed when introducing the Pepper because old hashes are incompatible.
 * Run once: npx ts-node --skip-project prisma/reset-passwords.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Temp@1234";
const PEPPER = process.env.PASSWORD_PEPPER || "RCR@EnterprisesPepper!2024#SecretKey$XYZ";

async function main() {
  const peppered = DEFAULT_PASSWORD + PEPPER;
  const hash = await bcrypt.hash(peppered, 12);

  const result = await prisma.user.updateMany({
    data: { passwordHash: hash },
  });

  console.log(`✅ Reset passwords for ${result.count} users to: Temp@1234`);
  console.log("⚠️  Inform all users to change their password on next login.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
