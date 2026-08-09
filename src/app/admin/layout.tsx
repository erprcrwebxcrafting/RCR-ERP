import { auth } from "@/auth";
import { signOutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AdminSidebar } from "./sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const logoutButton = (
    <form action={signOutAction}>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar userName={session?.user?.name} logoutButton={logoutButton} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
