import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HardHat, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddLabourForm } from "./add-labour-form";

export const dynamic = "force-dynamic";

export default async function AddLabourPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  if (!userId) redirect("/login");

  const assigned = await prisma.siteSupervisor.findMany({
    where: { supervisorId: userId },
    include: { site: { include: { labourCategories: true } } },
  });

  if (assigned.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-10 animate-in fade-in duration-500">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-6">
          <Building2 className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-800 dark:text-slate-100">No Sites Assigned</h2>
        <p className="text-slate-500 font-medium max-w-md text-center">You must be assigned to an active construction site to add labourers.</p>
      </div>
    );
  }

  const availableSites = assigned.map((a) => a.site);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-12">
      <Link href="/supervisor/labours" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 mr-2 transition-colors">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back to Directory
      </Link>

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            <HardHat className="h-3.5 w-3.5" />
            Add New Labourer
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Register Labourer</h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
            Add a new labourer to your assigned site. Please fill out all relevant details including bank information and Hajari rate.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <HardHat className="h-64 w-64" />
        </div>
      </div>

      <AddLabourForm availableSites={JSON.parse(JSON.stringify(availableSites))} />
    </div>
  );
}
