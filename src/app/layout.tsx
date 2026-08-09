import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RCR Enterprises — Construction ERP",
  description: "Sites, attendance, billing & quotations — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
