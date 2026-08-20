import { prisma } from "./prisma";
import { randomBytes } from "crypto";

/** Generate a short 7-char alphanumeric code */
function generateCode(): string {
  return randomBytes(5).toString("base64url").slice(0, 7);
}

/**
 * Create a time-limited share link for a bill or quotation.
 * Returns the short code (e.g. "aB3kP9x")
 */
export async function createShareLink(
  type: "BILL" | "QUOTATION",
  refId: string,
  expiresInHours = 72
): Promise<string> {
  // Clean up expired links for this ref to avoid DB bloat
  await prisma.shareLink.deleteMany({
    where: { refId, expiresAt: { lt: new Date() } },
  });

  // Check if an active link already exists for this bill/quotation
  const existing = await prisma.shareLink.findFirst({
    where: { refId, type, expiresAt: { gt: new Date() } },
  });
  if (existing) return existing.code;

  // Generate a unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const conflict = await prisma.shareLink.findUnique({ where: { code } });
    if (!conflict) break;
    code = generateCode();
    attempts++;
  }

  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  await prisma.shareLink.create({ data: { code, type, refId, expiresAt } });
  return code;
}

/** Build the full public download URL */
export function buildShareUrl(code: string): string {
  const baseUrl = process.env.AUTH_URL;
  if (!baseUrl) {
    throw new Error("AUTH_URL is not defined in the .env file.");
  }
  return `${baseUrl.replace(/\/$/, "")}/dl/${code}`;
}
