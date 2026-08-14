import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, User, ClipboardCheck, ArrowLeft, Layers, MapPin } from "lucide-react";

export default async function SupervisorSiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: { buildings: true, client: true },
  });
  
  if (!site) notFound();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Back navigation */}
      <Link href="/supervisor/sites" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 mr-2 transition-colors">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back to Sites
      </Link>

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <MapPin className="h-3.5 w-3.5" /> Site Operations Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{site.projectName}</h1>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-blue-100 font-medium">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-black/20 rounded-lg"><User className="h-4 w-4" /></div>
                <span>{site.client?.name || "No Client Assigned"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-black/20 rounded-lg"><Layers className="h-4 w-4" /></div>
                <span>{site.buildings.length} Buildings</span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center justify-start md:justify-end">
            <Link href={`/supervisor/attendance?siteId=${site.id}`}>
              <Button size="lg" className="h-12 px-6 rounded-xl bg-white hover:bg-white/90 text-indigo-600 shadow-xl shadow-indigo-900/20 transition-all font-bold gap-2 group border-0 hover:-translate-y-1">
                <ClipboardCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Mark Daily Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Buildings Card */}
        <Card className="md:col-span-2 group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl transition-all duration-500 group-hover:bg-blue-500/10" />
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-5">
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-5 w-5" />
              </div>
              Site Buildings Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {site.buildings.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {site.buildings.map((b) => (
                  <div 
                    key={b.id} 
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-default transition-all hover:-translate-y-0.5 group/badge"
                  >
                    <Building2 className="h-4 w-4 mr-2 text-slate-400 group-hover/badge:text-indigo-500 transition-colors" />
                    {b.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Buildings Found</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">Admin has not mapped any buildings to this site yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar quick actions */}
        <div className="space-y-6">
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-indigo-200/50 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Quick Actions</h3>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Jump directly to the attendance register for this specific site to mark presence for labourers.
              </p>
              <Link href={`/supervisor/attendance?siteId=${site.id}`}>
                <Button className="w-full h-11 justify-start gap-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-bold rounded-xl shadow-sm hover:border-indigo-300">
                  <ClipboardCheck className="h-4 w-4" /> Go to Attendance
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
