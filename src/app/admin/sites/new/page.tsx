import { prisma } from "@/lib/prisma";
import { SiteForm } from "./site-form";
import Link from "next/link";
import { ArrowLeft, Building2, Plus } from "lucide-react";

export default async function NewSitePage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <Link href="/admin/sites" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 mr-2 transition-colors">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back to Sites
      </Link>

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            <Plus className="h-3.5 w-3.5" />
            New Construction Site
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Create Site</h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
            Configure everything up front — buildings, dynamic work items, rates, and site-specific labour categories.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <Building2 className="h-64 w-64" />
        </div>
      </div>

      <SiteForm clients={clients} />
    </div>
  );
}
