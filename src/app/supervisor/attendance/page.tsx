import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveAttendance } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateSelector } from "./date-selector";
import { AttendanceForm } from "./attendance-form";
import { Lock, Building2, Calendar, MapPin, CheckCircle2, Save, Users, Clock, MessageSquare, Edit } from "lucide-react";
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
        <div className="rounded-full bg-muted/50 p-6 mb-6">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">No Sites Assigned</h2>
        <p className="text-muted-foreground max-w-md">You haven't been assigned to any active construction sites yet. Please contact the administrator.</p>
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
  if (!siteRaw) return <div className="p-8 text-center text-muted-foreground">Site not found.</div>;
  
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

  const existingMap = new Map(existingAttendances.map(a => [a.labourId, a]));
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  
  const hasExisting = existingAttendances.length > 0;
  const allLocked = hasExisting && existingAttendances.every(a => (now - new Date(a.createdAt).getTime()) > TWENTY_FOUR_HOURS_MS);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background border border-blue-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1 mb-4 text-sm font-medium text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
              Attendance Register
            </div>
            
            {/* Site Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {assigned.map((a) => (
                <a 
                  key={a.siteId} 
                  href={`/supervisor/attendance?siteId=${a.siteId}&date=${selectedDateStr}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    a.siteId === siteId 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                      : "bg-background/50 text-muted-foreground hover:bg-background hover:text-foreground border border-border/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.site.projectName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-blue-500/5">
          <Calendar className="h-64 w-64" />
        </div>
      </div>

      <AttendanceForm 
        siteId={siteId} 
        allLocked={allLocked} 
        hasExisting={hasExisting}
        headerControls={
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1.5 border border-border/50">
              <div className="p-2 bg-background rounded-md shadow-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="px-2">
                <DateSelector defaultDate={selectedDateStr} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1.5 border border-border/50 flex-1 md:flex-none">
              <div className="p-2 bg-background rounded-md shadow-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <select name="buildingId" className="h-9 w-full md:w-auto min-w-[200px] rounded-md border-0 bg-transparent px-3 text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground">
                <option value="" className="bg-slate-900 text-slate-200">All Buildings (General)</option>
                {site.buildings.map((b: any) => <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">{b.name}</option>)}
              </select>
            </div>
          </div>
        }
      >
        {/* Attendance Table */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/3">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Labourer</div>
                  </th>
                  <th className="px-6 py-4 font-semibold w-[200px]">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Hajari</div>
                  </th>
                  <th className="px-6 py-4 font-semibold min-w-[250px]">
                    <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Remarks</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {site.labourCategories.map((cat: any) => {
                  if (cat.labours.length === 0) return null;
                  
                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header */}
                      <tr>
                        <td colSpan={3} className="px-6 py-3 bg-muted/40 border-b border-border/40">
                          <span className="inline-flex items-center rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border/50 shadow-sm uppercase tracking-wider">
                            {cat.name}
                          </span>
                        </td>
                      </tr>
                      {cat.labours.map((p: any) => {
                        const existing = existingMap.get(p.id);
                        const isLocked = existing && (now - new Date(existing.createdAt).getTime() > TWENTY_FOUR_HOURS_MS);
                        
                        const colors = ['bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'];
                        const colorClass = colors[p.name.charCodeAt(0) % colors.length];
                        
                        return (
                          <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                            <td className="px-6 py-4">
                              <input type="hidden" name="labourId[]" value={p.id} />
                              <div className="flex items-center gap-4">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colorClass} ring-2 ring-background shadow-sm`}>
                                  {p.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</span>
                                  {isLocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive mt-0.5">
                                      <Lock className="h-3 w-3" /> Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isLocked ? (
                                <>
                                  <input type="hidden" name={`hajari__${p.id}`} defaultValue={existing.hajari} />
                                  <select className="h-10 w-full rounded-md border-border/50 bg-muted/50 text-muted-foreground text-sm cursor-not-allowed opacity-80" disabled defaultValue={existing.hajari}>
                                    <option value="0">Absent</option>
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n.toString()}>{n} Hajari</option>)}
                                  </select>
                                </>
                              ) : (
                                <select name={`hajari__${p.id}`} className="h-10 w-full rounded-md border-border/60 bg-background text-foreground text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm cursor-pointer hover:border-blue-400" defaultValue={existing?.hajari?.toString() || "1"}>
                                    <option value="0">Absent</option>
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n.toString()}>{n} Hajari</option>)}
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isLocked ? (
                                <>
                                  <input type="hidden" name={`remarks__${p.id}`} defaultValue={existing.remarks || ""} />
                                  <Input className="h-10 w-full border-border/50 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-80" disabled defaultValue={existing.remarks || ""} placeholder="" />
                                </>
                              ) : (
                                <Input className="h-10 w-full border-border/60 bg-background focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all shadow-sm hover:border-blue-400" name={`remarks__${p.id}`} placeholder="Add a remark..." defaultValue={existing?.remarks || ""} />
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
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No labourers assigned</p>
                        <p className="text-sm">There are no active labourers assigned to you on this site.</p>
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
