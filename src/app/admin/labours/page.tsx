import { prisma } from "@/lib/prisma";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LabourForm } from "./labour-form";
import { deleteLabour, toggleLabourActive } from "./actions";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/search";
import { Search as SearchIcon, Trash2, ChevronDown, Users, MapPin, Pickaxe, Phone, FileText, FileDown, BookOpen, ChevronLeft, ChevronRight, UserX, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { SiteLaboursTable } from "./site-labours-table";

export default async function LaboursPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; showInactive?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const showInactive = resolvedParams.showInactive === "1";
  const PAGE_SIZE = 10;

  const [totalSites, sites, allSites, allCategories, allSupervisors] = await Promise.all([
    prisma.site.count({ where: { active: true } }),
    prisma.site.findMany({
      where: { active: true },
      take: q ? undefined : PAGE_SIZE,
      skip: q ? undefined : (page - 1) * PAGE_SIZE,
      select: {
      id: true,
      projectName: true,
      labourCategories: {
        select: { id: true, name: true, order: true }
      },
      // ✅ Only safe supervisor fields — no passwordHash etc.
      supervisors: {
        select: {
          supervisor: { select: { id: true, name: true } }
        }
      },
      labours: {
        select: {
          id: true,
          name: true,
          phone: true,
          active: true,
          joiningDate: true,
          dailyWage: true,
          overtimeRate: true,
          address: true,
          aadharNumber: true,
          aadharCardUrl: true,
          bankName: true,
          accountNumber: true,
          ifscCode: true,
          bankBranch: true,
          siteId: true,
          supervisorId: true,
          labourCategory: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
        },
        where: q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ]
        } : (showInactive ? undefined : { active: true }),
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { projectName: "asc" },
  }),
  prisma.site.findMany({
    where: { active: true },
    select: {
      id: true,
      projectName: true,
      labourCategories: { select: { id: true, name: true, order: true } },
      supervisors: { select: { supervisor: { select: { id: true, name: true } } } }
    },
    orderBy: { projectName: "asc" }
  }),
  prisma.labourCategory.findMany({ orderBy: { name: "asc" } }),
  prisma.user.findMany({ where: { role: "SUPERVISOR", active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  const filteredSites = q ? (sites as any[]).filter(s => s.labours.length > 0) : (sites as any[]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <Users className="h-3.5 w-3.5" />
              Workforce
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Labours Management</h1>
            <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
              Manage your workforce efficiently. Organize labourers by sites, track details, and monitor supervisors all in one place.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
             <LabourForm sites={allSites as any} supervisors={allSupervisors} />
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex-1 min-w-0 sm:max-w-md">
          <Search placeholder="Search by labour name or phone..." />
        </div>
        <Link
          href={showInactive ? "/admin/labours" : "/admin/labours?showInactive=1"}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
            showInactive
              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          {showInactive ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
          {showInactive ? "Showing All" : "Show Inactive"}
        </Link>
      </div>

      {/* Site Accordions */}
      <div className="space-y-6">
        {filteredSites.map((site: any) => (
          <details key={site.id} suppressHydrationWarning className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-800/50">
            <summary className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 list-none [&::-webkit-details-marker]:hidden bg-slate-50/50 dark:bg-slate-800/20 group-open:bg-slate-50 dark:group-open:bg-slate-800/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{site.projectName}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm ml-11">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Supervisors:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {site.supervisors.length > 0
                        ? site.supervisors.map((s: any) => s.supervisor.name).join(", ")
                        : <span className="text-slate-400 italic">None assigned</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Total Labourers:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200">{site.labours.length}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-11 sm:ml-0 border-t sm:border-0 pt-4 sm:pt-0 border-slate-200 dark:border-slate-800">
                {/* Supervisor Ledger Buttons */}
                <div className="flex flex-wrap gap-2">
                  {site.supervisors.map((s: any) => (
                    <Button key={s.supervisor.id} variant="outline" size="sm" asChild className="h-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <a href={`/admin/supervisors/${s.supervisor.id}`}>
                        <BookOpen className="h-3 w-3 mr-1.5 text-indigo-500" />
                        {s.supervisor.name.split(' ')[0]} Ledger
                      </a>
                    </Button>
                  ))}
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 transition-transform duration-300 group-open:-rotate-180">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </summary>
            
            <SiteLaboursTable site={site} allSites={allSites} allSupervisors={allSupervisors} />
          </details>
        ))}
        {filteredSites.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <SearchIcon className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No results found</h3>
            <p className="text-slate-500 text-sm mt-1">
              {q ? "No labourers found matching your search criteria." : "No active sites found."}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {!q && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(totalSites / PAGE_SIZE)} 
            totalItems={totalSites} 
            pageSize={PAGE_SIZE} 
          />
        )}
      </div>
    </div>
  );
}
