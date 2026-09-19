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

  // Send OTP via Email
  const transporter = (await import("@/lib/email")).transporter;
  
  if (process.env.SMTP_HOST) {
    try {
      await transporter.sendMail({
        from: `"RCR ERP Security" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your Admin Password Reset OTP",
        text: `Your OTP for admin password reset is: ${otp}. It is valid for 15 minutes.`,
        html: `<p>Your OTP for admin password reset is: <strong>${otp}</strong>.</p><p>It is valid for 15 minutes. Do not share this with anyone.</p>`,
      });
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      // We still return success: true so the user doesn't know if email exists or not,
      // but in a real scenario you might handle this differently.
    }
  } else {
    // Fallback or warning if SMTP not configured, but we shouldn't log it in production
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 OTP for ${user.email}: ${otp} (expires in 15 min)\n`);
    }
  }

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

  // Update password with pepper hash and increment passwordVersion
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { 
      passwordHash: newHash,
      passwordVersion: { increment: 1 } 
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
