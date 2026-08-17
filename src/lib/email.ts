import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  text: string,
  attachments: { filename: string; content: Buffer }[],
  html?: string
) {
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP email configuration is missing in the .env file. Please configure SMTP_HOST.");
  }
  
  await transporter.sendMail({
    from: `"Construction ERP" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
