import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { LabourAttendanceCalendar } from "./labour-attendance-calendar";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, HardHat, CalendarDays, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { AadharUpload } from "@/components/ui/aadhar-upload";
import { toggleLabourActiveSupervisor } from "./actions";

export default async function SupervisorLabourDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  
  if (!userId) redirect("/login");

  // Ensure supervisor is assigned to the site of this labour
  const assignedSites = await prisma.siteSupervisor.findMany({ 
    where: { supervisorId: userId }, 
    select: { siteId: true } 
  });
  const siteIds = assignedSites.map((a) => a.siteId);

  const labourRaw = await prisma.labour.findUnique({
    where: { id: resolvedParams.id, siteId: { in: siteIds } },
    include: {
      site: true,
      labourCategory: true,
      attendances: { orderBy: { date: "desc" }, take: 60 },
    },
  });

  if (!labourRaw) return notFound();
  
  const labour = labourRaw as any;
  const dailyWage = labour.dailyWage ?? labour.labourCategory.dailyWage;

  const formattedAttendances = labour.attendances.map((a: any) => ({
    id: a.id,
    labourId: a.labourId,
    date: a.date.toISOString(),
    status: a.status,
    hajari: a.hajari,
    hajariRate: a.hajariRate,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 sm:p-8 md:p-10 text-white shadow-2xl shadow-blue-500/20 border border-blue-400/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/supervisor/labours" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-lg backdrop-blur-md">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm capitalize mr-2">
              {labour.name}
            </h1>
            <div className="flex items-center gap-2">
              <ActiveToggle id={labour.id} active={labour.active} entityName={labour.name} onToggle={toggleLabourActiveSupervisor} />
              {!labour.active && (
                <Badge variant="secondary" className="bg-rose-500/20 text-rose-100 border border-rose-400/30 font-bold backdrop-blur-md px-2.5 py-0.5">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:ml-[3.25rem]">
            <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white backdrop-blur-md border border-white/20 shadow-sm">
              <HardHat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-200" /> {labour.labourCategory.name}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white backdrop-blur-md border border-white/20 shadow-sm">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-200" /> {labour.site.projectName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Top Info Bar: Profile Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            
            <div className="group md:pr-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Contact Info
                </h2>
              </div>
              {labour.phone ? (
                <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl">
                  <Phone className="h-5 w-5 text-blue-500" /> {labour.phone}
                </p>
              ) : (
                <p className="text-slate-400 italic text-sm font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg inline-block">Not provided</p>
              )}
            </div>
            
            <div className="group pt-6 md:pt-0 md:px-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Joining Date
                </h2>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl">
                {labour.joiningDate ? new Date(labour.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : new Date(labour.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="group pt-6 md:pt-0 md:pl-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Wage Rate
                </h2>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300 font-black px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center justify-between text-lg sm:text-xl border border-blue-100 dark:border-blue-900/50 shadow-inner">
                <span>{dailyWage}</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">/ hajari</span>
              </div>
            </div>

          </div>
          
          {/* Aadhar Upload Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <AadharUpload type="labour" id={labour.id} currentUrl={labour.aadharCardUrl} />
          </div>
        </div>

        {/* Main Content: Attendance Calendar */}
        <div className="w-full">
          <LabourAttendanceCalendar 
            labour={{ id: labour.id, name: labour.name, dailyWage }} 
            initialAttendances={formattedAttendances} 
          />
        </div>
      </div>
    </div>
  );
}
