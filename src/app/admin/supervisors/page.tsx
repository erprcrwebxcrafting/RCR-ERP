import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, UserCheck, IndianRupee, MapPin, Mail, Phone, Building2, CalendarDays, UserX } from "lucide-react";
import Link from "next/link";
import { SupervisorForm } from "./supervisor-form";
import { EditSupervisorForm } from "./edit-supervisor-form";
import { Pagination } from "@/components/ui/pagination";
import { Search } from "@/components/search";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { toggleSupervisorActive } from "./actions";

export const dynamic = 'force-dynamic';

export default async function SupervisorsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; showInactive?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const showInactive = resolvedParams.showInactive === "1";
  const PAGE_SIZE = 10;

  const whereClause = { 
    role: "SUPERVISOR",
    ...(showInactive ? {} : { active: true }),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ]
    } : {})
  };

  const [totalSupervisors, salaryAggregate, supervisors, allSites] = await Promise.all([
    prisma.user.count({ where: whereClause as any }),
    prisma.user.aggregate({
      where: whereClause as any,
      _sum: { monthlySalary: true }
    }),
    prisma.user.findMany({
      where: whereClause as any,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        monthlySalary: true,
        dateOfJoining: true,
        address: true,
        aadharNumber: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        bankBranch: true,
        // ✅ NO passwordHash
        // ✅ Only show currently ACTIVE site assignments
        assignedSites: {
          where: { site: { active: true } },
          select: {
            siteId: true,
            site: { select: { id: true, projectName: true } }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.site.findMany({
      where: { active: true },
      select: { id: true, projectName: true },
      orderBy: { projectName: "asc" },
    }),
  ]);

  // Calculate KPIs
  const totalSalaryLiability = salaryAggregate._sum.monthlySalary || 0;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Page Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-2xl shadow-blue-500/20 border border-blue-400/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_1.5px,transparent_1.5px)] bg-[length:24px_24px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold backdrop-blur-md border border-white/20">
              <UserCheck className="h-4 w-4" />
              Supervisor Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              Supervisors Dashboard
            </h1>
            <p className="text-blue-100 text-sm sm:text-base font-medium max-w-lg">
              Manage your site supervisors and view their assignments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <SupervisorForm allSites={allSites} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Supervisors</p>
              <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100">{totalSupervisors}</p>
              <p className="text-xs text-slate-400 font-medium">Active site managers</p>
            </div>
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <UserCheck className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20" />
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Salary Liability</p>
              <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{totalSalaryLiability.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400 font-medium">Per month across all supervisors</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <IndianRupee className="h-7 w-7 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / Filter Bar */}
      <div className="flex flex-wrap items-start md:items-center gap-3 relative">
        <div className="flex-1 min-w-0 md:max-w-md">
          <Search placeholder="Search supervisors by name, email or phone..." />
          {q && (
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-blue-600">{totalSupervisors}</span> result{totalSupervisors !== 1 ? "s" : ""} for "<span className="font-bold">{q}</span>"
            </p>
          )}
        </div>
        <Link
          href={showInactive ? "/admin/supervisors" : "/admin/supervisors?showInactive=1"}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors shrink-0 h-[42px] ${
            showInactive
              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          {showInactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
          {showInactive ? "Showing All" : "Show Inactive"}
        </Link>
      </div>

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {(supervisors as any[]).map((s: any) => (
          <Card key={s.id} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden rounded-2xl">
            
            {/* Card Top Color Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
            
            <CardHeader className="pb-4 pt-5 px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg shadow-md shadow-blue-500/20">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                      {s.name}
                    </CardTitle>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      <IndianRupee className="h-3 w-3 mr-1 text-green-500 shrink-0" />
                      <span className="truncate">{s.monthlySalary ? <span className="text-green-600 dark:text-green-400">₹{s.monthlySalary.toLocaleString("en-IN")}/mo</span> : "Salary Not Set"}</span>
                    </div>
                  </div>
                </div>
                <ActiveToggle id={s.id} active={s.active} entityName={s.name} onToggle={toggleSupervisorActive} size="sm" />
              </div>
            </CardHeader>

            <CardContent className="flex-1 px-6 pb-4 space-y-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <span className="truncate font-medium">{s.phone || "No phone number"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <span className="truncate font-medium">{s.email}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Active Sites ({s.assignedSites.length})
                </div>
                {s.assignedSites.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.assignedSites.slice(0, 2).map((a: any) => (
                      <span key={a.siteId} className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-500/20 dark:text-blue-400 truncate max-w-[130px]" title={a.site.projectName}>
                        {a.site.projectName}
                      </span>
                    ))}
                    {s.assignedSites.length > 2 && (
                      <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                        +{s.assignedSites.length - 2} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 dark:text-slate-500 italic">No active site assignments</div>
                )}
              </div>
            </CardContent>

            <div className="px-6 pb-5 flex gap-2.5">
              <Button asChild className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 text-sm">
                <Link href={`/admin/supervisors/${s.id}`}>
                  View Ledger & History →
                </Link>
              </Button>
              <EditSupervisorForm supervisor={s} allSites={allSites} />
            </div>
          </Card>
        ))}

        {supervisors.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex flex-col items-center">
              <div className="h-20 w-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5">
                <UserCheck className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No supervisors found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6 max-w-xs">
                {q ? `No results for "${q}". Try a different search.` : "You haven't added any supervisors yet. Start by adding your first supervisor!"}
              </p>
              {!q && <SupervisorForm allSites={allSites} />}
            </div>
          </div>
        )}
      </div>
      
      <Pagination 
        currentPage={page} 
        totalPages={Math.ceil(totalSupervisors / PAGE_SIZE)} 
        totalItems={totalSupervisors} 
        pageSize={PAGE_SIZE} 
      />
    </div>
  );
}
