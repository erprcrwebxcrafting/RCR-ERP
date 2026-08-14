import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, User2, Mail, Phone, FileText, Briefcase, MapPin } from "lucide-react";
import { EditClientForm } from "../edit-client-form";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: id },
    include: { sites: true },
  });
  if (!client) notFound();

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/clients" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <User2 className="h-3.5 w-3.5" />
              Client Profile
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {client.name}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1 font-medium">
              <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
              <p>{client.address || "No address on file"}</p>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <EditClientForm client={client} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">GST No.</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{client.gstNo || "Not Provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Contact</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{client.contactPerson || "Not Provided"}</p>
                {client.phone && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{client.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-6 w-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{client.email || "Not Provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Briefcase className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Projects & Sites</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {client.sites.map((s) => (
            <Link key={s.id} href={`/admin/sites/${s.id}`}>
              <Card className="group transition-all duration-300 hover:shadow-md hover:border-blue-400/50 hover:-translate-y-0.5 overflow-hidden border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                <div className={`h-1 w-full ${s.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${s.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{s.projectName}</p>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{s.address || "No address provided"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 sm:self-center self-start">
                    {s.active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 px-2.5 py-0.5 font-bold shadow-none">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-700 px-2.5 py-0.5 font-bold">Closed</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {client.sites.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No sites assigned</h3>
              <p className="text-slate-500 text-sm mt-1">This client does not have any projects or sites yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
