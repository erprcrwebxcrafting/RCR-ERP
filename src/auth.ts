import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/hash-password";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, req) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Try to fetch settings
        const settings = await prisma.globalSettings.findUnique({ where: { id: "global" } });
        
        // Send email alert if required
        const shouldNotify = user.role === "ADMIN" || (user.role === "SUPERVISOR" && settings?.notifySupervisorLogins !== false);
        
        if (shouldNotify && process.env.SMTP_HOST && settings?.email) {
          try {
            const transporter = (await import("@/lib/email")).transporter;
            const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
            const ip = req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip") || "Unknown IP";
            const ua = req.headers?.get("user-agent") || "Unknown Device";
            
            await transporter.sendMail({
              from: `"RCR ERP Security" <${process.env.SMTP_USER}>`,
              to: settings.email, // Send to admin email from settings
              subject: `Security Alert: New Login (${user.role})`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                  <h2 style="color: #4f46e5;">New Login Detected</h2>
                  <p>A successful login was made to your ERP system.</p>
                  <ul>
                    <li><strong>User:</strong> ${user.name} (${user.email})</li>
                    <li><strong>Role:</strong> ${user.role}</li>
                    <li><strong>Time:</strong> ${now}</li>
                    <li><strong>IP Address:</strong> ${ip}</li>
                    <li><strong>Device/Browser:</strong> ${ua}</li>
                  </ul>
                  <p style="color: #666; font-size: 12px;">If this was not you or your team, please change your password immediately.</p>
                </div>
              `,
            });
          } catch (e) {
            console.error("Failed to send login alert email:", e);
          }
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role, passwordVersion: user.passwordVersion };
      },
    }),
  ],
});
