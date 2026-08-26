import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveAttendance } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateSelector } from "./date-selector";
import { AttendanceForm } from "./attendance-form";
import { HajariInput } from "./hajari-input";
import { Lock, Building2, Calendar, MapPin, CheckCircle2, Save, Users, Clock, MessageSquare, Edit, ClipboardCheck, AlertTriangle, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ siteId?: string; date?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  const userId = (session?.user as any)?.id as string;

  const assigned = await prisma.siteSupervisor.findMany({
    where: { supervisorId: userId },
    include: { site: true },
  });

  const siteId = resolvedSearchParams.siteId || assigned[0]?.siteId;
  if (!siteId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-6">
          <Building2 className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-800 dark:text-slate-100">No Sites Assigned</h2>
        <p className="text-slate-500 font-medium max-w-md">You haven't been assigned to any active construction sites yet. Please contact the administrator.</p>
      </div>
    );
  }

  const siteRaw = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      buildings: true,
      labourCategories: { include: { labours: { where: { active: true, supervisorId: userId } as any } } },
    },
  });
  if (!siteRaw) return <div className="p-8 text-center text-slate-500 font-medium">Site not found.</div>;
  
  const site = siteRaw as any;

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDateStr = resolvedSearchParams.date || todayStr;
  const targetDate = new Date(selectedDateStr);

  const existingAttendances = await prisma.attendance.findMany({
    where: {
      siteId,
      date: targetDate,
    },
  });

  const hasExisting = existingAttendances.length > 0;
  const existingMap = new Map(existingAttendances.map(a => [a.labourId, a]));

  const unmarkedCount = site.labourCategories.reduce(
    (acc: number, cat: any) => acc + cat.labours.filter((l: any) => !existingMap.has(l.id)).length,
    0
  );

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const allLocked = false; // The form should never be globally locked. Individual rows are locked.

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 md:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-6">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Attendance Register
              </div>
            </div>
            
            {/* Site Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-2">
              {assigned.map((a) => (
                <a 
                  key={a.siteId} 
                  href={`/supervisor/attendance?siteId=${a.siteId}&date=${selectedDateStr}`}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:-translate-y-0.5 border ${
                    a.siteId === siteId 
                      ? "bg-white text-indigo-600 shadow-xl shadow-indigo-900/20 border-white" 
                      : "bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
                  }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.site.projectName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <Calendar className="h-64 w-64" />
        </div>
      </div>

      {!allLocked && unmarkedCount > 0 && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="p-3 bg-rose-100/80 dark:bg-rose-900/40 rounded-xl shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-rose-800 dark:text-rose-300">Action Required: Unmarked Attendance</h3>
            <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium mt-1 leading-relaxed">
              You have <strong className="text-rose-700 dark:text-rose-300">{unmarkedCount}</strong> labourer{unmarkedCount !== 1 ? 's' : ''} with unmarked attendance for this date. Please ensure all attendances are marked to prevent them from being permanently locked.
            </p>
          </div>
        </div>
      )}

      <AttendanceForm 
        siteId={siteId} 
        allLocked={allLocked} 
        hasExisting={hasExisting}
        headerControls={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-blue-400/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-blue-600 dark:text-blue-400 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="px-2 w-full">
                <DateSelector defaultDate={selectedDateStr} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-400/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <select name="buildingId" className="h-9 w-full rounded-md border-0 bg-transparent px-2 text-sm font-bold focus:ring-0 cursor-pointer outline-none text-slate-700 dark:text-slate-200">
                <option value="" className="bg-white dark:bg-slate-900">All Buildings (General)</option>
                {site.buildings.map((b: any) => <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">{b.name}</option>)}
              </select>
            </div>
          </div>
        }
      >
        {/* Premium Attendance Table */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800/60 shadow-xl bg-white dark:bg-slate-900 w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] sm:text-xs font-black tracking-widest">
                <tr>
                  <th className="px-4 sm:px-6 py-4 sm:py-5 w-1/3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400"><Users className="h-4 w-4" /> Labourer</div>
                  </th>
                  <th className="px-4 sm:px-6 py-4 sm:py-5 w-[150px] sm:w-[220px]">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Hajari</div>
                  </th>
                  <th className="px-4 sm:px-6 py-4 sm:py-5 min-w-[200px]">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><MessageSquare className="h-4 w-4" /> Remarks</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {site.labourCategories.map((cat: any) => {
                  if (cat.labours.length === 0) return null;
                  
                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header */}
                      <tr>
                        <td colSpan={3} className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/80 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 shadow-sm uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 mr-2"></span>
                            {cat.name}
                          </span>
                        </td>
                      </tr>
                      {cat.labours.map((p: any) => {
                        const existing = existingMap.get(p.id);
                        const isLocked = !!existing && existing.createdAt.getTime() < twentyFourHoursAgo.getTime();
                        
                        const colors = ['bg-blue-50 text-blue-600 border-blue-200', 'bg-emerald-50 text-emerald-600 border-emerald-200', 'bg-purple-50 text-purple-600 border-purple-200', 'bg-amber-50 text-amber-600 border-amber-200', 'bg-rose-50 text-rose-600 border-rose-200'];
                        const colorClass = colors[p.name.charCodeAt(0) % colors.length];
                        
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-4">
                              <input type="hidden" name="labourId[]" value={p.id} />
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${colorClass} border dark:bg-slate-800 dark:border-slate-700 shadow-sm`}>
                                  {p.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                    {p.name}
                                    <a href={`/supervisor/labours/${p.id}`} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg p-1 transition-colors" title="View Labour Profile">
                                      <Eye className="h-3.5 w-3.5" />
                                    </a>
                                  </span>

                                  {isLocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 mt-1 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-full w-fit">
                                      <Lock className="h-3 w-3" /> Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <HajariInput
                                labourId={p.id}
                                defaultValue={existing?.hajari !== undefined ? existing.hajari.toString() : "1"}
                                isLocked={isLocked}
                              />
                            </td>
                            <td className="px-6 py-4">
                              {isLocked ? (
                                <>
                                  <input type="hidden" name={`remarks__${p.id}`} defaultValue={existing?.remarks || ""} />
                                  <Input className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium cursor-not-allowed opacity-80" disabled defaultValue={existing?.remarks || ""} placeholder="" />
                                </>
                              ) : (
                                <Input className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all shadow-sm hover:border-indigo-400" name={`remarks__${p.id}`} placeholder="Add a remark..." defaultValue={existing?.remarks || ""} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {site.labourCategories.every((c: any) => c.labours.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Users className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-700" />
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No Labourers Assigned</p>
                        <p className="text-sm font-medium mt-1">There are no active labourers assigned to you on this site.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </AttendanceForm>
    </div>
  );
}
