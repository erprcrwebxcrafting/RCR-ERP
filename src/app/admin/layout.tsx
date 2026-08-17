import { auth } from "@/auth";
import { signOutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AdminSidebar } from "./sidebar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Get the earliest attendance year dynamically
  const earliest = await prisma.attendance.findFirst({
    orderBy: { date: "asc" },
    select: { date: true },
  });
  const earliestYear = earliest?.date
    ? (earliest.date.getMonth() >= 3 ? earliest.date.getFullYear() : earliest.date.getFullYear() - 1)
    : undefined;

  const logoutButton = (
    <form action={signOutAction}>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:text-rose-400 transition-colors rounded-xl border border-transparent hover:border-rose-500/20">
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar userName={session?.user?.name} logoutButton={logoutButton} earliestYear={earliestYear} />
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-0 flex flex-col min-h-[100dvh]">
        <div className="flex-1 mx-auto w-full max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
