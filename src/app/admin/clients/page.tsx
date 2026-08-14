import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NewClientDialog } from "./new-client-dialog";
import { EditClientForm } from "./edit-client-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, User2, Phone, Mail, FileText } from "lucide-react";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

  const clients = await prisma.client.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { contactPerson: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { gstNo: { contains: q, mode: "insensitive" } },
      ]
    } : {},
    include: { _count: { select: { sites: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalClients = clients.length;
  const totalSites = clients.reduce((acc, c) => acc + c._count.sites, 0);

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
              <User2 className="h-4 w-4" />
              Client Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              Clients Dashboard
            </h1>
            <p className="text-blue-100 text-sm sm:text-base font-medium max-w-lg">
              Manage your clients and view their independent projects & sites.
            </p>
          </div>
          <div className="shrink-0">
            <NewClientDialog />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Clients</p>
              <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100">{totalClients}</p>
              <p className="text-xs text-slate-400 font-medium">All registered clients</p>
            </div>
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <User2 className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/20" />
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Sites</p>
              <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100">{totalSites}</p>
              <p className="text-xs text-slate-400 font-medium">Across all clients</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Building2 className="h-7 w-7 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / Filter Bar */}
      <div className="relative">
        <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              name="q"
              placeholder="Search clients by name, contact, phone, email or GST..."
              defaultValue={q}
              className="pl-11 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
            {q && (
              <Button variant="outline" asChild className="h-12 px-5 rounded-xl border-slate-200 dark:border-slate-700 font-semibold transition-all hover:-translate-y-0.5">
                <a href="/admin/clients">Clear</a>
              </Button>
            )}
          </div>
        </form>
        {q && (
          <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-blue-600">{clients.length}</span> result{clients.length !== 1 ? "s" : ""} for &quot;<span className="font-bold">{q}</span>&quot;
          </p>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((c) => (
          <Card key={c.id} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden rounded-2xl">
            
            {/* Card Top Color Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
            
            <CardHeader className="pb-4 pt-5 px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg shadow-md shadow-blue-500/20">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                      {c.name}
                    </CardTitle>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      <User2 className="h-3 w-3 mr-1 text-blue-500 shrink-0" />
                      <span className="truncate">{c.contactPerson || "No Contact Person"}</span>
                    </div>
                  </div>
                </div>
                {/* Site Badge */}
                <div className="shrink-0">
                  {c._count.sites > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-bold px-2.5 py-1">
                      <Building2 className="h-3 w-3" />
                      {c._count.sites}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold px-2.5 py-1 border border-slate-200 dark:border-slate-700">
                      0 sites
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
    
            <CardContent className="flex-1 px-6 pb-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="truncate font-medium">{c.phone || "No phone number"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <span className="truncate font-medium">{c.email || "No email address"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="truncate font-medium">GST: {c.gstNo || "N/A"}</span>
                </div>
              </div>
            </CardContent>

            <div className="px-6 pb-5 flex gap-2.5">
              <Button asChild className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 text-sm">
                <Link href={`/admin/clients/${c.id}`}>View Details →</Link>
              </Button>
              <EditClientForm client={c} />
            </div>
          </Card>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex flex-col items-center">
              <div className="h-20 w-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5">
                <Building2 className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No clients found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6 max-w-xs">
                {q ? `No results for "${q}". Try a different search.` : "You haven't added any clients yet. Start by adding your first client!"}
              </p>
              {!q && <NewClientDialog />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
