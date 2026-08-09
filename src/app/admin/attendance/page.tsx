import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, CheckCircle2, XCircle, Clock, Building, Download, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ q?: string; siteId?: string; startDate?: string; endDate?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const siteId = resolvedParams.siteId || "";
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const startDateStr = resolvedParams.startDate || todayStr;
  const endDateStr = resolvedParams.endDate || todayStr;
  
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59, 999);

  const sites = await prisma.site.findMany({ where: { active: true }, orderBy: { projectName: "asc" }});

  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate,
    }
  };

  if (siteId) {
    whereClause.siteId = siteId;
  }

  if (q) {
    whereClause.OR = [
      { labour: { name: { contains: q, mode: "insensitive" } } },
      { site: { projectName: { contains: q, mode: "insensitive" } } },
      ...( ["PRESENT", "ABSENT", "HALF_DAY", "ONE_AND_HALF", "DOUBLE"].includes(q.toUpperCase().replace(/ /g, '_')) 
           ? [{ status: { equals: q.toUpperCase().replace(/ /g, '_') as any } }] 
           : [] )
    ];
  }

  const attendance = await prisma.attendance.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: { labour: { include: { labourCategory: true } }, site: true, building: true },
  });

  // Calculate KPIs
  let presentDays = 0;
  let totalHajari = 0;
  let absent = 0;

  attendance.forEach((a: any) => {
    if (a.hajari > 0) {
      presentDays++;
      totalHajari += a.hajari;
    } else {
      absent++;
    }
  });

  const total = attendance.length;
  
  const exportUrlParams = new URLSearchParams({
    siteId,
    startDate: startDateStr,
    endDate: endDateStr
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        
        {/* Top Minimal Navigation/Header */}
        <div className="bg-card/60 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Attendance Explorer</h1>
              <p className="text-sm text-muted-foreground">View, filter, and export attendance records across all sites</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                asChild
                disabled={!siteId} 
                className={!siteId ? "opacity-50 pointer-events-none" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm transition-all"}
              >
                <a href={`/api/attendance/export?format=excel&${exportUrlParams.toString()}`} target="_blank" rel="noreferrer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </a>
              </Button>
              <Button 
                variant="outline" 
                asChild
                disabled={!siteId} 
                className={!siteId ? "opacity-50 pointer-events-none" : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 shadow-sm transition-all"}
              >
                <a href={`/api/attendance/export?format=pdf&${exportUrlParams.toString()}`} target="_blank" rel="noreferrer">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </a>
              </Button>
              {!siteId && <span className="text-xs text-orange-500 font-medium ml-2">Select a site to export</span>}
          </div>
        </div>

        {/* Filters Bar */}
        <form method="GET" className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-wrap items-end gap-4 sm:gap-6 shadow-sm">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">From Date</label>
            <input type="date" name="startDate" defaultValue={startDateStr} className="h-10 w-40 rounded-lg border border-border/60 bg-background text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary px-3 cursor-pointer outline-none transition-all hover:border-primary/50 shadow-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">To Date</label>
            <input type="date" name="endDate" defaultValue={endDateStr} className="h-10 w-40 rounded-lg border border-border/60 bg-background text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary px-3 cursor-pointer outline-none transition-all hover:border-primary/50 shadow-sm" />
          </div>
          
          <div className="h-10 w-[1px] bg-border/60 hidden sm:block"></div>
          
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Site</label>
            <select name="siteId" defaultValue={siteId} className="h-10 w-full rounded-lg border border-border/60 bg-background text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary px-3 cursor-pointer outline-none transition-all hover:border-primary/50 shadow-sm">
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.projectName}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Search</label>
             <div className="relative w-full">
               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
               <input type="text" name="q" defaultValue={q} placeholder="Search names..." className="h-10 w-full pl-9 rounded-lg border border-border/60 bg-background text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-primary/50 shadow-sm" />
             </div>
          </div>
          
          <Button type="submit" className="h-10 px-8 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 bg-primary text-primary-foreground">
            FILTER
          </Button>
        </form>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Total Logs", value: total, color: "text-gray-700", icon: <Users className="h-4 w-4 text-gray-400" /> },
             { label: "Days Present", value: presentDays, color: "text-emerald-600", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
             { label: "Total Hajaris", value: totalHajari, color: "text-indigo-600", icon: <CheckCircle2 className="h-4 w-4 text-indigo-500" /> },
             { label: "Absent", value: absent, color: "text-rose-600", icon: <XCircle className="h-4 w-4 text-rose-500" /> },
           ].map((kpi, i) => (
             <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-primary/50 hover:bg-card/80 transition-all shadow-sm">
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
                 {kpi.icon}
               </div>
               <div className="flex justify-between items-center relative z-10">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                 <div className="p-1.5 bg-background rounded-md shadow-sm border border-border/50">
                    {kpi.icon}
                 </div>
               </div>
               <span className={`text-3xl font-bold mt-1 tracking-tight ${kpi.color} relative z-10`}>{kpi.value}</span>
             </div>
           ))}
        </div>

        {/* Main Table */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Site / Building</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Worker</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider">OT Hrs</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                   {attendance.map((a: any) => {
                     const colors = ['bg-blue-500/10 text-blue-500', 'bg-emerald-500/10 text-emerald-500', 'bg-purple-500/10 text-purple-500', 'bg-orange-500/10 text-orange-500', 'bg-pink-500/10 text-pink-500'];
                     const colorClass = colors[a.labour.name.charCodeAt(0) % colors.length];
                     
                     return (
                       <tr key={a.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{format(new Date(a.date), 'MMM dd, yyyy')}</div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{a.site.projectName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{a.building?.name || 'General'}</div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colorClass} ring-2 ring-background shadow-sm`}>
                                    {a.labour.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <Link href={`/admin/labours/${a.labourId}`} className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                                      {a.labour.name}
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{a.labour.labourCategory.name}</span>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <Badge className="text-[10px] uppercase font-bold shadow-sm" variant={a.hajari > 0 ? "secondary" : "destructive"}>
                                {a.hajari > 0 ? `${a.hajari} Hajari` : "Absent"}
                              </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                              {a.overtimeHrs > 0 ? `${a.overtimeHrs}h` : '—'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                              {a.remarks || '—'}
                          </td>
                       </tr>
                     );
                   })}
                   {attendance.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                          No attendance records found for these filters.
                        </td>
                      </tr>
                   )}
                </tbody>
              </table>
            </div>
      </div>
    </div>
  );
}
