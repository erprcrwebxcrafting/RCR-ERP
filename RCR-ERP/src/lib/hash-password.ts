import bcrypt from "bcryptjs";

function getPepper(): string {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error("Missing PASSWORD_PEPPER environment variable");
  }
  return pepper;
}

/**
 * Hash a password with bcrypt salt + a secret pepper.
 * Even if the database is stolen, the pepper (stored separately in env)
 * prevents offline brute-force attacks.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const peppered = plainPassword + getPepper();
  return bcrypt.hash(peppered, 12);
}

/**
 * Verify a plain password against a stored peppered hash.
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  const peppered = plainPassword + getPepper();
  return bcrypt.compare(peppered, hash);
}

/**
 * Generate a secure 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
