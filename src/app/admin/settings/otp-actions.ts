"use server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashPassword } from "@/lib/hash-password";
import { revalidatePath } from "next/cache";

/**
 * Request an OTP for admin password reset.
 * Sends OTP to console (replace with real email when SMTP is configured).
 */
export async function requestOtpAction(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.role !== "ADMIN") {
    // Don't reveal if email exists or not
    return { success: true };
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate old OTPs for this email
  await prisma.otpToken.updateMany({
    where: { email: user.email, used: false },
    data: { used: true },
  });

  // Create new OTP
  await prisma.otpToken.create({
    data: { email: user.email, otp, expiresAt },
  });

  // ========================================================
  // TODO: Replace console.log with real email sending when 
  // SMTP is configured in .env
  // ========================================================
  console.log(`\n🔐 OTP for ${user.email}: ${otp} (expires in 15 min)\n`);

  return { success: true };
}

/**
 * Verify OTP and reset admin password.
 */
export async function verifyOtpAndChangePasswordAction(
  email: string,
  otp: string,
  newPassword: string
) {
  // Validate new password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",.<>?]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const tokenRecord = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new Error("Invalid or expired OTP. Please request a new one.");
  }

  // Mark OTP as used
  await prisma.otpToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  // Update password with pepper hash
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { passwordHash: newHash },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
